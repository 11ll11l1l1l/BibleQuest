import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync('src/features/reader/index.js', 'utf8');

function boundedSource(startToken: string, endToken: string): string {
  const start = source.indexOf(startToken);
  const end = source.indexOf(endToken, start);
  assert.ok(start >= 0, `Missing Reader source token: ${startToken}`);
  assert.ok(end > start, `Could not bound Reader source after: ${startToken}`);
  return source.slice(start, end);
}

const peek = boundedSource(
  'const showPeek = async verse =>',
  'const onChange = async event =>',
);
const click = boundedSource(
  'const onClick = async event =>',
  'const onSubmit = async event =>',
);

test('Verse Peek keeps Scripture/reference/link presentation escaped at the live UI boundary', () => {
  assert.match(peek, /escapeHtml\(peek\.reference\)/);
  assert.match(peek, /escapeHtml\(peek\.text\)/);
  assert.match(peek, /escapeHtml\(link\.href\)/);
  assert.match(peek, /escapeHtml\(link\.label\)/);
  assert.match(source, /target="?_blank"? rel="noopener noreferrer"/);
});

test('Verse Peek exposes a named heading, explicit close action, and modal presentation', () => {
  assert.match(peek, /<p class="bq-eyebrow">VERSE PEEK<\/p>/);
  assert.match(peek, /<h2 id="bq-verse-peek-title">\$\{escapeHtml\(peek\.reference\)\}<\/h2>/);
  assert.match(source, /data-verse-dialog aria-labelledby="bq-verse-peek-title"/);
  assert.match(peek, /dialog\.showModal\(\)/);
  assert.match(source, /data-verse-close>Close<\/button>/);
});

test('Verse Peek context handoff preserves the exact resolved verse and closes the modal first', () => {
  assert.match(peek, /dialog\.dataset\.peekVerse = String\(peek\.verse\)/);

  const contextStart = click.indexOf("if (target.closest('[data-peek-context]'))");
  const contextEnd = click.indexOf("if (target.closest('[data-verse-close]'))", contextStart);
  assert.ok(contextStart >= 0 && contextEnd > contextStart);
  const handoff = click.slice(contextStart, contextEnd);

  const closeAt = handoff.indexOf('dialog?.close()');
  const contextAt = handoff.indexOf('return openContext(');
  assert.ok(closeAt >= 0 && contextAt > closeAt, 'Verse Peek must close before Context Lab takes focus');
  assert.match(handoff, /Number\(dialog\?\.dataset\.peekVerse\)/);
  assert.match(handoff, /verse: verseNumber/);
});

test('Japanese Verse Peek vocabulary remains opt-in and derived from the resolved verse text', () => {
  assert.match(peek, /reader\.getState\(\)\.translation === 'jko'/);
  assert.match(peek, /vocabularyState\?\.enabled/);
  assert.match(peek, /vocabulary\.notesFor\(peek\.text\)/);
  assert.match(peek, /japaneseVocabularyBlock/);
});

test('Verse Peek failures use the existing Reader live message boundary instead of fabricating content', () => {
  assert.match(peek, /catch \(error\)/);
  assert.match(peek, /message\(error\?\.message \|\| 'Could not open verse\.'\)/);
});
