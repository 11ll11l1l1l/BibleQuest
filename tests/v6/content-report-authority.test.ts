import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const migration = fs.readFileSync(
  new URL('../../supabase/migrations/20260930113000_content_report_insert_authority_hardening.sql', import.meta.url),
  'utf8',
);
const databaseTest = fs.readFileSync(
  new URL('../../supabase/tests/v6-content-report-authority.test.sql', import.meta.url),
  'utf8',
);

test('content report insert policy reserves review state for authorized reviewers', () => {
  assert.match(migration, /reporter_id\s*=\s*\(select auth\.uid\(\)\)/);
  assert.match(migration, /private\.is_bible_congregation_member\(congregation_id\)/);
  assert.match(migration, /status\s*=\s*'open'/);
  assert.match(migration, /reviewed_by is null/);
  assert.match(migration, /reviewed_at is null/);
});

test('disposable database coverage proves valid reporting and rejects authority spoofing', () => {
  assert.match(databaseTest, /Member A may submit a new open report in congregation A/);
  assert.match(databaseTest, /cannot submit a report already marked closed/);
  assert.match(databaseTest, /cannot prefill reviewer identity or review time/);
  assert.match(databaseTest, /cannot submit a report in congregation B/);
  assert.match(databaseTest, /inactive former Member A cannot submit/);
  assert.match(databaseTest, /Leader A may review a congregation A report/);
  assert.match(databaseTest, /ordinary Member A cannot change report review state/);
});
