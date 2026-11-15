create table public.planner_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  roadmap_id uuid not null references public.user_roadmaps(id) on delete cascade,
  action_type text not null check (action_type in ('behind', 'early', 'pause')),
  day_shift integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index planner_actions_user_created_idx
  on public.planner_actions (user_id, created_at desc);
alter table public.planner_actions enable row level security;
create policy "users read own planner actions"
  on public.planner_actions for select to authenticated
  using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.planner_actions from anon, authenticated;

create or replace function public.apply_user_roadmap_action(p_action_type text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_roadmap_id uuid;
  v_target_date date;
  v_new_target_date date;
  v_active_position integer;
  v_active_end_date date;
  v_day_shift integer;
  v_milestones_changed integer := 0;
  v_tasks_rescheduled integer := 0;
  v_message text;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_action_type is null or p_action_type not in ('behind', 'early', 'pause') then
    raise exception 'Unsupported planner action' using errcode = '22023';
  end if;

  select r.id, r.target_date into v_roadmap_id, v_target_date
  from public.user_roadmaps r
  where r.user_id = v_user_id and r.status = 'active'
  order by r.created_at desc
  limit 1
  for update;
  if not found then
    raise exception 'No active roadmap exists for this account' using errcode = 'P0002';
  end if;

  select m.position, m.end_date into v_active_position, v_active_end_date
  from public.milestones m
  where m.roadmap_id = v_roadmap_id
    and m.user_id = v_user_id
    and exists (
      select 1 from public.tasks t
      where t.milestone_id = m.id and t.user_id = v_user_id and t.done_at is null
    )
  order by m.position asc
  limit 1;
  if not found then
    return jsonb_build_object(
      'success', true,
      'day_shift', 0,
      'target_date', v_target_date,
      'message', 'All roadmap tasks are complete; there are no dates to change.'
    );
  end if;

  if p_action_type = 'behind' then
    v_day_shift := 3;
    v_message := 'The current stage and following dates moved back by 3 days.';
  elsif p_action_type = 'pause' then
    v_day_shift := 7;
    v_message := 'The current stage and following dates moved back by 7 days.';
  else
    v_day_shift := -least(
      3,
      greatest(0, coalesce(v_active_end_date, current_date) - current_date - 1),
      greatest(0, v_target_date - current_date)
    );
    if v_day_shift = 0 then
      return jsonb_build_object(
        'success', true,
        'day_shift', 0,
        'target_date', v_target_date,
        'message', 'The current schedule is already at its earliest dates.'
      );
    end if;
    v_message := 'Remaining milestone and task dates moved forward by ' || abs(v_day_shift)::text || ' days. Tasks still need to be completed.';
  end if;

  update public.milestones m
  set start_date = case
        when v_day_shift < 0 then greatest(current_date, coalesce(m.start_date, current_date) + v_day_shift)
        else coalesce(m.start_date, current_date) + v_day_shift
      end,
      end_date = case
        when v_day_shift < 0 then greatest(current_date + 1, coalesce(m.end_date, current_date + 1) + v_day_shift)
        else coalesce(m.end_date, current_date + 1) + v_day_shift
      end
  where m.roadmap_id = v_roadmap_id
    and m.user_id = v_user_id
    and m.position >= v_active_position;
  get diagnostics v_milestones_changed = row_count;

  update public.tasks t
  set due_date = case
        when v_day_shift < 0 then greatest(current_date, t.due_date + v_day_shift)
        else t.due_date + v_day_shift
      end
  from public.milestones m
  where t.milestone_id = m.id
    and m.roadmap_id = v_roadmap_id
    and m.user_id = v_user_id
    and t.user_id = v_user_id
    and m.position >= v_active_position
    and t.done_at is null;
  get diagnostics v_tasks_rescheduled = row_count;

  v_new_target_date := greatest(current_date, v_target_date + v_day_shift);
  update public.user_roadmaps
    set target_date = v_new_target_date
    where id = v_roadmap_id and user_id = v_user_id;
  update public.profiles
    set target_completion_date = v_new_target_date
    where id = v_user_id;

  insert into public.planner_actions (user_id, roadmap_id, action_type, day_shift, metadata)
  values (
    v_user_id,
    v_roadmap_id,
    p_action_type,
    v_day_shift,
    jsonb_build_object('milestones_changed', v_milestones_changed, 'tasks_rescheduled', v_tasks_rescheduled)
  );

  return jsonb_build_object(
    'success', true,
    'action_type', p_action_type,
    'day_shift', v_day_shift,
    'target_date', v_new_target_date,
    'milestones_changed', v_milestones_changed,
    'tasks_rescheduled', v_tasks_rescheduled,
    'message', v_message
  );
end;
$$;

revoke all on function public.apply_user_roadmap_action(text) from public, anon;
grant execute on function public.apply_user_roadmap_action(text) to authenticated;
