# Career Pilot: implementation status

This document summarizes the current repository state. It distinguishes features implemented in code from items that still need a configured backend, provider account, or human review. The detailed change log and migration-level notes remain in [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md).

## Project at a glance

Career Pilot is a career-development web app built around role selection, an adaptive learning roadmap, practical tasks and checkpoint quizzes, and supporting tools for skills, interviews, resumes, and coaching. The product combines a playful roadmap experience with account-backed career workspaces.

The frontend is React, TypeScript, and Vite. Supabase provides Auth, Postgres, Row Level Security, RPCs, and Edge Functions. The repository contains migrations and seed data, but they have not yet been applied and verified against the intended Career Pilot Supabase project.

**Overall state:** substantial product functionality is implemented, and the frontend lint/build checks pass. The project is not yet production-verified. Database execution, provider setup, end-to-end account flows, full accessibility review, content review, and operational launch settings remain open.

## What is implemented and how

### 1. Authentication and account security

- Supabase Auth is the identity source. The old in-memory OTP implementation and local identity fallback were removed. Email verification uses Supabase-managed OTP; password reset has a dedicated recovery flow.
- Sign-in screens include Google, GitHub, and Microsoft provider entry points. Those providers still need to be configured in the hosted Auth project before they can be relied on in production.
- TOTP MFA includes enrollment, verification, named backup factors, factor removal, and an assurance gate before protected data is loaded.
- Database policies restrict access to account-owned rows. Sensitive changes and progression actions use authenticated, ownership-checked database functions or Edge Functions rather than trusting user IDs from request bodies.
- Account deletion uses a JWT-verified Edge Function and database cascades. Account export gathers saved product records.
- Signup consent is unchecked by default. Acceptance of the current Terms and Privacy Notice versions is saved with a timestamp and included in account export. The policy documents are drafts, not legal approval.

**Implementation approach:** Supabase Auth sessions, RLS policies, database migrations, transaction-backed RPCs, and verified-JWT Edge Functions. MFA assurance is checked in the frontend and in privileged server functions.

### 2. Persistent workspace and career roadmap

- Profiles, career goals, onboarding preferences, roadmaps, milestones, tasks, skills, quiz attempts, CV data, interview attempts, coach messages, notifications, and settings have account-backed persistence paths.
- Initial onboarding saves the career goal and first roadmap in one database transaction. Career changes save the replacement plan transactionally so a failed plan does not overwrite the previous one.
- Roadmap generation uses a curated catalog of 209 roles, 12 career categories, role skill mappings, estimated effort, learner experience level, target date, and study capacity. Users can also define a custom role and select a category playbook.
- The planner generates dated milestones and concrete tasks, distributes effort over the selected timeline, and uses local date-only arithmetic to avoid timezone and month-end errors.
- Task completion, checkpoint scoring, XP, coins, streaks, milestone status, and achievements are validated and recorded server-side. Re-planning is transactional and does not fabricate completed work.
- Checkpoint answer keys are kept server-side. A sanitized view returns questions and choices; a database function checks answers, records attempts, awards progress, and completes eligible checkpoint tasks.
- Analytics and badges derive from saved task and achievement records rather than fabricated history.

**Implementation approach:** account-specific repositories hydrate saved state; migrations define ownership and constraints; database transactions handle multi-record operations; curated templates and category playbooks generate plans and assessments.

### 3. Career tools and learning content

- The Skills workspace derives skill gaps from role requirements and the learner’s saved skill profile. The catalog includes 942 distinct skills and 2,054 weighted role-skill mappings.
- Live remote listings are fetched through an authenticated Edge Function proxy for Remote OK. Optional regional/hybrid search is provided through Jooble. Listings are transient, linked to their source, and the UI describes the text-based relevance signal and its limits. Bundled sample listings are labeled as samples.
- A published learning-resource catalog covers all 12 categories. Learners can add a catalog resource to their roadmap as a task.
- Interactive Mock Interview Arena: tailored directly to the learner's chosen target role and career domain. Provides 72 calibrated questions across all 12 domains, with round filters (Behavioral, Technical, System Design), difficulty filters (Junior, Mid, Senior), practice pacing sprint timers (2-minute and 3-minute sprint countdowns with progress indicators), and Web Speech API voice dictation for spoken answer practice. Evaluates answers with calibrated STAR rubric scoring and optional metered AI deep feedback.
- Professional Multi-Template CV Maker: supports 5 visual resume templates (Modern Tech, Minimalist ATS, Classic Executive, Creative Split, and Compact One-Page). Persists template selection to account storage, renders live previews in real time, and includes clean print/PDF styling (`@media print`) for vector-fidelity export.
- The career coach saves messages and can request AI responses. Voice input is progressive dictation where supported; typed input remains available.

