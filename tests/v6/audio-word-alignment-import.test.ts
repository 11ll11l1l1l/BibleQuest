import assert from 'node:assert/strict';
import test from 'node:test';

import { convertBsbWordAlignments } from '../../scripts/v6-import-bsb-word-alignments.mjs';

const metadata = {
  translationId: 'bsb', source: 'Barry Hays / OpenBible candidate', license: 'CC0 claim awaiting review',
  alignmentSource: 'BSB-publishing/bsb-align output', contentVersion: 'audio-candidate-1',
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
