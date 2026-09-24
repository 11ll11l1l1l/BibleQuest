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