**Implementation approach:** curated seed/migration data, account-owned records, prompt-safe client queries, authenticated provider proxies, transient job search results, and explicit AI actions.

### 4. AI, quotas, and cost controls

- The AI gateway uses authenticated OpenAI Responses API calls for enabled coach, resume, interview-feedback, and custom-role planning actions. It validates and bounds input, returns clear unavailable-provider behavior, and avoids caching personal action inputs.
- Per-feature rolling quotas use atomic reservations. Failed calls release reservations; successful calls record provider token usage.
- A global UTC-day token budget reserves a conservative allowance before provider calls and reconciles actual usage afterward. A service-role-only view supports operator reporting.
- Validated generic custom-role outlines can be cached using a normalized-input digest; cached entries expire and do not retain the request title.
- User-visible error references correlate failures with server logs without exposing raw provider errors.

**Implementation approach:** server-side provider secrets, quota reservation migrations/RPCs, bounded prompts, token accounting, a restricted cache, and generic client errors.

### 5. UX, accessibility, and notifications

- The interface includes desktop navigation and mobile navigation, a gamified roadmap, analytics, settings, account controls, saved views through `?view=`, and browser back/forward synchronization.
- Theme-aware focus rings, reduced-motion behavior, skip-to-content, keyboard-operable controls, semantic state announcements, and shared dialog focus/escape/scroll behavior have been added.
- Realtime Backend Data Integration: Supabase Realtime channel subscriptions on tables `tasks`, `ai_coach_messages`, and `user_notifications` keep client state instantly in sync across multi-tab sessions and background operations without manual page refreshes.
- Granular Task Push Notifications & Detailed Notification Controls:
  - Users have full detailed control over notification preferences: daily task due reminders with customizable alert time dropdown (08:00, 09:00, 12:00, 18:00, 20:00), streak protection loss-prevention warnings, milestone stage celebrations, weekly check-in frequency (2x, 3x, 4x), and audible synthesizer chime effects with sample playback.
  - Automatic task-due reminder checker checks pending roadmap tasks due today or overdue and triggers high-priority browser notifications and in-app alerts.
  - NotificationCenterModal is redesigned with two dedicated tabs: "Inbox & Recent Activity" (with unread badges and mark all read) and "Detailed Settings" (with toggle controls, time picker, and instant test push notification).
- Responsive issues identified in the career picker, skills screen, interview screen, and authentication flow have been addressed. The authentication view was visually reviewed at desktop, 390px, and 320px widths.

**Implementation approach:** shared theme/accessibility CSS and dialog hooks, semantic native controls, lazy-loaded screens, URL-backed view state, per-account notification data, Supabase Realtime postgres_changes listeners, Web Audio API synthesis, and opt-in browser push.

### 6. Release and operator groundwork

- GitHub Actions runs frontend lint and a production build on relevant pushes and pull requests. Dependencies and workflow actions are updated through Dependabot; action references are pinned.
- Setup, AI cost controls, backup/retention, Edge Function observability, and contribution workflow documentation have been added or updated.
- All nine Edge Functions use a shared wrapper that adds a request ID to responses and emits structured privacy-conscious logs.
- Documentation describes the backup/PITR choices and restore-drill steps, but no production backup policy or restore drill has been completed.

**Implementation approach:** secret-free CI for lint/build, pinned GitHub Actions, operator documentation, and a shared Edge Function logging/correlation wrapper.

## Phase status and remaining work

