-- Expert Marketplace, Hourly Sessions, Escrow Wallet & Withdrawals
-- Career Pilot

-- 0. Ensure private MFA helper exists even on databases that skipped intermediate security migrations
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.has_mfa_assurance()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (select auth.uid()) is null then false
    when exists (
      select 1
      from auth.mfa_factors as factor
      where factor.user_id = (select auth.uid())
        and factor.status = 'verified'
    ) then coalesce((select auth.jwt()->>'aal'), 'aal1') = 'aal2'
    else true
  end;
$$;
revoke all on function private.has_mfa_assurance() from public, anon;
grant execute on function private.has_mfa_assurance() to authenticated;

-- 1. Extend profiles with immutable-by-client account_role
alter table public.profiles
  add column if not exists account_role text not null default 'learner'
  check (account_role in ('learner', 'expert'));

-- Backfill any expert account that registered before this migration ran
update public.profiles p
set account_role = 'expert'
from auth.users u
where u.id = p.id
  and u.raw_user_meta_data->>'account_role' = 'expert'
  and p.account_role <> 'expert';

-- Update auth trigger so signup metadata sets account_role cleanly and initializes expert_profiles when expert_draft is supplied
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := case
    when coalesce(new.raw_user_meta_data->>'account_role', 'learner') = 'expert' then 'expert'
    else 'learner'
  end;
  v_draft jsonb := new.raw_user_meta_data->'expert_draft';
  v_headline text;
  v_categories text[];
  v_target_roles text[];
  v_skills text[];
  v_offline_cities text[];
  v_rate integer;
  v_modes text;
  v_cv_filename text;
  v_cv_summary text;
  v_is_ready boolean;
begin
  insert into public.profiles (id, full_name, avatar_url, account_role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'Adventurer'),
    new.raw_user_meta_data->>'avatar_url',
    v_role
  );

  insert into public.user_gamification (user_id, xp, level, coins, current_streak, streak_freeze_count)
  values (new.id, 0, 1, 50, 1, 1);

  if v_role = 'expert'
    and v_draft is not null
    and jsonb_typeof(v_draft) = 'object'
    and to_regclass('public.expert_profiles') is not null
  then
    v_headline := trim(coalesce(v_draft->>'headline', ''));
    v_categories := coalesce(array(select jsonb_array_elements_text(coalesce(v_draft->'categories', '[]'::jsonb))), '{}');
    v_target_roles := coalesce(array(select jsonb_array_elements_text(coalesce(v_draft->'target_roles', '[]'::jsonb))), '{}');
    v_skills := coalesce(array(select jsonb_array_elements_text(coalesce(v_draft->'skills', '[]'::jsonb))), '{}');
    v_offline_cities := coalesce(array(select jsonb_array_elements_text(coalesce(v_draft->'offline_cities', '[]'::jsonb))), '{}');
    v_rate := greatest(500, least(200000, coalesce(nullif(v_draft->>'hourly_rate_cents', '')::integer, 5000)));
    v_modes := case
      when coalesce(v_draft->>'meeting_modes', 'online') in ('online', 'offline', 'both') then v_draft->>'meeting_modes'
      else 'online'
    end;
    v_cv_filename := nullif(trim(coalesce(v_draft->>'cv_filename', '')), '');
    v_cv_summary := nullif(trim(coalesce(v_draft->>'cv_summary', '')), '');
    v_is_ready := char_length(v_headline) >= 3
      and coalesce(array_length(v_categories, 1), 0) >= 1
      and (v_cv_filename is not null or char_length(coalesce(v_cv_summary, '')) >= 10);

    if char_length(v_headline) >= 3 then
      insert into public.expert_profiles (
        user_id, display_name, avatar_url, headline, bio, current_company, location, timezone,
        years_experience, categories, target_roles, skills, experiences,
        portfolio_url, linkedin_url, github_url, cv_filename, cv_summary,
        hourly_rate_cents, meeting_modes, offline_cities, offline_notes, default_meeting_url,
        max_hours_per_session, status, verification_tier
      ) values (
        new.id,
        coalesce(nullif(trim(v_draft->>'display_name'), ''), nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'Industry Expert'),
        new.raw_user_meta_data->>'avatar_url',
        v_headline,
        trim(coalesce(v_draft->>'bio', '')),
        nullif(trim(coalesce(v_draft->>'current_company', '')), ''),
        nullif(trim(coalesce(v_draft->>'location', '')), ''),
        coalesce(nullif(trim(v_draft->>'timezone'), ''), 'UTC'),
        greatest(0, least(60, coalesce(nullif(v_draft->>'years_experience', '')::integer, 1))),
        v_categories,
        v_target_roles,
        v_skills,
        coalesce(v_draft->'experiences', '[]'::jsonb),
        nullif(trim(coalesce(v_draft->>'portfolio_url', '')), ''),
        nullif(trim(coalesce(v_draft->>'linkedin_url', '')), ''),
        nullif(trim(coalesce(v_draft->>'github_url', '')), ''),
        v_cv_filename,
        v_cv_summary,
        v_rate,
        v_modes,
        v_offline_cities,
        nullif(trim(coalesce(v_draft->>'offline_notes', '')), ''),
        nullif(trim(coalesce(v_draft->>'default_meeting_url', '')), ''),
        greatest(1, least(8, coalesce(nullif(v_draft->>'max_hours_per_session', '')::integer, 4))),
        case when v_is_ready then 'active' else 'draft' end,
        case when v_is_ready and v_cv_filename is not null then 'verified' else 'standard' end
      )
      on conflict (user_id) do nothing;

      insert into public.expert_wallets (expert_id) values (new.id) on conflict (expert_id) do nothing;

      if not exists (select 1 from public.expert_availability_slots where expert_id = new.id) then
        insert into public.expert_availability_slots (expert_id, day_of_week, start_time, end_time, is_active)
        values
          (new.id, 1, '09:00', '17:00', true),
          (new.id, 2, '09:00', '17:00', true),
          (new.id, 3, '09:00', '17:00', true),
          (new.id, 4, '09:00', '17:00', true),
          (new.id, 5, '09:00', '17:00', true);
      end if;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Safe one-time helper for OAuth signups who started from the Expert portal before onboarding
