import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { en } from '../src/content/locales/en.js';
import { tl } from '../src/content/locales/tl.js';

const source = await readFile(new URL('../src/features/assignments/index.js', import.meta.url), 'utf8');
const keys = Object.keys(en).filter(key => key.startsWith('assignments.'));
const placeholders = value => [...String(value).matchAll(/\{([^}]+)\}/g)].map(match => match[1]).sort();

test('Assignments EN/TL dictionaries share every key and interpolation contract', () => {
  assert.ok(keys.length >= 90, `expected broad Assignments inventory, found ${keys.length}`);
  for (const key of keys) {
    assert.equal(typeof tl[key], 'string', `Tagalog is missing ${key}`);
    assert.ok(tl[key].trim(), `Tagalog value is empty for ${key}`);
    assert.deepEqual(placeholders(tl[key]), placeholders(en[key]), `placeholder mismatch for ${key}`);
  }
});

test('Assignments uses the integrated localization owner while preserving source/user data', () => {
  assert.match(source, /from '\.\.\/\.\.\/app\/localization\.js'/);
  assert.match(source, /localization\.getLocale\(\)/);
  assert.match(source, /localization\.t\(key,\{locale,values\}\)/);
  assert.match(source, /esc\(row\.title\)/, 'assignment title must remain runtime/source data');
  assert.match(source, /esc\(row\.instructions\)/, 'assignment instructions must remain runtime/source data');
  assert.match(source, /esc\(progress\.submission\)/, 'member submission must remain runtime/source data');
  assert.match(source, /esc\(progress\.leaderFeedback\)/, 'leader feedback must remain runtime/source data');
});

test('migrated Assignments owner has no representative rendered English chrome literals', () => {
  for (const leak of ['CONGREGATION TASKS','Back to Community','No active assignments','Assigned to you','Open task','Close task','Start task','Mark complete','Privacy boundary','Publish assignment','Load audiences','Loading assignments…','Assignments could not load.']) {
    assert.equal(source.includes(leak), false, `Assignments source still embeds migrated English UI text: ${leak}`);
  }
});

test('Tagalog Assignments copy covers member, ministry, privacy, and status surfaces', () => {
  assert.equal(tl['nav.assignments'], 'Mga Gawain');
  assert.equal(tl['assignments.openTask'], 'Buksan ang gawain');
  assert.equal(tl['assignments.markComplete'], 'Markahang kumpleto');
  assert.equal(tl['assignments.publisher.heading'], 'Mag-publish ng gawain');
  assert.equal(tl['assignments.privacy.heading'], 'Hangganan ng privacy');
  assert.equal(tl['assignments.error.load'], 'Hindi ma-load ang Mga Gawain.');
});