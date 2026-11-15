-- Browser push endpoints are credentials: expose only the signed-in owner's rows.
create table public.user_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth_secret text not null,
  timezone text not null default 'UTC',
  last_sent_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_push_subscriptions_endpoint_unique unique (endpoint),
  constraint user_push_subscriptions_https_endpoint check (endpoint ~ '^https://'),
  constraint user_push_subscriptions_endpoint_size check (octet_length(endpoint) <= 2048),
  constraint user_push_subscriptions_timezone_size check (octet_length(timezone) <= 100)
);

create index user_push_subscriptions_user_idx on public.user_push_subscriptions (user_id);
alter table public.user_push_subscriptions enable row level security;
create policy "users manage own push subscriptions"
  on public.user_push_subscriptions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "require mfa for enrolled users"
  on public.user_push_subscriptions as restrictive to authenticated
  using ((select private.has_mfa_assurance()));
grant select, insert, update, delete on public.user_push_subscriptions to authenticated;
revoke all on public.user_push_subscriptions from anon;

create or replace function public.set_push_subscription_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger user_push_subscriptions_updated_at
  before update on public.user_push_subscriptions
  for each row execute function public.set_push_subscription_updated_at();