create or replace function public.claim_initial_expert_role()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_current_role text;
  v_target_role text;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not private.has_mfa_assurance() then
    raise exception 'Complete multi-factor verification before continuing' using errcode = '42501';
  end if;

  select account_role, target_role into v_current_role, v_target_role
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if v_current_role = 'expert' then
    return 'expert';
  end if;

  if v_target_role is not null and trim(v_target_role) <> '' then
    raise exception 'Cannot convert an active learner workspace into an expert account' using errcode = '42501';
  end if;

  update public.profiles
    set account_role = 'expert'
    where id = v_user_id;

  return 'expert';
end;
$$;

revoke all on function public.claim_initial_expert_role() from public, anon;
grant execute on function public.claim_initial_expert_role() to authenticated;

-- 2. Private CV Storage Bucket for Experts
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'expert-cvs',
  'expert-cvs',
  false,
  5242880,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]
)
on conflict (id) do nothing;

drop policy if exists "experts upload own cv" on storage.objects;
create policy "experts upload own cv"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'expert-cvs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "experts update own cv" on storage.objects;
create policy "experts update own cv"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'expert-cvs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "experts delete own cv" on storage.objects;
create policy "experts delete own cv"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'expert-cvs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- 3. Expert Profiles Table
create table if not exists public.expert_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 120),
  avatar_url text,
  headline text not null check (char_length(trim(headline)) between 3 and 160),
  bio text not null default '',
  current_company text,
  location text,
  timezone text not null default 'UTC',
  years_experience integer not null default 1 check (years_experience between 0 and 60),
  categories text[] not null default '{}',
  target_roles text[] not null default '{}',
  skills text[] not null default '{}',
  experiences jsonb not null default '[]'::jsonb,
  portfolio_url text,
  linkedin_url text,
  github_url text,
  cv_storage_path text,
  cv_filename text,
  cv_summary text,
  hourly_rate_cents integer not null check (hourly_rate_cents between 500 and 200000),
  currency text not null default 'USD' check (currency = 'USD'),
  meeting_modes text not null default 'online' check (meeting_modes in ('online', 'offline', 'both')),
  offline_cities text[] not null default '{}',
  offline_notes text,
  default_meeting_url text,
  max_hours_per_session integer not null default 4 check (max_hours_per_session between 1 and 8),
  status text not null default 'active' check (status in ('draft', 'active', 'paused')),
  verification_tier text not null default 'standard' check (verification_tier in ('standard', 'verified')),
  rating_avg numeric(3,2) not null default 0.00,
  review_count integer not null default 0,
  completed_sessions_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_expert_profiles_status on public.expert_profiles (status);
create index if not exists idx_expert_profiles_categories on public.expert_profiles using gin (categories);
create index if not exists idx_expert_profiles_roles on public.expert_profiles using gin (target_roles);

alter table public.expert_profiles enable row level security;

drop policy if exists "authenticated read active or own expert profiles" on public.expert_profiles;
create policy "authenticated read active or own expert profiles"
  on public.expert_profiles for select to authenticated
  using (status = 'active' or (select auth.uid()) = user_id);

drop policy if exists "experts insert own profile" on public.expert_profiles;
create policy "experts insert own profile"
  on public.expert_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "experts update own profile" on public.expert_profiles;
create policy "experts update own profile"
  on public.expert_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "require mfa for enrolled users" on public.expert_profiles;
create policy "require mfa for enrolled users"
  on public.expert_profiles as restrictive to authenticated
  using ((select private.has_mfa_assurance()));

revoke insert, update, delete on public.expert_profiles from anon;

drop policy if exists "authenticated read active expert cv" on storage.objects;
create policy "authenticated read active expert cv"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'expert-cvs'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.expert_profiles ep
        where ep.user_id::text = (storage.foldername(name))[1]
          and ep.status = 'active'
      )
    )
  );

