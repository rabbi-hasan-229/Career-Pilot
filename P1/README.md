# 🚀 Contributor 1 (P1) — Roadmap & Weekly Schedule Module

Welcome! As **Contributor 1 (P1)**, your role in **Career Pilot** is delivering the **Interactive 3D Roadmap Highway**, **Weekly Schedule & Timeline Planner**, and **Checkpoint Quiz Challenges**.

---

## 📂 Assigned Files & Components

Here are the files you are pushing from your device:

| File Path | Description |
| :--- | :--- |
| `frontend/src/features/roadmap/Road3DGameView.tsx` | 3D Gamified Three.js isometric highway journey with milestone tollbooths |
| `frontend/src/features/roadmap/RoadHighwayView.tsx` | Interactive high-performance winding roadmap canvas view |
| `frontend/src/features/roadmap/RoadmapView.tsx` | Main container and state dispatcher for the roadmap experience |
| `frontend/src/features/roadmap/WeeklyScheduleView.tsx` | Weekly sprint planner, stage milestones, effort tracking, and replanning triggers |
| `frontend/src/features/roadmap/WeeklyTimeline.tsx` | Visual multi-week progress timeline & stage status cards |
| `frontend/src/features/roadmap/DailyRoadmapPlan.tsx` | Daily curriculum breakdown and session checklist widget |
| `frontend/src/features/roadmap/CheckpointQuizModal.tsx` | Interactive quiz modal evaluating stage mastery before unlocking new steps |
| `frontend/src/components/CheckpointQuestionModal.tsx` | Interactive quiz question card component |
| `frontend/src/components/RoadmapTimelineView.tsx` | Adaptive timeline visualization for milestones |
| `frontend/src/components/TodayPlanView.tsx` | Today's prioritized learning sessions widget |

---

## ⚡ Quick 1-Click Instructions (Windows / Mac / Linux)

### Option A: Automatic Copy & Push (Recommended)

1. Open your terminal in the root repository directory (`Career-Pilot`).
2. Make sure your Git name & email are set to your GitHub account:
   ```bash
   git config user.name "Your Name"
   git config user.email "your-github-email@example.com"
   ```
3. Run the copy script to move all P1 files into the project:
   - **Windows (PowerShell)**:
     ```powershell
     .\P1\copy_to_project.ps1
     ```
   - **Windows (Command Prompt / Double Click)**:
     ```cmd
     P1\copy_to_project.bat
     ```
   - **Mac / Linux**:
     ```bash
     bash P1/copy_to_project.sh
     ```
4. Commit your files:
   ```bash
   git add frontend/src/features/roadmap/Road3DGameView.tsx frontend/src/features/roadmap/RoadHighwayView.tsx frontend/src/features/roadmap/RoadmapView.tsx frontend/src/features/roadmap/WeeklyScheduleView.tsx frontend/src/features/roadmap/WeeklyTimeline.tsx frontend/src/features/roadmap/DailyRoadmapPlan.tsx frontend/src/features/roadmap/CheckpointQuizModal.tsx frontend/src/components/CheckpointQuestionModal.tsx frontend/src/components/RoadmapTimelineView.tsx frontend/src/components/TodayPlanView.tsx
   ```
5. Create your commit:
   ```bash
   git commit -m "feat(roadmap): implement 3D interactive roadmap highway, checkpoint quiz challenges, and weekly timeline planner"
   ```
6. Pull & Push to GitHub:
   ```bash
   git pull origin main --rebase
   git push origin main
   ```

---

### Option B: Manual Copy (If you prefer doing it by hand)

1. Copy all contents inside `P1/frontend/src/features/roadmap/` into `frontend/src/features/roadmap/`.
2. Copy all contents inside `P1/frontend/src/components/` into `frontend/src/components/`.
3. Run:
   ```bash
   git add frontend/src/features/roadmap/ frontend/src/components/CheckpointQuestionModal.tsx frontend/src/components/RoadmapTimelineView.tsx frontend/src/components/TodayPlanView.tsx
   git commit -m "feat(roadmap): implement 3D interactive roadmap highway, checkpoint quiz challenges, and weekly timeline planner"
   git pull origin main --rebase
   git push origin main
   ```

🎉 **Done! Your contributions will now show up on GitHub under your account with full commit authorship!**
