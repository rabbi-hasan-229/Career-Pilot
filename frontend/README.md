# Career Pilot frontend

The Career Pilot web client is a React, TypeScript, and Vite application.

## Requirements

- Node.js 24.x, recorded in `.node-version`.
- npm with the committed `package-lock.json`.

## Local development

```bash
npm ci
npm run dev
```

Copy `.env.example` to `.env`, then set the Supabase URL and publishable/anon key to use authenticated product features. UI work can run without live credentials; the app will show that account services are not configured.

## Quality checks

```bash
npm run lint
npm run build
```

GitHub Actions runs these checks for frontend changes. For project architecture, database setup, Edge Function deployment, and production configuration, see the [root README](../README.md) and [contribution workflow](../CONTRIBUTION_WORKFLOW.md).
