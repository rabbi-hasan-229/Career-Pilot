-- Let authenticated learners create their own roadmap task with a published
-- curated resource attached. Hidden resource rows cannot be linked through the
-- browser because the policy check also observes resource RLS.
drop policy if exists "users insert own tasks" on public.tasks;
create policy "users insert own tasks"
  on public.tasks for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.milestones m
      where m.id = milestone_id and m.user_id = (select auth.uid())
    )
    and (
      resource_id is null
      or exists (
        select 1 from public.resources r
        where r.id = resource_id and r.is_published
      )
    )
  );

grant insert (resource_id) on public.tasks to authenticated;
create index if not exists tasks_user_resource_idx
  on public.tasks (user_id, resource_id)
  where resource_id is not null;
