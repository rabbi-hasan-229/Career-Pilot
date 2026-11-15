-- Keep one active roadmap per account even when creation runs concurrently
-- from multiple devices. Preserve the most recently created active plan.
with ranked_active_roadmaps as (
  select id,
    row_number() over (
      partition by user_id
      order by created_at desc nulls last, id desc
    ) as position
  from public.user_roadmaps
  where status = 'active' and user_id is not null
)
update public.user_roadmaps as roadmap
set status = 'paused'
from ranked_active_roadmaps as ranked
where roadmap.id = ranked.id and ranked.position > 1;

create unique index user_roadmaps_one_active_per_user_idx
  on public.user_roadmaps (user_id)
  where status = 'active' and user_id is not null;

-- Serialize plan creation before the existing transactional routine pauses
-- the prior plan. The unique index remains the invariant for every write path.
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
  v_user_id uuid := auth.uid();
  v_tasks jsonb := p_tasks;
begin
  if not private.has_mfa_assurance() then
    raise exception 'Complete multi-factor verification before continuing' using errcode = '42501';
  end if;

  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text, 0)
  );

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
