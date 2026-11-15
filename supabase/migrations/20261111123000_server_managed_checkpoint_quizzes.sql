-- Every generated checkpoint receives a server-owned assessment. The browser
-- sends only a template ID; answer keys are expanded here and stay in the
-- protected task_quizzes table.
create table private.checkpoint_quiz_templates (
  id text primary key,
  question_template text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4),
  correct_option_id text not null,
  explanation_template text not null
);

alter table private.checkpoint_quiz_templates enable row level security;
revoke all on table private.checkpoint_quiz_templates from public, anon, authenticated, service_role;

insert into private.checkpoint_quiz_templates (
  id, question_template, options, correct_option_id, explanation_template
) values
  (
    'cp_phase_1',
    'Before starting “{checkpoint}”, what should you establish first?',
    '[{"id":"a","text":"The problem, context, constraints, and observable success criteria"},{"id":"b","text":"A tool choice before clarifying the goal"},{"id":"c","text":"A deadline that assumes every task will go perfectly"},{"id":"d","text":"A final solution before checking who will use it"}]'::jsonb,
    'a',
    'Clear outcomes and constraints make the work for “{checkpoint}” focused and reviewable.'
  ),
  (
    'cp_phase_2',
    'Which result is the strongest evidence for “{checkpoint}”?',
    '[{"id":"a","text":"A completed tutorial with no applied work"},{"id":"b","text":"A working, role-relevant deliverable with decisions and requirements recorded"},{"id":"c","text":"A progress estimate without an artifact"},{"id":"d","text":"A copied example whose behavior is not understood"}]'::jsonb,
    'b',
    'A role-relevant deliverable with traceable decisions demonstrates applied learning for “{checkpoint}”.'
  ),
  (
    'cp_phase_3',
    'How should you verify the work for “{checkpoint}” before calling it complete?',
    '[{"id":"a","text":"Check only the most common happy path"},{"id":"b","text":"Rely on appearance or intuition instead of criteria"},{"id":"c","text":"Compare it with stated criteria and check normal, boundary, and failure cases"},{"id":"d","text":"Skip review if the first attempt worked"}]'::jsonb,
    'c',
    'Verifying stated criteria and edge cases gives stronger evidence than a happy-path check for “{checkpoint}”.'
  ),
  (
    'cp_phase_4',
    'What makes the outcome of “{checkpoint}” ready to share with a reviewer?',
    '[{"id":"a","text":"A reproducible result, supporting evidence, key tradeoffs, and known limitations"},{"id":"b","text":"A claim of success with no supporting artifact"},{"id":"c","text":"A polished summary that omits failed attempts and limitations"},{"id":"d","text":"A list of tools used without explaining the outcome"}]'::jsonb,
    'a',
    'Reviewers need reproducible evidence and an honest account of tradeoffs and limitations for “{checkpoint}”.'
  );

-- Backfill incomplete checkpoints from roadmaps created before this quiz bank
-- existed. Completed tasks keep their historical state and are not changed.
with roadmap_lengths as (
  select roadmap_id, count(*)::integer as milestone_count
  from public.milestones
  group by roadmap_id
), missing_quizzes as (
  select
    task.id as task_id,
    task.title as task_title,
    least(
      4,
      greatest(1, floor(((milestone.position - 1) * 4.0) / roadmap_lengths.milestone_count)::integer + 1)
    ) as phase
  from public.tasks as task
  join public.milestones as milestone on milestone.id = task.milestone_id
  join roadmap_lengths on roadmap_lengths.roadmap_id = milestone.roadmap_id
  where task.task_type = 'Checkpoint'
    and task.done_at is null
    and not exists (
      select 1 from public.task_quizzes as existing where existing.task_id = task.id
    )
)
insert into public.task_quizzes (task_id, question, options, explanation)
select
  missing_quizzes.task_id,
  replace(template.question_template, '{checkpoint}', missing_quizzes.task_title),
  (
    select jsonb_agg(
      jsonb_build_object(
        'id', choice.value->>'id',
        'text', choice.value->>'text',
        'is_correct', (choice.value->>'id') = template.correct_option_id
      ) order by choice.ordinality
    )
    from jsonb_array_elements(template.options) with ordinality as choice(value, ordinality)
  ),
  replace(template.explanation_template, '{checkpoint}', missing_quizzes.task_title)
