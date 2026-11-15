# Career Pilot — 3-Person Contribution Split (30% / 35% / 35%)

Baseline: **Strictly the current unpushed changes only** — from the last pushed commit on `origin/main` (`ed12a86`) through the current working tree (earlier committed project history is excluded).

## Contribution Overview

| Contributor | Target Share | Measured Share | Files | Additions | Deletions | Total Changed Lines | Ownership Scope |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | --- |
| **Person 1 — Rabbi Hasan** (`rabbihasan3.1416@gmail.com`) | **30%** | **30.22%** | 60 | +7786 | -4565 | 12351 | Core App Shell, Auth/MFA/Legal, Onboarding, Profile & Account, Design Tokens, Auth Art, CI & Docs |
| **Person 2 — Anis Ahmed Arko** (`anisahmedarko@gmail.com`) | **35%** | **34.90%** | 31 | +9359 | -4903 | 14262 | Interactive 3D/Highway Roadmap, Weekly Schedule Agenda, Push Notifications & SW, AI Coach Workspace, Mock Interview Engine & Catalog, CV Builder, Checkpoint Quiz UI |
| **Person 3 — Madbor1** (`shamim241-35-272@diu.edu.bd`) | **35%** | **34.88%** | 56 | +11649 | -2607 | 14256 | Analytics & Velocity Dashboard, Skill Gap & Market Fit, Planner Engine, Curated Career/Resource Catalogs, Repository Tests, All Supabase SQL Migrations & Edge Functions |
| **Total** | **100%** | **100.00%** | **147** | **+28794** | **-12075** | **40869** | Full delta since `ed12a86` |

---

## How to Push Separately for All 3 Contributors

> **CI note:** `.github/workflows/frontend-quality.yml` runs `oxlint`, `vitest`, and `tsc -b && vite build` on every push to `main` with `cancel-in-progress: true`. Because `App.tsx` (Person 1) integrates modules from Person 2 and Person 3, push all 3 commits back-to-back onto `main` so the combined final state passes CI cleanly.

### Option A — Sequential 3-Commit Push Script (PowerShell, Run from `g:\Career-Pilot`)

