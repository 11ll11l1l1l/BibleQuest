export const V6_READER_AUDIO_STORAGE_CEILING_BYTES = 10_000_000_000;

export type AudioDelivery = 'stream' | 'downloadable' | 'external';
export type AudioRights = 'verified' | 'review-required' | 'forbidden';

export interface ScriptureAudioSourcePermissions {
  readonly stream?: 'allowed' | 'review-required' | 'forbidden';
  readonly offlineCopy?: 'allowed' | 'review-required' | 'forbidden';
}

export interface ScriptureAudioSourceMetadata {
  readonly translationId: string;
  readonly source: string;
  readonly sourceUrl?: string;
  /** Immutable V6 Scripture-manifest version whose text the timing rows describe. */
  readonly scriptureContentVersion?: string;
  readonly license: string;
  readonly rights: AudioRights;
  readonly delivery: AudioDelivery;
  readonly textAlignment: 'exact' | 'unverified' | 'mismatch';
  /** Exact source-file identity is independent from verse-level timing alignment. */
  readonly audioIdentity?: 'exact' | 'unverified';
  readonly attribution?: string;
  readonly permissions?: ScriptureAudioSourcePermissions;
  readonly rightsEvidence?: string;
  readonly reviewedBy?: string;
  readonly reviewedAt?: string;
}

export interface ScriptureAudioSegment {
  readonly id: string;
  readonly book: string;
  readonly chapter: number;
  readonly byteLength?: number;
  readonly sha256?: string;
  readonly url: string;
}

export interface ScriptureAudioManifest {
  readonly schemaVersion: 1;
  readonly translationId: string;
  readonly contentVersion?: string;
  readonly alignmentSource?: string;
  readonly source: ScriptureAudioSourceMetadata;
  readonly segments: readonly ScriptureAudioSegment[];
}

export interface AudioOfflineDecision {
  readonly eligible: boolean;
  readonly reason: 'eligible' | 'rights-unverified' | 'redistribution-forbidden' | 'audio-identity-unverified' | 'text-alignment-unverified' | 'text-mismatch' | 'storage-ceiling-exceeded' | 'invalid-manifest';
  readonly totalBytes: number;
}

export interface AudioStreamingDecision {
  readonly eligible: boolean;
  readonly reason: 'eligible' | 'streaming-unverified' | 'streaming-forbidden' | 'invalid-manifest';
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

  if (source.permissions !== undefined && (!source.permissions || typeof source.permissions !== 'object'
    || (source.permissions.stream !== undefined && !['allowed', 'review-required', 'forbidden'].includes(source.permissions.stream))
    || (source.permissions.offlineCopy !== undefined && !['allowed', 'review-required', 'forbidden'].includes(source.permissions.offlineCopy)))) {
    return false;
  }
  if (source.audioIdentity !== undefined && !['exact', 'unverified'].includes(source.audioIdentity)) {
    return false;
  }

  const reviewedAt = String(source.reviewedAt ?? '');
  if (source.rights === 'verified' && (!nonBlank(source.rightsEvidence) || !nonBlank(source.reviewedBy)
    || !nonBlank(source.scriptureContentVersion)
    || !nonBlank(reviewedAt) || !Number.isFinite(Date.parse(reviewedAt)))) {
    return false;
  }

  return true;
}

/** Direct streaming and offline copying use separate permission gates. */
export function audioStreamingEligibility(
  manifest: ScriptureAudioManifest | null | undefined,
): AudioStreamingDecision {
  if (!manifest || typeof manifest !== 'object' || manifest.schemaVersion !== 1
    || normalizedTranslationId(manifest.translationId) === null
    || !validSourceMetadata(manifest.source)
    || manifest.translationId !== manifest.source.translationId
    || !Array.isArray(manifest.segments) || manifest.segments.length < 1) {
    return { eligible: false, reason: 'invalid-manifest' };
  }
  const ids = new Set<string>();
  const chapters = new Set<string>();
  for (const segment of manifest.segments) {
    if (!segment || typeof segment !== 'object' || !nonBlank(segment.id) || !nonBlank(segment.book)
      || !Number.isSafeInteger(segment.chapter) || segment.chapter < 1 || !validHttpsUrl(segment.url)) {
      return { eligible: false, reason: 'invalid-manifest' };
    }
    const id = segment.id.trim(), key = `${segment.book.toUpperCase()}:${segment.chapter}`;
    if (ids.has(id) || chapters.has(key)) return { eligible: false, reason: 'invalid-manifest' };
    ids.add(id); chapters.add(key);
    if (segment.sha256 !== undefined && !SHA256_HEX.test(segment.sha256)) return { eligible: false, reason: 'invalid-manifest' };
    if (segment.byteLength !== undefined && (!Number.isSafeInteger(segment.byteLength) || segment.byteLength <= 0)) {
      return { eligible: false, reason: 'invalid-manifest' };
    }
  }
  const permission = manifest.source.permissions?.stream;
  if (permission === 'forbidden') return { eligible: false, reason: 'streaming-forbidden' };
  if (permission !== 'allowed' || manifest.source.rights === 'forbidden') {
    return { eligible: false, reason: 'streaming-unverified' };
  }
  return { eligible: true, reason: 'eligible' };
}

function validSegments(segments: readonly ScriptureAudioSegment[] | null | undefined): segments is readonly (ScriptureAudioSegment & Readonly<{ byteLength: number; sha256: string }>)[] {
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
 * does not imply that BibleQuest may redistribute or cache it offline. Offline
 * chapter caching requires exact source bytes/version identity, but does not
 * require verse-level timing alignment; verse sync is gated independently.
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

  const totalBytes = manifest.segments.reduce((sum, segment) => sum + segment.byteLength!, 0);
  if (!Number.isSafeInteger(totalBytes)) return { eligible: false, reason: 'invalid-manifest', totalBytes: 0 };
  if (manifest.source.rights === 'forbidden') return { eligible: false, reason: 'redistribution-forbidden', totalBytes };
  if (manifest.source.permissions?.offlineCopy !== 'allowed') return { eligible: false, reason: 'rights-unverified', totalBytes };
  if (manifest.source.rights !== 'verified' || manifest.source.delivery !== 'downloadable') return { eligible: false, reason: 'rights-unverified', totalBytes };
  if (manifest.source.audioIdentity !== 'exact') return { eligible: false, reason: 'audio-identity-unverified', totalBytes };
  if (totalBytes >= storageCeilingBytes) return { eligible: false, reason: 'storage-ceiling-exceeded', totalBytes };
  return { eligible: true, reason: 'eligible', totalBytes };
}

/** A BSB audio candidate stays non-packageable until both rights and exact text alignment are evidenced. */
export const BSB_AUDIO_CANDIDATE_POLICY: ScriptureAudioSourceMetadata = Object.freeze({
  translationId: 'bsb',
  source: 'Barry Hays BSB chapter audio candidate (OpenBible)',
  sourceUrl: 'https://openbible.com/audio/hays/',
  license: 'CC0 1.0 claimed by the BSB Audio Bible project; exact staged files still require review',
  rights: 'review-required',
  delivery: 'downloadable',
  textAlignment: 'unverified',
  audioIdentity: 'unverified',
  attribution: 'Barry Hays narration; source evidence and limitations recorded in docs/v6/BSB_AUDIO_SOURCE_REVIEW.md',
  permissions: Object.freeze({ stream: 'allowed', offlineCopy: 'review-required' }),
});
