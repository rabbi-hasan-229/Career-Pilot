# Career Pilot

> **Low-AI-Cost Career Roadmapping, Skill-Gap Analyzer & Interview Arena built on Supabase, React & Material 3.**

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20RLS-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android%20APK%20Ready-119eff?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![Material 3](https://img.shields.io/badge/Design-Material%203%20%2B%20Dark%20Mode-7c3aed)](https://m3.material.io/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 💡 The Core Philosophy: "Rules First, AI Last"

Routine planning, scoring, and schedule adjustments use deterministic code and database transactions. Optional AI actions are explicit, quota-metered requests, which keeps model use bounded and makes those actions available when configured.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CAREER PILOT ARCHITECTURE                       │
│                                                                        │
│   [ Client Browser / Android APK ]                                     │
│      │                                                                 │
│      ├─► Proportional Mathematical Planner ($0 AI)                     │
│      ├─► Authenticated Interview Scoring ($0 AI)                        │
│      ├─► Local CV Form Wizard & HTML-to-PDF ($0 AI)                    │
│      │                                                                 │
│   [ Supabase PostgreSQL + Row Level Security ]                         │
│      ├─► Curated Skill Profiles + Live Remote Job Search               │
│      ├─► Account-owned data with PostgreSQL RLS                        │
│      ├─► Transactional roadmap and task progression                    │
│      │                                                                 │
│   [ Supabase Edge Functions ] ───► [ LLM Provider ]                     │
│      ├─► Optional Responses API calls (provider secrets stay server-side)│
│      ├─► Atomic rolling 7-day per-feature quotas (ai_usage)             │
│      └─► Global UTC daily token budget and operator usage summary        │
│      └─► Interview scoring keeps answer keys server-side until submit   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Key Features

### Workspace navigation
- Workspace sections can be opened directly with `?view=plan`, `?view=overview`, `?view=coach`, `?view=interview`, `?view=cv`, `?view=skills`, or `?view=profile`. The home roadmap is the default (`?view=home` is also accepted).
- Switching sections updates browser history, so Back and Forward restore the previous workspace section.

### 1. 📐 Mathematical Proportional Planner ($0 Cost)
- Calculates time allocation using deterministic proportional effort formulas:
  $$\text{weeks}_i = W \times \frac{E_i}{\sum E}$$
- Instant, zero-latency schedule adjustments:
  - **"I'm Behind"**: Automatically shifts current milestones by $+3$ days and redistributes overdue tasks into upcoming weekday slots.
  - **"Finished Early"**: Pulls subsequent stages forward.
  - **"Pause a Week"**: Shifts all deadlines by $+7$ days without resetting active streaks.
- Optional overdue-task maintenance is available as a protected Edge Function. Migrations do not schedule it; configure a scheduler only after setting its dedicated secret and reviewing the operational behavior.

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

### 6. 🎯 Role Skill Profiles & Vacancy Search
- Loads curated role-specific skill requirements and the account's acquired skills; custom roles use an explicitly selected category baseline built from recurring skills across curated roles.
- Shows bundled listings as samples and searches live vacancies through the authenticated `search-remote-jobs` Edge Function. Remote listings use Remote OK; user-submitted regional searches use Jooble. Listings are transient and link to the provider source. Regional searches require a country-specific Jooble API key; hybrid search is limited to results whose available title or summary explicitly says “hybrid”.
- Calculates skill overlap from listing text and the active role profile. This is a practice signal, not a hiring prediction; no score is shown when no profile skills are detected in a listing.
- Lets learners mark skills acquired and queue a missing skill into their plan.

### 7. 🛡️ Supabase Low-Cost AI Gateway (`ai-gateway`)
- Single authenticated entrypoint for optional AI requests using the OpenAI Responses API.
- Enforces rolling seven-day per-feature quotas (*Free: 15 coach / 5 CV / 5 interview / 1 custom role; Premium: 100 coach / 40 CV / 40 interview / 5 custom role*) with atomic quota reservations.
- Provider failures release the quota reservation; abandoned reservations expire after five minutes. Personal coach, resume, and interview content is not cached.
- Resume edits and interview feedback send only the selected text after an explicit user action. AI availability requires the Edge Function secrets below; without them the app returns a clear unavailable message and keeps deterministic features usable.

### 8. 📱 Android APK Native Packaging
- Pre-configured Capacitor integration (`com.careerpilot.app`).
- Native Android studio wrapper project located in `frontend/android/`, buildable into an installable `.apk`.

---

## 📊 Where AI is Used vs. Where It Is Not

| Feature | Execution Method | Model Call? | Cost per Use |
| :--- | :--- | :---: | :---: |
| **Roadmap for Common Jobs** | Curated database templates adjusted by math | **No** | **$0.00** |
| **Roadmap for Custom Roles** | Curated category playbook and deterministic planning | **No** | **$0.00** |
| **Daily & Weekly Tasks** | Proportional math engine | **No** | **$0.00** |
| **Skill-Gap Analysis** | Direct PostgreSQL query | **No** | **$0.00** |
| **Planner Quick Actions** | Deterministic calendar algorithm | **No** | **$0.00** |
| **Coach Free-Text Chat** | Context-bounded AI response; user and assistant messages saved | Optional | Metered (15/wk) |
| **Mock Interview Question Bank** | Curated database rows | **No** | **$0.00** |
| **Mock Interview Evaluation** | Keyword matching & STAR rubric scoring | **No** | **$0.00** |
| **AI Interview Coaching** | Optional feedback against the saved deterministic score and rubric | Optional | Metered (5/wk) |
| **CV Builder & Export** | Local form wizard & print engine | **No** | **$0.00** |
| **CV "Improve Wording"** | Explicitly requested, selected-section rewrite that preserves facts | Optional | Metered (5/wk) |
| **Job Vacancy Matching** | SQL skill overlap calculation | **No** | **$0.00** |

---

## 📁 Repository Structure

```
Career Pilot/
├── frontend/
│   ├── android/                 # Capacitor Android project
│   ├── package.json
│   └── src/
│       ├── components/          # Workspace screens and shared UI
│       ├── features/            # Account, auth, AI, coach, CV, notifications, roadmap
│       ├── hooks/               # Shared accessibility and interaction hooks
│       ├── lib/                 # Supabase client, dates, theme, and local utilities
│       ├── types/               # Shared application types
│       ├── App.tsx              # Authenticated workspace shell and navigation
│       └── index.css            # Design tokens and global styles
└── supabase/
    ├── functions/               # Authenticated AI, planning, account, and job endpoints
    ├── migrations/              # Ordered schema, policy, and content migrations
    ├── config.toml              # Local Supabase service configuration
    └── seed.sql                 # Curated shared career and learning content
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20.19+ or v22.12+; required by the installed Vite 8 toolchain)
- [npm](https://www.npmjs.com/)
- (Optional for Android APK) [Android Studio](https://developer.android.com/studio) or JDK 17+

### 1. Clone & Install Dependencies
Use Node.js 24.x for local development and CI. The repository records this in `frontend/.node-version`.

```bash
git clone https://github.com/rabbi-hasan-229/Career-Pilot.git
cd career-pilot/frontend
npm ci
```

### 2. Configure Environment Variables
Create a `.env` file inside `frontend/`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_WEB_PUSH_PUBLIC_KEY=your-vapid-public-key
```

Replace both example values with the intended project URL and publishable/anon key. Example placeholders are detected and disable real account actions with an in-app setup message rather than sending requests to a fake project.

The signup screen uses Supabase Auth email OTP. Configure the Auth confirmation email template to include the one-time token (`{{ .Token }}`), configure the recovery template to use the confirmation link (`{{ .ConfirmationURL }}`), and configure a production SMTP provider before enabling real signups. Google, GitHub, and Microsoft sign-in also require their providers and redirect URLs to be configured in Supabase Auth. Add the deployed app origin with the `?recovery=1` redirect URL to Auth's redirect allow list for password resets.

Signup requires an explicit, unchecked-by-default acknowledgment and links to `/legal/terms.html` and `/legal/privacy.html`. Acceptance is recorded in an append-only, account-owned table with the accepted document versions and a database-generated timestamp. New and existing authenticated accounts must accept the current versions before workspace data loads. Apply migration `20261112020000_record_legal_acceptance.sql` before deploying this frontend. Whenever a policy changes, update its version in `frontend/src/features/legal/policyVersions.ts` and add a migration that updates the matching database constraint. These pages currently contain product-specific drafts that describe the implemented data flows; they intentionally identify the operator, support contact, jurisdiction, retention policy, and legal review as unresolved. Complete and approve those details before public registration.

Optional background reminders use browser Web Push. Generate one VAPID key pair with `npx web-push generate-vapid-keys` and keep it stable: put the public key in `VITE_WEB_PUSH_PUBLIC_KEY` and in the Edge Function's `WEB_PUSH_PUBLIC_KEY`; keep the private key only in Supabase Edge Function secrets. Also configure `WEB_PUSH_SUBJECT` as a valid `mailto:` or HTTPS contact URI and a random `PUSH_SCHEDULER_SECRET` of at least 32 characters. The migration creates private, account-owned browser subscriptions. Users opt in from Notifications; reminders are checked hourly and sent around 9–10 AM in each browser's saved timezone when unfinished tasks remain on an active roadmap. Browser push requires HTTPS (localhost is allowed for development), notification permission, and a browser that supports Push API. Demo accounts remain local-only.

Authenticator-based two-factor verification is available in Profile → Security. Users can enroll multiple named TOTP authenticators and choose one at sign-in; a separately stored backup authenticator provides recovery if the primary device is unavailable. Before deployment, enable TOTP enrollment and verification in the hosted Supabase project's Auth → Multi-Factor Authentication settings. The local Supabase configuration enables TOTP for development. Enrolled accounts must satisfy AAL2 in protected table policies, account-writing database functions, the AI gateway, and account deletion. The app also requires a verified authenticator challenge before loading a signed-in user's workspace.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```

GitHub Actions runs the frontend lint and production build for pushes and pull requests that change frontend files. The workflow uses the committed lockfile and requires no application secrets.

See [CONTRIBUTION_WORKFLOW.md](CONTRIBUTION_WORKFLOW.md) for branch, review, and database-change guidance.

Edge Functions return a request ID and emit privacy-safe structured logs for operator correlation. See [docs/edge-function-observability.md](docs/edge-function-observability.md) for the log fields, sensitive-data exclusions, and hosted monitoring work still required.

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
   supabase functions deploy apply-action
   supabase functions deploy delete-account
   supabase functions deploy nightly-replan
   supabase functions deploy plan-roadmap
   supabase functions deploy search-remote-jobs
   supabase functions deploy score-interview-answer
   supabase functions deploy send-push-reminders
   supabase functions deploy send-email-otp
   ```

   `send-email-otp` is a retired endpoint that now returns HTTP 410; keeping it deployed prevents old clients from writing raw OTP codes. New clients use Supabase Auth directly.

   Regional vacancy search is optional. Register for a Jooble REST API key on the intended country domain and configure the matching hostname (`jooble.org` for the US API, or a country domain such as `uk.jooble.org`) with the key as Supabase Edge Function secrets. Jooble documents a 500-request lifetime limit per key, so regional searches are user-submitted and should not be automatically polled. Example: `supabase secrets set JOOBLE_API_HOST=uk.jooble.org JOOBLE_API_KEY=your_country_specific_key`. If these secrets are omitted, remote search continues and regional search reports that it is unavailable. Search terms and locations are sent to Jooble; results are not persisted by Career Pilot. Review the current [Jooble REST API documentation](https://help.jooble.org/en/support/solutions/articles/60001448238-rest-api-documentation) and [API portal](https://jooble.org/api/about) before deployment.

   `nightly-replan` is not scheduled by the migration chain. If you enable it, set a dedicated high-entropy `NIGHTLY_REPLAN_SECRET` (at least 32 characters), configure the function with a scheduled POST that sends it as `Authorization: Bearer <secret>`, and keep the secret out of source control and browser configuration. Do not call it with a user session; it uses the service role to process overdue task records.

   `send-push-reminders` also requires a scheduled POST with `Authorization: Bearer <PUSH_SCHEDULER_SECRET>`. Configure the Edge Function secrets before enabling its schedule:
   ```bash
   supabase secrets set PUSH_SCHEDULER_SECRET=replace-with-a-random-64-character-value WEB_PUSH_PUBLIC_KEY=your-vapid-public-key WEB_PUSH_PRIVATE_KEY=your-vapid-private-key WEB_PUSH_SUBJECT=mailto:ops@example.com
   ```
   Then store the project function URL and the same scheduler secret in Supabase Vault, and schedule the hourly call with `pg_cron`/`pg_net` (the hosted dashboard or SQL editor can enable these extensions). Example after replacing the values with real secrets:
   ```sql
   select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'career_pilot_project_url');
   select vault.create_secret('YOUR_PUSH_SCHEDULER_SECRET', 'career_pilot_push_scheduler_secret');

   select cron.schedule('career-pilot-push-reminders', '0 * * * *', $$
     select net.http_post(
       url := (select decrypted_secret from vault.decrypted_secrets where name = 'career_pilot_project_url') || '/functions/v1/send-push-reminders',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'career_pilot_push_scheduler_secret')
       ),
       body := '{}'::jsonb
     );
   $$);
   ```
   Do not commit real VAPID or scheduler keys. The worker records delivery in notification history and removes subscriptions that the push service reports as expired.

   The account deletion endpoint verifies the caller's Supabase session and deletes only that caller's Auth user. Profile-owned rows cascade in PostgreSQL. The current app does not upload user files to Supabase Storage.

   See [data backup and retention guidance](docs/data-backup-retention.md) for what account export/deletion cover and the required production backup/restore drill. See [AI usage limits and operations](docs/ai-cost-controls.md) for the system-wide token budget, kill switch, and daily usage summary.

4. **Set Edge Function Secrets**:
   ```bash
   supabase secrets set OPENAI_API_KEY=your_api_key OPENAI_MODEL=your_enabled_model
   ```

   For the optional nightly function, generate a random secret with at least 32 characters and configure it separately, for example: `supabase secrets set NIGHTLY_REPLAN_SECRET=replace-with-a-random-64-character-value`.

   Optional: set `OPENAI_API_BASE_URL` when using a compatible Responses API endpoint. Configure the function with a model enabled for the provider account. Never put the provider key in frontend environment variables.

   The AI gateway sends bounded requests to the configured model through the Responses API. Requests set `store: false`; resume and interview inputs are never cached in `ai_cache`. AI use is recorded only after successful provider responses, and failed provider requests release their quota reservation. Configure the global daily token allowance and provider-side currency limits before enabling AI. See the [AI operations guide](docs/ai-cost-controls.md) and the [Responses API create reference](https://developers.openai.com/api/reference/resources/responses/methods/create) for provider request behavior.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
