// BibleQuest V5: My Journey wiring/composition/localization static contract.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const service = read('src/app/my-journey.js');
assert.ok(!/from\(['"]bible_/.test(service), 'My Journey must never query Supabase tables directly - composition over existing owners only.');
assert.ok(!/localStorage|sessionStorage/.test(service), 'My Journey must use the existing progress/assignments owners for state, not a new storage mechanism.');
assert.ok(service.includes('never surface housekeeping/non-meaningful events'), 'The meaningful-only filter must stay documented so it is not silently removed.');
assert.ok(!/label:\s*['"]/.test(service), 'The service must return localization keys, not pre-rendered English labels - that belongs in the presentation layer.');

const bootstrap = read('src/app/bootstrap.js');
assert.ok(bootstrap.includes("import { createMyJourneyService } from './my-journey.js';"), 'bootstrap.js must import the My Journey service.');
assert.ok(
  bootstrap.includes("import { myJourneyPage } from '../features/my-journey/index.js';") ||
  bootstrap.includes("const myJourneyPage = args => lazyFeaturePage('my-journey', 'myJourneyPage', args);"),
  'bootstrap.js must bind the My Journey page through a direct or V6 lazy feature owner.'
);
assert.ok(bootstrap.includes("'my-journey':()=>myJourneyPage("), 'bootstrap.js must register the my-journey route.');
const progressLine = bootstrap.split('\n').findIndex(line => line.includes('const progress=createProgressService'));
const assignmentsLine = bootstrap.split('\n').findIndex(line => line.includes('const assignments=createAssignmentsService'));
const myJourneyLine = bootstrap.split('\n').findIndex(line => line.includes('const myJourney=createMyJourneyService'));
assert.ok(progressLine >= 0 && assignmentsLine >= 0 && myJourneyLine >= 0, 'Could not locate all three dependency declarations.');
assert.ok(progressLine < myJourneyLine && assignmentsLine < myJourneyLine, 'progress and assignments must be declared before myJourney (temporal-dead-zone guard).');

const grow = read('src/features/progress/index.js');
assert.ok(grow.includes('data-open-my-journey'), 'Grow page must expose a My Journey entry point.');

const page = read('src/features/my-journey/index.js');
assert.ok(page.includes("import { localization } from '../../app/localization.js';"), 'My Journey must use the existing localization owner, matching Transform/Account/Recordings.');
assert.ok(page.includes("localization.getLocale()") && page.includes('localization.t('), 'My Journey must resolve every user-facing string through the localization helper.');

// --- Locale key parity: en and tl must define every myjourney.* key used ---
const en = read('src/content/locales/en.js');
const tl = read('src/content/locales/tl.js');
const usedKeys = [...page.matchAll(/text\('(myjourney\.[a-zA-Z.]+)'/g)].map(m => m[1]);
assert.ok(usedKeys.length >= 8, 'Expected the presentation layer to reference a real set of myjourney.* keys.');
for (const key of usedKeys) {
  assert.ok(en.includes(`'${key}':`), `en.js is missing the key used by My Journey: ${key}`);
  assert.ok(tl.includes(`'${key}':`), `tl.js is missing the key used by My Journey: ${key}`);
}
for (const type of ['reader', 'transformBasic', 'transformFull', 'dailyJourney', 'study', 'storyJourney', 'review', 'adaptive', 'wisdom', 'game', 'memoryGame', 'assignment', 'generic']) {
  const key = `myjourney.type.${type}`;
  assert.ok(en.includes(`'${key}':`), `en.js is missing event-type key: ${key}`);
  assert.ok(tl.includes(`'${key}':`), `tl.js is missing event-type key: ${key}`);
}

console.log('BibleQuest v5 My Journey static contract passed.');