from missing_quizzes
join private.checkpoint_quiz_templates as template
  on template.id = 'cp_phase_' || missing_quizzes.phase::text;

-- A checkpoint is never directly completable if its protected assessment is
-- missing. This closes the completion path for manually inserted or stale rows.
create or replace function public.guard_quiz_task_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.task_type = 'Checkpoint'
    and not exists (select 1 from public.task_quizzes as quiz where quiz.task_id = new.id) then
    raise exception 'This checkpoint is missing its assessment and cannot be completed' using errcode = '42501';
  end if;

  if old.done_at is null and new.done_at is not null
    and exists (select 1 from public.task_quizzes as quiz where quiz.task_id = new.id)
    and not exists (
      select 1 from public.quiz_submissions as submission
      where submission.user_id = new.user_id
        and submission.task_id = new.id
        and submission.is_correct
    ) then
    raise exception 'Pass the checkpoint before completing this task' using errcode = '42501';
  end if;

  if old.done_at is not null and new.done_at is null
    and exists (select 1 from public.task_quizzes as quiz where quiz.task_id = new.id) then
    raise exception 'Checkpoint completion cannot be cleared' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Replace the MFA wrapper so it expands server-managed quiz templates before
-- delegating roadmap creation to the original transactional implementation.
create or replace function public.create_user_roadmap(
  p_target_role text,
  p_target_date date,
  p_milestones jsonb,
  p_tasks jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tasks jsonb := p_tasks;
begin
  if not private.has_mfa_assurance() then
    raise exception 'Complete multi-factor verification before continuing' using errcode = '42501';
  end if;

  if jsonb_typeof(p_tasks) = 'array' then
    if exists (
      select 1
      from jsonb_array_elements(p_tasks) as item(value)
      where item.value->>'task_type' = 'Checkpoint'
        and not exists (
          select 1
          from private.checkpoint_quiz_templates as template
          where template.id = item.value->>'quiz_template_id'
        )
    ) then
      raise exception 'A generated checkpoint is missing its quiz template' using errcode = '22023';
    end if;

    select coalesce(jsonb_agg(
      case
        when item.value->>'task_type' = 'Checkpoint' then
          jsonb_set(
            item.value - 'quiz_template_id' - 'quiz',
            '{quiz}',
            (
              select jsonb_build_object(
                'question', replace(template.question_template, '{checkpoint}', item.value->>'title'),
                'options', (
                  select jsonb_agg(
                    jsonb_build_object(
                      'id', choice.value->>'id',
                      'text', choice.value->>'text',
                      'is_correct', (choice.value->>'id') = template.correct_option_id
                    ) order by choice.ordinality
                  )
                  from jsonb_array_elements(template.options) with ordinality as choice(value, ordinality)
                ),
                'explanation', replace(template.explanation_template, '{checkpoint}', item.value->>'title')
              )
              from private.checkpoint_quiz_templates as template
              where template.id = item.value->>'quiz_template_id'
            ),
            true
          )
        else item.value - 'quiz_template_id' - 'quiz'
      end order by item.ordinality
    ), '[]'::jsonb)
    into v_tasks
    from jsonb_array_elements(p_tasks) with ordinality as item(value, ordinality);
  end if;

  return public.create_user_roadmap_mfa_internal(
    p_target_role,
    p_target_date,
    p_milestones,
    v_tasks
  );
end;
$$;

revoke all on function public.create_user_roadmap(text, date, jsonb, jsonb) from public, anon;
grant execute on function public.create_user_roadmap(text, date, jsonb, jsonb) to authenticated;
