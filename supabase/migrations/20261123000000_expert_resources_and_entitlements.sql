-- Expert Profile Files & Consultation Resources (Auto-unlocked on Booking Purchase)
-- Career Pilot

-- 1. Private Storage Bucket for Expert Consultation Resources
insert into storage.buckets (id, name, public, file_size_limit)
values (
  'expert-resources',
  'expert-resources',
  false,
  15728640 -- 15 MiB
)
on conflict (id) do nothing;

-- 2. Expert Resources Table
create table if not exists public.expert_resources (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.expert_profiles(user_id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 160),
  description text not null default '',
  resource_type text not null default 'file' check (resource_type in ('file', 'link')),
  storage_path text,
  file_name text,
  file_size_bytes bigint,
  external_url text,
  created_at timestamptz not null default now(),
  check (
    (resource_type = 'file' and storage_path is not null and file_name is not null)
    or (resource_type = 'link' and external_url is not null and external_url ~* '^https?://')
  )
);

create index if not exists idx_expert_resources_expert on public.expert_resources (expert_id, created_at desc);

alter table public.expert_resources enable row level security;

drop policy if exists "experts manage own resources" on public.expert_resources;
create policy "experts manage own resources"
  on public.expert_resources for all to authenticated
  using ((select auth.uid()) = expert_id)
  with check ((select auth.uid()) = expert_id);

drop policy if exists "booked learners read unlocked expert resources" on public.expert_resources;
create policy "booked learners read unlocked expert resources"
  on public.expert_resources for select to authenticated
  using (
    exists (
      select 1 from public.expert_bookings b
      where b.expert_id = expert_resources.expert_id
        and b.learner_id = (select auth.uid())
        and b.payment_status in ('escrow_held', 'released_to_expert')
    )
  );

drop policy if exists "require mfa for enrolled users" on public.expert_resources;
create policy "require mfa for enrolled users"
  on public.expert_resources as restrictive to authenticated
  using ((select private.has_mfa_assurance()));

-- 3. Storage Policies for expert-resources bucket
drop policy if exists "experts upload own resources" on storage.objects;
create policy "experts upload own resources"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'expert-resources'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "experts update own resources" on storage.objects;
create policy "experts update own resources"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'expert-resources'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "experts delete own resources" on storage.objects;
create policy "experts delete own resources"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'expert-resources'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "owners and booked learners read expert resources" on storage.objects;
create policy "owners and booked learners read expert resources"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'expert-resources'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.expert_bookings b
        where b.expert_id::text = (storage.foldername(name))[1]
          and b.learner_id = (select auth.uid())
          and b.payment_status in ('escrow_held', 'released_to_expert')
      )
    )
  );

-- 4. Public Metadata Preview RPC (shows resource titles/types on Expert Profile without exposing file paths or URLs)
create or replace function public.list_expert_resource_previews(p_expert_id uuid)
returns table (
  id uuid,
  expert_id uuid,
  title text,
  description text,
  resource_type text,
  file_name text,
  file_size_bytes bigint,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id,
    r.expert_id,
    r.title,
    r.description,
    r.resource_type,
    r.file_name,
    r.file_size_bytes,
    r.created_at
  from public.expert_resources r
  join public.expert_profiles ep on ep.user_id = r.expert_id
  where r.expert_id = p_expert_id
    and (ep.status = 'active' or ep.user_id = (select auth.uid()))
    and (select private.has_mfa_assurance())
  order by r.created_at desc;
$$;

revoke all on function public.list_expert_resource_previews(uuid) from public, anon;
grant execute on function public.list_expert_resource_previews(uuid) to authenticated;
