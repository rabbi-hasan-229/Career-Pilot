# 📊 Contributor 2 (P2) — Dashboard, Careers & Objectives Module

Welcome! As **Contributor 2 (P2)**, your role in **Career Pilot** is delivering the **Comprehensive 200+ Careers Catalog**, **Dynamic Planner Engine & Objectives**, **Analytics & Progress Dashboard**, and **Skill Gap Matcher**.

---

## 📂 Assigned Files & Components

Here are the files you are pushing from your device:

| File Path | Description |
| :--- | :--- |
| `frontend/src/features/roadmap/careerCatalog.ts` | 200+ industry career blueprints, categories, stages, and effort estimates |
| `frontend/src/features/roadmap/plannerEngine.ts` | Dynamic milestone calculation, task duration generation, and replanning engine |
| `frontend/src/features/onboarding/OnboardingGoalModal.tsx` | Career goal setup modal with role search, daily commitment & timeline selector |
| `frontend/src/components/OverviewAnalyticsView.tsx` | Full-featured Analytics & Progress Dashboard with streak & velocity charts |
| `frontend/src/components/AnalyticsView.tsx` | Detailed metrics, task completion rate, and velocity breakdown |
| `frontend/src/components/RoleQuestSelectorModal.tsx` | Interactive modal allowing users to search and switch target career quests |
| `frontend/src/components/SkillGapView.tsx` | Market vacancy skill gap analysis and automated roadmap skill injection |

---

## ⚡ Quick 1-Click Instructions (Windows / Mac / Linux)

### Option A: Automatic Copy & Push (Recommended)

1. Open your terminal in the root repository directory (`Career-Pilot`).
2. Make sure your Git name & email are set to your GitHub account:
   ```bash
   git config user.name "Your Name"
   git config user.email "your-github-email@example.com"
   ```
3. Run the copy script to move all P2 files into the project:
   - **Windows (PowerShell)**:
     ```powershell
     .\P2\copy_to_project.ps1
     ```
   - **Windows (Command Prompt / Double Click)**:
     ```cmd
     P2\copy_to_project.bat
     ```
   - **Mac / Linux**:
     ```bash
     bash P2/copy_to_project.sh
     ```
4. Commit your files:
   ```bash
   git add frontend/src/features/roadmap/careerCatalog.ts frontend/src/features/roadmap/plannerEngine.ts frontend/src/features/onboarding/OnboardingGoalModal.tsx frontend/src/components/OverviewAnalyticsView.tsx frontend/src/components/AnalyticsView.tsx frontend/src/components/RoleQuestSelectorModal.tsx frontend/src/components/SkillGapView.tsx
   ```
5. Create your commit:
   ```bash
   git commit -m "feat(career-dashboard): add career catalog engine, analytics dashboard, role quest selector and skill gap analyzer"
   ```
6. Pull & Push to GitHub:
   ```bash
   git pull origin main --rebase
   git push origin main
   ```

---

### Option B: Manual Copy (If you prefer doing it by hand)

1. Copy `careerCatalog.ts` and `plannerEngine.ts` from `P2/frontend/src/features/roadmap/` into `frontend/src/features/roadmap/`.
2. Copy `OnboardingGoalModal.tsx` from `P2/frontend/src/features/onboarding/` into `frontend/src/features/onboarding/`.
3. Copy all files from `P2/frontend/src/components/` into `frontend/src/components/`.
4. Run:
   ```bash
   git add frontend/src/features/roadmap/careerCatalog.ts frontend/src/features/roadmap/plannerEngine.ts frontend/src/features/onboarding/OnboardingGoalModal.tsx frontend/src/components/OverviewAnalyticsView.tsx frontend/src/components/AnalyticsView.tsx frontend/src/components/RoleQuestSelectorModal.tsx frontend/src/components/SkillGapView.tsx
   git commit -m "feat(career-dashboard): add career catalog engine, analytics dashboard, role quest selector and skill gap analyzer"
   git pull origin main --rebase
   git push origin main
   ```

🎉 **Done! Your contributions will now show up on GitHub under your account with full commit authorship!**
