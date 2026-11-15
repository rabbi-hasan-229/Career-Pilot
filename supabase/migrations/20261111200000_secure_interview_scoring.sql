-- Keep interview answer keys server-only. Authenticated clients can read only
-- the public prompt metadata needed to render the practice session.
revoke all on table public.interview_questions from public, anon, authenticated;
grant select (id, role_category, round, difficulty, question, created_at)
  on table public.interview_questions to authenticated;

-- Attempts remain readable by their owner, but only the trusted scoring
-- function (service role) may create or modify them.
revoke all on table public.interview_attempts from public, anon, authenticated;
grant select on table public.interview_attempts to authenticated;
alter table public.interview_attempts
  add column request_id uuid,
  add constraint interview_attempts_user_request_id_key unique (user_id, request_id);

drop policy if exists "users manage own interview attempts" on public.interview_attempts;
drop policy if exists "users read own interview attempts" on public.interview_attempts;
create policy "users read own interview attempts"
  on public.interview_attempts for select to authenticated
  using ((select auth.uid()) = user_id);