Runs 3 separate commits (one per contributor's GitHub author email) and 3 pushes in order:

```powershell
# ── 1) Person 1 (Me — 30%): Rabbi Hasan ──────────────────────────────────────
$p1Files = @(
  ".github/dependabot.yml"
  ".github/workflows/frontend-quality.yml"
  "CONTRIBUTION_WORKFLOW.md"
  "docs/ai-cost-controls.md"
  "docs/data-backup-retention.md"
  "docs/edge-function-observability.md"
  "frontend/.env.example"
  "frontend/.node-version"
  "frontend/capacitor.config.json"
  "frontend/index.html"
  "frontend/package-lock.json"
  "frontend/package.json"
  "frontend/public/assets/career-auth-desktop.png"
  "frontend/public/assets/career-auth-mobile.png"
  "frontend/public/legal/privacy.html"
  "frontend/public/legal/terms.html"
  "frontend/README.md"
  "frontend/src/App.css"
  "frontend/src/App.tsx"
  "frontend/src/components/AuthModal.tsx"
  "frontend/src/components/BottomDock.tsx"
  "frontend/src/components/BottomNav.tsx"
  "frontend/src/components/DesktopSidebar.tsx"
  "frontend/src/components/Navbar.tsx"
  "frontend/src/components/ProfileAccountView.tsx"
  "frontend/src/components/ProfileSettingsModal.tsx"
  "frontend/src/components/QuickActionSheetModal.tsx"
  "frontend/src/components/RoleQuestSelectorModal.tsx"
  "frontend/src/components/SignOutModal.tsx"
  "frontend/src/components/SkeletonScreen.tsx"
  "frontend/src/features/account/accountRepository.test.ts"
  "frontend/src/features/account/accountRepository.ts"
  "frontend/src/features/ai/aiGateway.ts"
  "frontend/src/features/auth/AuthIllustration.tsx"
  "frontend/src/features/auth/AuthScreen.tsx"
  "frontend/src/features/auth/authService.test.ts"
  "frontend/src/features/auth/authService.ts"
  "frontend/src/features/auth/MFAChallengeScreen.tsx"
  "frontend/src/features/auth/PasswordRecoveryScreen.tsx"
  "frontend/src/features/legal/LegalAcceptanceScreen.tsx"
  "frontend/src/features/legal/policyVersions.ts"
  "frontend/src/features/onboarding/OnboardingGoalModal.tsx"
  "frontend/src/hooks/useAccessibleDialog.ts"
  "frontend/src/index.css"
  "frontend/src/lib/aiGateway.ts"
  "frontend/src/lib/authService.ts"
  "frontend/src/lib/dateOnly.test.ts"
  "frontend/src/lib/dateOnly.ts"
  "frontend/src/lib/mockData.ts"
  "frontend/src/lib/sound.ts"
  "frontend/src/lib/supabase.ts"
  "frontend/src/types/index.ts"
  "frontend/vite.config.ts"
  "IMPLEMENTATION_ROADMAP.md"
  "PROJECT_STATUS.md"
  "README.md"
  "supabase/config.toml"
  "supabase/functions/_shared/mfa.ts"
  "supabase/templates/confirm_signup.html"
  "TEAM_CONTRIBUTIONS.md"
)
git add -A -- $p1Files
git -c user.name="Rabbi Hasan" -c user.email="rabbihasan3.1416@gmail.com" commit -m "feat(core,auth,ui): redesign app shell, auth/onboarding flow, account tools, and docs"
git push origin main

# ── 2) Person 2 (35%): Anis Ahmed Arko ────────────────────────────────────────
$p2Files = @(
  "frontend/public/sw.js"
  "frontend/src/components/AICoachView.tsx"
  "frontend/src/components/CheckpointQuestionModal.tsx"
  "frontend/src/components/CVBuilderView.tsx"
  "frontend/src/components/InterviewSimulatorView.tsx"
  "frontend/src/components/RoadmapTimelineView.tsx"
  "frontend/src/components/TodayPlanView.tsx"
  "frontend/src/features/coach/AICoachView.tsx"
  "frontend/src/features/cv/cvRepository.ts"
  "frontend/src/features/cv/cvTemplates.test.ts"
  "frontend/src/features/cv/CVTemplates.tsx"
  "frontend/src/features/cv/cvTemplatesCatalog.ts"
  "frontend/src/features/interview/curatedInterviewCatalog.test.ts"
  "frontend/src/features/interview/curatedInterviewCatalog.ts"
  "frontend/src/features/interview/interviewSessionEngine.test.ts"
  "frontend/src/features/interview/interviewSessionEngine.ts"
  "frontend/src/features/notifications/NotificationBanner.tsx"
  "frontend/src/features/notifications/NotificationCenterModal.tsx"
  "frontend/src/features/notifications/notificationService.test.ts"
  "frontend/src/features/notifications/notificationService.ts"
  "frontend/src/features/roadmap/checkpointQuizCatalog.test.ts"
  "frontend/src/features/roadmap/checkpointQuizCatalog.ts"
  "frontend/src/features/roadmap/CheckpointQuizModal.tsx"
  "frontend/src/features/roadmap/DailyRoadmapPlan.tsx"
  "frontend/src/features/roadmap/demoCheckpointQuizzes.ts"
  "frontend/src/features/roadmap/domainCheckpointQuizTemplates.ts"
  "frontend/src/features/roadmap/Road3DGameView.tsx"
  "frontend/src/features/roadmap/RoadHighwayView.tsx"
  "frontend/src/features/roadmap/RoadmapView.tsx"
  "frontend/src/features/roadmap/WeeklyScheduleView.tsx"
  "frontend/src/features/roadmap/WeeklyTimeline.tsx"
)
git add -A -- $p2Files
git -c user.name="Anis Ahmed Arko" -c user.email="anisahmedarko@gmail.com" commit -m "feat(roadmap,coach,interview,push): redesign roadmap curves, schedule, push alerts, AI coach, and mock interviews"
git push origin main

# ── 3) Person 3 (35%): Madbor1 ────────────────────────────────────────────────
$p3Files = @(
  "frontend/src/components/AnalyticsView.tsx"
  "frontend/src/components/OverviewAnalyticsView.tsx"
  "frontend/src/components/SkillGapView.tsx"
  "frontend/src/features/resources/LearningResourcesPanel.tsx"
  "frontend/src/features/resources/resourceRepository.ts"
  "frontend/src/features/roadmap/careerCatalog.test.ts"
  "frontend/src/features/roadmap/careerCatalog.ts"
  "frontend/src/features/roadmap/CheckpointHistoryPanel.tsx"
  "frontend/src/features/roadmap/curriculaAudit.test.ts"
  "frontend/src/features/roadmap/plannerEngine.test.ts"
  "frontend/src/features/roadmap/plannerEngine.ts"
  "frontend/src/features/roadmap/roadmapRepository.test.ts"
  "frontend/src/features/roadmap/roadmapRepository.ts"
  "frontend/src/features/roadmap/TaskResourceLink.tsx"
  "frontend/src/lib/plannerEngine.ts"
  "supabase/functions/_shared/observability.ts"
  "supabase/functions/ai-gateway/index.ts"
  "supabase/functions/apply-action/index.ts"
  "supabase/functions/delete-account/index.ts"
  "supabase/functions/nightly-replan/index.ts"
  "supabase/functions/plan-roadmap/index.ts"
  "supabase/functions/score-interview-answer/index.ts"
  "supabase/functions/search-remote-jobs/index.ts"
  "supabase/functions/send-email-otp/index.ts"
  "supabase/functions/send-push-reminders/index.ts"
  "supabase/migrations/20261013000002_phase4_career_tools.sql"
  "supabase/migrations/20261111080705_auth_security_baseline.sql"
  "supabase/migrations/20261111081833_product_data_foundation.sql"
  "supabase/migrations/20261111084357_add_vacancy_skill_requirements.sql"
  "supabase/migrations/20261111084706_secure_quiz_scoring.sql"
  "supabase/migrations/20261111085606_notification_deduplication.sql"
  "supabase/migrations/20261111090055_cascade_account_data_deletion.sql"
  "supabase/migrations/20261111090310_persist_reminder_cadence.sql"
  "supabase/migrations/20261111090949_transactional_planner_actions.sql"
  "supabase/migrations/20261111091331_secure_task_completion.sql"
  "supabase/migrations/20261111092240_atomic_ai_usage_reservations.sql"
  "supabase/migrations/20261111102347_enforce_mfa_assurance_for_enrolled_users.sql"
  "supabase/migrations/20261111110000_harden_auth_trigger_and_document_quiz_view.sql"
  "supabase/migrations/20261111123000_server_managed_checkpoint_quizzes.sql"
  "supabase/migrations/20261111125332_expire_stale_ai_usage_reservations.sql"
  "supabase/migrations/20261111140000_featured_role_quiz_bank.sql"
  "supabase/migrations/20261111143430_ai_daily_token_budget.sql"
  "supabase/migrations/20261111150000_domain_checkpoint_quiz_banks.sql"
  "supabase/migrations/20261111160000_role_skill_requirements_and_vacancy_matching.sql"
  "supabase/migrations/20261111170000_career_domain_interview_bank.sql"
  "supabase/migrations/20261111180000_persist_custom_role_category.sql"
  "supabase/migrations/20261111190000_career_category_skill_baselines.sql"
  "supabase/migrations/20261111200000_secure_interview_scoring.sql"
  "supabase/migrations/20261111210000_web_push_subscriptions.sql"
  "supabase/migrations/20261111220000_serialize_active_user_roadmap.sql"
  "supabase/migrations/20261111230000_commit_career_goal_with_roadmap.sql"
  "supabase/migrations/20261111235900_curated_learning_resource_catalog.sql"
  "supabase/migrations/20261112000000_shared_ai_role_plan_templates.sql"
  "supabase/migrations/20261112010000_link_resources_to_learning_tasks.sql"
  "supabase/migrations/20261112020000_record_legal_acceptance.sql"
  "supabase/migrations/20261112030000_deepen_interview_question_coverage.sql"
)
git add -A -- $p3Files
git -c user.name="Madbor1" -c user.email="shamim241-35-272@diu.edu.bd" commit -m "feat(analytics,skills,backend): redesign analytics telemetry, planner engine, repositories, migrations, and edge functions"
git push origin main
```

### Option B — Push from 3 Separate Machines / GitHub Accounts (Patch Handoff)

If Person 2 and Person 3 want to push directly from their own computers:

1. **Export Person 2 & Person 3 patches on Rabbi's PC before staging Person 1** (note: `git diff --output=...` writes clean UTF-8 without a PowerShell BOM and handles binary PNGs + file deletions):
   ```powershell
   git add -N -- $p2Files
   git diff --binary HEAD --output=p2-work.patch -- $p2Files
   git reset -- $p2Files

   git add -N -- $p3Files
   git diff --binary HEAD --output=p3-work.patch -- $p3Files
   git reset -- $p3Files
   ```
2. **Person 1 pushes first** (`git add -A -- $p1Files`, commit + `git push origin main`), then cleans up P2/P3 working-tree changes (`git restore --staged --worktree -- $p2Files $p3Files` and delete untracked P2/P3 files before pulling later).
3. **Person 2 on their laptop** pulls `origin/main`, runs `git apply --index p2-work.patch`, commits with their own Git user, and runs `git push origin main`.
4. **Person 3 on their laptop** pulls `origin/main`, runs `git apply --index p3-work.patch`, commits with their own Git user, and runs `git push origin main`.

---

## Detailed File Assignment

### Person 1 — Rabbi Hasan (30% · 60 files · 12351 lines · 30.22%)

| File | Status | + | - | Total |
| --- | --- | ---: | ---: | ---: |
| `.github/dependabot.yml` | added | +14 | -0 | 14 |
| `.github/workflows/frontend-quality.yml` | added | +52 | -0 | 52 |
| `CONTRIBUTION_WORKFLOW.md` | modified | +26 | -144 | 170 |
| `docs/ai-cost-controls.md` | added | +66 | -0 | 66 |
| `docs/data-backup-retention.md` | added | +30 | -0 | 30 |
| `docs/edge-function-observability.md` | added | +24 | -0 | 24 |
| `frontend/.env.example` | modified | +1 | -4 | 5 |
| `frontend/.node-version` | added | +2 | -0 | 2 |
| `frontend/capacitor.config.json` | modified | +1 | -1 | 2 |
| `frontend/index.html` | modified | +3 | -1 | 4 |
| `frontend/package-lock.json` | modified | +288 | -2 | 290 |
| `frontend/package.json` | modified | +4 | -2 | 6 |
| `frontend/public/assets/career-auth-desktop.png` | added | +10 | -0 | 10 |
| `frontend/public/assets/career-auth-mobile.png` | added | +10 | -0 | 10 |
| `frontend/public/legal/privacy.html` | added | +57 | -0 | 57 |
| `frontend/public/legal/terms.html` | added | +52 | -0 | 52 |
| `frontend/README.md` | modified | +16 | -22 | 38 |
| `frontend/src/App.css` | deleted | +0 | -184 | 184 |
| `frontend/src/App.tsx` | modified | +898 | -275 | 1173 |
| `frontend/src/components/AuthModal.tsx` | deleted | +0 | -929 | 929 |
| `frontend/src/components/BottomDock.tsx` | deleted | +0 | -25 | 25 |
| `frontend/src/components/BottomNav.tsx` | modified | +8 | -3 | 11 |
| `frontend/src/components/DesktopSidebar.tsx` | modified | +87 | -103 | 190 |
| `frontend/src/components/Navbar.tsx` | modified | +52 | -47 | 99 |
| `frontend/src/components/ProfileAccountView.tsx` | modified | +585 | -357 | 942 |
| `frontend/src/components/ProfileSettingsModal.tsx` | modified | +51 | -62 | 113 |
| `frontend/src/components/QuickActionSheetModal.tsx` | modified | +11 | -2 | 13 |
| `frontend/src/components/RoleQuestSelectorModal.tsx` | modified | +204 | -31 | 235 |
| `frontend/src/components/SignOutModal.tsx` | modified | +9 | -0 | 9 |
| `frontend/src/components/SkeletonScreen.tsx` | added | +403 | -0 | 403 |
| `frontend/src/features/account/accountRepository.test.ts` | added | +56 | -0 | 56 |
| `frontend/src/features/account/accountRepository.ts` | added | +113 | -0 | 113 |
| `frontend/src/features/ai/aiGateway.ts` | added | +88 | -0 | 88 |
| `frontend/src/features/auth/AuthIllustration.tsx` | modified | +13 | -13 | 26 |
| `frontend/src/features/auth/AuthScreen.tsx` | modified | +408 | -611 | 1019 |
| `frontend/src/features/auth/authService.test.ts` | added | +643 | -0 | 643 |
| `frontend/src/features/auth/authService.ts` | modified | +517 | -459 | 976 |
| `frontend/src/features/auth/MFAChallengeScreen.tsx` | added | +113 | -0 | 113 |
| `frontend/src/features/auth/PasswordRecoveryScreen.tsx` | added | +128 | -0 | 128 |
| `frontend/src/features/legal/LegalAcceptanceScreen.tsx` | added | +71 | -0 | 71 |
| `frontend/src/features/legal/policyVersions.ts` | added | +5 | -0 | 5 |
| `frontend/src/features/onboarding/OnboardingGoalModal.tsx` | modified | +604 | -707 | 1311 |
| `frontend/src/hooks/useAccessibleDialog.ts` | added | +81 | -0 | 81 |
| `frontend/src/index.css` | modified | +852 | -40 | 892 |
| `frontend/src/lib/aiGateway.ts` | deleted | +0 | -40 | 40 |
| `frontend/src/lib/authService.ts` | modified | +4 | -7 | 11 |
| `frontend/src/lib/dateOnly.test.ts` | added | +100 | -0 | 100 |
| `frontend/src/lib/dateOnly.ts` | added | +53 | -0 | 53 |
| `frontend/src/lib/mockData.ts` | modified | +1 | -2 | 3 |
| `frontend/src/lib/sound.ts` | deleted | +0 | -114 | 114 |
| `frontend/src/lib/supabase.ts` | modified | +113 | -8 | 121 |
| `frontend/src/types/index.ts` | modified | +24 | -5 | 29 |
| `frontend/vite.config.ts` | modified | +2 | -284 | 286 |
| `IMPLEMENTATION_ROADMAP.md` | added | +174 | -0 | 174 |
| `PROJECT_STATUS.md` | added | +120 | -0 | 120 |
| `README.md` | modified | +110 | -74 | 184 |
| `supabase/config.toml` | modified | +27 | -7 | 34 |
| `supabase/functions/_shared/mfa.ts` | added | +20 | -0 | 20 |
| `supabase/templates/confirm_signup.html` | added | +5 | -0 | 5 |
| `TEAM_CONTRIBUTIONS.md` | added | +377 | -0 | 377 |

### Person 2 — Anis Ahmed Arko (35% · 31 files · 14262 lines · 34.90%)

| File | Status | + | - | Total |
| --- | --- | ---: | ---: | ---: |
| `frontend/public/sw.js` | added | +36 | -0 | 36 |
| `frontend/src/components/AICoachView.tsx` | deleted | +0 | -274 | 274 |
| `frontend/src/components/CheckpointQuestionModal.tsx` | deleted | +0 | -209 | 209 |
| `frontend/src/components/CVBuilderView.tsx` | modified | +222 | -230 | 452 |
| `frontend/src/components/InterviewSimulatorView.tsx` | modified | +1610 | -263 | 1873 |
| `frontend/src/components/RoadmapTimelineView.tsx` | deleted | +0 | -216 | 216 |
| `frontend/src/components/TodayPlanView.tsx` | deleted | +0 | -177 | 177 |
| `frontend/src/features/coach/AICoachView.tsx` | modified | +717 | -216 | 933 |
| `frontend/src/features/cv/cvRepository.ts` | added | +40 | -0 | 40 |
| `frontend/src/features/cv/cvTemplates.test.ts` | added | +25 | -0 | 25 |
| `frontend/src/features/cv/CVTemplates.tsx` | added | +570 | -0 | 570 |
| `frontend/src/features/cv/cvTemplatesCatalog.ts` | added | +48 | -0 | 48 |
| `frontend/src/features/interview/curatedInterviewCatalog.test.ts` | added | +139 | -0 | 139 |
| `frontend/src/features/interview/curatedInterviewCatalog.ts` | added | +1149 | -0 | 1149 |
| `frontend/src/features/interview/interviewSessionEngine.test.ts` | added | +136 | -0 | 136 |
| `frontend/src/features/interview/interviewSessionEngine.ts` | added | +711 | -0 | 711 |
| `frontend/src/features/notifications/NotificationBanner.tsx` | deleted | +0 | -95 | 95 |
| `frontend/src/features/notifications/NotificationCenterModal.tsx` | modified | +617 | -90 | 707 |
| `frontend/src/features/notifications/notificationService.test.ts` | added | +110 | -0 | 110 |
| `frontend/src/features/notifications/notificationService.ts` | modified | +560 | -144 | 704 |
| `frontend/src/features/roadmap/checkpointQuizCatalog.test.ts` | added | +120 | -0 | 120 |
| `frontend/src/features/roadmap/checkpointQuizCatalog.ts` | added | +60 | -0 | 60 |
| `frontend/src/features/roadmap/CheckpointQuizModal.tsx` | modified | +93 | -28 | 121 |
| `frontend/src/features/roadmap/DailyRoadmapPlan.tsx` | deleted | +0 | -240 | 240 |
| `frontend/src/features/roadmap/demoCheckpointQuizzes.ts` | added | +380 | -0 | 380 |
| `frontend/src/features/roadmap/domainCheckpointQuizTemplates.ts` | added | +293 | -0 | 293 |
| `frontend/src/features/roadmap/Road3DGameView.tsx` | modified | +221 | -165 | 386 |
| `frontend/src/features/roadmap/RoadHighwayView.tsx` | modified | +83 | -56 | 139 |
| `frontend/src/features/roadmap/RoadmapView.tsx` | modified | +3 | -0 | 3 |
| `frontend/src/features/roadmap/WeeklyScheduleView.tsx` | modified | +1416 | -2194 | 3610 |
| `frontend/src/features/roadmap/WeeklyTimeline.tsx` | deleted | +0 | -306 | 306 |

### Person 3 — Madbor1 (35% · 56 files · 14256 lines · 34.88%)

| File | Status | + | - | Total |
| --- | --- | ---: | ---: | ---: |
| `frontend/src/components/AnalyticsView.tsx` | deleted | +0 | -268 | 268 |
| `frontend/src/components/OverviewAnalyticsView.tsx` | modified | +997 | -1296 | 2293 |
| `frontend/src/components/SkillGapView.tsx` | modified | +694 | -241 | 935 |
| `frontend/src/features/resources/LearningResourcesPanel.tsx` | added | +183 | -0 | 183 |
| `frontend/src/features/resources/resourceRepository.ts` | added | +138 | -0 | 138 |
| `frontend/src/features/roadmap/careerCatalog.test.ts` | added | +100 | -0 | 100 |
| `frontend/src/features/roadmap/careerCatalog.ts` | modified | +142 | -61 | 203 |
| `frontend/src/features/roadmap/CheckpointHistoryPanel.tsx` | added | +142 | -0 | 142 |
| `frontend/src/features/roadmap/curriculaAudit.test.ts` | added | +88 | -0 | 88 |
| `frontend/src/features/roadmap/plannerEngine.test.ts` | added | +218 | -0 | 218 |
| `frontend/src/features/roadmap/plannerEngine.ts` | modified | +418 | -152 | 570 |
| `frontend/src/features/roadmap/roadmapRepository.test.ts` | added | +323 | -0 | 323 |
| `frontend/src/features/roadmap/roadmapRepository.ts` | added | +629 | -0 | 629 |
| `frontend/src/features/roadmap/TaskResourceLink.tsx` | added | +31 | -0 | 31 |
| `frontend/src/lib/plannerEngine.ts` | deleted | +0 | -157 | 157 |
| `supabase/functions/_shared/observability.ts` | added | +104 | -0 | 104 |
| `supabase/functions/ai-gateway/index.ts` | modified | +387 | -186 | 573 |
| `supabase/functions/apply-action/index.ts` | modified | +41 | -120 | 161 |
| `supabase/functions/delete-account/index.ts` | added | +54 | -0 | 54 |
| `supabase/functions/nightly-replan/index.ts` | modified | +51 | -11 | 62 |
| `supabase/functions/plan-roadmap/index.ts` | modified | +14 | -4 | 18 |
| `supabase/functions/score-interview-answer/index.ts` | added | +165 | -0 | 165 |
| `supabase/functions/search-remote-jobs/index.ts` | added | +313 | -0 | 313 |
| `supabase/functions/send-email-otp/index.ts` | modified | +16 | -111 | 127 |
| `supabase/functions/send-push-reminders/index.ts` | added | +149 | -0 | 149 |
| `supabase/migrations/20261013000002_phase4_career_tools.sql` | modified | +15 | -0 | 15 |
| `supabase/migrations/20261111080705_auth_security_baseline.sql` | added | +74 | -0 | 74 |
| `supabase/migrations/20261111081833_product_data_foundation.sql` | added | +221 | -0 | 221 |
| `supabase/migrations/20261111084357_add_vacancy_skill_requirements.sql` | added | +18 | -0 | 18 |
| `supabase/migrations/20261111084706_secure_quiz_scoring.sql` | added | +182 | -0 | 182 |
| `supabase/migrations/20261111085606_notification_deduplication.sql` | added | +6 | -0 | 6 |
| `supabase/migrations/20261111090055_cascade_account_data_deletion.sql` | added | +16 | -0 | 16 |
| `supabase/migrations/20261111090310_persist_reminder_cadence.sql` | added | +7 | -0 | 7 |
| `supabase/migrations/20261111090949_transactional_planner_actions.sql` | added | +154 | -0 | 154 |
| `supabase/migrations/20261111091331_secure_task_completion.sql` | added | +295 | -0 | 295 |
| `supabase/migrations/20261111092240_atomic_ai_usage_reservations.sql` | added | +87 | -0 | 87 |
| `supabase/migrations/20261111102347_enforce_mfa_assurance_for_enrolled_users.sql` | added | +167 | -0 | 167 |
| `supabase/migrations/20261111110000_harden_auth_trigger_and_document_quiz_view.sql` | added | +18 | -0 | 18 |
| `supabase/migrations/20261111123000_server_managed_checkpoint_quizzes.sql` | added | +200 | -0 | 200 |
| `supabase/migrations/20261111125332_expire_stale_ai_usage_reservations.sql` | added | +63 | -0 | 63 |
| `supabase/migrations/20261111140000_featured_role_quiz_bank.sql` | added | +268 | -0 | 268 |
| `supabase/migrations/20261111143430_ai_daily_token_budget.sql` | added | +176 | -0 | 176 |
| `supabase/migrations/20261111150000_domain_checkpoint_quiz_banks.sql` | added | +315 | -0 | 315 |
| `supabase/migrations/20261111160000_role_skill_requirements_and_vacancy_matching.sql` | added | +3260 | -0 | 3260 |
| `supabase/migrations/20261111170000_career_domain_interview_bank.sql` | added | +60 | -0 | 60 |
| `supabase/migrations/20261111180000_persist_custom_role_category.sql` | added | +17 | -0 | 17 |
| `supabase/migrations/20261111190000_career_category_skill_baselines.sql` | added | +85 | -0 | 85 |
| `supabase/migrations/20261111200000_secure_interview_scoring.sql` | added | +20 | -0 | 20 |
| `supabase/migrations/20261111210000_web_push_subscriptions.sql` | added | +44 | -0 | 44 |
| `supabase/migrations/20261111220000_serialize_active_user_roadmap.sql` | added | +108 | -0 | 108 |
| `supabase/migrations/20261111230000_commit_career_goal_with_roadmap.sql` | added | +80 | -0 | 80 |
| `supabase/migrations/20261111235900_curated_learning_resource_catalog.sql` | added | +77 | -0 | 77 |
| `supabase/migrations/20261112000000_shared_ai_role_plan_templates.sql` | added | +101 | -0 | 101 |
| `supabase/migrations/20261112010000_link_resources_to_learning_tasks.sql` | added | +26 | -0 | 26 |
| `supabase/migrations/20261112020000_record_legal_acceptance.sql` | added | +25 | -0 | 25 |
| `supabase/migrations/20261112030000_deepen_interview_question_coverage.sql` | added | +67 | -0 | 67 |
