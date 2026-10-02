# BibleQuest V6 Assignment Push Deployment Handoff

Status checked: 2026-10-02.

## Acceptance target

The V6 checklist row `Assignment assigned/due push is supported.` must remain open until both assigned and due Web Push paths are operational on the intended deployed environment.

Physical-device push acceptance is a separate checklist row and must not be inferred from repository, database, or browser automation.

## Repository state

The repository contains:

- durable assignment notification production through `bq_notify_assignment()`;
- assignment creation dispatch through `supabase/functions/bq-assignment/index.ts`;
- the shared `bq-push-delivery` sender;
- `supabase/migrations/20260928140000_assignment_due_reminders.sql`, which adds the service-only, tenant-scoped, idempotent due-reminder enqueue function;
- `supabase/functions/bq-assignment-reminders/index.ts`, which enqueues due notifications and dispatches their notification IDs through `bq-push-delivery`;
- disposable pgTAP coverage for assignment producer categories and due reminders;
- service-worker push/click coverage for the canonical `/#/assignments` deep link;
- `supabase/ops/assignment-due-reminder-cron.sql`, an explicit operator-applied Cron setup.

## Connected-project observation

The connected BibleQuest Supabase project was inspected read-only on 2026-10-02. The non-secret snapshot is pinned at
`docs/v6/evidence/ASSIGNMENT_PUSH_LIVE_READINESS_20261002.json`.

Observed state:

- `pg_cron` and `pg_net` are installed;
- one active `bq-assignment-due-reminders-v6` Cron job runs every five minutes;
- both required Vault names exist without exposing their values;
- `public.bible_enqueue_assignment_due_notifications_v6()` exists as SECURITY DEFINER, is executable by `service_role`, and is denied to `authenticated` and `anon`;
- the due-reminder idempotency and scheduler-scan indexes are live;
- `bq-assignment-reminders` is ACTIVE (version 1);
- sanitized Edge Function request logs showed 263 HTTP 200 responses and zero non-2xx responses for `/functions/v1/bq-assignment-reminders` in the inspected 24-hour window;
- the current database observation contained 283 successful Cron runs and zero failed runs in the prior 24 hours;
- production migration history records the reviewed equivalent `20261001150641 assignment_due_reminders_v6_20260928140000` rather than the repository's canonical `20260928140000` version;
- the later retry-redispatch migration `20261001113000_assignment_push_retry_redispatch.sql` is not live: its retry index and `retry_ready` function path are absent;
- there were zero current due assignments, zero due notifications and zero delivered due pushes during the observation window.

Therefore the deployed scheduler-to-Edge-Function path is operational, but the combined assignment assigned/due acceptance row remains OPEN. The checked-in retry-redispatch hardening is not yet live, and no eligible live due notification has yet exercised the canonical sender. The evaluator now fails closed on both conditions instead of allowing a delivery counter to PASS while retry hardening or real scheduler dispatch evidence is missing.

## Read-only readiness snapshot

Run `supabase/ops/assignment-push-live-readiness.sql` with a read-only production inspection connection. The query returns only booleans/counts and never returns Vault values, user IDs, assignment IDs, notification IDs, subscription endpoints, or other account data.

The SQL object is the database half of the evidence contract. A PASS-capable evidence file must also include sanitized management-plane evidence for the exact `bq-assignment-reminders` Edge Function: slug, ACTIVE status, deployed version, `verifyJwt` mode, and aggregate HTTP 200/non-2xx counts for the inspected window. Do not include request headers, tokens, user IDs, notification IDs, endpoints, or log bodies.

Evaluate the combined evidence envelope with:

```bash
node scripts/v6-assignment-push-live-readiness.mjs /path/to/evidence.json
```

Exit status `0` means all backend, retry, scheduler-dispatch and live due-delivery conditions pass. Exit `2` means the database scheduler/backend contract is unsafe; `3` means retry redispatch is not live; `4` means sanitized Edge Function dispatch evidence is missing or unhealthy; and `5` means the hardened backend is ready but eligible live due-delivery evidence is still missing. SQL-only evidence intentionally cannot PASS because a successful Cron row proves the SQL job ran, not that the asynchronous HTTP request reached the Edge Function.

