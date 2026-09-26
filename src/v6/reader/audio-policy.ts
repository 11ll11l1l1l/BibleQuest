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
const TRANSLATION_ID = /^[a-z0-9][a-z0-9_-]{0,31}$/;

function nonBlank(value: unknown): boolean {
  return String(value ?? '').trim().length > 0;
}

function normalizedTranslationId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized === value && TRANSLATION_ID.test(normalized) ? normalized : null;
}

function validHttpsUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const normalized = value.trim();
  if (!normalized || normalized !== value) return false;
  try {
    const parsed = new URL(normalized);
    return parsed.protocol === 'https:' && Boolean(parsed.hostname) && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

function validSourceMetadata(source: ScriptureAudioSourceMetadata | null | undefined): source is ScriptureAudioSourceMetadata {
  if (
    !source ||
    typeof source !== 'object' ||
    normalizedTranslationId(source.translationId) === null ||
    !nonBlank(source.source) ||
    !nonBlank(source.license)
  ) {
    return false;
  }

  if (source.sourceUrl !== undefined && !validHttpsUrl(source.sourceUrl)) {
    return false;
  }

  return true;
}

function validSegments(segments: readonly ScriptureAudioSegment[] | null | undefined): boolean {
  if (!Array.isArray(segments) || segments.length < 1) return false;

  const ids = new Set<string>();
  for (const segment of segments) {
    if (!segment || typeof segment !== 'object') return false;
    const id = String(segment.id ?? '').trim();
    if (
      !id ||
      ids.has(id) ||
      !nonBlank(segment.book) ||
      !Number.isInteger(segment.chapter) ||
      segment.chapter < 1 ||
      !Number.isSafeInteger(segment.byteLength) ||
      segment.byteLength <= 0 ||
      !SHA256_HEX.test(String(segment.sha256 ?? '').trim()) ||
      !validHttpsUrl(segment.url)
    ) {
      return false;
    }
    ids.add(id);
  }

  return true;
}

/**
 * Audio packaging is deliberately fail-closed. A provider being playable online
 * does not imply that BibleQuest may redistribute or cache it offline, and an
 * audio Bible labelled with a translation name does not prove exact alignment
 * with the displayed Scripture text.
 */
export function audioOfflineEligibility(
  manifest: ScriptureAudioManifest | null | undefined,
  storageCeilingBytes = V6_READER_AUDIO_STORAGE_CEILING_BYTES,
): AudioOfflineDecision {
  if (!manifest || typeof manifest !== 'object') {
    return { eligible: false, reason: 'invalid-manifest', totalBytes: 0 };
  }

  const translationId = normalizedTranslationId(manifest.translationId);
  const sourceTranslationId = normalizedTranslationId(manifest.source?.translationId);

  if (
    manifest.schemaVersion !== 1 ||
    translationId === null ||
    sourceTranslationId === null ||
    !validSourceMetadata(manifest.source) ||
    translationId !== sourceTranslationId ||
    !validSegments(manifest.segments) ||
    !Number.isSafeInteger(storageCeilingBytes) ||
    storageCeilingBytes <= 0
  ) {
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
