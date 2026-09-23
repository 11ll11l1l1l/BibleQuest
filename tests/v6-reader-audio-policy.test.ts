import { describe, expect, it } from 'vitest';
import { audioOfflineEligibility, BSB_AUDIO_CANDIDATE_POLICY, V6_READER_AUDIO_STORAGE_CEILING_BYTES, type ScriptureAudioManifest, type ScriptureAudioSourceMetadata } from '../src/v6/reader/audio-policy.ts';

const sha = 'a'.repeat(64);
const verified: ScriptureAudioSourceMetadata = {
  translationId: 'bsb', source: 'fixture', license: 'verified fixture rights', rights: 'verified', delivery: 'downloadable', textAlignment: 'exact',
};
const manifest = (source: ScriptureAudioSourceMetadata = verified, byteLength = 1024): ScriptureAudioManifest => ({
  schemaVersion: 1, translationId: source.translationId, source,
  segments: [{ id: 'GEN-1', book: 'GEN', chapter: 1, byteLength, sha256: sha, url: 'https://example.invalid/GEN-1.mp3' }],
});

describe('V6 Reader audio packaging policy', () => {
  it('keeps the current BSB candidate offline-ineligible until rights and alignment are proven', () => {
    expect(audioOfflineEligibility(manifest(BSB_AUDIO_CANDIDATE_POLICY))).toMatchObject({ eligible: false, reason: 'rights-unverified' });
  });

  it('allows only verified downloadable exact-alignment audio below the 10 GB ceiling', () => {
    expect(audioOfflineEligibility(manifest())).toMatchObject({ eligible: true, reason: 'eligible', totalBytes: 1024 });
  });

  it('rejects a package at the ceiling rather than silently exceeding the agreed budget', () => {
    expect(audioOfflineEligibility(manifest(verified, V6_READER_AUDIO_STORAGE_CEILING_BYTES))).toMatchObject({ eligible: false, reason: 'storage-ceiling-exceeded' });
  });

  it('rejects mismatched or merely unverified text alignment even with verified rights', () => {
    expect(audioOfflineEligibility(manifest({ ...verified, textAlignment: 'mismatch' }))).toMatchObject({ eligible: false, reason: 'text-mismatch' });
    expect(audioOfflineEligibility(manifest({ ...verified, textAlignment: 'unverified' }))).toMatchObject({ eligible: false, reason: 'text-alignment-unverified' });
  });

  it('rejects malformed checksum metadata before caching', () => {
    const bad = { ...manifest(), segments: [{ ...manifest().segments[0], sha256: 'not-a-sha' }] };
    expect(audioOfflineEligibility(bad)).toMatchObject({ eligible: false, reason: 'invalid-manifest' });
  });
});
