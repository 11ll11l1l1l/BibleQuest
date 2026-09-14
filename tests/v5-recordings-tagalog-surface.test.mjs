import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { recordingsEn, recordingsTl, RECORDINGS_LOCALE_KEY_INVENTORY } from '../src/content/locales/recordings.js';

const source = await readFile(new URL('../src/features/recordings/index.js', import.meta.url), 'utf8');
const placeholders = value => [...String(value).matchAll(/\{([^}]+)\}/g)].map(match => match[1]).sort();

test('Videos EN/TL dictionaries share one stable key inventory and interpolation contract', () => {
  assert.ok(RECORDINGS_LOCALE_KEY_INVENTORY.length >= 25, `expected bounded Videos inventory, found ${RECORDINGS_LOCALE_KEY_INVENTORY.length}`);
  assert.deepEqual(RECORDINGS_LOCALE_KEY_INVENTORY, Object.keys(recordingsEn).sort());
  assert.deepEqual(RECORDINGS_LOCALE_KEY_INVENTORY, Object.keys(recordingsTl).sort());
  for (const key of RECORDINGS_LOCALE_KEY_INVENTORY) {
    assert.match(key, /^recordings\./);
    assert.ok(recordingsEn[key]?.trim(), `English value is empty for ${key}`);
    assert.ok(recordingsTl[key]?.trim(), `Tagalog value is empty for ${key}`);
    assert.deepEqual(placeholders(recordingsTl[key]), placeholders(recordingsEn[key]), `placeholder mismatch for ${key}`);
  }
});

test('Videos uses the integrated localization owner with scoped plain dictionaries and English fallback', () => {
  assert.match(source, /from '\.\.\/\.\.\/app\/localization\.js'/);
  assert.match(source, /from '\.\.\/\.\.\/content\/locales\/recordings\.js'/);
  assert.match(source, /localization\.getLocale\(\)/);
  assert.match(source, /localization\.t\(key,/);
  assert.match(source, /dictionaries: recordingsDictionaries/);
});

test('Videos keeps recording identity and content as escaped runtime data', () => {
  assert.match(source, /data-video-select="\$\{escapeHtml\(row\.id\)\}"/);
  assert.match(source, /escapeHtml\(row\.title\)/);
  assert.match(source, /escapeHtml\(row\.description\)/);
  assert.match(source, /recordings\.select\(select\.dataset\.videoSelect, frameHost\)/);
  assert.match(source, /recordings\.addVideo\(/);
  assert.doesNotMatch(source, /YouTube Data API|webhook|scheduled external|ingestion daemon/i);
});

test('migrated Videos renderer no longer embeds representative English UI chrome', () => {
  for (const leak of [
    '>Featured<',
    '>Add a video<',
    '>Back home<',
    '<h1>Worship and Bible study videos</h1>',
    '<h2>No videos yet</h2>',
    '<h2>Choose a video</h2>',
    '>Add video<'
  ]) assert.equal(source.includes(leak), false, `Videos source still embeds migrated English UI text: ${leak}`);
});

test('Tagalog Videos copy covers viewing, empty state and curator actions', () => {
  assert.equal(recordingsTl['recordings.pageTitle'], 'Mga Video');
  assert.equal(recordingsTl['recordings.heading'], 'Mga video para sa pagsamba at pag-aaral ng Biblia');
  assert.equal(recordingsTl['recordings.nowPlaying.choose'], 'Pumili ng video');
  assert.equal(recordingsTl['recordings.empty.heading'], 'Wala pang mga video');
  assert.equal(recordingsTl['recordings.curator.open'], 'Magdagdag ng video');
  assert.equal(recordingsTl['recordings.backHome'], 'Bumalik sa Home');
});
