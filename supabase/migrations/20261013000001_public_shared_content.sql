-- Allow anon read access to shared templates, milestones, and quizzes
drop policy if exists "anon read roles" on public.roles;
create policy "anon read roles" on public.roles for select using (true);

drop policy if exists "anon read role milestones" on public.role_milestones;
create policy "anon read role milestones" on public.role_milestones for select using (true);

drop policy if exists "anon read task quizzes" on public.task_quizzes;
create policy "anon read task quizzes" on public.task_quizzes for select using (true);

drop policy if exists "anon read achievements" on public.achievements;
create policy "anon read achievements" on public.achievements for select using (true);
