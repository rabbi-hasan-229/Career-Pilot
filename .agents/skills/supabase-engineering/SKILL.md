---
name: supabase-engineering
description: Supabase engineering standards for Career Pilot, including schema design, Row Level Security (RLS) policies, Edge Functions, pg_cron scheduling, and low-cost AI gateway architecture.
---

# Supabase Engineering: Career Pilot

This skill details the backend architecture on Supabase for the Career Pilot application based on the low-AI-cost specifications.

## 1. Core Principles

- **Row Level Security (RLS):** Enabled on every table. Private user data (`tasks`, `milestones`, `quiz_submissions`, `cv_documents`) requires `auth.uid() = user_id`. Shared tables (`roles`, `role_milestones`, `resources`, `task_quizzes`) are read-only for `authenticated` users.
- **Client Direct Access:** Web frontend connects directly using `@supabase/supabase-js` and the public anon key.
- **Service Role Protection:** Service role key is restricted exclusively to Deno Edge Functions.

## 2. Edge Function Directory

All functions live under `supabase/functions/`:
- `plan-roadmap`: Builds or adjusts the proportional roadmap based on weeks $W$ and effort hours $E_i$.
- `apply-action`: Quick-action buttons ("I'm behind", "Finished early", "Pause a week").
- `ai-gateway`: Single gate for model calls with SHA256 input caching, rate quotas, and hard spending caps.
- `nightly-replan`: Automated via `pg_cron` to advance dates, flag overdue items, and maintain streaks.

## 3. Database Migrations Workflow

Place all schema definitions under `supabase/migrations/<timestamp>_<name>.sql`.
Verify migrations locally with `supabase db reset` or `supabase db push`.
