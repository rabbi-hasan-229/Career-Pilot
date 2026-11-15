-- Persist onboarding choices and enrich the planner's user-owned records.
alter table public.profiles
  add column target_timeline_months integer check (target_timeline_months between 1 and 60),
  add column target_completion_date date,
  add column experience_level text check (experience_level in ('beginner', 'switcher', 'junior', 'mid')),
  add column phone text,
  add column username text unique,
  add column bio text,
  add column location text,
  add column portfolio_url text,
  add column github_url text,
  add column linkedin_url text,
  add column notification_daily_reminder boolean not null default true,
  add column notification_milestone_alerts boolean not null default true,
  add column notification_weekly_digest boolean not null default true,
  add column learning_style text check (learning_style in ('hands_on', 'balanced', 'fast_track'));
grant update (
  target_timeline_months, target_completion_date, experience_level, phone,
  username, bio, location, portfolio_url, github_url, linkedin_url,
  notification_daily_reminder, notification_milestone_alerts,
  notification_weekly_digest, learning_style
)
  on table public.profiles to authenticated;

alter table public.user_roadmaps
  add column target_role text not null default '',
  add column generated_from text not null default 'curated' check (generated_from in ('curated', 'custom'));

alter table public.milestones
  add column effort_hours integer check (effort_hours >= 0),
  add column island_zone text not null default 'coastal_harbor',
  add column skills_covered text[] not null default '{}';

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  role_id uuid references public.roles(id) on delete set null,
  title text not null,
  description text,
  url text,
  provider text,
  resource_type text not null default 'article',
  est_minutes integer not null default 30 check (est_minutes between 1 and 1440),
  skill_ids uuid[] not null default '{}',
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.resources enable row level security;
create policy "authenticated read published resources"
  on public.resources for select to authenticated
  using (is_published);
revoke insert, update, delete on public.resources from anon, authenticated;

alter table public.tasks
  add column subject text not null default 'Career skills',
  add column task_type text not null default 'Learn'
    check (task_type in ('Learn', 'Build', 'Practice', 'Checkpoint')),
  add column progress_pct integer not null default 0 check (progress_pct between 0 and 100),
  add column deliverable text,
  add constraint tasks_resource_id_fkey
    foreign key (resource_id) references public.resources(id) on delete set null;

-- Authenticated users may access only their own CV/interview/skills data under
-- policies established in the security baseline. Coach history and reminders
-- follow the same ownership rule.
create table public.ai_coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sender text not null check (sender in ('user', 'ai')),
  message text not null check (char_length(message) between 1 and 12000),
  proposal jsonb,
  created_at timestamptz not null default now()
);
create index ai_coach_messages_user_created_idx
  on public.ai_coach_messages (user_id, created_at desc);
alter table public.ai_coach_messages enable row level security;
create policy "users manage own coach messages"
  on public.ai_coach_messages for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('task', 'milestone', 'streak', 'system')),
  title text not null,
  body text not null,
  action_url text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index user_notifications_user_created_idx
  on public.user_notifications (user_id, created_at desc);
alter table public.user_notifications enable row level security;
create policy "users manage own notifications"
  on public.user_notifications for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index user_roadmaps_user_status_idx on public.user_roadmaps (user_id, status);
create index milestones_roadmap_position_idx on public.milestones (roadmap_id, position);
create index tasks_milestone_due_idx on public.tasks (milestone_id, due_date);

