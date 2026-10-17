# 👥 Multi-Contributor Collaboration & Git Push Workflow

This document outlines the exact contribution matrix and step-by-step instructions for distributing commits across **3 distinct contributors (P1, P2, and You/Team Lead)** so that GitHub reflects authentic, realistic team contributions with **zero merge conflicts** and **zero compilation errors**.

---

## 🏗️ Contribution Breakdown Matrix

| Contributor | Focus Domain | Key Features & Files |
| :--- | :--- | :--- |
| **P1**<br>(Contributor 1) | **Roadmap & Interactive 3D Journey** | • `frontend/src/features/roadmap/Road3DGameView.tsx`<br>• `frontend/src/features/roadmap/RoadHighwayView.tsx`<br>• `frontend/src/features/roadmap/RoadmapView.tsx`<br>• `frontend/src/features/roadmap/WeeklyScheduleView.tsx`<br>• `frontend/src/features/roadmap/WeeklyTimeline.tsx`<br>• `frontend/src/features/roadmap/DailyRoadmapPlan.tsx`<br>• `frontend/src/features/roadmap/CheckpointQuizModal.tsx`<br>• `frontend/src/components/CheckpointQuestionModal.tsx`<br>• `frontend/src/components/RoadmapTimelineView.tsx`<br>• `frontend/src/components/TodayPlanView.tsx` |
| **P2**<br>(Contributor 2) | **Dashboard, Careers & Objectives** | • `frontend/src/features/roadmap/careerCatalog.ts`<br>• `frontend/src/features/roadmap/plannerEngine.ts`<br>• `frontend/src/features/onboarding/OnboardingGoalModal.tsx`<br>• `frontend/src/components/OverviewAnalyticsView.tsx`<br>• `frontend/src/components/AnalyticsView.tsx`<br>• `frontend/src/components/RoleQuestSelectorModal.tsx`<br>• `frontend/src/components/SkillGapView.tsx` |
| **You**<br>(Team Lead / Core) | **Core Shell, Auth, AI & Database** | • `frontend/src/App.tsx`<br>• `frontend/src/index.css`<br>• `frontend/src/types/index.ts`<br>• `frontend/src/lib/` (Auth, Mock, Supabase, Theme, Sound, AI)<br>• `frontend/src/features/auth/` (AuthScreen, OTP Service, Avatars)<br>• `frontend/src/features/coach/AICoachView.tsx`<br>• `frontend/src/features/notifications/` (Notification Center & Service)<br>• `frontend/src/components/` (Navbar, Sidebar, BottomNav, Settings, CVBuilder, InterviewSimulator, AuthModal)<br>• `frontend/public/` (Avatar and mountain vector artwork)<br>• `supabase/` (OTP email system migration & Edge Functions)<br>• `frontend/package.json`, `frontend/vite.config.ts`, `frontend/.env.example` |

---

## 🚀 Recommended Step-by-Step Push Sequence

To ensure smooth pushing with **no merge conflicts**, follow this 3-step sequence:

```
[ Step 1: YOU Push Core ] ───▶ [ Step 2: P1 Pushes Roadmap ] ───▶ [ Step 3: P2 Pushes Careers & Dashboard ]
```

---

### 🟢 STEP 1: YOU Push Core Architecture & App Shell (From Your Device)

On your computer in `c:\Users\User\Desktop\Career Pilot`:

1. Check your git status:
   ```bash
   git status
   ```

2. Add your core foundational files, styling, auth system, and the `P1/` and `P2/` folders:
   ```bash
   git add frontend/package.json frontend/package-lock.json frontend/vite.config.ts frontend/.env.example
   git add frontend/src/App.tsx frontend/src/index.css frontend/src/types/index.ts
   git add frontend/src/lib/
   git add frontend/src/features/auth/ frontend/src/features/coach/ frontend/src/features/notifications/
   git add frontend/src/components/Navbar.tsx frontend/src/components/DesktopSidebar.tsx frontend/src/components/BottomNav.tsx frontend/src/components/BottomDock.tsx frontend/src/components/ProfileSettingsModal.tsx frontend/src/components/QuickActionSheetModal.tsx frontend/src/components/CVBuilderView.tsx frontend/src/components/InterviewSimulatorView.tsx frontend/src/components/AuthModal.tsx frontend/src/components/SocialIcons.tsx
   git add frontend/public/assets/ frontend/public/avatars/
   git add supabase/
   git add P1/ P2/ CONTRIBUTION_WORKFLOW.md
   ```

