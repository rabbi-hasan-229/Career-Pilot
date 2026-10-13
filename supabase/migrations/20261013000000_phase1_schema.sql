-- Phase 1 Migration: Core Tables, Low-Cost AI Controls & Gamification Engine
-- JobSeeker / Career Pilot

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  target_role text,
  plan text not null default 'free' check (plan in ('free','premium')),
  daily_minutes int not null default 60,
  created_at timestamptz default now()
);

-- 2. User Gamification State Table
create table if not exists public.user_gamification (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  xp int not null default 0,
  level int not null default 1,
  coins int not null default 50,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_activity_date date,
  streak_freeze_count int not null default 1,
  avatar_config jsonb default '{"avatar_id": "novice_scout", "skin_tone": 1, "accessory": "bandana"}'::jsonb,
  updated_at timestamptz default now()
);

-- 3. Curated Roles Table (Shared Content)
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  category text default 'Tech',
  icon_name text default 'compass',
  source text not null default 'curated' check (source in ('curated','ai')),
  created_at timestamptz default now()
);

-- 4. Role Milestones Template Table (Shared Content)
create table if not exists public.role_milestones (
  id uuid primary key default gen_random_uuid(),
  role_id uuid references public.roles(id) on delete cascade,
  position int not null,
  title text not null,
  description text,
  island_zone text default 'coastal_harbor',
  effort_hours int not null,
  skill_ids uuid[] default '{}'
);

-- 5. User Active Roadmaps
create table if not exists public.user_roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  role_id uuid references public.roles(id),
  target_date date not null,
  status text default 'active' check (status in ('active','completed','paused')),
  created_at timestamptz default now()
);

-- 6. User Instantiated Milestones
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid references public.user_roadmaps(id) on delete cascade,
  user_id uuid not null,
  title text not null,
  position int not null,
  start_date date,
  end_date date,
  status text default 'todo' check (status in ('todo','doing','done'))
);

-- 7. User Roadmap Tasks (Stepping stones on the island path)
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid references public.milestones(id) on delete cascade,
  user_id uuid not null,
  title text not null,
  resource_id uuid,
  due_date date not null,
  est_minutes int default 30,
  xp_reward int default 25,
  done_at timestamptz
);

-- 8. Smart Checkpoint Quizzes
create table if not exists public.task_quizzes (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  question text not null,
  options jsonb not null, -- [{"id": "a", "text": "...", "is_correct": true}]
  explanation text,
  xp_reward int default 25,
  coins_reward int default 5,
  created_at timestamptz default now()
);

-- 9. Quiz Submissions (Gated completion verification)
create table if not exists public.quiz_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  selected_option text not null,
  is_correct boolean not null,
  attempt_count int default 1,
  passed_at timestamptz default now()
);

-- 10. Achievements & Badges
create table if not exists public.achievements (
  id text primary key,
  title text not null,
  description text not null,
  icon_name text not null,
  tier text default 'bronze',
  xp_bonus int not null default 100
);

create table if not exists public.user_achievements (
  user_id uuid references public.profiles(id) on delete cascade,
  achievement_id text references public.achievements(id) on delete cascade,
  unlocked_at timestamptz default now(),
  primary key (user_id, achievement_id)
);

-- 11. Low-Cost AI Usage Control & SHA-256 Cache
create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  feature text not null check (feature in ('coach','cv','interview','role')),
  tokens_in int,
  tokens_out int,
  created_at timestamptz default now()
);

create table if not exists public.ai_cache (
  key text primary key,
  response jsonb not null,
  created_at timestamptz default now()
);

-- App level killswitch
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

insert into public.app_settings (key, value)
values ('ai_enabled', 'true'::jsonb)
on conflict (key) do nothing;

-- Indexes for performance
create index if not exists idx_tasks_user_due on public.tasks (user_id, due_date);
create index if not exists idx_ai_usage_user_feature on public.ai_usage (user_id, feature, created_at);
create index if not exists idx_milestones_user on public.milestones (user_id, position);
create index if not exists idx_quiz_task on public.task_quizzes (task_id);

-- ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
create policy "users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);

alter table public.user_gamification enable row level security;
create policy "users manage own gamification" on public.user_gamification for all using (auth.uid() = user_id);

alter table public.roles enable row level security;
create policy "authenticated read roles" on public.roles for select using (auth.role() = 'authenticated');

alter table public.role_milestones enable row level security;
create policy "authenticated read role milestones" on public.role_milestones for select using (auth.role() = 'authenticated');

alter table public.user_roadmaps enable row level security;
create policy "users manage own roadmaps" on public.user_roadmaps for all using (auth.uid() = user_id);

alter table public.milestones enable row level security;
create policy "users manage own milestones" on public.milestones for all using (auth.uid() = user_id);

alter table public.tasks enable row level security;
create policy "users manage own tasks" on public.tasks for all using (auth.uid() = user_id);

alter table public.task_quizzes enable row level security;
create policy "authenticated read task quizzes" on public.task_quizzes for select using (auth.role() = 'authenticated');

alter table public.quiz_submissions enable row level security;
create policy "users manage own quiz submissions" on public.quiz_submissions for all using (auth.uid() = user_id);

alter table public.achievements enable row level security;
create policy "authenticated read achievements" on public.achievements for select using (auth.role() = 'authenticated');

alter table public.user_achievements enable row level security;
create policy "users manage own achievements" on public.user_achievements for all using (auth.uid() = user_id);

alter table public.ai_usage enable row level security;
create policy "users view own ai usage" on public.ai_usage for select using (auth.uid() = user_id);

-- Automatic Auth Trigger for New Users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Create Profile
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Adventurer'),
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Initialize Gamification Stats
  insert into public.user_gamification (user_id, xp, level, coins, current_streak, streak_freeze_count)
  values (new.id, 0, 1, 50, 1, 1);

  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists then recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
