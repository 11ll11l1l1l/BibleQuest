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
  /if\(session\.isAuthenticated\(\)\)router\.navigate\(router\.current\(\)\);/,
  'restored authenticated sessions must force one re-render of the exact current route so auth-gated deep links cannot remain stale'
);

const rerenders = (bootstrap.match(/router\.navigate\(router\.current\(\)\);/g) || []).length;
assert.equal(rerenders, 1, 'bootstrap must contain exactly one current-route hydration re-render');
assert.doesNotMatch(
  hydrationBlock,
  /\n\s*router\.navigate\(router\.current\(\)\);/,
  'signed-out/local-first session completion must not unconditionally remount the current route'
);

console.log('PASS V5 authenticated deep-link hydration contract');
