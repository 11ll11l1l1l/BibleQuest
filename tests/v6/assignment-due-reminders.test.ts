import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const edge = readFileSync(new URL('../../supabase/functions/bq-assignment-reminders/index.ts', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../../supabase/migrations/20260928140000_assignment_due_reminders.sql', import.meta.url), 'utf8');
const retryMigration = readFileSync(new URL('../../supabase/migrations/20261001113000_assignment_push_retry_redispatch.sql', import.meta.url), 'utf8');
const retryDatabaseTest = readFileSync(new URL('../../supabase/tests/v6-assignment-push-retry-redispatch.test.sql', import.meta.url), 'utf8');
const databaseTest = readFileSync(new URL('../../supabase/tests/v6-assignment-due-reminders.test.sql', import.meta.url), 'utf8');
const config = readFileSync(new URL('../../supabase/config.toml', import.meta.url), 'utf8');
const assignmentFunction = readFileSync(new URL('../../supabase/functions/bq-assignment/index.ts', import.meta.url), 'utf8');

test('assignment due reminder scheduler is service-only, bounded and calls the existing sender', () => {
  assert.match(edge, /request\.method !== 'POST'/);
  assert.match(edge, /X-BQ-Assignment-Reminder-Secret/);
  assert.match(edge, /from vault\.decrypted_secrets/);
  assert.match(edge, /bq_assignment_reminder_scheduler_secret/);
  assert.match(edge, /SUPABASE_DB_URL/);
  assert.doesNotMatch(edge, /authorization !== `Bearer \$\{key\}` && apiKey !== key/);
  assert.match(edge, /admin\.rpc\('bible_enqueue_assignment_due_notifications_v6'\)/);
  assert.match(edge, /admin\.functions\.invoke\('bq-push-delivery'/);
  assert.match(edge, /const BATCH_SIZE = 10/);
  assert.match(config, /\[functions\.bq-assignment-reminders\]\s*verify_jwt = false/);
  assert.match(edge, /notification_id/);
});

test('assignment due reminder SQL scopes current incomplete recipients and deduplicates durable notifications', () => {
  assert.match(migration, /bible_notifications_assignment_due_once_idx/);
  assert.match(migration, /bible_assignments_active_due_reminder_idx/);
  assert.match(migration, /a\.active is true/);
  assert.match(migration, /c\.active is true/);
  assert.match(migration, /a\.schedule_at is null or a\.schedule_at <= clock_timestamp\(\)/);
  assert.match(migration, /cm\.active is true/);
  assert.match(migration, /progress\.status = 'completed'/);
  assert.match(migration, /delivery_category,[\s\S]*?'assignments'/);
  assert.match(migration, /revoke all on function public\.bible_enqueue_assignment_due_notifications_v6\(\) from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.bible_enqueue_assignment_due_notifications_v6\(\) to service_role/);
  assert.match(databaseTest, /repeat scheduler runs do not duplicate/);
  assert.match(databaseTest, /reminders stay in each congregation/);
  assert.match(assignmentFunction, /An assignment due date is required when setting a reminder/);
  assert.match(assignmentFunction, /Reminder must be scheduled on or before the assignment due date/);
});


test('assignment scheduler redispatches only recent assignment retries after backoff', () => {
  assert.match(retryMigration, /bible_push_retry_state_due_idx/);
  assert.match(retryMigration, /join public\.bible_push_retry_state retry/);
  assert.match(retryMigration, /n\.delivery_category = 'assignments'/);
  assert.match(retryMigration, /n\.action_kind = 'assignment'/);
  assert.match(retryMigration, /n\.created_at >= clock_timestamp\(\) - interval '14 minutes'/);
  assert.match(retryMigration, /retry\.next_retry_at <= clock_timestamp\(\)/);
  assert.match(retryMigration, /limit 25/);
  assert.match(retryMigration, /select retry_ready\.notification_id from retry_ready/);
  assert.match(retryDatabaseTest, /scheduler re-emits a recent assignment notification after retry backoff elapses/);
  assert.match(retryDatabaseTest, /scheduler does not bypass a future retry backoff/);
  assert.match(retryDatabaseTest, /scheduler does not redispatch outside the canonical sender freshness window/);
});
