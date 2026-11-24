-- Enable Supabase Realtime replication for 1-on-1 session chat, bookings, and live workspace tables
-- Career Pilot

-- 1. Use FULL replica identity on session chat and booking tables so filtered Realtime
--    subscriptions receive complete payloads across INSERT, UPDATE, and DELETE events.
alter table if exists public.expert_session_messages replica identity full;
alter table if exists public.expert_bookings replica identity full;

-- 2. Add tables idempotently to the supabase_realtime publication.
do $$
declare
  v_table text;
  v_tables text[] := array[
    'expert_session_messages',
    'expert_bookings',
    'tasks',
    'ai_coach_messages',
    'user_notifications'
  ];
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  foreach v_table in array v_tables loop
    if to_regclass(format('public.%I', v_table)) is not null
      and not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = v_table
      )
    then
      execute format('alter publication supabase_realtime add table public.%I', v_table);
    end if;
  end loop;
end
$$;
