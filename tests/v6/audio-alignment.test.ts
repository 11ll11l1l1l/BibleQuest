import assert from 'node:assert/strict';
import test from 'node:test';

import {
  audioTimeForVerse,
  validateChapterAlignment,
  verseAtAudioTime,
  type ScriptureChapterAlignment,
} from '../../src/v6/reader/audio-alignment.ts';

const alignment: ScriptureChapterAlignment = {
  schemaVersion: 1,
  translationId: 'bsb',
  contentVersion: 'fixture-1',
  scriptureContentVersion: 'bsb-fixture-1',
  book: 'JHN',
  chapter: 3,
  durationSeconds: 90,
  source: 'licensed audio fixture',
  license: 'fixture permission record',
  alignmentSource: 'word-level timing export v1',
  verses: [
    { verse: 1, startSeconds: 0, endSeconds: 21.4 },
    { verse: 2, startSeconds: 21.4, endSeconds: 48 },
    { verse: 3, startSeconds: 48, endSeconds: 89.9 },
  ],
};

test('chapter alignment validates identity, canonical verse ordering and provenance', () => {
  assert.deepEqual(validateChapterAlignment(alignment, {
    translationId: 'bsb', book: 'JHN', chapter: 3, verseCount: 3,
  }), { valid: true, issues: [] });
  assert.match(validateChapterAlignment(alignment, { translationId: 'niv' }).issues[0], /translation identity/);
  assert.match(validateChapterAlignment(alignment, { verseCount: 4 }).issues[0], /verse count/);
  assert.match(validateChapterAlignment(alignment, { verseNumbers: [1, 2, 4] }).issues[0], /verse identity/);
});

test('alignment rejects missing verse rows, overlaps, duration overruns and missing evidence', () => {
  const invalid = {
    ...alignment,
    alignmentSource: '',
    verses: [
      alignment.verses[0],
      { verse: 3, startSeconds: 20, endSeconds: 40 },
      { verse: 3, startSeconds: 40, endSeconds: 91 },
    ],
  };
  const result = validateChapterAlignment(invalid);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some(issue => /provenance/.test(issue)));
  assert.ok(result.issues.some(issue => /strictly increasing/.test(issue)));
  assert.ok(result.issues.some(issue => /overlaps/.test(issue)));
  assert.ok(result.issues.some(issue => /exceeds audio duration/.test(issue)));
});

test('time and verse conversions use half-open timing intervals and reject gaps', () => {
  assert.equal(verseAtAudioTime(alignment, 0), 1);
  assert.equal(verseAtAudioTime(alignment, 21.4), 2);
  assert.equal(verseAtAudioTime(alignment, 48), 3);
  assert.equal(verseAtAudioTime(alignment, 89.9), null);
  assert.equal(verseAtAudioTime(alignment, -1), null);
  assert.equal(audioTimeForVerse(alignment, 2), 21.4);
  assert.equal(audioTimeForVerse(alignment, 4), null);
});


test('alignment supports canonical verse-number gaps without shifting seek identity', () => {
  const gap: ScriptureChapterAlignment = {
    ...alignment,
    book: 'ACT',
    chapter: 8,
    verses: [
      { verse: 1, startSeconds: 0, endSeconds: 20 },
      { verse: 3, startSeconds: 20, endSeconds: 50 },
      { verse: 4, startSeconds: 50, endSeconds: 89 },
    ],
  };
  assert.deepEqual(validateChapterAlignment(gap, {
    translationId: 'bsb', book: 'ACT', chapter: 8, verseCount: 3, verseNumbers: [1, 3, 4],
  }), { valid: true, issues: [] });
  assert.equal(audioTimeForVerse(gap, 2), null);
  assert.equal(audioTimeForVerse(gap, 3), 20);
  assert.equal(verseAtAudioTime(gap, 25), 3);
});
