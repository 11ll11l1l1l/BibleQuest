import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const assignmentEdge = readFileSync(new URL('../../supabase/functions/bq-assignment/index.ts', import.meta.url), 'utf8');
const reminderEdge = readFileSync(new URL('../../supabase/functions/bq-assignment-reminders/index.ts', import.meta.url), 'utf8');
const producerMigration = readFileSync(new URL('../../supabase/migrations/20260924103000_notification_producer_delivery_categories.sql', import.meta.url), 'utf8');
const reminderMigration = readFileSync(new URL('../../supabase/migrations/20260928140000_assignment_due_reminders.sql', import.meta.url), 'utf8');
const pushDelivery = readFileSync(new URL('../../supabase/functions/bq-push-delivery/index.ts', import.meta.url), 'utf8');
const producerDbTest = readFileSync(new URL('../../supabase/tests/v6-notification-producer-categories.test.sql', import.meta.url), 'utf8');
const reminderDbTest = readFileSync(new URL('../../supabase/tests/v6-assignment-due-reminders.test.sql', import.meta.url), 'utf8');
const workerTest = readFileSync(new URL('./assignment-push-service-worker.test.ts', import.meta.url), 'utf8');
const databaseWorkflow = readFileSync(new URL('../../.github/workflows/v6-database-ci.yml', import.meta.url), 'utf8');
const schedulerOps = readFileSync(new URL('../../supabase/ops/assignment-due-reminder-cron.sql', import.meta.url), 'utf8');

test('assignment assigned push is connected from durable producer to the canonical sender', () => {
  assert.match(producerMigration, /create or replace function public\.bq_notify_assignment\(\)/);
  assert.match(producerMigration, /'assignment',[\s\S]*?'assignments'[\s\S]*?'New assignment: '/);
  assert.match(producerMigration, /'assignment',[\s\S]*?jsonb_build_object\('assignment_id', new\.id\)/);
  assert.match(assignmentEdge, /await dispatchAssignmentPush\(admin,String\(made\.data\.id\),'assignment'\)/);
  assert.match(assignmentEdge, /admin\.functions\.invoke\('bq-push-delivery',\{body:\{notificationId:row\.id\}\}\)/);

  assert.match(
    producerDbTest,
    /assignment producer emits canonical assignments category/,
    'disposable database suite must execute the assignment producer',
  );
  assert.match(
    producerDbTest,
    /producer category fixtures create no cross-congregation notifications/,
    'assignment producer DB proof must retain tenant-isolation coverage',
  );
});

test('assignment assigned push pages large recipient sets instead of dropping the fanout', () => {
  assert.match(assignmentEdge, /const PUSH_NOTIFICATION_PAGE=100/);
  assert.match(assignmentEdge, /\.order\('created_at',\{ascending:true\}\)[\s\S]*?\.order\('id',\{ascending:true\}\)[\s\S]*?\.range\(offset,offset\+PUSH_NOTIFICATION_PAGE-1\)/);
  assert.match(assignmentEdge, /if\(rows\.length<PUSH_NOTIFICATION_PAGE\)break;[\s\S]*?offset\+=PUSH_NOTIFICATION_PAGE/);
  assert.doesNotMatch(assignmentEdge, /fanout rejected/);
});

test('assignment due push is service-only, recipient-scoped, idempotent and uses the same sender', () => {
  assert.match(reminderMigration, /create or replace function public\.bible_enqueue_assignment_due_notifications_v6\(\)/);
  assert.match(reminderMigration, /notification_type[\s\S]*?'assignment_due'/);
  assert.match(reminderMigration, /delivery_category[\s\S]*?'assignments'/);
  assert.match(reminderMigration, /action_kind[\s\S]*?'assignment'/);
  assert.match(reminderMigration, /'reminder_kind', 'due'/);
  assert.match(reminderMigration, /progress\.status = 'completed'/);
  assert.match(reminderMigration, /revoke all on function public\.bible_enqueue_assignment_due_notifications_v6\(\) from public, anon, authenticated/);
  assert.match(reminderMigration, /grant execute on function public\.bible_enqueue_assignment_due_notifications_v6\(\) to service_role/);

  assert.match(reminderEdge, /admin\.rpc\('bible_enqueue_assignment_due_notifications_v6'\)/);
  assert.match(reminderEdge, /admin\.functions\.invoke\('bq-push-delivery', \{ body: \{ notificationId \} \}\)/);
  assert.match(reminderEdge, /const BATCH_SIZE = 10/);

  assert.match(reminderDbTest, /eligible incomplete recipients receive one durable due reminder each/);
  assert.match(reminderDbTest, /reminders stay in each congregation/);
  assert.match(reminderDbTest, /repeat scheduler runs do not duplicate delivered-to-inbox reminder rows/);
});

test('assigned and due notifications resolve to the assignments push category and deep link', () => {
  assert.match(pushDelivery, /type V6PushCategory = 'reading' \| 'assignments' \| 'ministry'/);
  assert.match(pushDelivery, /type\.includes\('assignment'\).*action === 'assignment'/);
  assert.match(pushDelivery, /category === 'assignment' \|\| category === 'assignments'\) return '\/#\/assignments'/);

  assert.match(workerTest, /assignment assigned push renders the canonical assignments deep link/);
  assert.match(workerTest, /assignment due push renders the same canonical assignments deep link/);
  assert.match(workerTest, /url: '\/#\/assignments'/);
  assert.match(workerTest, /shown\.options\.data\.url, 'https:\/\/biblequest\.example\/#\/assignments'/);
});

test('changes to the combined assignment push contract trigger disposable Database CI', () => {
  assert.match(
    databaseWorkflow,
    /- 'tests\/v6\/assignment-assigned-due-push\.test\.ts'/,
    'Database CI must rerun when this cross-layer acceptance contract changes',
  );
});


test('due reminder scheduler is explicit, Vault-backed and does not embed server secret values', () => {
  assert.match(schedulerOps, /create extension if not exists pg_cron/);
  assert.match(schedulerOps, /create extension if not exists pg_net with schema extensions/);
  assert.match(schedulerOps, /'bq-assignment-due-reminders-v6'/);
  assert.match(schedulerOps, /'\*\/5 \* \* \* \*'/);
  assert.match(schedulerOps, /vault\.decrypted_secrets/);
  assert.match(schedulerOps, /bq_assignment_reminder_project_url/);
  assert.match(schedulerOps, /bq_assignment_reminder_secret_key/);
  assert.match(schedulerOps, /\/functions\/v1\/bq-assignment-reminders/);
  assert.match(schedulerOps, /'Authorization', 'Bearer ' \|\|/);
  assert.match(schedulerOps, /timeout_milliseconds := 5000/);
  assert.doesNotMatch(schedulerOps, /SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEYS/);
  assert.doesNotMatch(schedulerOps, /https:\/\/[a-z0-9]+\.supabase\.co/);
});
