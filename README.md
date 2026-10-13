# 🧭 Career Pilot (JobSeeker)

> **Low-AI-Cost Career Roadmapping, Skill-Gap Analyzer & Interview Arena built on Supabase, React & Material 3.**

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20RLS-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android%20APK%20Ready-119eff?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![Material 3](https://img.shields.io/badge/Design-Material%203%20%2B%20Dark%20Mode-7c3aed)](https://m3.material.io/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 💡 The Core Philosophy: "Rules First, AI Last"

Most modern AI apps suffer from runaway token costs by invoking Large Language Models for simple calculations, schedule adjustments, or repetitive evaluations. **Career Pilot** replaces heavy AI with **deterministic math, Postgres SQL queries, and local browser engines**, driving operating costs down by over 95%.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CAREER PILOT ARCHITECTURE                       │
│                                                                        │
│   [ Client Browser / Android APK ]                                     │
│      │                                                                 │
│      ├─► Proportional Mathematical Planner ($0 AI)                     │
│      ├─► Keyword & STAR Rubric Interview Scoring ($0 AI)               │
│      ├─► Local CV Form Wizard & HTML-to-PDF ($0 AI)                    │
│      │                                                                 │
│   [ Supabase PostgreSQL + Row Level Security ]                         │
│      ├─► Vacancy Skill Matching via SQL Overlap ($0 AI)                │
│      ├─► 16 Core Tables (Shared Curated Content & Private User Data)   │
│      ├─► Automated Nightly Re-plan via pg_cron ($0 AI)                 │
│      │                                                                 │
│   [ Supabase Edge Functions: ai-gateway ] ───► [ LLM Provider ]        │
│      ├─► SHA-256 Hashed Response Cache (ai_cache)                      │
│      └─► Strict Weekly Token Quotas (ai_usage)                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Key Features

### 1. 📐 Mathematical Proportional Planner ($0 Cost)
- Calculates time allocation using deterministic proportional effort formulas:
  $$\text{weeks}_i = W \times \frac{E_i}{\sum E}$$
- Instant, zero-latency schedule adjustments:
  - **"I'm Behind"**: Automatically shifts current milestones by $+3$ days and redistributes overdue tasks into upcoming weekday slots.
  - **"Finished Early"**: Pulls subsequent stages forward.
  - **"Pause a Week"**: Shifts all deadlines by $+7$ days without resetting active streaks.
- Scheduled via `pg_cron` for nightly maintenance at 02:00 UTC.

### 2. 🎨 Material 3 Responsive Design & Obsidian Dark Mode
- Built mobile-first for smartphones with an adaptive multi-column widescreen command center on desktop ( $\ge 1024\text{px}$ ).
- **Obsidian Dark Mode**: High-contrast, OLED-friendly dark palette (`#0b0f19` background, `#111827` surface cards, violet neon glows).
- **Curved Bottom Navigation Dock**: Native-feeling mobile navigation with a prominent center `+` action sheet for rapid replanning and career accelerators.

### 3. 🧠 Checkpoint Assessment Quizzes
- Gated task completion ensuring verified comprehension.
- Features countdown timers, multiple-choice pill selections, instant answer validation, and explanatory feedback before marking sessions complete.

### 4. 🎙️ Zero-AI Mock Interview Arena
- **$0 Free Evaluation Engine**: Instant scoring against expected technical keywords and the **STAR rubric** (*Situation, Task, Action, Result*).
- **Optional Deep AI Feedback**: Metered, opt-in button providing hiring-manager review without unexpected token spend.

### 5. 📄 Professional CV & Resume Builder
- Form wizard organizing contact info, work experience, education, and technical competencies.
- Live Material 3 preview with dual-pane split editor and one-click PDF print export (`window.print()`).
- Optional **"Improve Wording"** button for executive summaries and quantifiable bullet points.

### 6. 🎯 SQL-Powered Skill-Gap Matrix & Vacancy Matcher
- Computes role readiness percentages and vacancy matches directly in Postgres SQL:
  ```sql
  select v.id, v.title,
    round(100.0 * count(*) filter (where us.skill_id is not null) / count(*)) as match_pct
  from vacancies v
  join vacancy_skills vs on vs.vacancy_id = v.id
  left join user_skills us on us.skill_id = vs.skill_id and us.user_id = auth.uid()
  group by v.id, v.title
  order by match_pct desc limit 20;
  ```
- Highlights acquired competencies vs. high-impact missing skills with a single-click **"Queue into Plan"** action.

### 7. 🛡️ Supabase Low-Cost AI Gateway (`ai-gateway`)
- Single secure entrypoint for all LLM calls.
- Enforces rolling 7-day quotas (*Free: 15 coach / 5 cv / 5 interview / 1 role; Premium: 100 coach / 40 cv / 40 interview / 5 role*).
- Computes SHA-256 hashes of feature inputs to serve duplicate requests from `ai_cache` at **$0 cost**.

### 8. 📱 Android APK Native Packaging
- Pre-configured Capacitor integration (`com.careerpilot.app`).
- Native Android studio wrapper project located in `frontend/android/`, buildable into an installable `.apk`.

---

## 📊 Where AI is Used vs. Where It Is Not

| Feature | Execution Method | Model Call? | Cost per Use |
| :--- | :--- | :---: | :---: |
| **Roadmap for Common Jobs** | Curated database templates adjusted by math | **No** | **$0.00** |
| **Roadmap for Custom Roles** | Gateway builds template, caches for all users | Yes | Metered (1/wk) |
| **Daily & Weekly Tasks** | Proportional math engine | **No** | **$0.00** |
| **Skill-Gap Analysis** | Direct PostgreSQL query | **No** | **$0.00** |
| **Planner Quick Actions** | Deterministic calendar algorithm | **No** | **$0.00** |
| **Coach Free-Text Chat** | Context-bounded AI response | Yes | Metered (15/wk) |
| **Mock Interview Question Bank** | Curated database rows | **No** | **$0.00** |
| **Mock Interview Evaluation** | Keyword matching & STAR rubric scoring | **No** | **$0.00** |
| **AI Interview Coaching** | Senior reviewer critique | Optional | Metered (5/wk) |
| **CV Builder & Export** | Local form wizard & print engine | **No** | **$0.00** |
| **CV "Improve Wording"** | Targeted section refinement | Optional | Metered (5/wk) |
| **Job Vacancy Matching** | SQL skill overlap calculation | **No** | **$0.00** |

---

## 📁 Repository Structure

```
Career Pilot/
├── frontend/
│   ├── android/                  # Native Android Studio Capacitor project
│   ├── capacitor.config.json     # Capacitor configuration
│   ├── index.html
│   ├── package.json
│   ├── src/
│   │   ├── components/
│   │   │   ├── AICoachView.tsx              # Coach chat with quota indicator
│   │   │   ├── AuthModal.tsx                # Supabase Auth & 1-click demo switcher
│   │   │   ├── BottomNav.tsx                # Material 3 curved mobile dock with FAB
│   │   │   ├── CheckpointQuestionModal.tsx  # Assessment modal with timer & choices
│   │   │   ├── CVBuilderView.tsx            # Form wizard, live preview & PDF export
│   │   │   ├── DesktopSidebar.tsx           # Widescreen navigation sidebar
│   │   │   ├── InterviewSimulatorView.tsx   # STAR rubric & keyword scoring
│   │   │   ├── Navbar.tsx                   # Header with dark mode toggle & quota
│   │   │   ├── OverviewAnalyticsView.tsx    # SVG metrics & subject donut charts
│   │   │   ├── ProfileSettingsModal.tsx     # Study commitment, theme & quotas
│   │   │   ├── QuickActionSheetModal.tsx    # Mobile slide-up speed dial
│   │   │   ├── RoadmapTimelineView.tsx      # Interactive roadmap & replan buttons
│   │   │   ├── RoleQuestSelectorModal.tsx   # Career role & deadline picker
│   │   │   ├── SkillGapView.tsx             # Skill matrix & SQL vacancy matcher
│   │   │   └── TodayPlanView.tsx            # Daily focus hero card & task dials
│   │   ├── lib/
│   │   │   ├── aiGateway.ts                 # Client gateway connector
│   │   │   ├── mockData.ts                  # Seed data & fallback records
│   │   │   ├── plannerEngine.ts             # Mathematical scheduling algorithms
│   │   │   ├── supabase.ts                  # Supabase client instantiation
│   │   │   └── theme.ts                     # Dark/light theme persistence
│   │   ├── types/
│   │   │   └── index.ts                     # TypeScript interfaces & models
│   │   ├── App.tsx                          # Root application shell
│   │   └── index.css                        # Material 3 design tokens & dark mode
│   └── tsconfig.json
└── supabase/
    ├── functions/
    │   ├── ai-gateway/index.ts       # Metered gateway with SHA-256 caching
    │   ├── nightly-replan/index.ts   # Automated overdue task rebalancer
    │   └── plan-roadmap/index.ts     # Serverless proportional planner
    ├── migrations/
    │   ├── 20261013000000_phase1_schema.sql         # 16 core tables & RLS
    │   ├── 20261013000001_public_shared_content.sql # Seed roles, skills & questions
    │   └── 20261013000002_phase4_career_tools.sql   # Vacancies, attempts & metrics
    └── seed.sql
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- [npm](https://www.npmjs.com/)
- (Optional for Android APK) [Android Studio](https://developer.android.com/studio) or JDK 17+

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/career-pilot.git
cd career-pilot/frontend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file inside `frontend/`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 📱 Building the Android APK

1. **Synchronize Web Assets to Android**:
   ```bash
   cd frontend
   npm run build
   npx cap sync android
   ```

2. **Generate the Debug APK**:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   The compiled APK will be located at:
   `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

3. **Or open in Android Studio**:
   ```bash
   npx cap open android
   ```

---

## 🗄️ Supabase Database Setup

1. **Link Project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

2. **Push Migrations**:
   ```bash
   supabase db push
   ```

3. **Deploy Edge Functions**:
   ```bash
   supabase functions deploy ai-gateway
   supabase functions deploy nightly-replan
   supabase functions deploy plan-roadmap
   ```

4. **Set Edge Function Secrets**:
   ```bash
   supabase secrets set MODEL_API_KEY=your_llm_api_key
   ```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
