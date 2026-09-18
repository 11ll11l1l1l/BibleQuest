import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const [readerService, readerFeature, availabilityContract] = await Promise.all([
  read('src/app/reader.js'),
  read('src/features/reader/index.js'),
  read('src/app/offline-scripture-status.js')
]);

assert.match(readerService, /from '\.\/offline-scripture-status\.js'/, 'Reader service must consume the integrated Phase 5 availability contract.');
assert.match(readerService, /createOfflineScriptureAvailability\(\{ bibleService: bible \}\)/, 'Reader service must delegate availability to the integrated Bible-backed contract.');
assert.match(readerService, /offlineScripture\.getStatus\(state\.translation, state\.book\)/, 'Reader status must follow the currently selected translation and book.');
assert.match(readerService, /getOfflineStatus,/, 'Reader service must expose its availability status to the Reader feature.');

assert.match(readerFeature, /data-reader-offline-status/, 'Reader UI must expose a stable offline-status surface.');
assert.match(readerFeature, /Available offline/, 'Reader UI must distinguish available cached Scripture.');
assert.match(readerFeature, /Not available offline/, 'Reader UI must distinguish supported but unavailable Scripture.');
assert.match(readerFeature, /Online required/, 'Reader UI must distinguish translations that require network access.');
assert.match(readerFeature, /const offlineStatus = await getOfflineStatus\(\)/, 'Normal Reader loads must resolve availability alongside the passage.');
assert.match(readerFeature, /renderError\(error, offlineStatus\)/, 'Reader load failures must retain the availability state rather than hiding it.');

assert.doesNotMatch(readerFeature, /from ['"]\.\.\/\.\.\/core\/bible\.js['"]/, 'Reader UI must not bypass the Reader/Bible service boundary.');
assert.doesNotMatch(readerFeature, /\bcaches\s*\./, 'Reader UI must not own CacheStorage behavior.');
assert.doesNotMatch(readerService, /\bcaches\s*\./, 'Reader service must not duplicate CacheStorage ownership.');

assert.match(availabilityContract, /createOfflineScriptureAvailability/, 'Integrated availability contract must remain present.');
assert.match(availabilityContract, /probeService\.loadBook\(translation\.id, book\.code, \{ persistOffline: false \}\)/, 'Availability must continue probing through authoritative Bible cache ownership.');
assert.match(availabilityContract, /available: false,[\s\S]*supported: false/, 'Non-offline translation state must remain explicit.');

console.log('PASS v5-reader-offline-availability: Reader consumes integrated availability without duplicating cache ownership.');
