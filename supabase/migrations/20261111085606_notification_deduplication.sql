-- Deduplicate automatic reminders across tabs and sessions for the same user
-- without suppressing reminders the user explicitly requests.
create unique index user_notifications_dedupe_key_idx
  on public.user_notifications (user_id, (metadata->>'dedupe_key'))
  where metadata ? 'dedupe_key';
