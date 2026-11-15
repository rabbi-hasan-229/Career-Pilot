-- Never ship answer keys to the browser. Authenticated users can read the
-- question and choices for their own tasks through a sanitized view.
alter table public.quiz_submissions rename column passed_at to created_at;
create index quiz_submissions_user_task_attempt_idx
  on public.quiz_submissions (user_id, task_id, attempt_count desc);
create index quiz_submissions_user_created_idx
  on public.quiz_submissions (user_id, created_at desc);
revoke select on table public.task_quizzes from public, anon, authenticated;
drop policy if exists "authenticated read task quizzes" on public.task_quizzes;
drop policy if exists "anon read task quizzes" on public.task_quizzes;

create or replace view public.task_quizzes_public as
select
  q.id,
  q.task_id,
  q.question,
  coalesce((
    select jsonb_agg(
      jsonb_build_object('id', choice.value->>'id', 'text', choice.value->>'text')
      order by choice.ordinality
    )
    from jsonb_array_elements(q.options) with ordinality as choice(value, ordinality)
  ), '[]'::jsonb) as options
from public.task_quizzes q
where exists (
  select 1
  from public.tasks t
  where t.id = q.task_id
    and t.user_id = (select auth.uid())
);

grant select on public.task_quizzes_public to authenticated;
revoke all on public.task_quizzes_public from public, anon;
grant select on public.task_quizzes_public to authenticated;

create or replace function public.submit_task_quiz(
  p_task_id uuid,
  p_selected_option text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_task public.tasks%rowtype;
  v_quiz public.task_quizzes%rowtype;
  v_selected_exists boolean;
  v_is_correct boolean;
  v_correct_option text;
  v_attempt_number integer;
  v_xp integer := 0;
  v_coins integer := 0;
  v_streak integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_task_id is null or p_selected_option is null or char_length(trim(p_selected_option)) not between 1 and 100 then
    raise exception 'Choose a valid answer' using errcode = '22023';
  end if;

  -- Lock the owned task so concurrent submissions cannot award duplicate XP.
  select t.* into v_task
  from public.tasks t
  where t.id = p_task_id and t.user_id = v_user_id
  for update;
  if not found then
    raise exception 'Task not found' using errcode = 'P0002';
  end if;
  if v_task.done_at is not null then
    raise exception 'This checkpoint has already been completed' using errcode = '22023';
  end if;

  select q.* into v_quiz
  from public.task_quizzes q
  where q.task_id = p_task_id
  order by q.created_at asc
  limit 1;
  if not found then
    raise exception 'No checkpoint is available for this task' using errcode = 'P0002';
  end if;

  select exists (
    select 1 from jsonb_array_elements(v_quiz.options) as options(value)
    where value->>'id' = p_selected_option
  ) into v_selected_exists;
  if not v_selected_exists then
    raise exception 'Selected answer is not part of this checkpoint' using errcode = '22023';
  end if;

  select value->>'id' into v_correct_option
  from jsonb_array_elements(v_quiz.options) as options(value)
  where coalesce((value->>'is_correct')::boolean, false)
  limit 1;
  v_is_correct := p_selected_option = v_correct_option;

  select coalesce(max(s.attempt_count), 0) + 1 into v_attempt_number
  from public.quiz_submissions s
  where s.user_id = v_user_id and s.task_id = p_task_id;

  insert into public.quiz_submissions (user_id, task_id, selected_option, is_correct, attempt_count)
  values (v_user_id, p_task_id, p_selected_option, v_is_correct, v_attempt_number);

  if v_is_correct then
    update public.tasks
      set done_at = now(), progress_pct = 100
      where id = p_task_id and user_id = v_user_id;

    v_xp := greatest(coalesce(v_quiz.xp_reward, 0), 0);
    v_coins := greatest(coalesce(v_quiz.coins_reward, 0), 0);
    update public.user_gamification g
      set xp = g.xp + v_xp,
          level = greatest(g.level, floor((g.xp + v_xp) / 100.0)::integer + 1),
          coins = g.coins + v_coins,
          current_streak = case
            when g.last_activity_date = current_date then g.current_streak
            when g.last_activity_date = current_date - 1 then g.current_streak + 1
            else 1
          end,
          longest_streak = greatest(g.longest_streak, case
            when g.last_activity_date = current_date then g.current_streak
            when g.last_activity_date = current_date - 1 then g.current_streak + 1
            else 1
          end),
          last_activity_date = current_date,
          updated_at = now()
      where g.user_id = v_user_id
      returning g.current_streak into v_streak;
    if not found then
      raise exception 'Gamification state is not initialized' using errcode = 'P0002';
    end if;
  end if;

  return jsonb_build_object(
    'is_correct', v_is_correct,
    'correct_option_id', v_correct_option,
    'explanation', v_quiz.explanation,
    'attempt_number', v_attempt_number,
    'xp_awarded', v_xp,
    'coins_awarded', v_coins,
    'current_streak', v_streak
  );
end;
$$;

revoke all on function public.submit_task_quiz(uuid, text) from public, anon;
grant execute on function public.submit_task_quiz(uuid, text) to authenticated;

-- Prevent client-side task toggles from bypassing an attached quiz, and make
-- passed checkpoint completion immutable to ordinary table updates.
create or replace function public.guard_quiz_task_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.done_at is null and new.done_at is not null
    and exists (select 1 from public.task_quizzes q where q.task_id = new.id)
    and not exists (
      select 1 from public.quiz_submissions s
      where s.user_id = new.user_id and s.task_id = new.id and s.is_correct
    ) then
    raise exception 'Pass the checkpoint before completing this task' using errcode = '42501';
  end if;

  if old.done_at is not null and new.done_at is null
    and exists (select 1 from public.task_quizzes q where q.task_id = new.id) then
    raise exception 'Checkpoint completion cannot be cleared' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger guard_quiz_task_completion_before_update
before update of done_at on public.tasks
for each row execute function public.guard_quiz_task_completion();

revoke all on function public.guard_quiz_task_completion() from public, anon, authenticated;