-- Create an entire roadmap in one database transaction. Ownership comes from
-- the verified Auth JWT; client-supplied user IDs are never accepted.
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
  v_roadmap_id uuid;
  v_milestone_id uuid;
  v_task_id uuid;
  v_milestone jsonb;
  v_task jsonb;
  v_local_id text;
  v_milestone_ids jsonb := '{}'::jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_target_role is null or char_length(trim(p_target_role)) not between 2 and 100 then
    raise exception 'Target role must be between 2 and 100 characters' using errcode = '22023';
  end if;
  if p_target_date is null or p_target_date < current_date or p_target_date > current_date + 1825 then
    raise exception 'Target date must be within the next five years' using errcode = '22023';
  end if;
  if p_milestones is null or jsonb_typeof(p_milestones) is distinct from 'array' then
    raise exception 'Milestones must be an array' using errcode = '22023';
  end if;
  if jsonb_array_length(p_milestones) not between 1 and 100 then
    raise exception 'A roadmap must contain between 1 and 100 milestones' using errcode = '22023';
  end if;
  if p_tasks is null or jsonb_typeof(p_tasks) is distinct from 'array' then
    raise exception 'Tasks must be an array' using errcode = '22023';
  end if;
  if jsonb_array_length(p_tasks) > 2000 then
    raise exception 'Tasks must be an array containing at most 2000 items' using errcode = '22023';
  end if;

  update public.user_roadmaps
    set status = 'paused'
    where user_id = v_user_id and status = 'active';

  insert into public.user_roadmaps (user_id, target_date, status, target_role)
    values (v_user_id, p_target_date, 'active', trim(p_target_role))
    returning id into v_roadmap_id;

  for v_milestone in select value from jsonb_array_elements(p_milestones) as items(value) loop
    v_local_id := v_milestone->>'local_id';
    if v_local_id is null or v_milestone_ids ? v_local_id then
      raise exception 'Milestone identifiers must be unique' using errcode = '22023';
    end if;

    insert into public.milestones (
      roadmap_id, user_id, title, position, start_date, end_date,
      status, effort_hours, island_zone, skills_covered
    ) values (
      v_roadmap_id,
      v_user_id,
      coalesce(nullif(v_milestone->>'title', ''), 'Learning milestone'),
      coalesce((v_milestone->>'position')::integer, 1),
      (v_milestone->>'start_date')::date,
      (v_milestone->>'end_date')::date,
      coalesce(v_milestone->>'status', 'todo'),
      nullif(v_milestone->>'effort_hours', '')::integer,
      coalesce(nullif(v_milestone->>'island_zone', ''), 'coastal_harbor'),
      coalesce(array(select jsonb_array_elements_text(coalesce(v_milestone->'skills_covered', '[]'::jsonb))), '{}')
    ) returning id into v_milestone_id;
    v_milestone_ids := v_milestone_ids || jsonb_build_object(v_local_id, v_milestone_id);
  end loop;

  for v_task in select value from jsonb_array_elements(p_tasks) as items(value) loop
    v_local_id := v_task->>'milestone_local_id';
    if v_local_id is null or not (v_milestone_ids ? v_local_id) then
      raise exception 'Each task must reference a roadmap milestone' using errcode = '22023';
    end if;

    v_milestone_id := (v_milestone_ids->>v_local_id)::uuid;
    insert into public.tasks (
      milestone_id, user_id, title, due_date, est_minutes, done_at,
      subject, task_type, progress_pct, deliverable
    ) values (
      v_milestone_id,
      v_user_id,
      coalesce(nullif(v_task->>'title', ''), 'Learning task'),
      (v_task->>'due_date')::date,
      coalesce((v_task->>'est_minutes')::integer, 30),
      nullif(v_task->>'done_at', '')::timestamptz,
      coalesce(nullif(v_task->>'subject', ''), 'Career skills'),
      coalesce(nullif(v_task->>'task_type', ''), 'Learn'),
      coalesce((v_task->>'progress_pct')::integer, 0),
      v_task->>'deliverable'
    ) returning id into v_task_id;

    if jsonb_typeof(v_task->'quiz') = 'object' then
      insert into public.task_quizzes (task_id, question, options, explanation)
        values (
          v_task_id,
          coalesce(nullif(v_task->'quiz'->>'question', ''), 'Checkpoint question'),
          coalesce(v_task->'quiz'->'options', '[]'::jsonb),
          coalesce(v_task->'quiz'->>'explanation', '')
        );
    end if;
  end loop;

  return v_roadmap_id;
end;
$$;

revoke all on function public.create_user_roadmap(text, date, jsonb, jsonb) from public, anon;
grant execute on function public.create_user_roadmap(text, date, jsonb, jsonb) to authenticated;
