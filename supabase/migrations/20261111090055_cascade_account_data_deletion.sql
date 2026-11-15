-- AI usage rows predate a foreign-key to profiles. Remove any legacy orphaned
-- rows, then ensure account removal cascades to the remaining usage history.
delete from public.ai_usage a
where not exists (
  select 1 from public.profiles p where p.id = a.user_id
);

alter table public.ai_usage
  add constraint ai_usage_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- The custom OTP system was retired in favor of Supabase Auth. Remove any
-- remaining short-lived verification secrets and the unused storage table.
drop function if exists public.cleanup_expired_otps();
drop table if exists public.auth_otps;
