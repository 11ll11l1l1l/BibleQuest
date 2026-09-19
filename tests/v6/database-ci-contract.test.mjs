import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (filePath) => fs.readFileSync(new URL(`../../${filePath}`, import.meta.url), 'utf8');

test('V6 database CI is local-only, pinned, and uses released V5 baseline plus V6 forward migrations', () => {
  const workflow = read('.github/workflows/v6-database-ci.yml');
  const prepare = read('scripts/v6-prepare-local-supabase.mjs');
  const config = read('supabase/config.toml');
  const prerequisites = read('supabase/v6-ci-release-prerequisites.sql');

  assert.match(workflow, /version:\s*2\.117\.0/);
  assert.match(workflow, /node scripts\/v6-prepare-local-supabase\.mjs/);
  assert.match(workflow, /supabase db reset/);
  assert.match(workflow, /supabase test db/);
  assert.match(workflow, /supabase gen types typescript --local/);
  assert.doesNotMatch(workflow, /supabase link|--linked|SUPABASE_ACCESS_TOKEN|SUPABASE_DB_PASSWORD|SERVICE_ROLE_KEY/);

  assert.match(prepare, /00000000000000_biblequest_v5_release_baseline\.sql/);
  assert.match(prepare, /V5_BASELINE_CUTOFF = '20260918235959'/);
  assert.match(prepare, /historicalPreV6Migrations/);
  assert.match(prepare, /v6ForwardMigrations/);
  assert.match(prepare, /V6 forward migrations must use unique 14-digit versions/);
  assert.match(prepare, /schema\.sql/);
  assert.match(prepare, /v6-ci-release-prerequisites\.sql/);
  assert.match(prepare, /20260905_admin_auth_schema_parity\.sql/);
  assert.match(prerequisites, /create table if not exists public\.bible_congregation_invites/);
  assert.match(prerequisites, /enable row level security/);
  assert.match(prerequisites, /revoke all on table public\.bible_congregation_invites from anon, authenticated/);
  assert.match(config, /project_id = "biblequest-v6-local"/);
  assert.doesNotMatch(config, /env\(|secret|password|token/i);
});

test('released baseline captures the production congregation-role helper safely', () => {
  const schema = read('supabase/schema.sql');
  assert.match(schema, /create or replace function private\.bible_role_in_congregation\(target_congregation uuid\)/);
  assert.match(schema, /security definer[\s\S]*?set search_path = ''/);
  assert.match(schema, /revoke all on function private\.bible_role_in_congregation\(uuid\) from public/);
  assert.match(schema, /grant execute on function private\.bible_role_in_congregation\(uuid\) to authenticated/);
});

test('V6 database fixtures contain two distinct congregations and non-production identities', () => {
  const seed = read('supabase/seed-v6-ci.sql');
  const tests = read('supabase/tests/v6-tenant-rls.test.sql');

  assert.match(seed, /V6 Congregation A/);
  assert.match(seed, /V6 Congregation B/);
  assert.match(seed, /leader-a@bq-v6\.invalid/);
  assert.match(seed, /member-a@bq-v6\.invalid/);
  assert.match(seed, /admin-b@bq-v6\.invalid/);
  assert.match(seed, /platform-owner@bq-v6\.invalid/);
  assert.match(tests, /cannot force a foreign assignment/);
  assert.match(tests, /server-only admin audit log/);
  assert.match(tests, /SECURITY DEFINER/);
});
