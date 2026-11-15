-- Opt-in MFA policy: accounts without a verified factor may use AAL1; accounts
-- with a verified factor must use AAL2 for personal data and user operations.
-- The helper lives outside exposed schemas and can only answer for auth.uid().

-- Legacy cache and global settings are server-only; neither belongs in the
-- browser Data API. The AI gateway only needs read access to app_settings.
alter table public.ai_cache enable row level security;
revoke all on table public.ai_cache from public, anon, authenticated, service_role;
alter table public.app_settings enable row level security;
revoke all on table public.app_settings from public, anon, authenticated;
grant select on table public.app_settings to service_role;
revoke all on table public.auth_otps from public, anon, authenticated;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.has_mfa_assurance()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (select auth.uid()) is null then false
    when exists (
      select 1
      from auth.mfa_factors as factor
      where factor.user_id = (select auth.uid())
        and factor.status = 'verified'
    ) then coalesce((select auth.jwt()->>'aal'), 'aal1') = 'aal2'
    else true
  end;
$$;
revoke all on function private.has_mfa_assurance() from public, anon;
grant execute on function private.has_mfa_assurance() to authenticated;

-- A restrictive policy composes with the existing ownership policies instead
-- of granting access by itself. It applies to reads and writes on account data.
create policy "require mfa for enrolled users"
  on public.profiles as restrictive to authenticated
  using ((select private.has_mfa_assurance()));
create policy "require mfa for enrolled users"
  on public.user_gamification as restrictive to authenticated
  using ((select private.has_mfa_assurance()));
create policy "require mfa for enrolled users"
  on public.user_roadmaps as restrictive to authenticated
  using ((select private.has_mfa_assurance()));
create policy "require mfa for enrolled users"
  on public.milestones as restrictive to authenticated
  using ((select private.has_mfa_assurance()));
create policy "require mfa for enrolled users"
  on public.tasks as restrictive to authenticated
  using ((select private.has_mfa_assurance()));
create policy "require mfa for enrolled users"
  on public.quiz_submissions as restrictive to authenticated
  using ((select private.has_mfa_assurance()));
create policy "require mfa for enrolled users"
  on public.user_achievements as restrictive to authenticated
  using ((select private.has_mfa_assurance()));
create policy "require mfa for enrolled users"
  on public.ai_usage as restrictive to authenticated
  using ((select private.has_mfa_assurance()));
create policy "require mfa for enrolled users"
  on public.user_skills as restrictive to authenticated
  using ((select private.has_mfa_assurance()));
create policy "require mfa for enrolled users"
  on public.interview_attempts as restrictive to authenticated
  using ((select private.has_mfa_assurance()));
create policy "require mfa for enrolled users"
  on public.cv_documents as restrictive to authenticated
  using ((select private.has_mfa_assurance()));
create policy "require mfa for enrolled users"
  on public.ai_coach_messages as restrictive to authenticated
  using ((select private.has_mfa_assurance()));
create policy "require mfa for enrolled users"
  on public.user_notifications as restrictive to authenticated
  using ((select private.has_mfa_assurance()));
create policy "require mfa for enrolled users"
  on public.planner_actions as restrictive to authenticated
  using ((select private.has_mfa_assurance()));

-- These SECURITY DEFINER RPCs write account data and therefore need their own
-- assurance check; table RLS policies do not constrain their owner context.
alter function public.create_user_roadmap(text, date, jsonb, jsonb)
  rename to create_user_roadmap_mfa_internal;
revoke all on function public.create_user_roadmap_mfa_internal(text, date, jsonb, jsonb)
  from public, anon, authenticated;
create function public.create_user_roadmap(
  p_target_role text, p_target_date date, p_milestones jsonb, p_tasks jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_mfa_assurance() then
    raise exception 'Complete multi-factor verification before continuing' using errcode = '42501';
  end if;
  return public.create_user_roadmap_mfa_internal(p_target_role, p_target_date, p_milestones, p_tasks);
end;
$$;
revoke all on function public.create_user_roadmap(text, date, jsonb, jsonb) from public, anon;
grant execute on function public.create_user_roadmap(text, date, jsonb, jsonb) to authenticated;

alter function public.submit_task_quiz(uuid, text)
  rename to submit_task_quiz_mfa_internal;
revoke all on function public.submit_task_quiz_mfa_internal(uuid, text)
  from public, anon, authenticated;
create function public.submit_task_quiz(p_task_id uuid, p_selected_option text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_mfa_assurance() then
    raise exception 'Complete multi-factor verification before continuing' using errcode = '42501';
  end if;
  return public.submit_task_quiz_mfa_internal(p_task_id, p_selected_option);
end;
$$;
revoke all on function public.submit_task_quiz(uuid, text) from public, anon;
grant execute on function public.submit_task_quiz(uuid, text) to authenticated;

alter function public.apply_user_roadmap_action(text)
  rename to apply_user_roadmap_action_mfa_internal;
revoke all on function public.apply_user_roadmap_action_mfa_internal(text)
  from public, anon, authenticated;
create function public.apply_user_roadmap_action(p_action_type text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_mfa_assurance() then
    raise exception 'Complete multi-factor verification before continuing' using errcode = '42501';
  end if;
  return public.apply_user_roadmap_action_mfa_internal(p_action_type);
end;
$$;
revoke all on function public.apply_user_roadmap_action(text) from public, anon;
grant execute on function public.apply_user_roadmap_action(text) to authenticated;

alter function public.complete_user_task(uuid)
  rename to complete_user_task_mfa_internal;
revoke all on function public.complete_user_task_mfa_internal(uuid)
  from public, anon, authenticated;
create function public.complete_user_task(p_task_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_mfa_assurance() then
    raise exception 'Complete multi-factor verification before continuing' using errcode = '42501';
  end if;
  return public.complete_user_task_mfa_internal(p_task_id);
end;
$$;
revoke all on function public.complete_user_task(uuid) from public, anon;
grant execute on function public.complete_user_task(uuid) to authenticated;
