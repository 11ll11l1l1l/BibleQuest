import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (relative: string) =>
  fs.readFileSync(new URL('../../' + relative, import.meta.url), 'utf8');

function ownerSource(source: string, owner: string): string {
  const start = source.indexOf(`const ${owner} = Object.freeze({`);
  assert.notEqual(start, -1, `Missing API owner ${owner}.`);
  const end = source.indexOf('\n  });', start);
  assert.notEqual(end, -1, `Could not find end of API owner ${owner}.`);
  return source.slice(start, end);
}

test('typed tenant repositories expose exactly one congregation scope', () => {
  const tenant = read('src/v6/kernel/tenant-context.ts');
  const repository = read('src/v6/kernel/repository.ts');

  assert.match(tenant, /readonly congregationId: string;/);
  assert.doesNotMatch(tenant, /congregationIds:/);
  assert.match(repository, /readonly scope: TenantScope;/);
});

test('Team Center repository is single-tenant and rejects implicit inter-congregation reads', () => {
  const api = read('src/core/api.js');
  const source = ownerSource(api, 'teamCenter');

  assert.match(source, /async list\(congregationId\)/);
  assert.match(source, /Array\.isArray\(congregationId\)/);
  assert.match(source, /does not allow implicit inter-congregation reads/);
  assert.match(source, /\.eq\('congregation_id',id\)/);
  assert.doesNotMatch(source, /\.in\('congregation_id'/);
  assert.doesNotMatch(source, /congregationIds/);
});

test('shared API contains no implicit multi-congregation tenant query', () => {
  const api = read('src/core/api.js');

  assert.doesNotMatch(api, /\.in\('congregation_id'/);
  assert.doesNotMatch(api, /\bcongregationIds\b/);
});

test('Team Center live service passes only the active congregation to its repository', () => {
  const service = read('src/app/team-center.js');

  assert.match(service, /const activeId=activeCongregationId\(\)/);
  assert.match(service, /api\.list\(activeId\)/);
  assert.doesNotMatch(service, /api\.list\(\[activeId\]\)/);
  assert.match(service, /const allowedCongregations=new Set\(\[activeId\]\)/);
});

test('inter-congregation sharing policy is deny-by-default and requires a separately approved exception', () => {
  const policy = read('docs/v6/V6_INTER_CONGREGATION_SHARING_POLICY.md');

  assert.match(policy, /does not imply inter-congregation data sharing/i);
  assert.match(policy, /no approved inter-congregation directory or shared-resource features/i);
  assert.match(policy, /V6 ADR approves the cross-tenant data model/i);
  assert.match(policy, /separately named cross-congregation operation/i);
  assert.match(policy, /executable DB and browser tests prove opt-in behavior/i);
});