## Production-safe release sequence

Do not execute these steps without explicit production authorization.


Before any repair or push, use the repository migration-history guard against a reviewed remote migration export. When a logical migration is already applied under a different timestamp, an operator may supply a separately reviewed equivalence file:

```bash
node scripts/v6-migration-history-guard.mjs \
  --remote-json /path/to/reviewed-remote-migrations.json \
  --equivalence-json /path/to/reviewed-equivalences.json \
  --validate-repair-plan
```

Each equivalence must identify the exact remote and local version/name pair, set `reviewed: true`, and cite independent schema-equivalence evidence. The guard validates the mapping and prints the exact metadata-only `supabase migration repair` commands, but never executes them. A valid plan is not itself push-safe: after an authorized metadata repair, rerun the guard without `--validate-repair-plan` and require `safeForOrderedPush: true` before `supabase db push --dry-run`.

After migration history is actually aligned, require the due-reminder migration itself to be exact and ordered before any push:

```bash
npm run check:v6-assignment-push-release -- \
  --remote-json /path/to/reviewed-remote-migrations.json
```

This second gate is also read-only. It exits non-zero unless the canonical `assignment_due_reminders` migration is either already recorded at its exact repository version or is safely pending in an ordered tail with no unresolved history repair, name/version conflict, remote-only migration, or older unapplied migration behind the remote tip. A reviewed repair plan by itself is intentionally insufficient; the history must first be repaired through an authorized process and re-exported.

1. Reconcile the production migration history against the authoritative V6 migration plan. Do not skip or manually fake migration-history entries.
2. Apply the reviewed V6 database migrations through the normal release path, including `20260928140000_assignment_due_reminders.sql` and `20261001113000_assignment_push_retry_redispatch.sql`.
3. Deploy the exact reviewed `bq-assignment-reminders` Edge Function.
4. In Supabase Vault, configure:
   - `bq_assignment_reminder_project_url` with the project API URL;
   - `bq_assignment_reminder_scheduler_secret` with one server-only Supabase secret accepted by the reminder Edge Function.
5. Apply `supabase/ops/assignment-due-reminder-cron.sql`.
6. Verify without exposing secret values:
   - `pg_cron` is installed;
   - one active Cron job named `bq-assignment-due-reminders-v6` exists on the expected five-minute schedule;
   - `public.bible_enqueue_assignment_due_notifications_v6()` exists and remains executable only by the trusted server role;
   - `bq-assignment-reminders` is active;
   - sanitized Edge Function logs show successful HTTP responses for the scheduled path with no non-2xx responses in the inspected acceptance window.
7. Create a disposable near-due assignment in a test congregation/account set and verify:
   - only eligible incomplete recipients receive one durable `assignment_due` notification;
   - a repeated scheduler run does not duplicate the reminder;
   - the notification dispatches through `bq-push-delivery`;
   - the resulting push payload resolves to `/#/assignments`.
8. Remove disposable test data and record exact migration/function/job evidence in the acceptance checklist.

## Exact remaining live evidence action

After the reviewed retry-redispatch migration is deployed and the evaluator reports `retryHardeningReady: true`, exactly one live acceptance action remains for this backend row: create one disposable eligible near-due assignment for a controlled test recipient, allow the real scheduler to enqueue it, and capture sanitized evidence that the resulting `assignment_due` notification was delivered through `bq-push-delivery`. A physical-device notification display is not required for this backend row and belongs to the separate field-evidence task.

## Security boundaries

- Never place a project server secret directly in repository SQL, GitHub Actions, `cron.job.command`, client code, logs, or diagnostics.
- The Cron command resolves its project URL and server secret from Supabase Vault at execution time.
- Browser roles must not be able to call the due-enqueue database function or impersonate the scheduler.
- Due notifications remain congregation-scoped and exclude completed recipients.
- Keep physical-device notification delivery as a separate field-evidence gate.
