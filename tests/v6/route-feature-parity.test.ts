import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const baselineSha = '7420bbba789ce21e02ac667f98558681e71d2a28';
const baselineRoutes = Object.freeze([
  'home','bible-quest','mission','learn','study','deep-questions','story-journey',
  'wisdom-situations','adaptive-learning','bible-world','explorer','open-review',
  'private-notes','cloud-notes','couples-family','couples-cloud','journey-groups',
  'encouragements','community','live-rooms','ministry-hub','leader-center',
  'notification-center','workspace','team-center','leaderboards','recognition',
  'assignments','content-review','reader','challenges','play','grow','my-journey',
  'transform','personality-profile','psychometrics','avatar-vault','my-mission',
  'calendar','recordings','media','more','help','accessibility','backup',
  'congregation','account'
]);

function runtimeRoutes(source: string) {
  const start = source.indexOf('const routes=Object.freeze({');
  const end = source.indexOf("\n  });", start);
  assert.ok(start >= 0 && end > start, 'runtime route registry must remain discoverable');
  return source.slice(start, end).split('\n').flatMap(line => {
    const match = line.match(/^    (?:'([^']+)'|([a-z][\\w-]*)):\(\)=>/);
    return match ? [match[1] || match[2]] : [];
  }).filter(route => route !== 'not-found');
}

test('V6 retains every user-facing route from the certified production parity baseline', () => {
  const bootstrap = fs.readFileSync(new URL('../../src/app/bootstrap.js', import.meta.url), 'utf8');
  const current = runtimeRoutes(bootstrap);
  const missing = baselineRoutes.filter(route => !current.includes(route));
  assert.deepEqual(missing, [], 'V6 removed route(s) from parity baseline ' + baselineSha);
  assert.equal(new Set(current).size, current.length, 'runtime route registry must not contain duplicate route owners');
});

test('built-browser canonical deep-link matrix covers every current user-facing runtime route', () => {
  const bootstrap = fs.readFileSync(new URL('../../src/app/bootstrap.js', import.meta.url), 'utf8');
  const browser = fs.readFileSync(new URL('./built-artifact-browser.mjs', import.meta.url), 'utf8');
  const current = runtimeRoutes(bootstrap);
  const matrixMatch = browser.match(/const canonicalRoutes = \[([\s\S]*?)\n\];/);
  assert.ok(matrixMatch, 'built browser canonical route matrix must remain discoverable');
  const covered = [...matrixMatch[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
  assert.deepEqual(
    current.filter(route => !covered.includes(route)),
    [],
    'every current user-facing route must have built-artifact direct deep-link evidence',
  );
});
