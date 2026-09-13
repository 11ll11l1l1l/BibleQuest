import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const bootstrapUrl = new URL('../src/app/bootstrap.js', import.meta.url);

async function bootstrapSource() {
  return readFile(bootstrapUrl, 'utf8');
}

function indexOfOrFail(source, needle, label = needle) {
  const index = source.indexOf(needle);
  assert.notEqual(index, -1, `bootstrap must contain ${label}`);
  return index;
}

test('bootstrap retains one guarded startup owner and actionable failure UI', async () => {
  const source = await bootstrapSource();

  assert.match(source, /function start\(\)\s*\{/);
  assert.match(source, /try\s*\{\s*boot\(root\);\s*\}\s*catch\(error\)\s*\{\s*renderStartupFailure\(root,error\);\s*\}/s);
  assert.match(source, /data-startup-failure/);
  assert.match(source, /data-startup-reload/);
  assert.match(source, /DOMContentLoaded/);

  const startCalls = source.match(/\bstart\(\);/g) ?? [];
  assert.equal(startCalls.length, 1, 'bootstrap should expose one immediate startup call site');
});

test('bootstrap initializes fail-closed session state before constructing session-dependent services', async () => {
  const source = await bootstrapSource();

  const storeIndex = indexOfOrFail(source, "session:Object.freeze({status:'booting',authenticated:false,remoteAvailable:true,user:null,expiresAt:null,error:''})", 'booting guest-safe session state');
  const sessionIndex = indexOfOrFail(source, 'const session=createSessionService({auth:api.auth,store});', 'session service construction');
  const congregationIndex = indexOfOrFail(source, 'const congregation=createCongregationMembershipService({api,session});', 'congregation service construction');

  assert.ok(storeIndex < sessionIndex, 'store/session baseline must exist before session service construction');
  assert.ok(sessionIndex < congregationIndex, 'session must exist before congregation-scoped services');
});

test('bootstrap keeps one route table and one router owner for shell navigation', async () => {
  const source = await bootstrapSource();

  const routeTables = source.match(/const routes=Object\.freeze\(\{/g) ?? [];
  const routerConstructions = source.match(/createRouter\s*\(/g) ?? [];
  assert.equal(routeTables.length, 1, 'bootstrap should own one authoritative route table');
  assert.equal(routerConstructions.length, 1, 'bootstrap should construct one router');

  assert.match(source, /'not-found'\s*:/);
  assert.match(source, /router\.navigate\(/);
  assert.match(source, /router\.start\(\)/);
});

test('bootstrap mounts the shell before starting router delivery', async () => {
  const source = await bootstrapSource();

  const shellIndex = indexOfOrFail(source, 'shell=mountShell(', 'shell mount');
  const routerIndex = indexOfOrFail(source, 'router.start();', 'router start');

  assert.ok(shellIndex < routerIndex, 'route delivery must not begin before the shell mount exists');
});

test('bootstrap starts offline/session work without blocking initial router delivery', async () => {
  const source = await bootstrapSource();

  const routerIndex = indexOfOrFail(source, 'router.start();', 'router start');
  const offlineIndex = indexOfOrFail(source, "offlineShell.start().catch(error=>console.warn('Offline shell unavailable',error));", 'offline shell async start');
  const sessionIndex = indexOfOrFail(source, 'session.boot().then(()=>{', 'session async boot');

  assert.ok(routerIndex < offlineIndex, 'initial route should render before offline-shell startup settles');
  assert.ok(routerIndex < sessionIndex, 'initial route should render before session boot settles');
});

test('bootstrap retains centralized pagehide cleanup for stateful runtime owners', async () => {
  const source = await bootstrapSource();

  assert.match(source, /window\.addEventListener\('pagehide'/);
  for (const cleanup of [
    'unsubscribeStore()',
    'unsubscribeModeration()',
    'offlineShell.dispose()',
    'pwaInstall.dispose()',
    'presence.dispose()',
    'games.leave()',
    'recordings.dispose()',
    'session.dispose()'
  ]) {
    assert.ok(source.includes(cleanup), `pagehide cleanup must retain ${cleanup}`);
  }

  assert.match(source, /\{once:true\}\);/);
});
