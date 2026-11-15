-- Recover quota reservations left behind if an Edge Function is terminated
-- before it can call finish_ai_usage. The provider request timeout is 25s;
-- five minutes leaves room for platform and database latency.
create index if not exists ai_usage_pending_created_at_idx
  on public.ai_usage (created_at)
  where tokens_in is null and tokens_out is null;

create or replace function public.reserve_ai_usage(
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
  v_used integer;
  v_reservation_id bigint;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
  if p_user_id is null or p_feature is null or p_feature not in ('coach', 'cv', 'interview', 'role')
    or p_feature_limit is null or p_feature_limit not between 1 and 1000 then
    raise exception 'Invalid AI usage reservation' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text || ':' || p_feature, 0)
  );

  delete from public.ai_usage
  where tokens_in is null
    and tokens_out is null
    and created_at < now() - interval '5 minutes';

  select count(*)::integer into v_used
  from public.ai_usage u
  where u.user_id = p_user_id
    and u.feature = p_feature
    and u.created_at >= now() - interval '7 days';

  if v_used >= p_feature_limit then
    return jsonb_build_object('allowed', false, 'used', v_used, 'limit', p_feature_limit);
  end if;

  insert into public.ai_usage (user_id, feature)
  values (p_user_id, p_feature)
  returning id into v_reservation_id;
  return jsonb_build_object(
    'allowed', true,
    'used', v_used + 1,
    'limit', p_feature_limit,
    'reservation_id', v_reservation_id
  );
end;
$$;

revoke all on function public.reserve_ai_usage(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.reserve_ai_usage(uuid, text, integer) to service_role;
