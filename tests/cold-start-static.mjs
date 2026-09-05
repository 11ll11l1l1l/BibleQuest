import fs from 'node:fs';
import assert from 'node:assert/strict';

const index=fs.readFileSync('index.html','utf8');
const hardening=fs.readFileSync('cold-start-hardening.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');

const pos=name=>index.indexOf(`<script src="${name}"></script>`);
assert.ok(pos('cloud-config.js')>=0,'cloud config must load');
assert.ok(pos('cold-start-hardening.js')>pos('cloud-config.js'),'cold-start hardening must load after cloud config');
assert.ok(pos('account.js')>pos('cold-start-hardening.js'),'account must start after state hardening');
assert.ok(pos('app.js')>pos('account.js'),'account bootstrap must begin before main app runtime');
assert.ok(pos('onboarding-tutorial.js')>pos('account.js')&&pos('onboarding-tutorial.js')<pos('app.js'),'new-account tutorial listener must be ready before app runtime');

assert.match(hardening,/biblequest_state_v4/);
assert.match(hardening,/biblequest_growth_v1/);
assert.match(hardening,/crypto\.randomUUID/);
assert.match(hardening,/bqStartupGate/);
assert.match(hardening,/unhandledrejection/);
assert.match(hardening,/cold_start_backup/);

assert.match(sw,/biblequest-v61/);
for(const file of ['./cloud-config.js','./cold-start-hardening.js','./account.js','./linked-activities.js','./team-center.js'])assert.ok(sw.includes(`'${file}'`),`service worker should include ${file}`);
assert.match(sw,/INSTALL_REQUIRED=.*cold-start-hardening\.js/);

console.log('cold-start static contracts present');
