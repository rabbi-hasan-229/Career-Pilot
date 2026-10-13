-- Phase 4 Migration: Career Accelerators (Skills, Interview Arena, CVs, Vacancies)
-- From JobSeeker Technical Documentation Sections 4 & 8

-- 1. Skills Directory Table
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  category text not null,
  description text,
  created_at timestamptz default now()
);

-- 2. User Acquired Skills Table
create table if not exists public.user_skills (
  user_id uuid references public.profiles(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  level text default 'proficient' check (level in ('beginner','proficient','advanced')),
  acquired_at timestamptz default now(),
  primary key (user_id, skill_id)
);

-- 3. Mock Interview Question Bank
create table if not exists public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid references public.roles(id) on delete cascade,
  round text not null check (round in ('Behavioral','Technical','System Design')),
  difficulty text not null check (difficulty in ('Junior','Mid','Senior')),
  question text not null,
  expected_keywords text[] default '{}',
  rubric jsonb not null default '{"situation": true, "task": true, "action": true, "result": true}'::jsonb,
  model_answer text not null,
  created_at timestamptz default now()
);

-- 4. User Interview Practice Attempts
create table if not exists public.interview_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  question_id uuid references public.interview_questions(id) on delete cascade,
  user_answer text not null,
  score int not null default 0,
  matched_keywords text[] default '{}',
  rubric_feedback jsonb not null default '{}'::jsonb,
  ai_feedback text,
  created_at timestamptz default now()
);

-- 5. CV Documents Table
create table if not exists public.cv_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null default 'Full-Stack Software Engineer CV',
  data jsonb not null default '{}'::jsonb,
  pdf_url text,
  updated_at timestamptz default now()
);

-- 6. Vacancies Table
create table if not exists public.vacancies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  location text not null default 'Remote',
  salary_range text,
  url text,
  created_at timestamptz default now()
);

-- 7. Vacancy Skills Association Table
create table if not exists public.vacancy_skills (
  vacancy_id uuid references public.vacancies(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  primary key (vacancy_id, skill_id)
);

-- Row Level Security (RLS)
alter table public.skills enable row level security;
create policy "public read skills" on public.skills for select using (true);

alter table public.user_skills enable row level security;
create policy "users manage own skills" on public.user_skills for all using (auth.uid() = user_id);

alter table public.interview_questions enable row level security;
create policy "public read interview questions" on public.interview_questions for select using (true);

alter table public.interview_attempts enable row level security;
create policy "users manage own interview attempts" on public.interview_attempts for all using (auth.uid() = user_id);

alter table public.cv_documents enable row level security;
create policy "users manage own cv documents" on public.cv_documents for all using (auth.uid() = user_id);

alter table public.vacancies enable row level security;
create policy "public read vacancies" on public.vacancies for select using (true);

alter table public.vacancy_skills enable row level security;
create policy "public read vacancy skills" on public.vacancy_skills for select using (true);

-- Seed Initial Skills & Questions for Phase 4
insert into public.skills (id, name, category) values
('aaaa0001-0000-0000-0000-000000000001', 'Data Structures & Algorithms', 'Computer Science'),
('aaaa0002-0000-0000-0000-000000000002', 'PostgreSQL & SQL Modeling', 'Database'),
('aaaa0003-0000-0000-0000-000000000003', 'TypeScript & React Architecture', 'Frontend'),
('aaaa0004-0000-0000-0000-000000000004', 'RESTful API & Deno/Node.js', 'Backend'),
('aaaa0005-0000-0000-0000-000000000005', 'System Design & Scalability', 'Architecture')
on conflict (name) do nothing;

insert into public.interview_questions (id, role_id, round, difficulty, question, expected_keywords, rubric, model_answer) values
(
  'bbbb0001-0000-0000-0000-000000000001',
  '22222222-2222-2222-2222-222222222222',
  'Behavioral',
  'Mid',
  'Tell me about a time you had to deal with an unexpected production incident or performance bottleneck. How did you diagnose and resolve it?',
  ARRAY['diagnosed', 'monitored', 'metrics', 'root cause', 'rollback', 'post-mortem', 'collaborated'],
  '{"situation": true, "task": true, "action": true, "result": true}'::jsonb,
  'In my previous role, high latency spiked to 4s during peak traffic. Situation: Database connection pool was saturated by unindexed queries. Task: Restore service within SLA. Action: Identified slow queries in pg_stat_statements, deployed partial indexes, and enabled connection pooling via PgBouncer. Result: Latency dropped by 92% to 120ms with zero downtime.'
),
(
  'bbbb0002-0000-0000-0000-000000000002',
  '22222222-2222-2222-2222-222222222222',
  'Technical',
  'Senior',
  'How do you design database indexes in PostgreSQL to optimize range queries without degrading write throughput?',
  ARRAY['b-tree', 'selectivity', 'write amplification', 'partial index', 'composite', 'vacuum'],
  '{"indexing": true, "write_cost": true, "explain_analyze": true}'::jsonb,
  'B-Tree indexes are standard for inequality and range queries (<, >). To minimize write amplification, I use partial indexes targeting active status rows, place highest-selectivity columns first in composite indexes, and verify query execution plans with EXPLAIN (ANALYZE, BUFFERS).'
)
on conflict (id) do nothing;

insert into public.vacancies (id, title, company, location, salary_range) values
('cccc0001-0000-0000-0000-000000000001', 'Full-Stack Software Engineer', 'Vercel / Cloudflare Ecosystem', 'Remote', '$110k - $140k'),
('cccc0002-0000-0000-0000-000000000002', 'Senior Backend & Database Engineer', 'Supabase Partner Studio', 'Remote (Global)', '$125k - $160k')
on conflict (id) do nothing;
