export const READER_CHAPTER_READ_EVENT_TYPE = 'reader.chapter.read' as const;
export const READER_CHAPTER_READ_XP = 10;

export interface ReaderProgressEventRow {
  readonly type?: string;
  readonly date?: string;
  readonly [key: string]: unknown;
}

export interface LegacyProgressOwner {
  getState(): Readonly<{ events?: Readonly<Record<string, ReaderProgressEventRow>> }>;
  record(input: Readonly<{
    id: string;
    type: typeof READER_CHAPTER_READ_EVENT_TYPE;
    xp: number;
    meaningful: true;
    metrics: Readonly<{ chaptersRead: 1 }>;
  }>): Readonly<{
    applied: boolean;
    duplicate: boolean;
    date: string;
    awardedXp: number;
    [key: string]: unknown;
  }>;
}

export interface ReaderChapterReadMatch {
  readonly id: string;
  readonly row: ReaderProgressEventRow;
}

export interface ReaderChapterReadBoundary {
  canonicalEventId(bookCode: string, chapter: number): string;
  canonicalScoreEventId(bookCode: string, chapter: number): string;
  find(bookCode: string, chapter: number): ReaderChapterReadMatch | null;
  record(bookCode: string, chapter: number): ReturnType<LegacyProgressOwner['record']>;
}

function normalizeBookCode(value: unknown): string {
  const code = String(value ?? '').trim().toUpperCase();
  if (!/^[0-9A-Z]{3}$/.test(code)) throw new Error('Reader chapter progress requires a canonical Bible book code.');
  return code;
}

function normalizeChapter(value: unknown): number {
  const chapter = Number(value);
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 200) {
    throw new Error('Reader chapter progress requires a valid chapter number.');
  }
  return chapter;
}

export function canonicalReaderChapterReadEventId(bookCode: string, chapter: number): string {
  return `reader.read:${normalizeBookCode(bookCode)}:${normalizeChapter(chapter)}`;
}

export function canonicalReadingScoreEventId(bookCode: string, chapter: number): string {
  return `reading.chapter:${normalizeBookCode(bookCode)}:${normalizeChapter(chapter)}`;
}

export function findReaderChapterReadEvent(
  events: Readonly<Record<string, ReaderProgressEventRow>> | null | undefined,
  bookCode: string,
  chapter: number,
): ReaderChapterReadMatch | null {
  const code = normalizeBookCode(bookCode);
  const normalizedChapter = normalizeChapter(chapter);
  const canonicalId = canonicalReaderChapterReadEventId(code, normalizedChapter);
  const canonical = events?.[canonicalId];
  if (canonical?.type === READER_CHAPTER_READ_EVENT_TYPE) {
    return Object.freeze({ id: canonicalId, row: canonical });
  }

  const suffix = `:${code}:${normalizedChapter}`;
  for (const [id, row] of Object.entries(events ?? {})) {
    if (
      row?.type === READER_CHAPTER_READ_EVENT_TYPE
      && id.startsWith('reader.read:')
      && id.endsWith(suffix)
    ) {
      return Object.freeze({ id, row });
    }
  }
  return null;
}

export function createReaderChapterReadBoundary(progress: LegacyProgressOwner): ReaderChapterReadBoundary {
  if (!progress?.getState || !progress?.record) {
    throw new Error('Reader chapter progress boundary requires Progress ownership.');
  }

  return Object.freeze({
    canonicalEventId: canonicalReaderChapterReadEventId,
    canonicalScoreEventId: canonicalReadingScoreEventId,
    find(bookCode: string, chapter: number) {
      return findReaderChapterReadEvent(progress.getState()?.events, bookCode, chapter);
    },
    record(bookCode: string, chapter: number) {
      const id = canonicalReaderChapterReadEventId(bookCode, chapter);
      return progress.record(Object.freeze({
        id,
        type: READER_CHAPTER_READ_EVENT_TYPE,
        xp: READER_CHAPTER_READ_XP,
        meaningful: true as const,
        metrics: Object.freeze({ chaptersRead: 1 as const }),
      }));
    },
  });
}
