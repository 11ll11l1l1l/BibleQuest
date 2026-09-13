import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const STATIC_SWEEP = [
  'tests/v4-whole-app-audit-static.mjs'
];

const BROWSER_SWEEP = [
  'tests/v4-whole-app-browser-states-smoke.mjs',
  'tests/v4-whole-app-deep-routes-smoke.mjs',
  'tests/v4-assignments-page-smoke.mjs',
  'tests/v4-daily-journey-page-smoke.mjs',
  'tests/v3-offline-shell-smoke.mjs',
  'tests/v3-operational-recovery-smoke.mjs'
];

for (const file of [...STATIC_SWEEP, ...BROWSER_SWEEP]) {
  if (!existsSync(file)) throw new Error(`Section G sweep dependency is missing: ${file}`);
}

for (const file of STATIC_SWEEP) {
  const result = spawnSync(process.execPath, [file], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Section G static sweep failed in ${file} (exit ${result.status}).`);
}

console.log('BibleQuest V5 Section G static state sweep passed.');
console.log('BROWSER-AUTO companions required on the same exact candidate:');
for (const file of BROWSER_SWEEP) console.log(` - ${file}`);
