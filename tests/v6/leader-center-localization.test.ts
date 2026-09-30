import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { en } from '../../src/content/locales/en.js';
import { tl } from '../../src/content/locales/tl.js';
import { ceb } from '../../src/content/locales/ceb.js';

const source = readFileSync(new URL('../../src/features/leader-center/index.js', import.meta.url), 'utf8');
const keys = Object.freeze([
  'leaderCenter.announcements.heading',
  'leaderCenter.announcements.description',
  'leaderCenter.announcements.open',
]);

test('Leader Center announcement copy comes from the structured locale catalogs', () => {
  for (const key of keys) {
    assert.match(source, new RegExp(`tr\\(['"]${key.replaceAll('.', '\\.') }['"]\\)`));
    assert.ok(String(en[key] || '').trim(), `English catalog missing ${key}`);
    assert.ok(String(tl[key] || '').trim(), `Tagalog catalog missing ${key}`);
    assert.ok(String(ceb[key] || '').trim(), `Cebuano catalog missing ${key}`);
  }

  assert.doesNotMatch(source, />Congregation announcements</);
  assert.doesNotMatch(source, />Publish a message for members of your active congregation\./);
  assert.doesNotMatch(source, />Open announcements</);

  assert.notEqual(tl[keys[0]], en[keys[0]], 'Tagalog announcement heading must not silently fall back to English');
  assert.notEqual(ceb[keys[0]], en[keys[0]], 'Cebuano announcement heading must not silently fall back to English');
});
