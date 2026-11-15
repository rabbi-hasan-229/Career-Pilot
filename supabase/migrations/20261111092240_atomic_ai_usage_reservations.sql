-- Reserve AI quota atomically so concurrent requests cannot exceed a user's
-- rolling seven-day feature allowance. Provider failures release reservations.
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
  if p_reservation_id is null then
    raise exception 'Reservation identifier is required' using errcode = '22023';
  end if;

  if p_success then
    if p_tokens_in is null or p_tokens_out is null
      or p_tokens_in not between 0 and 1000000
      or p_tokens_out not between 0 and 1000000 then
      raise exception 'Invalid token usage' using errcode = '22023';
    end if;
    update public.ai_usage
      set tokens_in = p_tokens_in, tokens_out = p_tokens_out
      where id = p_reservation_id;
  else
    delete from public.ai_usage where id = p_reservation_id;
  end if;
end;
$$;
revoke all on function public.finish_ai_usage(bigint, boolean, integer, integer) from public, anon, authenticated;
grant execute on function public.finish_ai_usage(bigint, boolean, integer, integer) to service_role;
