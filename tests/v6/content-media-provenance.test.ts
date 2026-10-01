import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  BSB_AUDIO_CANDIDATE_POLICY,
  audioOfflineEligibility,
  type ScriptureAudioManifest,
} from '../../src/v6/reader/audio-policy.ts';
import { V6_TRANSLATION_PACKAGING_POLICY } from '../../src/v6/reader/license-policy.ts';

const policy = JSON.parse(
  await readFile(new URL('../../docs/v6/V6_CONTENT_MEDIA_PROVENANCE_POLICY.json', import.meta.url), 'utf8'),
);
const recordingsRuntime = await readFile(new URL('../../src/v6/media/recordings-runtime.ts', import.meta.url), 'utf8');
const mediaLibrary = await readFile(new URL('../../media-library.js', import.meta.url), 'utf8');

test('downloadable Scripture translations require redistribution permission', () => {
  for (const entry of V6_TRANSLATION_PACKAGING_POLICY) {
    if (entry.delivery === 'downloadable') {
      assert.equal(entry.license.redistribution, 'allowed', entry.translationId + ' cannot be bundled without redistribution permission');
    }
    if (entry.license.redistribution === 'forbidden') {
      assert.notEqual(entry.delivery, 'downloadable', entry.translationId + ' forbidden content must not be bundled');
    }
  }
});

test('BSB streaming permission does not silently authorize local redistribution', () => {
  assert.equal(BSB_AUDIO_CANDIDATE_POLICY.permissions?.stream, 'allowed');
  assert.equal(BSB_AUDIO_CANDIDATE_POLICY.permissions?.offlineCopy, 'review-required');
  assert.equal(BSB_AUDIO_CANDIDATE_POLICY.rights, 'review-required');

  const manifest: ScriptureAudioManifest = {
    schemaVersion: 1,
    translationId: 'bsb',
    source: BSB_AUDIO_CANDIDATE_POLICY,
    segments: [{
      id: 'GEN-001',
      book: 'GEN',
      chapter: 1,
      url: 'https://openbible.com/audio/hays/BSB_01_Gen_001_H.mp3',
      byteLength: 1024,
      sha256: 'a'.repeat(64),
    }],
  };
  assert.equal(audioOfflineEligibility(manifest).eligible, false);
  assert.equal(audioOfflineEligibility(manifest).reason, 'rights-unverified');
});

test('Recordings keeps provider media external instead of hosting or transforming it', () => {
  assert.match(recordingsRuntime, /createMediaProviderRegistry\(\[youtube\]\)/);
  assert.match(mediaLibrary, /host!==['"]youtube\.com['"]/);
  assert.match(mediaLibrary, /https:\/\/i\.ytimg\.com\/vi\//);
  assert.match(mediaLibrary, /cover_path:null/);
  assert.doesNotMatch(mediaLibrary, /supabase\.storage|\.storage\.from\(/);
});

test('cross-cutting provenance policy is explicit and fail-closed', () => {
  assert.equal(policy.schemaVersion, 1);
  assert.match(policy.baseline.sha, /^[0-9a-f]{40}$/);
  assert.equal(new Set(policy.reviewedChanges.map((entry: { path: string }) => entry.path)).size, policy.reviewedChanges.length);
  for (const entry of policy.reviewedChanges) {
    assert.equal(entry.redistribution, 'allowed');
    assert.ok(String(entry.provenanceKind || '').trim());
    assert.ok(String(entry.evidence || '').trim());
  }
  for (const surface of policy.runtimeExternalMedia) {
    assert.equal(surface.bibleQuestHostsOrTransformsThirdPartyBytes, false);
    assert.ok(surface.evidence.length > 0);
  }
});
