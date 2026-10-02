import assert from 'node:assert/strict';
import test from 'node:test';

import { buildBsbAlignmentManifest, validateBsbAlignmentManifest } from '../../scripts/v6-bsb-alignment-manifest.mjs';
import { convertBsbWordAlignments, remapBsbAlignmentVerseIds } from '../../scripts/v6-import-bsb-word-alignments.mjs';
import { computeHaysAudioInventoryDigest } from '../../scripts/v6-hays-source-inventory.mjs';

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

function partialHaysInventory(durationSeconds = 5) {
  const files = [{
    book: 'GEN', chapter: 1, filename: 'BSB_01_Gen_001_H.mp3',
    byteLength: 12345, sha256: 'c'.repeat(64), durationSeconds,
    sourceUrl: 'https://openbible.com/audio/hays/BSB_01_Gen_001_H.mp3',
  }];
  const inventorySha256 = computeHaysAudioInventoryDigest(files);
  return {
    schemaVersion: 1,
    translationId: 'bsb',
    narrator: 'Barry Hays',
    source: 'OpenBible Barry Hays',
    sourceBaseUrl: 'https://openbible.com/audio/hays/',
    chapters: files.length,
    totalBytes: files[0].byteLength,
    totalDurationSeconds: durationSeconds,
    inventorySha256,
    contentVersion: 'sha256-' + inventorySha256,
    files,
  };
}

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
  assert.equal(result.manifest.audioContentVersion, metadata.contentVersion);
  assert.equal(result.manifest.scriptureContentVersion, 'sha256-current-bsb-12345678901234567890');
  assert.equal(result.manifest.alignmentRevision, metadata.alignmentRevision);
  assert.equal(result.manifest.complete, false);
  assert.match(result.manifest.alignmentContentVersion, /^sha256-[a-f0-9]{64}$/);
  assert.ok(Math.abs(result.audit.rows[0].averageWordScore - 0.838) < 1e-12);
});

test('BSB word timing import rejects stale text, partial verse coverage, bad duration and missing timing', () => {
  const args = { durations, bookPacks: { GEN: pack }, metadata, scriptureContentVersion: 'bsb-current', requireComplete: false };
  assert.throws(() => convertBsbWordAlignments({ ...args, records: [{ ...words[0], verses: { '1': [{ ...words[0].verses['1'][0], text: 'At' }] } }] }), /word text mismatch.*GEN-1:1/i);
  assert.throws(() => convertBsbWordAlignments({ ...args, records: [{ ...words[0], verses: {} }] }), /covers 0 verses/i);
  assert.throws(() => convertBsbWordAlignments({ ...args, durations: [], records: words }), /missing measured audio duration/i);
  assert.throws(() => convertBsbWordAlignments({ ...args, records: [{ ...words[0], verses: { '1': [{ ...words[0].verses['1'][0], end: 9 }] } }] }), /out-of-duration bounds/i);
});

