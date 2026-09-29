import type { ReaderBookRef, ReaderVerse } from './contracts.ts';

export type ReaderPresentationChapterInput = Readonly<{
  book: Pick<ReaderBookRef, 'code' | 'name' | 'chapters'>;
  chapter: number;
  verses: readonly Pick<ReaderVerse, 'chapter' | 'verse' | 'verseEnd' | 'text'>[];
}>;

export type ReaderVersePresentation = Readonly<{
  verse: number;
  verseEnd?: number;
  label: string;
  text: string;
}>;

export type ReaderChapterPresentation = Readonly<{
  bookCode: string;
  bookName: string;
  chapter: number;
  heading: string;
  verses: readonly ReaderVersePresentation[];
}>;

export type ReaderChapterHtmlOptions = Readonly<{
  translationLabel: string;
  highlightedVerse?: number | null;
  isRead: boolean;
}>;

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

function positiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function requiredText(value: string, label: string): string {
  if (!value.trim()) throw new Error(`Reader presentation requires ${label}.`);
  return value;
}

export function readerChapterHeading(
  book: Pick<ReaderBookRef, 'name'>,
  chapter: number,
): string {
  const name = requiredText(book.name, 'a book name');
  if (!positiveInteger(chapter)) throw new Error('Reader presentation requires a positive chapter.');
  return `${name} ${chapter}`;
}

export function presentReaderVerse(
  verse: Pick<ReaderVerse, 'chapter' | 'verse' | 'verseEnd' | 'text'>,
): ReaderVersePresentation {
  if (!positiveInteger(verse.chapter) || !positiveInteger(verse.verse)) {
    throw new Error('Reader presentation requires a valid verse location.');
  }
  const end = verse.verseEnd ?? verse.verse;
  if (!positiveInteger(end) || end < verse.verse) {
    throw new Error('Reader presentation requires a valid verse range.');
  }
  const text = requiredText(verse.text, 'non-blank Scripture text');
  return Object.freeze({
    verse: verse.verse,
    ...(verse.verseEnd === undefined ? {} : { verseEnd: verse.verseEnd }),
    label: end > verse.verse ? `${verse.verse}–${end}` : String(verse.verse),
    text,
  });
}

/**
 * Pure chapter/verse presentation seam used by the live Reader view.
 * It preserves provider text exactly and fails closed on malformed ordering
 * rather than letting the DOM layer reinterpret Scripture payloads.
 */
export function presentReaderChapter(input: ReaderPresentationChapterInput): ReaderChapterPresentation {
  const bookCode = requiredText(input.book.code, 'a book code').toUpperCase();
  const bookName = requiredText(input.book.name, 'a book name');
  if (!positiveInteger(input.book.chapters) || !positiveInteger(input.chapter) || input.chapter > input.book.chapters) {
    throw new Error('Reader presentation requires a valid chapter location.');
  }
  if (input.verses.length === 0) throw new Error('Reader presentation requires Scripture verses.');

  let previousEnd = 0;
  const verses = input.verses.map((verse) => {
    if (verse.chapter !== input.chapter) throw new Error('Reader presentation rejected a verse from another chapter.');
    const presented = presentReaderVerse(verse);
    const end = presented.verseEnd ?? presented.verse;
    if (presented.verse <= previousEnd) throw new Error('Reader presentation rejected overlapping or out-of-order verses.');
    previousEnd = end;
    return presented;
  });

  return Object.freeze({
    bookCode,
    bookName,
    chapter: input.chapter,
    heading: readerChapterHeading(input.book, input.chapter),
    verses: Object.freeze(verses),
  });
}

/**
 * Pure HTML presentation for the validated chapter/verse model. Scripture and labels
 * are escaped here so the route only composes the chapter with its other Reader panels.
 */
export function renderReaderChapterPresentation(
  chapter: ReaderChapterPresentation,
  options: ReaderChapterHtmlOptions,
): string {
  if (!chapter || !Array.isArray(chapter.verses) || chapter.verses.length === 0) {
    throw new Error('Reader chapter HTML requires a presented chapter.');
  }
  const translationLabel = requiredText(options.translationLabel, 'a translation label');
  if (typeof options.isRead !== 'boolean') throw new Error('Reader chapter HTML requires read status.');
  const highlightedVerse = options.highlightedVerse ?? null;
  if (highlightedVerse !== null && !positiveInteger(highlightedVerse)) {
    throw new Error('Reader chapter HTML requires a valid highlighted verse.');
  }
  const verses = chapter.verses.map((verse) => {
    const highlighted = verse.verse === highlightedVerse ? ' is-highlighted' : '';
    return `<button type="button" class="bq-verse${highlighted}" data-verse="${verse.verse}"><span>${escapeHtml(verse.label)}</span><p data-reader-verse-text>${escapeHtml(verse.text)}</p></button>`;
  }).join('');
  return `<div class="bq-reader-title"><div><p class="bq-eyebrow">${escapeHtml(translationLabel)}</p><h2>${escapeHtml(chapter.heading)}</h2></div><button type="button" class="bq-secondary-button" data-reader-mark>${options.isRead ? 'Marked read' : 'Mark read'}</button></div><div class="bq-verse-list">${verses}</div>`;
}
