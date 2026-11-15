-- Close the anonymous OTP table introduced by the prototype. Email verification
-- is handled by Supabase Auth; application clients must never read/write codes.
drop policy if exists "anon insert auth_otps" on public.auth_otps;
drop policy if exists "anon select auth_otps" on public.auth_otps;
drop policy if exists "anon update auth_otps" on public.auth_otps;
revoke all on table public.auth_otps from anon, authenticated;

-- A user's plan is a billing/authorization value, not a self-service profile field.
drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
revoke update on table public.profiles from authenticated;
grant update (full_name, avatar_url, target_role, daily_minutes)
  on table public.profiles to authenticated;

-- Gamification awards must be written by trusted server-side logic.
drop policy if exists "users manage own gamification" on public.user_gamification;
create policy "users read own gamification"
  on public.user_gamification for select to authenticated
  using ((select auth.uid()) = user_id);
revoke insert, update, delete on table public.user_gamification from authenticated;

-- Explicit WITH CHECK clauses prevent ownership reassignment on writes.
drop policy if exists "users manage own roadmaps" on public.user_roadmaps;
create policy "users manage own roadmaps"
  on public.user_roadmaps for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "users manage own milestones" on public.milestones;
create policy "users manage own milestones"
  on public.milestones for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "users manage own tasks" on public.tasks;
create policy "users manage own tasks"
  on public.tasks for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "users manage own quiz submissions" on public.quiz_submissions;
create policy "users read own quiz submissions"
  on public.quiz_submissions for select to authenticated
  using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.quiz_submissions from authenticated;

drop policy if exists "users manage own achievements" on public.user_achievements;
drop policy if exists "users read own achievements" on public.user_achievements;
create policy "users read own achievements"
  on public.user_achievements for select to authenticated
  using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.user_achievements from authenticated;

drop policy if exists "users manage own skills" on public.user_skills;
create policy "users manage own skills"
  on public.user_skills for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "users manage own interview attempts" on public.interview_attempts;
create policy "users manage own interview attempts"
  on public.interview_attempts for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "users manage own cv documents" on public.cv_documents;
create policy "users manage own cv documents"
  on public.cv_documents for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
