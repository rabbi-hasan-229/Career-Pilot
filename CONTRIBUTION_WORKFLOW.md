# Contributing to Career Pilot

## Development environment

- Use Node.js 24.x. The version is recorded in `frontend/.node-version`.
- Install the locked dependencies with `cd frontend && npm ci`.
- The app can run with placeholder Supabase settings for local UI work. Use a dedicated local or non-production Supabase project for database and Edge Function work.
- Never commit `.env` files, provider credentials, service-role keys, VAPID private keys, or scheduler secrets.

## Branch and review workflow

1. Start from an up-to-date `main` branch and create a focused branch, for example `feat/custom-career-plan` or `fix/roadmap-date-boundary`.
2. Keep each change focused. Include related migrations, Edge Functions, frontend changes, and documentation together when they form one feature.
3. Before opening a pull request, run the frontend checks from `frontend/`:

   ```bash
   npm run lint
   npm run build
   ```

4. Open a pull request against `main`. Describe the user-facing behavior, the important implementation choices, migration/deployment requirements, and any checks that could not be run.
5. Review the final diff for unrelated changes, secrets, destructive SQL, and inaccurate product claims. Merge only after the required checks and review are complete.

GitHub Actions runs the same frontend lint and production build on relevant pushes and pull requests. It does not deploy the application or validate Supabase migrations and Edge Functions.

## Database and Edge Function changes

- Create schema changes as ordered Supabase migrations. Review ownership, grants, RLS policies, transaction boundaries, and rollback behavior before deployment.
- Apply migrations and deploy functions only to the intended Career Pilot project. Verify the project reference before any hosted operation; do not use unrelated connected projects.
- Keep service-role and third-party provider credentials on the server. Document required secret names and deployment steps without including secret values.
- Validate database and function behavior in an isolated environment before production deployment. State clearly when local services, credentials, or external provider configuration prevent that validation.

## Pull request checklist

- [ ] The change matches the project's documented roadmap and uses truthful user-facing language.
- [ ] Frontend lint and production build pass when frontend files change.
- [ ] Database migrations and Edge Functions are reviewed when applicable.
- [ ] Required secrets and hosted configuration are documented without exposing values.
- [ ] No generated build output, credentials, or unrelated edits are included.
