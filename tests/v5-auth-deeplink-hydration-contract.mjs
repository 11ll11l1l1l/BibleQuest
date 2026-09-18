import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const bootstrap = await readFile(new URL('../src/app/bootstrap.js', import.meta.url), 'utf8');

const routerStart = bootstrap.indexOf('router.start();');
const sessionBoot = bootstrap.indexOf('session.boot().then(()=>{');
assert.ok(routerStart >= 0, 'bootstrap must still start the router');
assert.ok(sessionBoot >= 0, 'bootstrap must still boot the session');
assert.ok(routerStart < sessionBoot, 'router should remain responsive before remote session restoration completes');

const hydrationBlock = bootstrap.slice(sessionBoot, bootstrap.indexOf('.catch(error=>console.error(\'Session boot failed\'', sessionBoot));
assert.match(
  hydrationBlock,
  /router\.navigate\(router\.current\(\)\);/,
  'session hydration must force one re-render of the exact current route so auth-gated deep links cannot remain stale'
);

const rerenders = (bootstrap.match(/router\.navigate\(router\.current\(\)\);/g) || []).length;
assert.equal(rerenders, 1, 'bootstrap must force exactly one current-route re-render after session hydration');

console.log('PASS V5 authenticated deep-link hydration contract');
