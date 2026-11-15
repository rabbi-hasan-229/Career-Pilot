-- Clients may create ordinary roadmap tasks, but only trusted database
-- functions can set completion state or delete task history.
drop policy if exists "users manage own tasks" on public.tasks;
drop policy if exists "users read own tasks" on public.tasks;
drop policy if exists "users insert own tasks" on public.tasks;
drop policy if exists "users update own task dates" on public.tasks;

create policy "users read own tasks"
  on public.tasks for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users insert own tasks"
  on public.tasks for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.milestones m
      where m.id = milestone_id and m.user_id = (select auth.uid())
    )
  );
create policy "users update own task dates"
  on public.tasks for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.milestones m
      where m.id = milestone_id and m.user_id = (select auth.uid())
    )
  );
revoke insert, update, delete on public.tasks from anon, authenticated;
grant select on public.tasks to authenticated;
grant insert (milestone_id, user_id, title, subject, task_type, due_date, est_minutes, deliverable)
  on public.tasks to authenticated;

-- Roadmap and milestone lifecycle state is maintained by trusted RPCs and
-- triggers. Clients may read their plan, but cannot mark it complete or edit
-- progression fields directly.
drop policy if exists "users manage own roadmaps" on public.user_roadmaps;
drop policy if exists "users read own roadmaps" on public.user_roadmaps;
create policy "users read own roadmaps"
  on public.user_roadmaps for select to authenticated
  using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.user_roadmaps from anon, authenticated;
grant select on public.user_roadmaps to authenticated;

drop policy if exists "users manage own milestones" on public.milestones;
drop policy if exists "users read own milestones" on public.milestones;
create policy "users read own milestones"
  on public.milestones for select to authenticated
  using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.milestones from anon, authenticated;
grant select on public.milestones to authenticated;

insert into public.achievements (id, title, description, icon_name, tier, xp_bonus)
values
  ('first_step', 'First Footprint', 'Complete your first learning node on the island', 'footprints', 'bronze', 50),
  ('quiz_master_1', 'Riddle Solver', 'Pass your first checkpoint quiz with 100% accuracy', 'brain', 'bronze', 50),
  ('streak_3', 'Momentum Seeker', 'Maintain a 3-day learning streak', 'flame', 'silver', 100),
  ('streak_7', 'Island Pioneer', 'Maintain a 7-day learning streak', 'trophy', 'gold', 250),
  ('role_graduate', 'Quest Champion', 'Complete an entire career roadmap', 'crown', 'platinum', 1000)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  icon_name = excluded.icon_name,
  tier = excluded.tier,
  xp_bonus = excluded.xp_bonus;

create or replace function public.guard_task_parent_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.milestones m
    join public.user_roadmaps r on r.id = m.roadmap_id
    where m.id = new.milestone_id
      and m.user_id = new.user_id
      and r.user_id = new.user_id
      and r.status = 'active'
  ) then
    raise exception 'Task must belong to your own roadmap milestone' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger task_parent_owner_before_write
before insert or update of milestone_id, user_id on public.tasks
for each row execute function public.guard_task_parent_owner();
revoke all on function public.guard_task_parent_owner() from public, anon, authenticated;

