import assert from 'node:assert/strict';
import test from 'node:test';

import { convertBsbWordAlignments, remapBsbAlignmentVerseIds } from '../../scripts/v6-import-bsb-word-alignments.mjs';

const metadata = {
  translationId: 'bsb', source: 'Barry Hays / OpenBible candidate', license: 'CC0 claim awaiting review',
  alignmentSource: 'BSB-publishing/bsb-align output',
  alignmentRevision: 'bdb859afc427b215b78e12ee4a7798c32b7b91e0',
  contentVersion: 'audio-candidate-1',
};
const pack = [{ c: 1, v: 1, t: 'In the beginning God created the heavens and the earth.' }];
const words = [{
  book: 'GEN', chapter: '001', verses: {
    '1': [
      { text: 'In', start: 0.1, end: 0.2, score: 0.99 },
      { text: 'the', start: 0.21, end: 0.3, score: 0.99 },
      { text: 'beginning', start: 0.31, end: 0.7, score: 0.8 },
      { text: 'God', start: 0.71, end: 0.9, score: 0.9 },
      { text: 'created', start: 0.91, end: 1.2, score: 0.9 },
      { text: 'the', start: 1.21, end: 1.3, score: 0.9 },
      { text: 'heavens', start: 1.31, end: 1.6, score: 0.9 },
      { text: 'and', start: 1.61, end: 1.7, score: 0.9 },
      { text: 'the', start: 1.71, end: 1.8, score: 0.9 },
      { text: 'earth', start: 1.81, end: 2, score: 0.2 },
    ],
  },
}];
const durations = [{ book: 'GEN', chapter: 1, durationSeconds: 5 }];

test('BSB word timings convert only against matching current verse text and bind to its immutable version', () => {
  const result = convertBsbWordAlignments({
    records: words, durations, bookPacks: { GEN: pack }, metadata,
    scriptureContentVersion: 'sha256-current-bsb-12345678901234567890', requireComplete: false,
  });
  assert.equal(result.alignments[0].scriptureContentVersion, 'sha256-current-bsb-12345678901234567890');
  assert.equal(result.alignments[0].alignmentSource,
    'BSB-publishing/bsb-align output@bdb859afc427b215b78e12ee4a7798c32b7b91e0');
  assert.deepEqual(result.alignments[0].verses, [{ verse: 1, startSeconds: 0.1, endSeconds: 2 }]);
  assert.equal(result.audit.words, 10);
  assert.equal(result.audit.lowConfidenceWords, 1);
  assert.ok(Math.abs(result.audit.rows[0].averageWordScore - 0.838) < 1e-12);
});

test('BSB word timing import rejects stale text, partial verse coverage, bad duration and missing timing', () => {
  const args = { durations, bookPacks: { GEN: pack }, metadata, scriptureContentVersion: 'bsb-current', requireComplete: false };
  assert.throws(() => convertBsbWordAlignments({ ...args, records: [{ ...words[0], verses: { '1': [{ ...words[0].verses['1'][0], text: 'At' }] } }] }), /word text mismatch.*GEN-1:1/i);
  assert.throws(() => convertBsbWordAlignments({ ...args, records: [{ ...words[0], verses: {} }] }), /covers 0 verses/i);
  assert.throws(() => convertBsbWordAlignments({ ...args, durations: [], records: words }), /missing measured audio duration/i);
  assert.throws(() => convertBsbWordAlignments({ ...args, records: [{ ...words[0], verses: { '1': [{ ...words[0].verses['1'][0], end: 9 }] } }] }), /out-of-duration bounds/i);
});

test('full BSB import mode requires every chapter alignment and duration record', () => {
  assert.throws(() => convertBsbWordAlignments({
    records: words, durations, bookPacks: { GEN: pack }, metadata, scriptureContentVersion: 'bsb-current',
  }), /full BSB timing import incomplete/i);
});


test('BSB word timing import requires an immutable upstream alignment revision', () => {
  const args = {
    records: words, durations, bookPacks: { GEN: pack },
    scriptureContentVersion: 'bsb-current', requireComplete: false,
  };
  const { alignmentRevision: _missing, ...withoutRevision } = metadata;
  assert.throws(() => convertBsbWordAlignments({ ...args, metadata: withoutRevision }), /alignmentRevision/i);
  assert.throws(() => convertBsbWordAlignments({
    ...args, metadata: { ...metadata, alignmentRevision: 'main' },
  }), /immutable 40-hex Git commit/i);
});


test('BSB alignment import remaps line ordinals to canonical verse ids without shifting omitted verse numbers', () => {
  const scriptureContentVersion = 'bsb-current-gap-fixture';
  const raw = [{
    book: 'ACT', chapter: '008', verses: {
      '1': [
        { text: 'Look', start: 0.1, end: 0.2, score: 0.9 },
        { text: 'here', start: 0.21, end: 0.3, score: 0.9 },
        { text: 'is', start: 0.31, end: 0.4, score: 0.9 },
        { text: 'water', start: 0.41, end: 0.6, score: 0.9 },
      ],
      '2': [
        { text: 'He', start: 1.0, end: 1.1, score: 0.9 },
        { text: 'stopped', start: 1.11, end: 1.3, score: 0.9 },
        { text: 'the', start: 1.31, end: 1.4, score: 0.9 },
        { text: 'chariot', start: 1.41, end: 1.7, score: 0.9 },
      ],
    },
  }];
  const exportManifest = {
    translationId: 'bsb',
    scriptureContentVersion,
    files: [{ book: 'ACT', chapter: 8, verseNumbers: [1, 3] }],
  };
  const remapped = remapBsbAlignmentVerseIds({ records: raw, exportManifest, scriptureContentVersion });
  assert.deepEqual(Object.keys(remapped[0].verses), ['1', '3']);

  const result = convertBsbWordAlignments({
    records: remapped,
    durations: [{ book: 'ACT', chapter: 8, durationSeconds: 3 }],
    bookPacks: { ACT: [
      { c: 8, v: 1, t: 'Look, here is water.' },
      { c: 8, v: 3, t: 'He stopped the chariot.' },
    ] },
    metadata,
    scriptureContentVersion,
    requireComplete: false,
  });
  assert.deepEqual(result.alignments[0].verses, [
    { verse: 1, startSeconds: 0.1, endSeconds: 0.6 },
    { verse: 3, startSeconds: 1, endSeconds: 1.7 },
  ]);
});

test('BSB alignment verse remap rejects a stale Scripture export manifest', () => {
  assert.throws(() => remapBsbAlignmentVerseIds({
    records: words,
    scriptureContentVersion: 'current',
    exportManifest: {
      translationId: 'bsb',
      scriptureContentVersion: 'stale',
      files: [{ book: 'GEN', chapter: 1, verseNumbers: [1] }],
    },
  }), /different Scripture content revision/i);
});
