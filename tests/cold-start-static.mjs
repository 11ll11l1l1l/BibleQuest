import fs from 'node:fs';
import assert from 'node:assert/strict';

const index=fs.readFileSync('index.html','utf8');
const hardening=fs.readFileSync('cold-start-hardening.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const cacheVersion=Number(sw.match(/const CACHE='biblequest-v(\d+)'/)?.[1]||0);

const pos=name=>index.indexOf(`<script src="${name}"></script>`);
assert.ok(pos('cloud-config.js')>=0,'cloud config must load');
assert.ok(pos('cold-start-hardening.js')>pos('cloud-config.js'),'cold-start hardening must load after cloud config');
assert.ok(pos('account.js')>pos('cold-start-hardening.js'),'account must start after state hardening');
assert.ok(pos('guest-access-hardening.js')>pos('account.js'),'guest hardening must load after canonical account runtime');
assert.ok(pos('app.js')>pos('guest-access-hardening.js'),'guest startup behavior must be ready before main app runtime');
assert.ok(pos('onboarding-tutorial.js')>pos('guest-access-hardening.js')&&pos('onboarding-tutorial.js')<pos('app.js'),'new-account tutorial listener must be ready before app runtime');

for(const key of [
  'biblequest_state_v4','biblequest_growth_v1','biblequest_reader_v1','biblequest_sequence_v1',
  'biblequest_story_journey_v1','biblequest_couples_v1','biblequest_open_review_v1','biblequest_learning_v1'
])assert.ok(hardening.includes(key),`cold-start sanitizer should cover ${key}`);
assert.match(hardening,/biblequest_transform_v2/);
assert.match(hardening,/biblequest_transformation_v1/);
assert.match(hardening,/biblequest_learning_engine_v1/);
assert.match(hardening,/__bq_alias/);
assert.match(hardening,/setInterval\(primeAliases,5000\)/);
assert.doesNotMatch(hardening,/Storage\.prototype\.setItem/);
assert.match(hardening,/crypto\.randomUUID/);
assert.match(hardening,/blocking:false/);
assert.match(hardening,/removeLegacyGate/);
assert.doesNotMatch(hardening,/Opening BibleQuest/);
assert.doesNotMatch(hardening,/function ensureGate/);
assert.doesNotMatch(hardening,/function tick\(/);
assert.match(hardening,/unhandledrejection/);
assert.match(hardening,/cold_start_backup/);

assert.ok(cacheVersion>=66,`guest-first cold-start baseline requires PWA v66+, got v${cacheVersion||'missing'}`);
for(const file of ['./cloud-config.js','./cold-start-hardening.js','./account.js','./guest-access-hardening.js','./linked-activities.js','./team-center.js'])assert.ok(sw.includes(`'${file}'`),`service worker should include ${file}`);
assert.match(sw,/INSTALL_REQUIRED=.*cold-start-hardening\.js/);
assert.match(sw,/INSTALL_REQUIRED=.*guest-access-hardening\.js/);

console.log(`fail-open guest cold-start and progress-restore contracts present · PWA v${cacheVersion}`);
