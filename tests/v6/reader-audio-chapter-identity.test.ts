import assert from 'node:assert/strict';
import test from 'node:test';

import {
  audioOfflineEligibility,
  type ScriptureAudioManifest,
  type ScriptureAudioSegment,
} from '../../src/v6/reader/audio-policy.ts';

const sha = 'a'.repeat(64);

function segment(id: string, book: string, chapter: number): ScriptureAudioSegment {
  return Object.freeze({
    id,
    book,
    chapter,
    byteLength: 1_000,
    sha256: sha,
    url: `https://media.example.test/${encodeURIComponent(id)}.mp3`,
  });
}

function manifest(segments: readonly ScriptureAudioSegment[]): ScriptureAudioManifest {
  return Object.freeze({
    schemaVersion: 1,
    translationId: 'bsb',
    source: Object.freeze({
      translationId: 'bsb',
      source: 'fixture narration',
      sourceUrl: 'https://media.example.test/source',
      license: 'fixture verified redistribution',
      rights: 'verified',
      delivery: 'downloadable',
      textAlignment: 'exact',
      attribution: 'fixture attribution',
    }),
    segments: Object.freeze([...segments]),
  });
}

test('audio packaging keeps a single deterministic segment identity per Bible chapter', () => {
  const decision = audioOfflineEligibility(manifest([
    segment('john-3-a', 'JHN', 3),
    segment('john-3-b', 'JHN', 3),
  ]));

  assert.deepEqual(decision, {
    eligible: false,
    reason: 'invalid-manifest',
    totalBytes: 0,
  });
});

test('audio chapter identity rejects case/whitespace aliases that would map to the same passage', () => {
  const decision = audioOfflineEligibility(manifest([
    segment('john-3-a', 'JHN', 3),
    segment('john-3-b', ' jhn ', 3),
  ]));

  assert.equal(decision.eligible, false);
  assert.equal(decision.reason, 'invalid-manifest');
});

test('distinct chapter identities remain package-eligible when all existing safety gates pass', () => {
  const decision = audioOfflineEligibility(manifest([
    segment('john-3', 'JHN', 3),
    segment('john-4', 'JHN', 4),
    segment('genesis-1', 'GEN', 1),
  ]));

  assert.deepEqual(decision, {
    eligible: true,
    reason: 'eligible',
    totalBytes: 3_000,
  });
});
