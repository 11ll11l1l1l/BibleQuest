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

No production schema, function, extension, secret, schedule, subscription, notification, or user record was modified while collecting this evidence.
