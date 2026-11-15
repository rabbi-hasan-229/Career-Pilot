-- Pin name resolution for the auth trigger's SECURITY DEFINER function.
-- The trigger still runs as its owner, but application roles cannot invoke it
-- through the Data API or as a regular function.
alter function public.handle_new_user()
  set search_path = '';
revoke all on function public.handle_new_user()
  from public, anon, authenticated;

-- This view intentionally uses its owner to read quiz answer keys, because
-- direct access to task_quizzes is revoked. The view projects only sanitized
-- choices and explicitly restricts rows to tasks owned by auth.uid(). A
-- security barrier also keeps caller-supplied predicates from being evaluated
-- ahead of that ownership filter.
alter view public.task_quizzes_public
  set (security_barrier = true);
comment on view public.task_quizzes_public is
  'Intentional owner-privileged view: exposes sanitized quiz choices only for tasks owned by auth.uid(); direct access to task_quizzes remains revoked.';
