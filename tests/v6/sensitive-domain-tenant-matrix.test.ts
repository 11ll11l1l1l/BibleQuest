import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

type TenantDomain = Readonly<{
  id: string;
  testFiles: readonly string[];
  denialMarkers: readonly string[];
}>;

type TenantMatrix = Readonly<{
  schemaVersion: number;
  coverageStatus: 'PARTIAL' | 'COMPLETE';
  targetRow: string;
  domains: readonly TenantDomain[];
}>;

const root = new URL('../..', import.meta.url);
const read = (relative: string) => fs.readFileSync(new URL(relative, root), 'utf8');
const matrix = JSON.parse(read('docs/v6/V6_SENSITIVE_DOMAIN_TENANT_MATRIX.json')) as TenantMatrix;
const checklist = read('V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md');
const databaseWorkflow = read('.github/workflows/v6-database-ci.yml');

const specialTenantTests = new Set([
  'v6-assignment-due-reminders.test.sql',
  'v6-congregation-member-management.test.sql',
  'v6-content-report-authority.test.sql',
  'v6-leader-center-role-matrix.test.sql',
  'v6-notification-producer-categories.test.sql',
  'v6-security-definer-callers.test.sql',
]);

function discoveredTenantTests() {
  const names = fs.readdirSync(new URL('supabase/tests/', root));
  return names
    .filter(name => /tenant.*\.test\.sql$/i.test(name) || specialTenantTests.has(name))
    .map(name => 'supabase/tests/' + name)
    .sort();
}

test('sensitive-domain tenant matrix exhaustively classifies executable cross-congregation DB suites', () => {
  assert.equal(matrix.schemaVersion, 1);
  assert.equal(matrix.coverageStatus, 'COMPLETE');
  assert.equal(matrix.targetRow, 'Cross-congregation denial is tested for every sensitive migrated domain.');
  assert.ok(matrix.domains.length >= 10, 'sensitive-domain inventory must remain explicit rather than collapsing to one generic suite');

  const domainIds = matrix.domains.map(domain => domain.id);
  assert.equal(new Set(domainIds).size, domainIds.length, 'tenant matrix domain IDs must be unique');

  const mappedFiles = matrix.domains.flatMap(domain => domain.testFiles);
  assert.equal(new Set(mappedFiles).size, mappedFiles.length, 'each tenant pgTAP file must have one accountable domain owner');
  assert.deepEqual(
    [...mappedFiles].sort(),
    discoveredTenantTests(),
    'every tenant-focused/sensitive-domain pgTAP suite must be classified in the matrix, and stale entries are forbidden',
  );

  for (const domain of matrix.domains) {
    assert.ok(domain.testFiles.length > 0, domain.id + ' must map to executable database evidence');
    assert.ok(domain.denialMarkers.length > 0, domain.id + ' must identify concrete denial assertions');

    const sql = domain.testFiles.map(path => {
      assert.ok(fs.existsSync(new URL(path, root)), domain.id + ' references missing pgTAP file ' + path);
      const body = read(path);
      assert.match(body, /\bbegin\s*;/i, path + ' must execute transactionally');
      assert.match(body, /create extension if not exists pgtap/i, path + ' must use pgTAP');
      assert.match(body, /select\s+plan\(/i, path + ' must declare a pgTAP plan');
      assert.match(body, /select\s+(?:results_eq|throws_ok|lives_ok|is|ok)\s*\(/i, path + ' must execute assertions');
      return body;
    }).join('\n');

    for (const marker of domain.denialMarkers) {
      assert.ok(sql.includes(marker), domain.id + ' is missing denial evidence marker: ' + marker);
    }
  }
});

test('Database CI executes the tenant matrix and all mapped pgTAP suites on disposable Supabase', () => {
  assert.match(databaseWorkflow, /tests\/v6\/sensitive-domain-tenant-matrix\.test\.ts/);
  assert.match(databaseWorkflow, /docs\/v6\/V6_SENSITIVE_DOMAIN_TENANT_MATRIX\.json/);
  assert.match(databaseWorkflow, /node --test[\s\S]*sensitive-domain-tenant-matrix\.test\.ts/);
  assert.match(databaseWorkflow, /supabase test db/);
});

test('completed tenant matrix is represented as PASS only with the aggregate contract present', () => {
  const row = '- [x] ' + matrix.targetRow;
  assert.ok(checklist.includes(row), 'complete sensitive-domain matrix requires the aggregate checklist row to be checked');
});
