export interface ScriptureVerseTiming {
  readonly verse: number;
  readonly startSeconds: number;
  readonly endSeconds: number;
}

export interface ScriptureChapterAlignment {
  readonly schemaVersion: 1;
  readonly translationId: string;
  readonly contentVersion: string;
  readonly scriptureContentVersion: string;
  readonly book: string;
  readonly chapter: number;
  readonly durationSeconds: number;
  readonly source: string;
  readonly license: string;
  readonly alignmentSource: string;
  readonly verses: readonly ScriptureVerseTiming[];
}

export interface AudioAlignmentValidation {
  readonly valid: boolean;
  readonly issues: readonly string[];
}

const TRANSLATION_ID = /^[a-z0-9][a-z0-9_-]{0,31}$/;
const BOOK_CODE = /^(?:[1-3])?[A-Z]{2,3}$/;

function nonBlank(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Validates one-based verse timings before they can drive Reader highlighting or seeking. */
export function validateChapterAlignment(
  alignment: ScriptureChapterAlignment | null | undefined,
  expected?: { readonly translationId?: string; readonly book?: string; readonly chapter?: number; readonly verseCount?: number; readonly verseNumbers?: readonly number[] },
): AudioAlignmentValidation {
  const issues: string[] = [];
  if (!alignment || typeof alignment !== 'object') return { valid: false, issues: ['alignment is required'] };
  if (alignment.schemaVersion !== 1) issues.push('unsupported schema version');
  if (!TRANSLATION_ID.test(String(alignment.translationId ?? ''))) issues.push('invalid translation id');
  if (!nonBlank(alignment.contentVersion)) issues.push('content version is required');
  if (!nonBlank(alignment.scriptureContentVersion)) issues.push('Scripture content version is required');
  const book = String(alignment.book ?? '').toUpperCase();
  if (!BOOK_CODE.test(book)) issues.push('invalid book code');
  if (!Number.isSafeInteger(alignment.chapter) || alignment.chapter < 1) issues.push('invalid chapter number');
  if (!Number.isFinite(alignment.durationSeconds) || alignment.durationSeconds <= 0) issues.push('invalid audio duration');
  if (!nonBlank(alignment.source) || !nonBlank(alignment.license) || !nonBlank(alignment.alignmentSource)) {
    issues.push('source, license, and alignment provenance are required');
  }
  if (!Array.isArray(alignment.verses) || alignment.verses.length === 0) {
    issues.push('verse timings are required');
  } else {
    let previousEnd = 0;
    let previousVerse = 0;
    alignment.verses.forEach((timing, index) => {
      const verse = Number(timing?.verse);
      if (!Number.isSafeInteger(verse) || verse < 1) {
        issues.push(`verse timing at index ${index} has an invalid verse number`);
      } else if (verse <= previousVerse) {
        issues.push('verse numbers must be strictly increasing');
      }
      const label = Number.isSafeInteger(verse) && verse > 0 ? verse : index + 1;
      if (!Number.isFinite(timing?.startSeconds) || !Number.isFinite(timing?.endSeconds)
        || timing.startSeconds < 0 || timing.endSeconds <= timing.startSeconds) {
        issues.push(`verse ${label} has invalid timing bounds`);
        return;
      }
      if (timing.startSeconds < previousEnd) issues.push(`verse ${label} overlaps the preceding timing`);
      if (timing.endSeconds > alignment.durationSeconds) issues.push(`verse ${label} exceeds audio duration`);
      previousEnd = timing.endSeconds;
      if (Number.isSafeInteger(verse) && verse > 0) previousVerse = verse;
    });
  }
  if (expected?.translationId && alignment.translationId !== expected.translationId) issues.push('translation identity mismatch');
  if (expected?.book && book !== expected.book.toUpperCase()) issues.push('book identity mismatch');
  if (expected?.chapter !== undefined && alignment.chapter !== expected.chapter) issues.push('chapter identity mismatch');
  if (expected?.verseCount !== undefined && (!Array.isArray(alignment.verses) || alignment.verses.length !== expected.verseCount)) {
    issues.push('verse count mismatch');
  }
  if (expected?.verseNumbers !== undefined) {
    const actual = Array.isArray(alignment.verses) ? alignment.verses.map(row => row.verse) : [];
    if (actual.length !== expected.verseNumbers.length
      || actual.some((verse, index) => verse !== expected.verseNumbers![index])) {
      issues.push('verse identity sequence mismatch');
    }
  }
  return Object.freeze({ valid: issues.length === 0, issues: Object.freeze(issues) });
}

export function verseAtAudioTime(alignment: ScriptureChapterAlignment, seconds: number): number | null {
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  let low = 0;
  let high = alignment.verses.length - 1;
  while (low <= high) {
    const mid = (low + high) >>> 1;
    const timing = alignment.verses[mid];
    if (seconds < timing.startSeconds) high = mid - 1;
    else if (seconds >= timing.endSeconds) low = mid + 1;
    else return timing.verse;
  }
  return null;
}

export function audioTimeForVerse(alignment: ScriptureChapterAlignment, verse: number): number | null {
  if (!Number.isSafeInteger(verse) || verse < 1) return null;
  let low = 0;
  let high = alignment.verses.length - 1;
  while (low <= high) {
    const mid = (low + high) >>> 1;
    const timing = alignment.verses[mid];
    if (verse < timing.verse) high = mid - 1;
    else if (verse > timing.verse) low = mid + 1;
    else return timing.startSeconds;
  }
  return null;
}