-- 4. Expert Weekly Availability Slots
create table if not exists public.expert_availability_slots (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.expert_profiles(user_id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index if not exists idx_expert_availability_expert on public.expert_availability_slots (expert_id, day_of_week);

alter table public.expert_availability_slots enable row level security;

drop policy if exists "authenticated read availability slots" on public.expert_availability_slots;
create policy "authenticated read availability slots"
  on public.expert_availability_slots for select to authenticated
  using (true);

drop policy if exists "experts manage own availability slots" on public.expert_availability_slots;
create policy "experts manage own availability slots"
  on public.expert_availability_slots for all to authenticated
  using ((select auth.uid()) = expert_id)
  with check ((select auth.uid()) = expert_id);

drop policy if exists "require mfa for enrolled users" on public.expert_availability_slots;
create policy "require mfa for enrolled users"
  on public.expert_availability_slots as restrictive to authenticated
  using ((select private.has_mfa_assurance()));

-- 5. Expert Wallets (Server-controlled balance ledger for experts only)
create table if not exists public.expert_wallets (
  expert_id uuid primary key references public.expert_profiles(user_id) on delete cascade,
  pending_escrow_cents integer not null default 0 check (pending_escrow_cents >= 0),
  available_balance_cents integer not null default 0 check (available_balance_cents >= 0),
  total_earned_cents integer not null default 0 check (total_earned_cents >= 0),
  total_withdrawn_cents integer not null default 0 check (total_withdrawn_cents >= 0),
  currency text not null default 'USD' check (currency = 'USD'),
  updated_at timestamptz not null default now()
);

alter table public.expert_wallets enable row level security;

drop policy if exists "experts read own wallet" on public.expert_wallets;
create policy "experts read own wallet"
  on public.expert_wallets for select to authenticated
  using ((select auth.uid()) = expert_id);

drop policy if exists "require mfa for enrolled users" on public.expert_wallets;
create policy "require mfa for enrolled users"
  on public.expert_wallets as restrictive to authenticated
  using ((select private.has_mfa_assurance()));

revoke insert, update, delete on public.expert_wallets from anon, authenticated;

-- 7. Expert Bookings (Hourly Sessions + Escrow Status)
create table if not exists public.expert_bookings (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid references public.profiles(id) on delete set null,
  expert_id uuid references public.expert_profiles(user_id) on delete set null,
  learner_name_snapshot text not null,
  expert_name_snapshot text not null,
  expert_headline_snapshot text not null default '',
  hours integer not null check (hours between 1 and 8),
  hourly_rate_cents integer not null check (hourly_rate_cents > 0),
  gross_amount_cents integer not null check (gross_amount_cents > 0),
  platform_fee_cents integer not null check (platform_fee_cents >= 0),
  expert_payout_cents integer not null check (expert_payout_cents > 0),
  meeting_mode text not null check (meeting_mode in ('online', 'offline')),
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  timezone text not null default 'UTC',
  meeting_url text,
  offline_city text,
  offline_venue text,
  topic text not null check (char_length(trim(topic)) between 3 and 1000),
  status text not null default 'pending_confirmation'
    check (status in ('pending_confirmation', 'confirmed', 'completed', 'cancelled_by_learner', 'cancelled_by_expert')),
  payment_status text not null default 'escrow_held'
    check (payment_status in ('escrow_held', 'released_to_expert', 'refunded')),
  payment_method text not null default 'SSLCOMMERZ',
  payment_reference text,
  expert_completed_at timestamptz,
  learner_confirmed_at timestamptz,
  released_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  check (scheduled_end > scheduled_start)
);

create index if not exists idx_expert_bookings_learner on public.expert_bookings (learner_id, scheduled_start desc);
create index if not exists idx_expert_bookings_expert on public.expert_bookings (expert_id, scheduled_start asc);

alter table public.expert_bookings enable row level security;

drop policy if exists "booking participants read own bookings" on public.expert_bookings;
create policy "booking participants read own bookings"
  on public.expert_bookings for select to authenticated
  using ((select auth.uid()) = learner_id or (select auth.uid()) = expert_id);

drop policy if exists "require mfa for enrolled users" on public.expert_bookings;
create policy "require mfa for enrolled users"
  on public.expert_bookings as restrictive to authenticated
  using ((select private.has_mfa_assurance()));

revoke insert, update, delete on public.expert_bookings from anon, authenticated;

-- 8. 1-on-1 Session Coordination Messages
create table if not exists public.expert_session_messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.expert_bookings(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  sender_name text not null default 'Participant',
  message text not null check (char_length(trim(message)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists idx_expert_session_messages_booking on public.expert_session_messages (booking_id, created_at asc);

alter table public.expert_session_messages enable row level security;

drop policy if exists "booking participants read messages" on public.expert_session_messages;
create policy "booking participants read messages"
  on public.expert_session_messages for select to authenticated
  using (
    exists (
      select 1 from public.expert_bookings b
      where b.id = booking_id
        and ((select auth.uid()) = b.learner_id or (select auth.uid()) = b.expert_id)
    )
  );

drop policy if exists "booking participants insert messages" on public.expert_session_messages;
create policy "booking participants insert messages"
  on public.expert_session_messages for insert to authenticated
  with check (
    (select auth.uid()) = sender_id
    and exists (
      select 1 from public.expert_bookings b
      where b.id = booking_id
        and ((select auth.uid()) = b.learner_id or (select auth.uid()) = b.expert_id)
    )
  );

drop policy if exists "require mfa for enrolled users" on public.expert_session_messages;
create policy "require mfa for enrolled users"
  on public.expert_session_messages as restrictive to authenticated
  using ((select private.has_mfa_assurance()));

-- 9. Expert Reviews
create table if not exists public.expert_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid unique not null references public.expert_bookings(id) on delete cascade,
  expert_id uuid not null references public.expert_profiles(user_id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  learner_name text not null default 'Learner',
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_expert_reviews_expert on public.expert_reviews (expert_id, created_at desc);

alter table public.expert_reviews enable row level security;

drop policy if exists "authenticated read expert reviews" on public.expert_reviews;
create policy "authenticated read expert reviews"
  on public.expert_reviews for select to authenticated
  using (true);

drop policy if exists "require mfa for enrolled users" on public.expert_reviews;
create policy "require mfa for enrolled users"
  on public.expert_reviews as restrictive to authenticated
  using ((select private.has_mfa_assurance()));

revoke insert, update, delete on public.expert_reviews from anon, authenticated;

-- 10. Payout Methods, Withdrawals & Immutable Wallet Ledger
create table if not exists public.expert_payout_methods (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.expert_profiles(user_id) on delete cascade,
  method_type text not null check (method_type in ('bank_transfer', 'paypal', 'mobile_banking')),
  account_label text not null check (char_length(trim(account_label)) between 2 and 80),
  masked_destination text not null check (char_length(trim(masked_destination)) between 3 and 80),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.expert_payout_methods enable row level security;

drop policy if exists "experts manage own payout methods" on public.expert_payout_methods;
create policy "experts manage own payout methods"
  on public.expert_payout_methods for all to authenticated
  using ((select auth.uid()) = expert_id)
  with check ((select auth.uid()) = expert_id);

drop policy if exists "require mfa for enrolled users" on public.expert_payout_methods;
create policy "require mfa for enrolled users"
  on public.expert_payout_methods as restrictive to authenticated
  using ((select private.has_mfa_assurance()));

create table if not exists public.expert_withdrawals (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.expert_profiles(user_id) on delete cascade,
  payout_method_id uuid references public.expert_payout_methods(id) on delete set null,
  payout_summary text not null,
  amount_cents integer not null check (amount_cents >= 1000),
  status text not null default 'paid' check (status in ('processing', 'paid', 'failed')),
  reference_code text not null,
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_expert_withdrawals_expert on public.expert_withdrawals (expert_id, requested_at desc);

alter table public.expert_withdrawals enable row level security;

drop policy if exists "experts read own withdrawals" on public.expert_withdrawals;
create policy "experts read own withdrawals"
  on public.expert_withdrawals for select to authenticated
  using ((select auth.uid()) = expert_id);

drop policy if exists "require mfa for enrolled users" on public.expert_withdrawals;
create policy "require mfa for enrolled users"
  on public.expert_withdrawals as restrictive to authenticated
  using ((select private.has_mfa_assurance()));

revoke insert, update, delete on public.expert_withdrawals from anon, authenticated;

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.expert_profiles(user_id) on delete cascade,
  booking_id uuid references public.expert_bookings(id) on delete set null,
  withdrawal_id uuid references public.expert_withdrawals(id) on delete set null,
  tx_type text not null check (tx_type in ('escrow_hold', 'session_release', 'withdrawal_debit', 'refund_reversal')),
  amount_cents integer not null,
  available_balance_after_cents integer not null,
  pending_escrow_after_cents integer not null,
  description text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_wallet_transactions_expert on public.wallet_transactions (expert_id, created_at desc);

alter table public.wallet_transactions enable row level security;

drop policy if exists "experts read own wallet transactions" on public.wallet_transactions;
create policy "experts read own wallet transactions"
  on public.wallet_transactions for select to authenticated
  using ((select auth.uid()) = expert_id);

drop policy if exists "require mfa for enrolled users" on public.wallet_transactions;
create policy "require mfa for enrolled users"
  on public.wallet_transactions as restrictive to authenticated
  using ((select private.has_mfa_assurance()));

revoke insert, update, delete on public.wallet_transactions from anon, authenticated;

-- =============================================================================
-- ATOMIC SERVER-SIDE BUSINESS & WALLET RPCs
-- =============================================================================

-- A. Upsert Expert Profile + Initialize Wallet & Default Availability
create or replace function public.upsert_expert_profile(
  p_display_name text,
  p_avatar_url text,
  p_headline text,
  p_bio text,
  p_current_company text,
  p_location text,
  p_timezone text,
  p_years_experience integer,
  p_categories text[],
  p_target_roles text[],
  p_skills text[],
  p_experiences jsonb,
  p_portfolio_url text,
  p_linkedin_url text,
  p_github_url text,
  p_cv_storage_path text,
  p_cv_filename text,
  p_cv_summary text,
  p_hourly_rate_cents integer,
  p_meeting_modes text,
  p_offline_cities text[],
  p_offline_notes text,
  p_default_meeting_url text,
  p_max_hours_per_session integer default 4
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_ready boolean;
  v_status text;
  v_tier text;
  v_row public.expert_profiles%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not private.has_mfa_assurance() then
    raise exception 'Complete multi-factor verification before continuing' using errcode = '42501';
  end if;
  if p_hourly_rate_cents is null or p_hourly_rate_cents not between 500 and 200000 then
    raise exception 'Hourly rate must be between $5 and $2,000' using errcode = '22023';
  end if;
  if p_meeting_modes not in ('online', 'offline', 'both') then
    raise exception 'Unsupported meeting mode' using errcode = '22023';
  end if;

  v_is_ready := char_length(trim(coalesce(p_headline, ''))) >= 3
    and coalesce(array_length(p_categories, 1), 0) >= 1
    and (
      nullif(trim(coalesce(p_cv_storage_path, '')), '') is not null
      or nullif(trim(coalesce(p_cv_filename, '')), '') is not null
      or char_length(trim(coalesce(p_cv_summary, ''))) >= 10
    );

  v_status := case when v_is_ready then 'active' else 'draft' end;
  v_tier := case
    when v_is_ready
      and (
        nullif(trim(coalesce(p_cv_storage_path, '')), '') is not null
        or nullif(trim(coalesce(p_cv_filename, '')), '') is not null
      )
      and (
        nullif(trim(coalesce(p_portfolio_url, '')), '') is not null
        or nullif(trim(coalesce(p_linkedin_url, '')), '') is not null
      )
    then 'verified'
    else 'standard'
  end;

  insert into public.expert_profiles (
    user_id, display_name, avatar_url, headline, bio, current_company, location, timezone,
    years_experience, categories, target_roles, skills, experiences,
    portfolio_url, linkedin_url, github_url, cv_storage_path, cv_filename, cv_summary,
    hourly_rate_cents, meeting_modes, offline_cities, offline_notes, default_meeting_url,
    max_hours_per_session, status, verification_tier, updated_at
  ) values (
    v_user_id,
    coalesce(nullif(trim(p_display_name), ''), 'Industry Expert'),
    nullif(trim(coalesce(p_avatar_url, '')), ''),
    trim(coalesce(p_headline, 'Career Mentor')),
    trim(coalesce(p_bio, '')),
    nullif(trim(coalesce(p_current_company, '')), ''),
    nullif(trim(coalesce(p_location, '')), ''),
    coalesce(nullif(trim(p_timezone), ''), 'UTC'),
    greatest(0, least(60, coalesce(p_years_experience, 1))),
    coalesce(p_categories, '{}'),
    coalesce(p_target_roles, '{}'),
    coalesce(p_skills, '{}'),
    coalesce(p_experiences, '[]'::jsonb),
    nullif(trim(coalesce(p_portfolio_url, '')), ''),
    nullif(trim(coalesce(p_linkedin_url, '')), ''),
    nullif(trim(coalesce(p_github_url, '')), ''),
    nullif(trim(coalesce(p_cv_storage_path, '')), ''),
    nullif(trim(coalesce(p_cv_filename, '')), ''),
    nullif(trim(coalesce(p_cv_summary, '')), ''),
    p_hourly_rate_cents,
    p_meeting_modes,
    coalesce(p_offline_cities, '{}'),
    nullif(trim(coalesce(p_offline_notes, '')), ''),
    nullif(trim(coalesce(p_default_meeting_url, '')), ''),
    greatest(1, least(8, coalesce(p_max_hours_per_session, 4))),
    v_status,
    v_tier,
    now()
  )
  on conflict (user_id) do update set
    display_name = excluded.display_name,
    avatar_url = coalesce(excluded.avatar_url, public.expert_profiles.avatar_url),
    headline = excluded.headline,
    bio = excluded.bio,
    current_company = excluded.current_company,
    location = excluded.location,
    timezone = excluded.timezone,
    years_experience = excluded.years_experience,
    categories = excluded.categories,
    target_roles = excluded.target_roles,
    skills = excluded.skills,
    experiences = excluded.experiences,
    portfolio_url = excluded.portfolio_url,
    linkedin_url = excluded.linkedin_url,
    github_url = excluded.github_url,
    cv_storage_path = coalesce(excluded.cv_storage_path, public.expert_profiles.cv_storage_path),
    cv_filename = coalesce(excluded.cv_filename, public.expert_profiles.cv_filename),
    cv_summary = excluded.cv_summary,
    hourly_rate_cents = excluded.hourly_rate_cents,
    meeting_modes = excluded.meeting_modes,
    offline_cities = excluded.offline_cities,
    offline_notes = excluded.offline_notes,
    default_meeting_url = excluded.default_meeting_url,
    max_hours_per_session = excluded.max_hours_per_session,
    status = case
      when public.expert_profiles.status = 'paused' and v_status = 'active' then 'paused'
      else v_status
    end,
    verification_tier = v_tier,
    updated_at = now()
  returning * into v_row;

  insert into public.expert_wallets (expert_id)
  values (v_user_id)
  on conflict (expert_id) do nothing;

  -- Seed sensible default Mon-Fri 09:00-17:00 slots on first setup if none exist
  if not exists (select 1 from public.expert_availability_slots where expert_id = v_user_id) then
    insert into public.expert_availability_slots (expert_id, day_of_week, start_time, end_time, is_active)
    values
      (v_user_id, 1, '09:00', '17:00', true),
      (v_user_id, 2, '09:00', '17:00', true),
      (v_user_id, 3, '09:00', '17:00', true),
      (v_user_id, 4, '09:00', '17:00', true),
      (v_user_id, 5, '09:00', '17:00', true);
  end if;

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.upsert_expert_profile(text, text, text, text, text, text, text, integer, text[], text[], text[], jsonb, text, text, text, text, text, text, integer, text, text[], text, text, integer) from public, anon;
grant execute on function public.upsert_expert_profile(text, text, text, text, text, text, text, integer, text[], text[], text[], jsonb, text, text, text, text, text, text, integer, text, text[], text, text, integer) to authenticated;

-- B. Book Expert Session via Direct SSLCOMMERZ Checkout & Hold Payout in Expert Escrow
create or replace function public.book_expert_session(
  p_expert_id uuid,
  p_hours integer,
  p_meeting_mode text,
  p_scheduled_start timestamptz,
  p_timezone text,
  p_offline_city text,
  p_offline_venue text,
  p_topic text,
  p_payment_method text default 'SSLCOMMERZ',
  p_payment_reference text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_learner_id uuid := auth.uid();
  v_learner_name text;
  v_expert public.expert_profiles%rowtype;
  v_wallet public.expert_wallets%rowtype;
  v_scheduled_end timestamptz;
  v_gross integer;
  v_fee integer;
  v_payout integer;
  v_pay_method text := coalesce(nullif(trim(p_payment_method), ''), 'SSLCOMMERZ');
  v_pay_ref text := coalesce(nullif(trim(p_payment_reference), ''), 'SSL-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)));
  v_booking public.expert_bookings%rowtype;
begin
  if v_learner_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not private.has_mfa_assurance() then
    raise exception 'Complete multi-factor verification before continuing' using errcode = '42501';
  end if;
  if p_expert_id = v_learner_id then
    raise exception 'You cannot book a session with yourself' using errcode = '22023';
  end if;
  if p_meeting_mode not in ('online', 'offline') then
    raise exception 'Select either online or offline meeting mode' using errcode = '22023';
  end if;
  if p_scheduled_start is null or p_scheduled_start <= now() - interval '5 minutes' then
    raise exception 'Session start time must be in the future' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(p_topic, ''))) < 3 then
    raise exception 'Please enter a brief session topic or agenda' using errcode = '22023';
  end if;

  select full_name into v_learner_name from public.profiles where id = v_learner_id;

  select * into v_expert
  from public.expert_profiles
  where user_id = p_expert_id and status = 'active'
  for update;
  if not found then
    raise exception 'Expert profile is unavailable for booking' using errcode = 'P0002';
  end if;

  if p_hours is null or p_hours < 1 or p_hours > v_expert.max_hours_per_session then
    raise exception 'Select between 1 and % hours for this expert', v_expert.max_hours_per_session using errcode = '22023';
  end if;
  if v_expert.meeting_modes <> 'both' and v_expert.meeting_modes <> p_meeting_mode then
    raise exception 'This expert only offers % sessions', v_expert.meeting_modes using errcode = '22023';
  end if;

  v_scheduled_end := p_scheduled_start + make_interval(hours => p_hours);

  -- Conflict check against expert's active bookings
  if exists (
    select 1 from public.expert_bookings b
    where b.expert_id = p_expert_id
      and b.status in ('pending_confirmation', 'confirmed')
      and p_scheduled_start < b.scheduled_end
      and v_scheduled_end > b.scheduled_start
  ) then
    raise exception 'This time slot conflicts with an existing booking' using errcode = '23505';
  end if;

  v_gross := v_expert.hourly_rate_cents * p_hours;
  v_fee := round(v_gross * 0.10);
  v_payout := v_gross - v_fee;

  insert into public.expert_wallets (expert_id)
  values (p_expert_id)
  on conflict (expert_id) do nothing;

  update public.expert_wallets
    set pending_escrow_cents = pending_escrow_cents + v_payout,
        updated_at = now()
    where expert_id = p_expert_id
    returning * into v_wallet;

  insert into public.expert_bookings (
    learner_id, expert_id, learner_name_snapshot, expert_name_snapshot, expert_headline_snapshot,
    hours, hourly_rate_cents, gross_amount_cents, platform_fee_cents, expert_payout_cents,
    meeting_mode, scheduled_start, scheduled_end, timezone,
    meeting_url, offline_city, offline_venue, topic, status, payment_status,
    payment_method, payment_reference
  ) values (
    v_learner_id, p_expert_id,
    coalesce(nullif(trim(v_learner_name), ''), 'Learner'),
    v_expert.display_name,
    v_expert.headline,
    p_hours, v_expert.hourly_rate_cents, v_gross, v_fee, v_payout,
    p_meeting_mode, p_scheduled_start, v_scheduled_end, coalesce(nullif(trim(p_timezone), ''), v_expert.timezone),
    case when p_meeting_mode = 'online' then v_expert.default_meeting_url else null end,
    case when p_meeting_mode = 'offline' then nullif(trim(coalesce(p_offline_city, '')), '') else null end,
    case when p_meeting_mode = 'offline' then nullif(trim(coalesce(p_offline_venue, '')), '') else null end,
    trim(p_topic),
    'pending_confirmation',
    'escrow_held',
    v_pay_method,
    v_pay_ref
  )
  returning * into v_booking;

  insert into public.wallet_transactions (
    expert_id, booking_id, tx_type, amount_cents,
    available_balance_after_cents, pending_escrow_after_cents, description
  ) values (
    p_expert_id, v_booking.id, 'escrow_hold', v_payout,
    v_wallet.available_balance_cents, v_wallet.pending_escrow_cents,
    format('Escrow held (%s · %s) for %sh %s session with %s', v_pay_method, v_pay_ref, p_hours, p_meeting_mode, v_booking.learner_name_snapshot)
  );

  if to_regclass('public.user_notifications') is not null then
    insert into public.user_notifications (user_id, category, title, body, metadata)
    values (
      p_expert_id,
      'system',
      'New Session Booking Request',
      format('%s booked a %sh %s session. Confirm and share meeting details.', v_booking.learner_name_snapshot, p_hours, p_meeting_mode),
      jsonb_build_object('booking_id', v_booking.id)
    );
  end if;

  return jsonb_build_object('booking', to_jsonb(v_booking));
end;
$$;

revoke all on function public.book_expert_session(uuid, integer, text, timestamptz, text, text, text, text, text, text) from public, anon;
grant execute on function public.book_expert_session(uuid, integer, text, timestamptz, text, text, text, text, text, text) to authenticated;

-- D. Expert Confirms Booking & Supplies External Meeting Link or Venue
create or replace function public.confirm_expert_booking(
  p_booking_id uuid,
  p_meeting_url text default null,
  p_offline_venue text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.expert_bookings%rowtype;
  v_url text := nullif(trim(coalesce(p_meeting_url, '')), '');
  v_venue text := nullif(trim(coalesce(p_offline_venue, '')), '');
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not private.has_mfa_assurance() then
    raise exception 'Complete multi-factor verification before continuing' using errcode = '42501';
  end if;

  select * into v_booking
  from public.expert_bookings
  where id = p_booking_id and expert_id = v_user_id
  for update;

  if not found then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;
  if v_booking.status not in ('pending_confirmation', 'confirmed') then
    raise exception 'Only pending or confirmed sessions can be updated' using errcode = '22023';
  end if;

  if v_booking.meeting_mode = 'online' then
    v_url := coalesce(v_url, v_booking.meeting_url);
    if v_url is null or v_url !~* '^https?://' then
      raise exception 'Provide a valid Zoom, Google Meet, or Teams link (https://...)' using errcode = '22023';
    end if;
  else
    v_venue := coalesce(v_venue, v_booking.offline_venue);
    if v_venue is null then
      raise exception 'Provide the confirmed in-person meeting venue address' using errcode = '22023';
    end if;
  end if;

  update public.expert_bookings
    set status = 'confirmed',
        meeting_url = case when meeting_mode = 'online' then v_url else meeting_url end,
        offline_venue = case when meeting_mode = 'offline' then v_venue else offline_venue end
    where id = p_booking_id
    returning * into v_booking;

  if v_booking.learner_id is not null and to_regclass('public.user_notifications') is not null then
    insert into public.user_notifications (user_id, category, title, body, metadata)
    values (
      v_booking.learner_id,
      'system',
      'Expert Session Confirmed',
      format('%s confirmed your %sh %s session.', v_booking.expert_name_snapshot, v_booking.hours, v_booking.meeting_mode),
      jsonb_build_object('booking_id', v_booking.id, 'actionTab', 'experts', 'actionLabel', 'View Booking')
    );
  end if;

  return to_jsonb(v_booking);
end;
$$;

revoke all on function public.confirm_expert_booking(uuid, text, text) from public, anon;
grant execute on function public.confirm_expert_booking(uuid, text, text) to authenticated;

-- E. Internal Escrow Release Helper
create or replace function private.release_booking_escrow_internal(p_booking_id uuid)
returns public.expert_bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.expert_bookings%rowtype;
  v_wallet public.expert_wallets%rowtype;
begin
  select * into v_booking
  from public.expert_bookings
  where id = p_booking_id
  for update;

  if v_booking.payment_status <> 'escrow_held' then
    return v_booking;
  end if;

  select * into v_wallet
  from public.expert_wallets
  where expert_id = v_booking.expert_id
  for update;

  update public.expert_wallets
    set pending_escrow_cents = greatest(0, pending_escrow_cents - v_booking.expert_payout_cents),
        available_balance_cents = available_balance_cents + v_booking.expert_payout_cents,
        total_earned_cents = total_earned_cents + v_booking.expert_payout_cents,
        updated_at = now()
    where expert_id = v_booking.expert_id
    returning * into v_wallet;

  update public.expert_profiles
    set completed_sessions_count = completed_sessions_count + 1,
        updated_at = now()
    where user_id = v_booking.expert_id;

  update public.expert_bookings
    set status = 'completed',
        payment_status = 'released_to_expert',
        released_at = now()
    where id = p_booking_id
    returning * into v_booking;

  insert into public.wallet_transactions (
    expert_id, booking_id, tx_type, amount_cents,
    available_balance_after_cents, pending_escrow_after_cents, description
  ) values (
    v_booking.expert_id, v_booking.id, 'session_release', v_booking.expert_payout_cents,
    v_wallet.available_balance_cents, v_wallet.pending_escrow_cents,
    format('Session payout released for %sh session with %s', v_booking.hours, v_booking.learner_name_snapshot)
  );

  if v_booking.expert_id is not null and to_regclass('public.user_notifications') is not null then
    insert into public.user_notifications (user_id, category, title, body, metadata)
    values (
      v_booking.expert_id,
      'system',
      'Payment Released to Wallet',
      format('$%s added to your available balance from %s.', to_char(v_booking.expert_payout_cents / 100.0, 'FM999990.00'), v_booking.learner_name_snapshot),
      jsonb_build_object('booking_id', v_booking.id)
    );
  end if;

  return v_booking;
end;
$$;

revoke all on function private.release_booking_escrow_internal(uuid) from public, anon, authenticated;

-- F. Expert Marks Session Delivered
create or replace function public.expert_mark_session_completed(p_booking_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.expert_bookings%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not private.has_mfa_assurance() then
    raise exception 'Complete multi-factor verification before continuing' using errcode = '42501';
  end if;

  select * into v_booking
  from public.expert_bookings
  where id = p_booking_id and expert_id = v_user_id
  for update;

  if not found then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;
  if v_booking.status <> 'confirmed' then
    raise exception 'Confirm the session before marking it delivered' using errcode = '22023';
  end if;

  update public.expert_bookings
    set expert_completed_at = coalesce(expert_completed_at, now())
    where id = p_booking_id
    returning * into v_booking;

  if v_booking.learner_confirmed_at is not null then
    v_booking := private.release_booking_escrow_internal(p_booking_id);
  elsif v_booking.learner_id is not null and to_regclass('public.user_notifications') is not null then
    insert into public.user_notifications (user_id, category, title, body, metadata)
    values (
      v_booking.learner_id,
      'system',
      'Confirm Completed Expert Session',
      format('%s marked your session complete. Confirm to release escrow payment.', v_booking.expert_name_snapshot),
      jsonb_build_object('booking_id', v_booking.id, 'actionTab', 'experts', 'actionLabel', 'Confirm Session')
    );
  end if;

  return to_jsonb(v_booking);
end;
$$;

revoke all on function public.expert_mark_session_completed(uuid) from public, anon;
grant execute on function public.expert_mark_session_completed(uuid) to authenticated;

-- G. Learner Confirms Session Completion & Releases Escrow to Expert Wallet
create or replace function public.learner_confirm_session_completion(p_booking_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.expert_bookings%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not private.has_mfa_assurance() then
    raise exception 'Complete multi-factor verification before continuing' using errcode = '42501';
  end if;

  select * into v_booking
  from public.expert_bookings
  where id = p_booking_id and learner_id = v_user_id
  for update;

  if not found then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;
  if v_booking.status not in ('confirmed', 'completed') then
    raise exception 'Only confirmed sessions can be completed' using errcode = '22023';
  end if;

  update public.expert_bookings
    set learner_confirmed_at = coalesce(learner_confirmed_at, now())
    where id = p_booking_id
    returning * into v_booking;

  v_booking := private.release_booking_escrow_internal(p_booking_id);
  return to_jsonb(v_booking);
end;
$$;

revoke all on function public.learner_confirm_session_completion(uuid) from public, anon;
grant execute on function public.learner_confirm_session_completion(uuid) to authenticated;

-- H. Cancel Booking & Refund Escrow
create or replace function public.cancel_expert_booking(p_booking_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.expert_bookings%rowtype;
  v_wallet public.expert_wallets%rowtype;
  v_next_status text;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not private.has_mfa_assurance() then
    raise exception 'Complete multi-factor verification before continuing' using errcode = '42501';
  end if;

  select * into v_booking
  from public.expert_bookings
  where id = p_booking_id and (learner_id = v_user_id or expert_id = v_user_id)
  for update;

  if not found then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;
  if v_booking.status not in ('pending_confirmation', 'confirmed') then
    raise exception 'This booking can no longer be cancelled' using errcode = '22023';
  end if;
  if v_booking.payment_status <> 'escrow_held' then
    raise exception 'Escrow payment has already been settled' using errcode = '22023';
  end if;

  v_next_status := case
    when v_user_id = v_booking.expert_id then 'cancelled_by_expert'
    else 'cancelled_by_learner'
  end;

  if v_booking.expert_id is not null then
    select * into v_wallet
    from public.expert_wallets
    where expert_id = v_booking.expert_id
    for update;

    update public.expert_wallets
      set pending_escrow_cents = greatest(0, pending_escrow_cents - v_booking.expert_payout_cents),
          updated_at = now()
      where expert_id = v_booking.expert_id
      returning * into v_wallet;

    insert into public.wallet_transactions (
      expert_id, booking_id, tx_type, amount_cents,
      available_balance_after_cents, pending_escrow_after_cents, description
    ) values (
      v_booking.expert_id, v_booking.id, 'refund_reversal', -v_booking.expert_payout_cents,
      v_wallet.available_balance_cents, v_wallet.pending_escrow_cents,
      format('Booking cancelled; escrow refunded to %s', v_booking.learner_name_snapshot)
    );
  end if;

  update public.expert_bookings
    set status = v_next_status,
        payment_status = 'refunded',
        cancelled_at = now()
    where id = p_booking_id
    returning * into v_booking;

  return to_jsonb(v_booking);
end;
$$;

revoke all on function public.cancel_expert_booking(uuid) from public, anon;
grant execute on function public.cancel_expert_booking(uuid) to authenticated;

-- I. Submit Review & Recalculate Expert Rating
create or replace function public.submit_expert_review(
  p_booking_id uuid,
  p_rating integer,
  p_comment text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.expert_bookings%rowtype;
  v_review public.expert_reviews%rowtype;
  v_avg numeric(3,2);
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not private.has_mfa_assurance() then
    raise exception 'Complete multi-factor verification before continuing' using errcode = '42501';
  end if;
  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'Rating must be between 1 and 5' using errcode = '22023';
  end if;

  select * into v_booking
  from public.expert_bookings
  where id = p_booking_id and learner_id = v_user_id and status = 'completed';

  if not found then
    raise exception 'You can only review completed sessions' using errcode = '22023';
  end if;
  if v_booking.expert_id is null then
    raise exception 'Expert profile is no longer available' using errcode = 'P0002';
  end if;

  insert into public.expert_reviews (booking_id, expert_id, learner_id, learner_name, rating, comment)
  values (p_booking_id, v_booking.expert_id, v_user_id, v_booking.learner_name_snapshot, p_rating, trim(coalesce(p_comment, '')))
  returning * into v_review;

  select round(avg(rating)::numeric, 2), count(*) into v_avg, v_count
  from public.expert_reviews
  where expert_id = v_booking.expert_id;

  update public.expert_profiles
    set rating_avg = coalesce(v_avg, 0),
        review_count = coalesce(v_count, 0),
        updated_at = now()
    where user_id = v_booking.expert_id;

  return to_jsonb(v_review);
end;
$$;

revoke all on function public.submit_expert_review(uuid, integer, text) from public, anon;
grant execute on function public.submit_expert_review(uuid, integer, text) to authenticated;

-- J. Request Expert Withdrawal (Atomic Available Balance Debit)
create or replace function public.request_expert_withdrawal(
  p_payout_method_id uuid,
  p_amount_cents integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expert_id uuid := auth.uid();
  v_wallet public.expert_wallets%rowtype;
  v_method public.expert_payout_methods%rowtype;
  v_withdrawal public.expert_withdrawals%rowtype;
  v_ref text;
begin
  if v_expert_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not private.has_mfa_assurance() then
    raise exception 'Complete multi-factor verification before continuing' using errcode = '42501';
  end if;
  if p_amount_cents is null or p_amount_cents < 1000 then
    raise exception 'Minimum withdrawal is $10.00' using errcode = '22023';
  end if;

  select * into v_method
  from public.expert_payout_methods
  where id = p_payout_method_id and expert_id = v_expert_id;
  if not found then
    raise exception 'Select a saved payout method first' using errcode = 'P0002';
  end if;

  select * into v_wallet
  from public.expert_wallets
  where expert_id = v_expert_id
  for update;
  if not found or v_wallet.available_balance_cents < p_amount_cents then
    raise exception 'Insufficient available balance for this withdrawal' using errcode = '22023';
  end if;

  v_ref := 'WD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  update public.expert_wallets
    set available_balance_cents = available_balance_cents - p_amount_cents,
        total_withdrawn_cents = total_withdrawn_cents + p_amount_cents,
        updated_at = now()
    where expert_id = v_expert_id
    returning * into v_wallet;

  insert into public.expert_withdrawals (
    expert_id, payout_method_id, payout_summary, amount_cents, status, reference_code, processed_at
  ) values (
    v_expert_id,
    v_method.id,
    format('%s (%s)', v_method.account_label, v_method.masked_destination),
    p_amount_cents,
    'paid',
    v_ref,
    now()
  )
  returning * into v_withdrawal;

  insert into public.wallet_transactions (
    expert_id, withdrawal_id, tx_type, amount_cents,
    available_balance_after_cents, pending_escrow_after_cents, description
  ) values (
    v_expert_id, v_withdrawal.id, 'withdrawal_debit', -p_amount_cents,
    v_wallet.available_balance_cents, v_wallet.pending_escrow_cents,
    format('Withdrawal to %s (%s)', v_method.account_label, v_ref)
  );

  return jsonb_build_object(
    'withdrawal', to_jsonb(v_withdrawal),
    'wallet', to_jsonb(v_wallet)
  );
end;
$$;

revoke all on function public.request_expert_withdrawal(uuid, integer) from public, anon;
grant execute on function public.request_expert_withdrawal(uuid, integer) to authenticated;
