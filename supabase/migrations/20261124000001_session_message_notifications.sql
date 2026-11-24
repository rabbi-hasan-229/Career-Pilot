-- Ensure user_notifications exists with Realtime enabled and automatically notify
-- the recipient (learner or expert) whenever a new 1-on-1 session chat message is sent.
-- Career Pilot

-- 1. Ensure public.user_notifications exists (idempotent for DBs that skipped earlier migrations)
create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('task', 'milestone', 'streak', 'system')),
  title text not null,
  body text not null,
  action_url text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists user_notifications_user_created_idx
  on public.user_notifications (user_id, created_at desc);

create unique index if not exists user_notifications_dedupe_key_idx
  on public.user_notifications (user_id, (metadata->>'dedupe_key'))
  where metadata ? 'dedupe_key';

alter table public.user_notifications enable row level security;

drop policy if exists "users manage own notifications" on public.user_notifications;
create policy "users manage own notifications"
  on public.user_notifications for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "require mfa for enrolled users" on public.user_notifications;
create policy "require mfa for enrolled users"
  on public.user_notifications as restrictive to authenticated
  using ((select private.has_mfa_assurance()));

grant select, insert, update, delete on public.user_notifications to authenticated;

-- 2. Enable Supabase Realtime replication for user_notifications
alter table public.user_notifications replica identity full;

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_notifications'
  ) then
    alter publication supabase_realtime add table public.user_notifications;
  end if;
end
$$;

-- 3. Trigger: automatically notify the other participant on every new session chat message
create or replace function public.notify_session_message_recipient()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking record;
  v_recipient_id uuid;
  v_sender_label text;
  v_action_tab text;
  v_preview text;
begin
  select
    b.id,
    b.learner_id,
    b.expert_id,
    b.learner_name_snapshot,
    b.expert_name_snapshot,
    b.topic
  into v_booking
  from public.expert_bookings b
  where b.id = new.booking_id;

  if not found then
    return new;
  end if;

  if new.sender_id = v_booking.learner_id then
    v_recipient_id := v_booking.expert_id;
    v_sender_label := coalesce(nullif(trim(new.sender_name), ''), nullif(trim(v_booking.learner_name_snapshot), ''), 'Learner');
    v_action_tab := 'messages';
  elsif new.sender_id = v_booking.expert_id then
    v_recipient_id := v_booking.learner_id;
    v_sender_label := coalesce(nullif(trim(new.sender_name), ''), nullif(trim(v_booking.expert_name_snapshot), ''), 'Expert');
    v_action_tab := 'experts';
  else
    return new;
  end if;

  if v_recipient_id is null or v_recipient_id = new.sender_id then
    return new;
  end if;

  v_preview := trim(regexp_replace(coalesce(new.message, ''), '\s+', ' ', 'g'));
  if char_length(v_preview) > 140 then
    v_preview := left(v_preview, 137) || '...';
  end if;

  insert into public.user_notifications (
    user_id,
    category,
    title,
    body,
    metadata
  ) values (
    v_recipient_id,
    'system',
    format('New message from %s', v_sender_label),
    v_preview,
    jsonb_build_object(
      'kind', 'session_message',
      'booking_id', new.booking_id,
      'message_id', new.id,
      'sender_id', new.sender_id,
      'sender_name', v_sender_label,
      'actionTab', v_action_tab,
      'actionLabel', 'Open Chat',
      'dedupe_key', 'session_msg_' || new.id::text
    )
  )
  on conflict do nothing;

  return new;
end;
$$;

revoke all on function public.notify_session_message_recipient() from public, anon, authenticated;

drop trigger if exists trg_notify_session_message_recipient on public.expert_session_messages;
create trigger trg_notify_session_message_recipient
  after insert on public.expert_session_messages
  for each row
  execute function public.notify_session_message_recipient();
