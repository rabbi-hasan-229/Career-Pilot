-- Phase 5 Migration: Database Email OTP Authentication & User Authorization
-- Career Pilot

create table if not exists public.auth_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  otp_code text not null,
  full_name text,
  target_role text default 'Full Stack Engineer',
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  verified boolean not null default false,
  attempts int not null default 0,
  created_at timestamptz default now()
);

-- Index for speedy lookup by email and verification status
create index if not exists idx_auth_otps_email on public.auth_otps (email, verified, expires_at);

-- ROW LEVEL SECURITY (RLS)
alter table public.auth_otps enable row level security;

-- Drop existing policies if any
drop policy if exists "anon insert auth_otps" on public.auth_otps;
drop policy if exists "anon select auth_otps" on public.auth_otps;
drop policy if exists "anon update auth_otps" on public.auth_otps;

-- Allow anon and authenticated to request OTP
create policy "anon insert auth_otps" on public.auth_otps
  for insert with check (true);

-- Allow verification of OTP
create policy "anon select auth_otps" on public.auth_otps
  for select using (true);

create policy "anon update auth_otps" on public.auth_otps
  for update using (true);

-- Clean up expired OTPs periodically (helper function)
create or replace function public.cleanup_expired_otps()
returns void as $$
begin
  delete from public.auth_otps where expires_at < now() - interval '1 day';
end;
$$ language plpgsql security definer;
