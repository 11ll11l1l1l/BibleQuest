import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

type ParityEntry = Readonly<{
  v4Route: string;
  v6Route: string;
  featureOwner: string;
  status: 'preserved';
}>;

type ParityManifest = Readonly<{
  schemaVersion: number;
  baselineSource: string;
  baselineRouteCount: number;
  v6RouteSource: string;
  ownerConvention: string;
  entries: readonly ParityEntry[];
}>;

const manifestUrl = new URL('../../docs/v6/V6_V4_ROUTE_FEATURE_PARITY.json', import.meta.url);
const v4RouteSmokeUrl = new URL('../v4-whole-app-deep-routes-smoke.mjs', import.meta.url);
const bootstrapUrl = new URL('../../src/app/bootstrap.js', import.meta.url);

function parseHistoricalV4Routes(source: string): string[] {
  const match = source.match(/const MAINTAINED_ROUTES=\[([\s\S]*?)\];/);
  assert.ok(match, 'V4 maintained-route inventory must remain readable');
  return [...match[1].matchAll(/'([^']+)'/g)].map(item => item[1]);
}

function routeBlock(source: string): string {
  const start = source.indexOf('const routes=Object.freeze({');
  const end = source.indexOf('router=createRouter({routes', start);
  assert.ok(start >= 0 && end > start, 'V6 route table boundaries must remain discoverable');
  return source.slice(start, end);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasRouteEntry(source: string, route: string): boolean {
  const escaped = escapeRegExp(route);
  const pattern = new RegExp("(?:^|\\n|,)\\s*(?:'" + escaped + "'|\\\"" + escaped + "\\\"|" + escaped + "):\\(\\)=>", 'm');
  return pattern.test(routeBlock(source));
}

test('V4 maintained routes have an exact V6 route and feature-owner parity matrix', async () => {
  const [manifestSource, v4Source, bootstrapSource] = await Promise.all([
    readFile(manifestUrl, 'utf8'),
    readFile(v4RouteSmokeUrl, 'utf8'),
    readFile(bootstrapUrl, 'utf8'),
  ]);

  const manifest = JSON.parse(manifestSource) as ParityManifest;
  const historicalRoutes = parseHistoricalV4Routes(v4Source);
  const manifestRoutes = manifest.entries.map(entry => entry.v4Route);

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.baselineSource, 'tests/v4-whole-app-deep-routes-smoke.mjs');
  assert.equal(manifest.v6RouteSource, 'src/app/bootstrap.js');
  assert.equal(manifest.ownerConvention, 'src/features/<featureOwner>/index.js');
  assert.equal(historicalRoutes.length, 42);
  assert.equal(manifest.baselineRouteCount, historicalRoutes.length);
  assert.equal(new Set(manifestRoutes).size, manifestRoutes.length, 'V4 parity routes must be unique');
  assert.deepEqual([...manifestRoutes].sort(), [...historicalRoutes].sort(), 'matrix must cover every historical V4 maintained route exactly once');

  const aliasOwners = new Map<string, string>([
    ['mission', 'daily-mission'],
    ['recognition', 'congregation-recognition'],
    ['play', 'games'],
    ['grow', 'progress'],
    ['my-mission', 'mission'],
    ['media', 'recordings'],
  ]);

  for (const entry of manifest.entries) {
    assert.equal(entry.status, 'preserved', entry.v4Route + ' must be explicitly preserved');
    assert.equal(entry.v6Route, entry.v4Route, entry.v4Route + ' must retain its V4 deep-link route');
    assert.equal(hasRouteEntry(bootstrapSource, entry.v6Route), true, '#/' + entry.v6Route + ' must remain in the V6 route table');

    const expectedOwner = aliasOwners.get(entry.v4Route) ?? entry.v4Route;
    assert.equal(entry.featureOwner, expectedOwner, entry.v4Route + ' must retain the documented V6 feature owner');

    const ownerUrl = new URL('../../src/features/' + entry.featureOwner + '/index.js', import.meta.url);
    await access(fileURLToPath(ownerUrl));
  }
});

test('V6 route table is a superset of the frozen V4 maintained-route baseline', async () => {
  const [manifestSource, bootstrapSource] = await Promise.all([
    readFile(manifestUrl, 'utf8'),
    readFile(bootstrapUrl, 'utf8'),
  ]);
  const manifest = JSON.parse(manifestSource) as ParityManifest;
  for (const entry of manifest.entries) {
    assert.equal(hasRouteEntry(bootstrapSource, entry.v6Route), true);
  }

  for (const additiveRoute of ['bible-quest', 'explorer', 'leader-center', 'ministry-announcements', 'challenges', 'help']) {
    assert.equal(hasRouteEntry(bootstrapSource, additiveRoute), true, '#/' + additiveRoute + ' should remain additive to V4 parity');
    assert.equal(manifest.entries.some(entry => entry.v4Route === additiveRoute), false, additiveRoute + ' must not rewrite the frozen V4 baseline');
  }
});
