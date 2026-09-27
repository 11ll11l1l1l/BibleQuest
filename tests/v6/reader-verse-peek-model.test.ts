import assert from 'node:assert/strict';
import test from 'node:test';

import { presentReaderVersePeek } from '../../src/v6/reader/index.ts';

test('Verse Peek presentation is independently testable and DOM-free', () => {
  const presentation = presentReaderVersePeek({
    verse: 16,
    reference: 'John 3:16',
    text: 'fixture Scripture text',
    links: [{ label: 'STEP', href: 'https://www.stepbible.org/?q=fixture' }],
  });
  assert.deepEqual(presentation, {
    verse: 16,
    reference: 'John 3:16',
    text: 'fixture Scripture text',
    links: [{ label: 'STEP', href: 'https://www.stepbible.org/?q=fixture' }],
  });
});

test('Verse Peek preserves grouped-verse identity and provider text exactly', () => {
  const presentation = presentReaderVersePeek({
    verse: 16,
    verseEnd: 17,
    reference: 'John 3:16-17',
    text: '<strong>fixture</strong>',
    links: [],
  });
  assert.equal(presentation.verse, 16);
  assert.equal(presentation.verseEnd, 17);
  assert.equal(presentation.text, '<strong>fixture</strong>');
});

test('Verse Peek fails closed for blank Scripture, invalid ranges and unsafe links', () => {
  assert.throws(
    () => presentReaderVersePeek({
      verse: 16,
      reference: 'John 3:16',
      text: '   ',
      links: [],
    }),
    /non-blank Scripture text/,
  );
  assert.throws(
    () => presentReaderVersePeek({
      verse: 16,
      verseEnd: 15,
      reference: 'John 3:16-15',
      text: 'fixture',
      links: [],
    }),
    /valid verse range/,
  );
  assert.throws(
    () => presentReaderVersePeek({
      verse: 16,
      reference: 'John 3:16',
      text: 'fixture',
      links: [{ label: 'unsafe', href: 'javascript:alert(1)' }],
    }),
    /HTTPS external links/,
  );
});
