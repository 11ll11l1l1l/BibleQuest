import assert from 'node:assert/strict';
import test from 'node:test';

import {
  presentReaderChapter,
  presentReaderVerse,
  renderReaderChapterPresentation,
  readerChapterHeading,
} from '../../src/v6/reader/presentation.ts';

test('presents representative OT and NT chapter headings without changing Scripture text', () => {
  const genesis = presentReaderChapter({
    book: { code: 'GEN', name: 'Genesis', chapters: 50 },
    chapter: 1,
    verses: [
      { chapter: 1, verse: 1, text: 'In the beginning fixture text.' },
      { chapter: 1, verse: 2, text: 'Second fixture verse.' },
    ],
  });
  assert.equal(genesis.heading, 'Genesis 1');
  assert.deepEqual(genesis.verses.map((verse) => verse.label), ['1', '2']);
  assert.equal(genesis.verses[0]?.text, 'In the beginning fixture text.');

  const john = presentReaderChapter({
    book: { code: 'JHN', name: 'John', chapters: 21 },
    chapter: 3,
    verses: [{ chapter: 3, verse: 16, text: 'Tagalog fixture text remains exact.' }],
  });
  assert.equal(john.heading, 'John 3');
  assert.equal(john.verses[0]?.text, 'Tagalog fixture text remains exact.');
});

test('preserves Japanese text and grouped verse labels without translation substitution', () => {
  const japaneseFixture = '日本語のテスト本文';
  const chapter = presentReaderChapter({
    book: { code: 'JHN', name: 'ヨハネによる福音書', chapters: 21 },
    chapter: 3,
    verses: [{ chapter: 3, verse: 16, verseEnd: 17, text: japaneseFixture }],
  });
  assert.equal(chapter.heading, 'ヨハネによる福音書 3');
  assert.equal(chapter.verses[0]?.label, '16–17');
  assert.equal(chapter.verses[0]?.text, japaneseFixture);
});

test('renders chapter and verse presentation as escaped, independently testable HTML', () => {
  const chapter = presentReaderChapter({
    book: { code: 'JHN', name: 'John <3>', chapters: 21 },
    chapter: 3,
    verses: [
      { chapter: 3, verse: 16, verseEnd: 17, text: 'For God so loved <the world> & all.' },
      { chapter: 3, verse: 18, text: 'Whoever believes.' },
    ],
  });
  const html = renderReaderChapterPresentation(chapter, {
    translationLabel: 'BSB & <English>', highlightedVerse: 16, isRead: false,
  });
  assert.match(html, /BSB &amp; &lt;English&gt;/);
  assert.match(html, /John &lt;3&gt; 3/);
  assert.match(html, /data-verse="16">/);
  assert.match(html, /class="bq-verse is-highlighted"/);
  assert.match(html, /16–17/);
  assert.match(html, /For God so loved &lt;the world&gt; &amp; all\./);
  assert.match(html, />Mark read</);
  assert.doesNotMatch(html, /<the world>/);
  const readHtml = renderReaderChapterPresentation(chapter, {
    translationLabel: 'BSB', highlightedVerse: null, isRead: true,
  });
  assert.match(readHtml, />Marked read</);
  assert.doesNotMatch(readHtml, /is-highlighted/);
});

test('chapter and verse presentation fail closed on malformed Scripture metadata', () => {
  assert.throws(() => readerChapterHeading({ name: '' }, 1), /book name/i);
  assert.throws(
    () => presentReaderVerse({ chapter: 1, verse: 3, verseEnd: 2, text: 'fixture' }),
    /verse range/i,
  );
  assert.throws(
    () => presentReaderVerse({ chapter: 1, verse: 1, text: '   ' }),
    /non-blank Scripture text/i,
  );
  assert.throws(
    () =>
      presentReaderChapter({
        book: { code: 'JHN', name: 'John', chapters: 21 },
        chapter: 3,
        verses: [
          { chapter: 3, verse: 2, text: 'fixture 2' },
          { chapter: 3, verse: 2, text: 'duplicate fixture' },
        ],
      }),
    /overlapping or out-of-order/i,
  );
  assert.throws(
    () =>
      presentReaderChapter({
        book: { code: 'JHN', name: 'John', chapters: 21 },
        chapter: 3,
        verses: [{ chapter: 4, verse: 1, text: 'wrong chapter fixture' }],
      }),
    /another chapter/i,
  );
});
