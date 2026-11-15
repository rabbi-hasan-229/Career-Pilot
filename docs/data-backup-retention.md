# Career Pilot data backup and retention

## Current status

Backup configuration is a release task, not something this repository can confirm. This checkout has no Career Pilot project credentials, so no claim is made that the hosted database has backups, point-in-time recovery, or a tested restore path.

## Data lifecycle implemented in the app

- Account-owned profile, roadmap, milestone, task, quiz-attempt, achievement, skill, CV, interview, coach, notification, AI-usage, push-subscription, and policy-acceptance records are stored in Supabase. Most user-owned rows reference the profile with `ON DELETE CASCADE`; policy acceptance rows cascade with the Auth user.
- The account export action downloads a JSON file containing the profile and the user's saved product records, including accepted policy versions and timestamps. It includes sanitized checkpoint questions for the user's tasks. It does not include push-subscription rows or Supabase Auth credentials/factors.
- The export file is created in the browser and is not encrypted by Career Pilot. Store it in a private location and remove it when no longer needed.
- Account deletion verifies the signed-in user and removes that Auth identity; profile-linked rows are removed by database cascades. A project backup can retain an earlier copy until that backup expires under the configured Supabase plan.
- There is no application-level expiry job for CVs, coach conversations, interview history, notifications, or AI usage. They remain until the account is deleted. AI quota checks use only the most recent seven days, so older AI usage does not affect current quota.
- Remote job search results are fetched transiently and are not copied into Career Pilot tables. The app currently does not store user files in Supabase Storage.

## Production backup policy to configure

1. Before accepting production accounts, choose the intended Supabase plan and the business recovery targets. The recommended initial target is a database recovery point no older than 24 hours; enable Point-in-Time Recovery (PITR) if the product needs a smaller recovery window.
2. Confirm that automatic backups or PITR are enabled for the intended Career Pilot project, and record the actual retention window. Current Supabase documentation says Free projects do not receive automatic database backups; Pro, Team, and Enterprise plans receive daily backups with plan-specific retention. PITR is an add-on with a separately selected recovery period. Recheck the plan details at deployment because they can change.
3. Treat a manual `supabase db dump` as an app-database export, not a complete Supabase project backup: the CLI excludes Supabase-managed schemas such as `auth` and `storage`, and a default dump contains schema but no data. Follow Supabase's current [backup and restore guide](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) if creating a separate logical export. Store dumps encrypted, outside this repository, with access limited to operators who need restore access.
4. Keep application code/migrations in Git, and keep Auth configuration, Edge Function secrets, VAPID keys, SMTP credentials, and scheduler secrets in a separate approved secret manager. A database restore does not restore these deployment settings.
5. Test a restore into a separate non-production project before production launch, then repeat at least quarterly and after major schema changes. Do not restore over production during a drill. Validate migrations, login/MFA, RLS ownership, roadmap/task records, account export/deletion, Edge Functions, and scheduled jobs after restore.
6. Record the project reference, backup type, recovery window, last successful restore drill, operator, and any exceptions in the deployment runbook. Restrict backup access because database backups contain user CV data, career history, and conversations.

Supabase states that daily database backups do not include objects in the Storage API, and that restoring an earlier backup can make the project unavailable during the restore. See its [database backup guide](https://supabase.com/docs/guides/platform/backups) and [production checklist](https://supabase.com/docs/guides/deployment/going-into-prod) for current platform behavior.

## User deletion and backup expiry

Account deletion removes live application rows through the account/profile cascade, but it does not rewrite already-created database backups. Keep the backup retention period as short as the approved recovery target allows, restrict backup access, and disclose the backup-expiry window in the deployed privacy notice after the plan is selected. Do not promise immediate removal from provider-managed backups.
