-- Prune bloated expert_draft and inline Base64 data: avatars from auth.users.raw_user_meta_data
-- so Supabase Auth JWTs stay compact and never trigger HTTP 431 / "Exceeded maximum allowed HTTP header size"
-- on Supabase Storage or Edge Function requests.
-- Career Pilot

-- 1. Clean up existing accounts whose expert_profiles row is already persisted
update auth.users u
set raw_user_meta_data = u.raw_user_meta_data - 'expert_draft'
where u.raw_user_meta_data ? 'expert_draft'
  and exists (
    select 1 from public.expert_profiles ep where ep.user_id = u.id
  );

-- 2. Strip any inline Base64 data: avatar_url from auth.users.raw_user_meta_data
--    (profiles.avatar_url and expert_profiles.avatar_url store the avatar without bloating JWTs)
update auth.users u
set raw_user_meta_data = u.raw_user_meta_data - 'avatar_url'
where coalesce(u.raw_user_meta_data->>'avatar_url', '') like 'data:%';