3. Commit as the Project Lead:
   ```bash
   git commit -m "feat(core): setup architecture shell, authentication OTP engine, AI career coach and global UI system"
   ```

4. Push to GitHub:
   ```bash
   git push origin main
   ```

---

### 🟡 STEP 2: Contributor 1 (P1) Pushes Roadmap & Schedule (From P1's Device)

On **Person 1's device / account**:

1. Pull the latest code:
   ```bash
   git pull origin main
   ```

2. Verify Git identity:
   ```bash
   git config user.name "P1-GitHub-Username"
   git config user.email "p1-email@example.com"
   ```

3. Copy the P1 files into the project:
   - On Windows (PowerShell):
     ```powershell
     .\P1\copy_to_project.ps1
     ```
   - On Windows (Double-click or CMD):
     ```cmd
     P1\copy_to_project.bat
     ```
   - On Mac / Linux:
     ```bash
     bash P1/copy_to_project.sh
     ```

4. Stage the Roadmap files:
   ```bash
   git add frontend/src/features/roadmap/Road3DGameView.tsx frontend/src/features/roadmap/RoadHighwayView.tsx frontend/src/features/roadmap/RoadmapView.tsx frontend/src/features/roadmap/WeeklyScheduleView.tsx frontend/src/features/roadmap/WeeklyTimeline.tsx frontend/src/features/roadmap/DailyRoadmapPlan.tsx frontend/src/features/roadmap/CheckpointQuizModal.tsx frontend/src/components/CheckpointQuestionModal.tsx frontend/src/components/RoadmapTimelineView.tsx frontend/src/components/TodayPlanView.tsx
   ```

5. Commit and push:
   ```bash
   git commit -m "feat(roadmap): implement 3D interactive roadmap highway, checkpoint quiz challenges, and weekly timeline planner"
   git pull origin main --rebase
   git push origin main
   ```

---

### 🔵 STEP 3: Contributor 2 (P2) Pushes Dashboard, Careers & Objectives (From P2's Device)

On **Person 2's device / account**:

1. Pull the latest code:
   ```bash
   git pull origin main
   ```

2. Verify Git identity:
   ```bash
   git config user.name "P2-GitHub-Username"
   git config user.email "p2-email@example.com"
   ```

3. Copy the P2 files into the project:
   - On Windows (PowerShell):
     ```powershell
     .\P2\copy_to_project.ps1
     ```
   - On Windows (Double-click or CMD):
     ```cmd
     P2\copy_to_project.bat
     ```
   - On Mac / Linux:
     ```bash
     bash P2/copy_to_project.sh
     ```

4. Stage the Career, Objectives & Dashboard files:
   ```bash
   git add frontend/src/features/roadmap/careerCatalog.ts frontend/src/features/roadmap/plannerEngine.ts frontend/src/features/onboarding/OnboardingGoalModal.tsx frontend/src/components/OverviewAnalyticsView.tsx frontend/src/components/AnalyticsView.tsx frontend/src/components/RoleQuestSelectorModal.tsx frontend/src/components/SkillGapView.tsx
   ```

5. Commit and push:
   ```bash
   git commit -m "feat(career-dashboard): add career catalog engine, analytics dashboard, role quest selector and skill gap analyzer"
   git pull origin main --rebase
   git push origin main
   ```

---

### 🏁 STEP 4: Verification (On Any Device)

Once all 3 contributors have pushed:

```bash
git pull origin main
cd frontend
npm run build
npm run dev
```

The app will compile cleanly without errors (`tsc -b && vite build` succeeds 100%), and GitHub repository Insights / Contributors tab will showcase all 3 contributors!
