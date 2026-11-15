-- Add a system-wide UTC-day token budget. Pending calls reserve an allowance
-- so parallel requests cannot all spend the same remaining budget.
alter table public.ai_usage
  add column reserved_tokens integer not null default 0
    check (reserved_tokens between 0 and 2000000);

insert into public.app_settings (key, value)
values ('ai_daily_token_budget_tokens', '200000'::jsonb)
on conflict (key) do nothing;

create index ai_usage_created_feature_idx
  on public.ai_usage (created_at, feature);

drop function if exists public.reserve_ai_usage(uuid, text, integer);

create function public.reserve_ai_usage(
  p_user_id uuid,
  p_feature text,
  p_feature_limit integer,
  p_reserved_tokens integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_used integer;
  v_daily_used bigint;
  v_daily_budget bigint;
  v_budget_value jsonb;
  v_reservation_id bigint;
  v_day_start timestamptz := pg_catalog.date_trunc('day', pg_catalog.timezone('UTC', now())) at time zone 'UTC';
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
  if p_user_id is null or p_feature is null or p_feature not in ('coach', 'cv', 'interview', 'role')
    or p_feature_limit is null or p_feature_limit not between 1 and 1000
    or p_reserved_tokens is null or p_reserved_tokens not between 1 and 2000000 then
    raise exception 'Invalid AI usage reservation' using errcode = '22023';
  end if;

  -- Only the reservation transaction takes this lock; model calls happen later.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('career-pilot:ai-daily-token-budget', 0)
  );

  delete from public.ai_usage
  where tokens_in is null
    and tokens_out is null
    and created_at < now() - interval '5 minutes';

  select value into v_budget_value
  from public.app_settings
  where key = 'ai_daily_token_budget_tokens';
  begin
    v_daily_budget := coalesce((v_budget_value #>> '{}')::bigint, 200000);
  exception when others then
    raise exception 'Invalid AI daily token budget setting' using errcode = '22023';
  end;
  if v_daily_budget not between 1 and 1000000000 then
    raise exception 'AI daily token budget must be between 1 and 1000000000' using errcode = '22023';
  end if;

  select count(*)::integer into v_user_used
  from public.ai_usage as u
  where u.user_id = p_user_id
    and u.feature = p_feature
    and u.created_at >= now() - interval '7 days';
  if v_user_used >= p_feature_limit then
    return jsonb_build_object(
      'allowed', false, 'reason', 'weekly_feature_limit',
      'used', v_user_used, 'limit', p_feature_limit
    );
  end if;

  select coalesce(sum(
    case
      when u.tokens_in is null or u.tokens_out is null then u.reserved_tokens::bigint
      else u.tokens_in::bigint + u.tokens_out::bigint
    end
  ), 0)::bigint into v_daily_used
  from public.ai_usage as u
  where u.created_at >= v_day_start;

  if v_daily_used + p_reserved_tokens > v_daily_budget then
    return jsonb_build_object(
      'allowed', false, 'reason', 'daily_budget_reached',
      'used_tokens', v_daily_used, 'limit_tokens', v_daily_budget
    );
  end if;

  insert into public.ai_usage (user_id, feature, reserved_tokens)
  values (p_user_id, p_feature, p_reserved_tokens)
  returning id into v_reservation_id;

  return jsonb_build_object(
    'allowed', true,
    'used', v_user_used + 1,
    'limit', p_feature_limit,
    'reservation_id', v_reservation_id,
    'daily_used_tokens', v_daily_used + p_reserved_tokens,
    'daily_limit_tokens', v_daily_budget
  );
end;
$$;
revoke all on function public.reserve_ai_usage(uuid, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.reserve_ai_usage(uuid, text, integer, integer)
  to service_role;

create or replace function public.finish_ai_usage(
  p_reservation_id bigint,
  p_success boolean,
  p_tokens_in integer default null,
  p_tokens_out integer default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
  if p_reservation_id is null or p_success is null then
    raise exception 'Reservation identifier and result are required' using errcode = '22023';
  end if;

  if p_success then
    if p_tokens_in is null or p_tokens_out is null
      or p_tokens_in not between 0 and 1000000
      or p_tokens_out not between 0 and 1000000 then
      raise exception 'Invalid token usage' using errcode = '22023';
    end if;
    update public.ai_usage
      set tokens_in = p_tokens_in, tokens_out = p_tokens_out, reserved_tokens = 0
      where id = p_reservation_id and tokens_in is null and tokens_out is null;
    if not found then
      raise exception 'AI usage reservation is no longer active' using errcode = 'P0002';
    end if;
  else
    delete from public.ai_usage
      where id = p_reservation_id and tokens_in is null and tokens_out is null;
  end if;
end;
$$;
revoke all on function public.finish_ai_usage(bigint, boolean, integer, integer)
  from public, anon, authenticated;
grant execute on function public.finish_ai_usage(bigint, boolean, integer, integer)
  to service_role;

create or replace view public.ai_usage_daily_summary
with (security_invoker = true)
as
select
  (u.created_at at time zone 'UTC')::date as usage_day,
  u.feature,
  count(*) filter (where u.tokens_in is not null and u.tokens_out is not null)::bigint as completed_requests,
  count(*) filter (where u.tokens_in is null or u.tokens_out is null)::bigint as pending_requests,
  coalesce(sum(u.tokens_in::bigint), 0)::bigint as tokens_in,
  coalesce(sum(u.tokens_out::bigint), 0)::bigint as tokens_out,
  coalesce(sum(case
    when u.tokens_in is null or u.tokens_out is null then u.reserved_tokens::bigint
    else 0
  end), 0)::bigint as reserved_tokens
from public.ai_usage as u
group by (u.created_at at time zone 'UTC')::date, u.feature;

revoke all on public.ai_usage_daily_summary from public, anon, authenticated;
grant select on public.ai_usage_daily_summary to service_role;
comment on view public.ai_usage_daily_summary is
  'Service-role-only UTC daily AI usage totals by feature. Do not expose through client APIs.';