create or replace function public.award_user_achievement(p_user_id uuid, p_achievement_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bonus integer;
  v_title text;
  v_description text;
  v_unlocked_id text;
begin
  select a.xp_bonus, a.title, a.description
    into v_bonus, v_title, v_description
  from public.achievements a
  where a.id = p_achievement_id;
  if not found then return false; end if;

  insert into public.user_achievements (user_id, achievement_id)
  values (p_user_id, p_achievement_id)
  on conflict (user_id, achievement_id) do nothing
  returning achievement_id into v_unlocked_id;
  if not found then return false; end if;

  update public.user_gamification g
    set xp = g.xp + greatest(v_bonus, 0),
        level = greatest(g.level, floor((g.xp + greatest(v_bonus, 0)) / 100.0)::integer + 1),
        updated_at = now()
    where g.user_id = p_user_id;

  insert into public.user_notifications (user_id, category, title, body, metadata)
  select p_user_id, 'milestone', 'Achievement unlocked: ' || v_title, v_description,
         jsonb_build_object('achievement_id', p_achievement_id)
  where exists (
    select 1 from public.profiles p
    where p.id = p_user_id and p.notification_milestone_alerts
  );
  return true;
end;
$$;
revoke all on function public.award_user_achievement(uuid, text) from public, anon, authenticated;

create or replace function public.handle_completed_task()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_roadmap_id uuid;
  v_position integer;
begin
  if old.done_at is not null or new.done_at is null then return new; end if;
  perform public.award_user_achievement(new.user_id, 'first_step');

  select m.roadmap_id, m.position into v_roadmap_id, v_position
  from public.milestones m
  where m.id = new.milestone_id and m.user_id = new.user_id;
  if v_roadmap_id is null then return new; end if;

  if not exists (
    select 1 from public.tasks t
    where t.milestone_id = new.milestone_id and t.user_id = new.user_id and t.done_at is null
  ) then
    update public.milestones
      set status = 'done'
      where id = new.milestone_id and user_id = new.user_id;
    update public.milestones
      set status = 'doing'
      where roadmap_id = v_roadmap_id and user_id = new.user_id
        and position = v_position + 1 and status <> 'done';
  end if;

  if not exists (
    select 1
    from public.tasks t
    join public.milestones m on m.id = t.milestone_id
    where m.roadmap_id = v_roadmap_id and m.user_id = new.user_id
      and t.user_id = new.user_id and t.done_at is null
  ) then
    update public.user_roadmaps
      set status = 'completed'
      where id = v_roadmap_id and user_id = new.user_id and status = 'active';
    perform public.award_user_achievement(new.user_id, 'role_graduate');
  end if;
  return new;
end;
$$;
create trigger task_completion_progression_after_update
after update of done_at on public.tasks
for each row execute function public.handle_completed_task();
revoke all on function public.handle_completed_task() from public, anon, authenticated;

create or replace function public.award_streak_achievements()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.current_streak > old.current_streak then
    if new.current_streak >= 3 then perform public.award_user_achievement(new.user_id, 'streak_3'); end if;
    if new.current_streak >= 7 then perform public.award_user_achievement(new.user_id, 'streak_7'); end if;
  end if;
  return new;
end;
$$;
create trigger streak_achievements_after_update
after update of current_streak on public.user_gamification
for each row execute function public.award_streak_achievements();
revoke all on function public.award_streak_achievements() from public, anon, authenticated;

create or replace function public.award_quiz_achievement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_correct then perform public.award_user_achievement(new.user_id, 'quiz_master_1'); end if;
  return new;
end;
$$;
create trigger quiz_achievement_after_submission
after insert on public.quiz_submissions
for each row execute function public.award_quiz_achievement();
revoke all on function public.award_quiz_achievement() from public, anon, authenticated;

create or replace function public.complete_user_task(p_task_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_task public.tasks%rowtype;
  v_xp integer;
  v_streak integer;
  v_has_active_roadmap boolean;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select t.* into v_task
  from public.tasks t
  where t.id = p_task_id and t.user_id = v_user_id
  for update;
  if not found then raise exception 'Task not found' using errcode = 'P0002'; end if;
  if v_task.done_at is not null then
    return jsonb_build_object('success', true, 'already_completed', true, 'xp_awarded', 0, 'current_streak', null);
  end if;
  select exists (
    select 1 from public.milestones m
    join public.user_roadmaps r on r.id = m.roadmap_id
    where m.id = v_task.milestone_id
      and m.user_id = v_user_id
      and r.user_id = v_user_id
      and r.status = 'active'
  ) into v_has_active_roadmap;
  if not v_has_active_roadmap then
    raise exception 'Task is not part of your active roadmap' using errcode = '42501';
  end if;
  if exists (select 1 from public.task_quizzes q where q.task_id = p_task_id) then
    raise exception 'Submit the checkpoint answer to complete this task' using errcode = '42501';
  end if;
  v_xp := greatest(coalesce(v_task.xp_reward, 0), 0);
  update public.tasks
    set done_at = now(), progress_pct = 100
    where id = p_task_id and user_id = v_user_id;

  update public.user_gamification g
    set xp = g.xp + v_xp,
        level = greatest(g.level, floor((g.xp + v_xp) / 100.0)::integer + 1),
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
  if not found then raise exception 'Gamification state is not initialized' using errcode = 'P0002'; end if;

  return jsonb_build_object(
    'success', true,
    'already_completed', false,
    'xp_awarded', v_xp,
    'current_streak', v_streak
  );
end;
$$;
revoke all on function public.complete_user_task(uuid) from public, anon;
grant execute on function public.complete_user_task(uuid) to authenticated;
