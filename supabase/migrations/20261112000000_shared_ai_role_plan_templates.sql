create table public.ai_role_plan_templates (
  cache_key text primary key check (cache_key ~ '^[0-9a-f]{64}$'),
  model_name text not null check (char_length(model_name) between 1 and 120),
  template_version smallint not null check (template_version > 0),
  response jsonb not null check (jsonb_typeof(response) = 'object'),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.ai_role_plan_templates enable row level security;
revoke all on public.ai_role_plan_templates from public, anon, authenticated;
grant select, insert, update, delete on public.ai_role_plan_templates to service_role;

create index ai_role_plan_templates_expiry_idx
  on public.ai_role_plan_templates (expires_at);

comment on table public.ai_role_plan_templates is
  'Service-role-only cache of validated, generic role-plan milestones. Keys are SHA-256 digests; role titles and request inputs are never stored.';

alter table public.ai_usage
  add column request_source text not null default 'model'
    check (request_source in ('model', 'cache'));

create or replace view public.ai_usage_daily_summary
with (security_invoker = true)
as
select
  (u.created_at at time zone 'UTC')::date as usage_day,
  u.feature,
  count(*) filter (
    where u.request_source = 'model' and u.tokens_in is not null and u.tokens_out is not null
  )::bigint as completed_requests,
  count(*) filter (
    where u.request_source = 'model' and (u.tokens_in is null or u.tokens_out is null)
  )::bigint as pending_requests,
  coalesce(sum(u.tokens_in::bigint), 0)::bigint as tokens_in,
  coalesce(sum(u.tokens_out::bigint), 0)::bigint as tokens_out,
  coalesce(sum(case
    when u.request_source = 'model' and (u.tokens_in is null or u.tokens_out is null)
      then u.reserved_tokens::bigint
    else 0
  end), 0)::bigint as reserved_tokens,
  count(*) filter (where u.request_source = 'cache')::bigint as cached_requests
from public.ai_usage as u
group by (u.created_at at time zone 'UTC')::date, u.feature;

-- Cached role templates consume no provider tokens but still count toward the
-- account feature quota. Keep this separate from token reservations so a cache
-- hit remains available after the global model token budget is exhausted.
create function public.record_cached_ai_usage(
  p_user_id uuid,
  p_feature text,
  p_feature_limit integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_used integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
  if p_user_id is null or p_feature is distinct from 'role'
    or p_feature_limit is null or p_feature_limit not between 1 and 1000 then
    raise exception 'Invalid cached AI usage request' using errcode = '22023';
  end if;

  -- Serialize the feature quota check with regular AI usage reservations.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('career-pilot:ai-daily-token-budget', 0)
  );

  select count(*)::integer into v_user_used
  from public.ai_usage as u
  where u.user_id = p_user_id
    and u.feature = 'role'
    and u.created_at >= now() - interval '7 days';
  if v_user_used >= p_feature_limit then
    return jsonb_build_object(
      'allowed', false, 'reason', 'weekly_feature_limit',
      'used', v_user_used, 'limit', p_feature_limit
    );
  end if;

  insert into public.ai_usage (user_id, feature, reserved_tokens, tokens_in, tokens_out, request_source)
  values (p_user_id, 'role', 0, 0, 0, 'cache');

  return jsonb_build_object(
    'allowed', true, 'used', v_user_used + 1, 'limit', p_feature_limit
  );
end;
$$;

revoke all on function public.record_cached_ai_usage(uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.record_cached_ai_usage(uuid, text, integer)
  to service_role;
