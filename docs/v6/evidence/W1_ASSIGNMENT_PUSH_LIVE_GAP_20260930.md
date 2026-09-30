# W1 assignment push live-backend evidence — 2026-09-30

This evidence records the read-only production-backend state for the V6 assignment assigned/due push acceptance lane. It does not authorize or perform a production deployment.

Observed against the connected active BibleQuest Supabase project:

- the existing `bq-push-delivery` Edge Function is deployed;
- the `bq-assignment-reminders` Edge Function is **not** deployed;
- `public.bible_assignments.reminder_at` exists;
- `public.bible_enqueue_assignment_due_notifications_v6()` does **not** exist;
- `bible_notifications_assignment_due_once_idx` does **not** exist;
- `bible_assignments_active_due_reminder_idx` does **not** exist;
- the production migration history does not include the repository's V6 due-reminder migration;
- `pg_net` and Supabase Vault are installed, while `pg_cron` is available but not installed.

Implication: the repository contains the due-reminder implementation, pgTAP coverage, and Cron/Vault runbook, but production cannot currently enqueue or schedule due reminders. Keep `Assignment assigned/due push is supported.` open until the migration and Edge Function are deployed through a reviewed release path, the scheduler is configured, and a synthetic due assignment proves end-to-end delivery. Physical-device push remains a separate acceptance row.

## Migration-history sequencing blocker

A name-based comparison between the current V6 repository migration directory and the live migration history found **20 repository migrations not applied in production by migration name**. They include push delivery hardening/preferences/retry/category work, tenant/privacy hardening, assignment due reminders, congregation member management, assignment target tenant hardening, and content-report authority hardening.

In addition, the logical migrations `v6_privacy_safe_telemetry` and `v6_telemetry_hardening` are already applied live under earlier migration versions than the current repository filenames. Because Supabase migration history is version-oriented, this repository/live timestamp divergence must be reconciled before any blanket migration push.

Do **not** apply `assignment_due_reminders` in isolation and do **not** run a blind production migration push from the current repository state. First reproduce/reconcile the migration sequence in a non-production Supabase branch or equivalent staging database, confirm that the two renamed telemetry migrations are not reapplied destructively, run database/security tests, then promote the ordered set through the reviewed release path.

No production schema, function, extension, secret, schedule, subscription, notification, or user record was modified while collecting this evidence.
