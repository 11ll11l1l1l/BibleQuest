import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  audioOfflineEligibility,
  audioStreamingEligibility,
  BSB_AUDIO_CANDIDATE_POLICY,
  V6_READER_AUDIO_STORAGE_CEILING_BYTES,
  type ScriptureAudioManifest,
  type ScriptureAudioSourceMetadata,
} from '../../src/v6/reader/audio-policy.ts';

function assertMatches(actual: object, expected: Record<string, unknown>) {
  for (const [key, value] of Object.entries(expected)) {
    assert.deepEqual((actual as Record<string, unknown>)[key], value, `unexpected ${key}`);
  }
}

const sha = 'a'.repeat(64);
const verified: ScriptureAudioSourceMetadata = {
  translationId: 'bsb',
  source: 'fixture',
  license: 'verified fixture rights',
  rights: 'verified',
  delivery: 'downloadable',
  textAlignment: 'exact',
  permissions: { stream: 'allowed', offlineCopy: 'allowed' },
  rightsEvidence: 'https://fixture.example/license',
  reviewedBy: 'V6 content reviewer',
  reviewedAt: '2026-09-28T00:00:00Z',
  scriptureContentVersion: 'bsb-fixture-1',
};
const manifest = (
  source: ScriptureAudioSourceMetadata = verified,
  byteLength = 1024,
): ScriptureAudioManifest => ({
  schemaVersion: 1,
  translationId: source.translationId,
  source,
  segments: [{
    id: 'GEN-1',
    book: 'GEN',
    chapter: 1,
    byteLength,
    sha256: sha,
    url: 'https://example.invalid/GEN-1.mp3',
  }],
});

describe('V6 Reader audio packaging policy', () => {
  it('separates direct streaming permission from permission to keep offline copies', () => {
    const streamOnly = manifest({
      ...verified,
      rights: 'review-required',
      permissions: { stream: 'allowed', offlineCopy: 'review-required' },
    });
    assertMatches(audioStreamingEligibility(streamOnly), { eligible: true, reason: 'eligible' });
    assertMatches(audioOfflineEligibility(streamOnly), { eligible: false, reason: 'rights-unverified' });
  });

  it('keeps the current BSB candidate offline-ineligible until rights and alignment are proven', () => {
    assertMatches(audioOfflineEligibility(manifest(BSB_AUDIO_CANDIDATE_POLICY)), {
      eligible: false,
      reason: 'rights-unverified',
    });
  });

  it('allows only verified downloadable exact-alignment audio below the 10 GB ceiling', () => {
    assertMatches(audioOfflineEligibility(manifest()), {
      eligible: true,
      reason: 'eligible',
      totalBytes: 1024,
    });
  });

  it('rejects a package at the ceiling rather than silently exceeding the agreed budget', () => {
    assertMatches(audioOfflineEligibility(manifest(verified, V6_READER_AUDIO_STORAGE_CEILING_BYTES)), {
      eligible: false,
      reason: 'storage-ceiling-exceeded',
    });
  });

  it('rejects mismatched or merely unverified text alignment even with verified rights', () => {
    assertMatches(audioOfflineEligibility(manifest({ ...verified, textAlignment: 'mismatch' })), {
      eligible: false,
      reason: 'text-mismatch',
    });
    assertMatches(audioOfflineEligibility(manifest({ ...verified, textAlignment: 'unverified' })), {
      eligible: false,
      reason: 'text-alignment-unverified',
    });
  });

  it('rejects malformed checksum metadata before caching', () => {
    const bad = { ...manifest(), segments: [{ ...manifest().segments[0], sha256: 'not-a-sha' }] };
    assertMatches(audioOfflineEligibility(bad), {
      eligible: false,
      reason: 'invalid-manifest',
    });
  });

  it('fails closed when verified claims omit source or license provenance', () => {
    for (const source of [
      { ...verified, source: '   ' },
      { ...verified, license: '' },
      { ...verified, rightsEvidence: '' },
      { ...verified, reviewedBy: '' },
      { ...verified, reviewedAt: 'yesterday' },
      { ...verified, scriptureContentVersion: '' },
      { ...verified, translationId: 'not a valid id' },
      { ...verified, translationId: 'BSB' },
      { ...verified, translationId: ' bsb ' },
    ]) {
      assertMatches(audioOfflineEligibility(manifest(source)), {
        eligible: false,
        reason: 'invalid-manifest',
        totalBytes: 0,
      });
    }
  });

  it('rejects unsupported schema versions and malformed source metadata at runtime', () => {
    const unsupportedSchema = {
      ...manifest(),
      schemaVersion: 2,
    } as unknown as ScriptureAudioManifest;
    const insecureSourceUrl = manifest({
      ...verified,
      sourceUrl: 'http://example.invalid/provenance',
    });
    const malformedSourceUrl = manifest({
      ...verified,
      sourceUrl: 'https://',
    });
    const missingSource = {
      ...manifest(),
      source: undefined,
    } as unknown as ScriptureAudioManifest;
    const missingSegments = {
      ...manifest(),
      segments: undefined,
    } as unknown as ScriptureAudioManifest;

    for (const bad of [unsupportedSchema, insecureSourceUrl, malformedSourceUrl, missingSource, missingSegments]) {
      assertMatches(audioOfflineEligibility(bad), {
        eligible: false,
        reason: 'invalid-manifest',
        totalBytes: 0,
      });
    }
  });

  it('fails closed on absent manifests and malformed runtime segment rows or URLs', () => {
    const absent = undefined as unknown as ScriptureAudioManifest;
    const nullSegment = {
      ...manifest(),
      segments: [null],
    } as unknown as ScriptureAudioManifest;
    const malformedPayloadUrl = {
      ...manifest(),
      segments: [{ ...manifest().segments[0], url: 'https://' }],
    };

    for (const bad of [absent, nullSegment, malformedPayloadUrl]) {
      assertMatches(audioOfflineEligibility(bad), {
        eligible: false,
        reason: 'invalid-manifest',
        totalBytes: 0,
      });
    }
  });

  it('rejects empty audio payloads and duplicate segment identities', () => {
    assertMatches(audioOfflineEligibility(manifest(verified, 0)), {
      eligible: false,
      reason: 'invalid-manifest',
    });

    const base = manifest();
    const duplicate = {
      ...base,
      segments: [
        base.segments[0],
        { ...base.segments[0], chapter: 2, url: 'https://example.invalid/GEN-2.mp3' },
      ],
    };
    assertMatches(audioOfflineEligibility(duplicate), {
      eligible: false,
      reason: 'invalid-manifest',
    });
  });
});