test('full BSB import mode requires an exact Hays audio inventory before release completeness can be evaluated', () => {
  assert.throws(() => convertBsbWordAlignments({
    records: words, durations, bookPacks: { GEN: pack }, metadata, scriptureContentVersion: 'bsb-current',
  }), /requires the exact Hays audio inventory/i);
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


test('BSB alignment manifest checksum binds timings to Scripture, audio and immutable alignment revisions', () => {
  const scriptureContentVersion = 'bsb-current-versioned-fixture';
  const result = convertBsbWordAlignments({
    records: words, durations, bookPacks: { GEN: pack }, metadata,
    scriptureContentVersion, requireComplete: false,
  });
  assert.deepEqual(validateBsbAlignmentManifest(result.manifest, {
    audioContentVersion: metadata.contentVersion,
    scriptureContentVersion,
  }), { valid: true, issues: [] });
  assert.equal(validateBsbAlignmentManifest(result.manifest, { requireComplete: true }).valid, false);

  const tampered = {
    ...result.manifest,
    chapters: [{
      ...result.manifest.chapters[0],
      verses: [{ ...result.manifest.chapters[0].verses[0], endSeconds: 2.1 }],
    }],
  };
  const validation = validateBsbAlignmentManifest(tampered);
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some(issue => /inventory checksum mismatch/i.test(issue)));

  assert.throws(() => buildBsbAlignmentManifest({
    alignments: result.alignments,
    metadata: { ...metadata, alignmentRevision: 'main' },
    scriptureContentVersion,
    complete: false,
  }), /immutable 40-hex/i);
});


test('partial BSB timing import binds chapter timing to the exact Hays file checksum, size and inventory digest', () => {
  const audioInventory = partialHaysInventory();
  const exactMetadata = { ...metadata, contentVersion: audioInventory.contentVersion };
  const result = convertBsbWordAlignments({
    records: words,
    durations,
    bookPacks: { GEN: pack },
    metadata: exactMetadata,
    scriptureContentVersion: 'bsb-current-exact-audio',
    audioInventory,
    requireComplete: false,
  });
  assert.equal(result.alignments[0].audioSha256, 'c'.repeat(64));
  assert.equal(result.alignments[0].audioByteLength, 12345);
  assert.equal(result.manifest.audioContentVersion, audioInventory.contentVersion);
  assert.equal(result.manifest.audioInventorySha256, audioInventory.inventorySha256);
  assert.deepEqual(validateBsbAlignmentManifest(result.manifest, {
    audioContentVersion: audioInventory.contentVersion,
    audioInventorySha256: audioInventory.inventorySha256,
    scriptureContentVersion: 'bsb-current-exact-audio',
  }), { valid: true, issues: [] });
});

test('BSB timing import rejects copied metadata or duration rows that do not match the exact Hays inventory', () => {
  const audioInventory = partialHaysInventory();
  assert.throws(() => convertBsbWordAlignments({
    records: words,
    durations,
    bookPacks: { GEN: pack },
    metadata,
    scriptureContentVersion: 'bsb-current',
    audioInventory,
    requireComplete: false,
  }), /contentVersion does not match the exact Hays audio inventory/i);

  const exactMetadata = { ...metadata, contentVersion: audioInventory.contentVersion };
  assert.throws(() => convertBsbWordAlignments({
    records: words,
    durations: [{ book: 'GEN', chapter: 1, durationSeconds: 4.5 }],
    bookPacks: { GEN: pack },
    metadata: exactMetadata,
    scriptureContentVersion: 'bsb-current',
    audioInventory,
    requireComplete: false,
  }), /duration.*does not match the exact Hays audio inventory/i);

  const tamperedInventory = { ...audioInventory, inventorySha256: 'd'.repeat(64), contentVersion: 'sha256-' + 'd'.repeat(64) };
  assert.throws(() => convertBsbWordAlignments({
    records: words,
    durations,
    bookPacks: { GEN: pack },
    metadata: { ...metadata, contentVersion: tamperedInventory.contentVersion },
    scriptureContentVersion: 'bsb-current',
    audioInventory: tamperedInventory,
    requireComplete: false,
  }), /inventory checksum mismatch/i);
});


test('BSB word timing import mirrors the pinned aligner punctuation boundaries for 1 Chronicles 1:32', () => {
  const verseText = 'The sons born to Keturah, Abraham’s concubine: Zimran, Jokshan, Medan, Midian, Ishbak, and Shuah. The sons of Jokshan: Sheba and Dedan.';
  const alignedTokens = 'The sons born to Keturah Abraham s concubine Zimran Jokshan Medan Midian Ishbak and Shuah The sons of Jokshan Sheba and Dedan'.split(' ');
  const alignedWords = alignedTokens.map((text, index) => ({
    text,
    start: Number((index * 0.1).toFixed(2)),
    end: Number((index * 0.1 + 0.08).toFixed(2)),
    score: 0.9,
  }));
  const shiftedWords = alignedWords.map(word => ({
    ...word,
    start: Number((word.start + 0.1).toFixed(2)),
    end: Number((word.end + 0.1).toFixed(2)),
  }));
  const result = convertBsbWordAlignments({
    records: [{
      book: '1CH',
      chapter: '001',
      verses: {
        '1': [{ text: 'Adam', start: 0, end: 0.08, score: 0.9 }],
        '32': shiftedWords,
      },
    }],
    durations: [{ book: '1CH', chapter: 1, durationSeconds: 10 }],
    bookPacks: { '1CH': [
      { c: 1, v: 1, t: 'Adam.' },
      { c: 1, v: 32, t: verseText },
    ] },
    metadata,
    scriptureContentVersion: 'bsb-current-punctuation-boundary',
    requireComplete: false,
  });

  assert.deepEqual(result.alignments[0].verses[1], {
    verse: 32,
    startSeconds: 0.1,
    endSeconds: Number(((alignedTokens.length - 1) * 0.1 + 0.18).toFixed(2)),
  });
  assert.equal(result.audit.words, alignedTokens.length + 1);
});


test('BSB timing import and manifest support a canonical chapter sequence that begins at verse 2', () => {
  const result = convertBsbWordAlignments({
    records: [{
      book: 'PSA',
      chapter: '003',
      verses: {
        '2': [
          { text: 'Many', start: 0, end: 0.2, score: 0.9 },
          { text: 'say', start: 0.21, end: 0.4, score: 0.9 },
        ],
        '3': [
          { text: 'But', start: 0.5, end: 0.7, score: 0.9 },
          { text: 'You', start: 0.71, end: 0.9, score: 0.9 },
        ],
      },
    }],
    durations: [{ book: 'PSA', chapter: 3, durationSeconds: 2 }],
    bookPacks: { PSA: [
      { c: 3, v: 2, t: 'Many say.' },
      { c: 3, v: 3, t: 'But You.' },
    ] },
    metadata,
    scriptureContentVersion: 'bsb-current-canonical-non-one-start',
    requireComplete: false,
  });

  assert.deepEqual(result.alignments[0].verses.map(row => row.verse), [2, 3]);
  assert.equal(result.manifest.chapters[0].verses[0].verse, 2);
  assert.equal(result.manifest.complete, false);
});
