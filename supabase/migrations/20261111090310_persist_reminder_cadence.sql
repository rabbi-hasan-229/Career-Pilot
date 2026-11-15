alter table public.profiles
  add column weekly_reminder_frequency text not null default '3x'
    check (weekly_reminder_frequency in ('2x', '3x', '4x'));

grant update (weekly_reminder_frequency)
  on table public.profiles to authenticated;
