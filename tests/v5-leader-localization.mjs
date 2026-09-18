import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { en, LOCALE_KEY_INVENTORY } from '../src/content/locales/en.js';
import { tl } from '../src/content/locales/tl.js';
import { ceb } from '../src/content/locales/ceb.js';

const source = await readFile(new URL('../src/features/leader-center/index.js', import.meta.url), 'utf8');
const adminSource = await readFile(new URL('../src/features/admin-console/index.js', import.meta.url), 'utf8');
const leaderKeys = LOCALE_KEY_INVENTORY.filter(key => key.startsWith('leaderCenter.'));

assert.ok(leaderKeys.length >= 40, 'leader-facing copy must have a meaningful shared key inventory');
for (const [locale, dictionary] of Object.entries({ tl, ceb })) {
  for (const key of leaderKeys) {
    assert.ok(String(dictionary[key] || '').trim(), `${locale} is missing ${key}`);
    assert.notEqual(dictionary[key], en[key], `${locale} still leaks English for ${key}`);
  }
}

assert.match(source, /localization\.getLocale\(\)/);
assert.match(source, /tr\('leaderCenter\.status\.completed'\)/);
assert.doesNotMatch(source, />Review member responses</);
assert.doesNotMatch(source, />Open all Assignments</);

const adminKeys = LOCALE_KEY_INVENTORY.filter(key => key.startsWith('adminConsole.'));
assert.ok(adminKeys.length >= 10, 'admin auth/state copy must have a shared key inventory');
for (const [locale, dictionary] of Object.entries({ tl, ceb })) {
  for (const key of adminKeys) assert.ok(String(dictionary[key] || '').trim(), `${locale} is missing ${key}`);
}
assert.match(adminSource, /tr\('adminConsole\.signedOut\.heading'\)/);
assert.match(adminSource, /tr\('adminConsole\.denied\.description'\)/);
assert.doesNotMatch(adminSource, />Sign in required</);
assert.doesNotMatch(adminSource, />Owner\/Admin access required</);

const cebuanoEnglishFallbacks = LOCALE_KEY_INVENTORY.filter(key => ceb[key] === en[key]);
assert.ok(cebuanoEnglishFallbacks.length <= 93, `Cebuano fallback count regressed to ${cebuanoEnglishFallbacks.length}`);

console.log(`BibleQuest V5 leader localization regression passed (${leaderKeys.length} leader keys; ${cebuanoEnglishFallbacks.length} Cebuano English fallbacks remain).`);
