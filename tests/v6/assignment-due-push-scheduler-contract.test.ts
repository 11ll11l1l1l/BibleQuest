import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const assignmentSource = readFileSync(
  new URL('../../supabase/functions/bq-assignment/index.ts', import.meta.url),
  'utf8'
);
const deliverySource = readFileSync(
  new URL('../../supabase/functions/bq-push-delivery/index.ts', import.meta.url),
  'utf8'
);

test('assignment creation persists reminder timing but only dispatches the immediate assigned notification', () => {
  assert.match(assignmentSource, /reminderAt=iso\(body\?\.reminderAt\)/);
  assert.match(assignmentSource, /reminder_at:reminderAt/);
  assert.match(assignmentSource, /dispatchAssignmentPush\(admin,String\(made\.data\.id\),'assignment'\)/);

  assert.doesNotMatch(
    assignmentSource,
    /dispatchAssignmentPush\([^\n]*['"](?:due|reminder)['"]/
  );
});

test('saved recurrence explicitly records that trusted scheduling is not enabled', () => {
  assert.match(
    assignmentSource,
    /recurrence_status:recurrenceRule\?'rule_saved_scheduler_not_enabled':'none'/
  );
});

test('assignment runtime does not substitute a browser or in-process timer for a trusted producer', () => {
  assert.doesNotMatch(assignmentSource, /\bsetTimeout\s*\(/);
  assert.doesNotMatch(assignmentSource, /\bsetInterval\s*\(/);
});

test('central push delivery requires a fresh durable notification and keeps idempotent claim enforcement', () => {
  assert.match(deliverySource, /MAX_NOTIFICATION_AGE_MS\s*=\s*15\s*\*\s*60\s*\*\s*1000/);
  assert.match(deliverySource, /\.from\('bible_notifications'\)/);
  assert.match(deliverySource, /if \(!isNotificationFresh\(notification\.created_at\)\)/);
  assert.match(deliverySource, /claimDelivery\(adminDb, notification\.id, subscription\.id, serverEnforced, localMinute\)/);
});

test('future due/reminder producer must preserve tenant-scoped durable delivery controls', () => {
  assert.match(assignmentSource, /congregation_id:congregationId/);
  assert.match(deliverySource, /bible_claim_push_delivery_v6_rate_limited/);
  assert.match(deliverySource, /quiet_hours_enabled/);
  assert.match(deliverySource, /delivery_category/);

  // Characterization only: reminder persistence is not evidence that a due/reminder
  // producer exists. This assertion intentionally stays red if runtime starts claiming
  // such support without replacing this contract with executable scheduler coverage.
  assert.doesNotMatch(assignmentSource, /notificationType:'assignment'\|'feedback'\|'due'|'reminder'/);
});
