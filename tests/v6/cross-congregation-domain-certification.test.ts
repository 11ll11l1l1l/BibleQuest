import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read=(path:string)=>fs.readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const evidence = [
  'supabase/tests/v6-tenant-rls.test.sql',
  'supabase/tests/v6-assignment-progress-tenant-rls.test.sql',
  'supabase/tests/v6-assignment-response-presence-tenant-rls.test.sql',
  'supabase/tests/v6-avatar-vault-tenant-rls.test.sql',
  'supabase/tests/v6-calendar-ministry-tenant-writes.test.sql',
  'supabase/tests/v6-challenge-tenant-rls.test.sql',
  'supabase/tests/v6-community-tenant-rls.test.sql',
  'supabase/tests/v6-live-room-tenant-rls.test.sql',
  'supabase/tests/v6-media-notification-tenant-rls.test.sql',
  'supabase/tests/v6-poll-tenant-integrity.test.sql',
] as const;

test('sensitive migrated database domains retain executable two-congregation denial evidence', () => {
  for (const path of evidence) {
    const source=read(path);
    assert.match(source,/begin;/i);
    assert.match(source,/set local role authenticated/i);
    assert.match(source,/congregation B|foreign congregation/i);
    assert.match(source,/rollback;/i);
  }
});

test('database CI executes pgTAP against disposable Supabase', () => {
  const workflow=read('.github/workflows/v6-database-ci.yml');
  assert.match(workflow,/Prepare disposable V5-baseline-to-current V6 database/);
  assert.match(workflow,/supabase db reset/);
  assert.match(workflow,/supabase test db/);
});