| Phase | Status | What remains to close it |
|---|---|---|
| 1. Auth and security | Code implemented; database verification pending | Apply the complete migration chain in an isolated/local Supabase database; run RLS allow/deny probes, Auth/MFA checks, and Supabase advisors against the intended project. Configure email template/SMTP and any OAuth providers. |
| 2. Persistent product data | Code implemented; live verification pending | Verify refresh, sign-out/sign-in, multi-device persistence, export, deletion, and failure/retry paths using real Auth and database state. |
| 3. Core career journey | Code verified; live database verification pending | Automated curriculum audit tests verified all 209 curated roles across 12 categories; validate the full plan/task/quiz/re-plan/achievement lifecycle against the database. |
| 4. Career accelerators | Code implemented | Multi-template CV Maker with 5 distinct visual designs and print styling; Mock Interview Arena tailored to target role with round/difficulty filters, 2m/3m pacing sprint timers, Web Speech voice dictation, and calibrated STAR rubric scoring; OpenAI/Jooble proxies and Edge Functions ready. |
| 5. Professional UX | Code implemented | Realtime backend data integration via Supabase Realtime channel subscriptions on tasks, coach messages, and notifications; granular notification control center with custom reminder times, streak loss warnings, milestone celebrations, weekly frequency, and synthesizer chime. |
| 6. Release readiness | In progress | Quality automation test suite expanded (52 Vitest unit/integration/audit tests passing in CI across 9 test files); choose hosted backup/PITR and log-retention policies; complete a restore drill; configure alerts and optional APM; verify production function/migration setup and scheduled jobs. |

## External setup and launch gates

- **Intended Supabase project:** the repository has no configured Career Pilot project credentials. The connected Supabase project exposed in this environment is named `Shaako`; do not apply Career Pilot migrations to it.
- **Local database:** Supabase CLI is present, but Docker is not available, so the local Supabase database and migration chain cannot currently be run here.
- **Edge Function runtime:** Deno is unavailable in this environment. TypeScript syntax was checked previously, but the functions still need Deno type/runtime verification and deployment.
- **Auth delivery:** configure the production SMTP provider and Supabase email templates. Enable hosted TOTP MFA and configure any OAuth providers the product will offer.
- **AI and jobs:** configure OpenAI and optional Jooble secrets, review provider behavior and terms, then validate quotas and searches in the intended project.
- **Push/scheduler:** configure VAPID and scheduler secrets, deploy the worker function, explicitly activate its schedule, and verify deliveries in supported browsers.
- **Legal/privacy:** finalize operator identity, support contact, jurisdiction, retention decisions, and qualified legal review before public launch.
- **Quality automation:** Vitest unit, integration, and curriculum audit suite is active (52 tests across 9 test suites running in < 600ms), and GitHub Actions CI runs lint, test, and production build.

## Verification performed so far

- The most recent frontend `npm run lint` passed with 0 warnings and 0 errors.
- The Vitest automated test suite passed with 52 tests across 9 test files (`dateOnly`, `careerCatalog`, `checkpointQuizCatalog`, `cvTemplates`, `plannerEngine`, `curriculaAudit`, `curatedInterviewCatalog`, `accountRepository`, `notificationService`).
- An exhaustive automated curriculum audit verified roadmap, task, and checkpoint quiz generation across all 209 curated roles in all 12 career categories.
- The most recent frontend `npm run build` passed (`tsc -b` and Vite production bundle; initial JS chunk is 497 KB, safely below the 500 KB threshold).
- `git diff --check` passed; the working copy reports line-ending normalization notices on some existing files.
- Headless Edge visual review covered the authentication screen at desktop, 390px, and 320px widths. This is limited to that screen and is not a substitute for complete manual or assistive-technology review.
- No live Supabase migration, RLS probe, Edge Function deployment, provider integration, or production restore drill has been verified from this checkout.

## Recommended next implementation order

1. Prepare an isolated local Supabase environment and verify migrations/RLS without touching the connected Shaako project.
2. Fix migration or policy issues found, then verify onboarding, persistence, quiz completion, re-planning, account export, and deletion end to end.
3. Complete the whole-app responsive, keyboard, and screen-reader review and resolve findings.
4. Configure the intended hosted project, required secrets/providers, schedules, backup/retention policy, monitoring, and legal launch details; run a production rehearsal and restore drill.

