import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const edge = readFileSync(new URL('../../supabase/functions/bq-assignment-reminders/index.ts', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../../supabase/migrations/20260928140000_assignment_due_reminders.sql', import.meta.url), 'utf8');
const databaseTest = readFileSync(new URL('../../supabase/tests/v6-assignment-due-reminders.test.sql', import.meta.url), 'utf8');
const config = readFileSync(new URL('../../supabase/config.toml', import.meta.url), 'utf8');
const assignmentFunction = readFileSync(new URL('../../supabase/functions/bq-assignment/index.ts', import.meta.url), 'utf8');

test('assignment due reminder scheduler is service-only, bounded and calls the existing sender', () => {
  assert.match(edge, /request\.method !== 'POST'/);
  assert.match(edge, /authorization !== `Bearer \$\{key\}` && apiKey !== key/);
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
