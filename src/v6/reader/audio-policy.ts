export const V6_READER_AUDIO_STORAGE_CEILING_BYTES = 10_000_000_000;

export type AudioDelivery = 'stream' | 'downloadable' | 'external';
export type AudioRights = 'verified' | 'review-required' | 'forbidden';

export interface ScriptureAudioSourceMetadata {
  readonly translationId: string;
  readonly source: string;
  readonly sourceUrl?: string;
  readonly license: string;
  readonly rights: AudioRights;
  readonly delivery: AudioDelivery;
  readonly textAlignment: 'exact' | 'unverified' | 'mismatch';
  readonly attribution?: string;
}

export interface ScriptureAudioSegment {
  readonly id: string;
  readonly book: string;
  readonly chapter: number;
  readonly byteLength: number;
  readonly sha256: string;
  readonly url: string;
}

export interface ScriptureAudioManifest {
  readonly schemaVersion: 1;
  readonly translationId: string;
  readonly source: ScriptureAudioSourceMetadata;
  readonly segments: readonly ScriptureAudioSegment[];
}

export interface AudioOfflineDecision {
  readonly eligible: boolean;
  readonly reason: 'eligible' | 'rights-unverified' | 'redistribution-forbidden' | 'text-alignment-unverified' | 'text-mismatch' | 'storage-ceiling-exceeded' | 'invalid-manifest';
  readonly totalBytes: number;
}

const SHA256_HEX = /^[a-f0-9]{64}$/i;

/**
 * Audio packaging is deliberately fail-closed. A provider being playable online
 * does not imply that BibleQuest may redistribute or cache it offline, and an
 * audio Bible labelled with a translation name does not prove exact alignment
 * with the displayed Scripture text.
 */
export function audioOfflineEligibility(
  manifest: ScriptureAudioManifest,
  storageCeilingBytes = V6_READER_AUDIO_STORAGE_CEILING_BYTES,
): AudioOfflineDecision {
  const segmentsValid = manifest.segments.length > 0 && manifest.segments.every((segment) =>
    segment.id.trim().length > 0 &&
    segment.book.trim().length > 0 &&
    Number.isInteger(segment.chapter) && segment.chapter > 0 &&
    Number.isSafeInteger(segment.byteLength) && segment.byteLength >= 0 &&
    SHA256_HEX.test(segment.sha256) &&
    /^https:\/\//i.test(segment.url),
  );

  if (!segmentsValid || manifest.translationId !== manifest.source.translationId || !Number.isSafeInteger(storageCeilingBytes) || storageCeilingBytes <= 0) {
    return { eligible: false, reason: 'invalid-manifest', totalBytes: 0 };
  }

  const totalBytes = manifest.segments.reduce((sum, segment) => sum + segment.byteLength, 0);
  if (!Number.isSafeInteger(totalBytes)) return { eligible: false, reason: 'invalid-manifest', totalBytes: 0 };
  if (manifest.source.rights === 'forbidden') return { eligible: false, reason: 'redistribution-forbidden', totalBytes };
  if (manifest.source.rights !== 'verified' || manifest.source.delivery !== 'downloadable') return { eligible: false, reason: 'rights-unverified', totalBytes };
  if (manifest.source.textAlignment === 'mismatch') return { eligible: false, reason: 'text-mismatch', totalBytes };
  if (manifest.source.textAlignment !== 'exact') return { eligible: false, reason: 'text-alignment-unverified', totalBytes };
  if (totalBytes >= storageCeilingBytes) return { eligible: false, reason: 'storage-ceiling-exceeded', totalBytes };
  return { eligible: true, reason: 'eligible', totalBytes };
}

/** A BSB audio candidate stays non-packageable until both rights and exact text alignment are evidenced. */
export const BSB_AUDIO_CANDIDATE_POLICY: ScriptureAudioSourceMetadata = Object.freeze({
  translationId: 'bsb',
  source: 'Unverified BSB-compatible audio candidate',
  license: 'No redistribution permission recorded in V6 repository evidence yet',
  rights: 'review-required',
  delivery: 'stream',
  textAlignment: 'unverified',
});
