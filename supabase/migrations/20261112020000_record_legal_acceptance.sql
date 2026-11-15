-- Keep a minimal, append-only record of the policy versions an account accepted.
-- A new migration must update these constraints when the published versions change.
create table public.legal_acceptances (
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null check (terms_version = '2026-11-11-draft-1'),
  privacy_notice_version text not null check (privacy_notice_version = '2026-11-11-draft-1'),
  accepted_at timestamptz not null default now(),
  primary key (user_id, terms_version, privacy_notice_version)
);

alter table public.legal_acceptances enable row level security;

create policy "users read own legal acceptances"
  on public.legal_acceptances for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "users insert own legal acceptances"
  on public.legal_acceptances for insert to authenticated
  with check ((select auth.uid()) = user_id);

revoke all on table public.legal_acceptances from anon, authenticated;
grant select on table public.legal_acceptances to authenticated;
grant insert (user_id, terms_version, privacy_notice_version)
  on table public.legal_acceptances to authenticated;
