import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { filterRecordingRows } from '../src/features/recordings/index.js';
import { recordingsEn, recordingsTl } from '../src/content/locales/recordings.js';

const source = await readFile(new URL('../src/features/recordings/index.js', import.meta.url), 'utf8');
const rows = Object.freeze([
  Object.freeze({ id: 'featured', title: 'Sunday Worship', description: 'Grace and prayer', featured: true }),
  Object.freeze({ id: 'study', title: 'Bible Study', description: 'The book of Romans', featured: false }),
  Object.freeze({ id: 'youth', title: 'Youth Night', description: '', featured: true })
]);

test('Recordings filter searches only loaded title and description metadata', () => {
  assert.deepEqual(filterRecordingRows(rows, { query: 'WORSHIP' }).map(row => row.id), ['featured']);
  assert.deepEqual(filterRecordingRows(rows, { query: 'romans' }).map(row => row.id), ['study']);
  assert.deepEqual(filterRecordingRows(rows, { query: '  ' }).map(row => row.id), ['featured', 'study', 'youth']);
  assert.deepEqual(rows.map(row => row.id), ['featured', 'study', 'youth'], 'filtering must not mutate canonical loaded rows');
});

test('Recordings featured filter composes with search without inventing categories', () => {
  assert.deepEqual(filterRecordingRows(rows, { featuredOnly: true }).map(row => row.id), ['featured', 'youth']);
  assert.deepEqual(filterRecordingRows(rows, { query: 'bible', featuredOnly: true }), []);
  assert.doesNotMatch(source, /row\??\.(?:platform|category|rank(?:ing)?)/i);
  assert.match(source, /filterRecordingRows\(rows, \{ query: searchQuery, featuredOnly \}\)/);
});

test('Recordings filter copy remains complete and localized in its scoped EN/TL dictionary', () => {
  const keys = [
    'recordings.filter.heading', 'recordings.filter.searchLabel', 'recordings.filter.searchPlaceholder',
    'recordings.filter.scopeLabel', 'recordings.filter.all', 'recordings.filter.featured',
    'recordings.filter.results', 'recordings.filter.empty.heading', 'recordings.filter.empty.description'
  ];
  for (const key of keys) {
    assert.ok(recordingsEn[key]?.trim(), `missing English copy for ${key}`);
    assert.ok(recordingsTl[key]?.trim(), `missing Tagalog copy for ${key}`);
  }
  assert.equal(recordingsTl['recordings.filter.searchLabel'], 'Maghanap sa mga na-load na video');
  assert.equal(recordingsTl['recordings.filter.featured'], 'Itinatampok lamang');
});

test('Recordings presentation owns filtering without a new service or persistence path', () => {
  assert.match(source, /data-recordings-search/);
  assert.match(source, /data-recordings-feature-filter/);
  assert.match(source, /data-recordings-filter-status/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|supabase|\.from\(|fetch\(/);
});
