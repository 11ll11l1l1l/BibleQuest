import assert from 'node:assert/strict';
import test from 'node:test';

import { createContextLab } from '../../src/features/reader/context.js';

const book = Object.freeze({ code: 'JHN', name: 'John', chapters: 21 });
const verses = Object.freeze([
  Object.freeze({ chapter: 3, verse: 15, text: 'fixture fifteen' }),
  Object.freeze({ chapter: 3, verse: 16, text: 'fixture sixteen' }),
  Object.freeze({ chapter: 3, verse: 17, text: 'fixture seventeen' }),
]);

class FakeDialog {
  open = false;
  innerHTML = '';

  showModal() {
    this.open = true;
  }

  close() {
    this.open = false;
  }

  querySelector() {
    return null;
  }

  querySelectorAll() {
    return [];
  }

  replaceChildren() {
    this.innerHTML = '';
  }
}

function contextSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    available: true,
    reason: '',
    book,
    chapter: 3,
    verse: 16,
    reference: 'John 3:16',
    scripture: verses[1],
    previous: verses[0],
    next: verses[2],
    entries: [],
    source: 'STEPBible fixture',
    license: 'CC BY 4.0',
    note: 'fixture',
    external: [],
    ...overrides,
  };
}

function readerHarness(snapshotFactory = () => contextSnapshot()) {
  let lexicalCalls = 0;
  const reader = {
    books: [book],
    getState() {
      return { translation: 'jko', book: 'JHN', chapter: 3 };
    },
    async contextChapter(code: string, chapter: number) {
      assert.equal(code, 'JHN');
      assert.equal(chapter, 3);
      return {
        book,
        chapter: 3,
        translation: { id: 'bsb', label: 'BSB' },
        verses,
      };
    },
    async lexicalContext({ code, chapter, verse }: { code: string; chapter: number; verse: number }) {
      lexicalCalls += 1;
      assert.deepEqual({ code, chapter, verse }, { code: 'JHN', chapter: 3, verse: 16 });
      return snapshotFactory();
    },
  };
  return { reader, getLexicalCalls: () => lexicalCalls };
}

test('live Context Lab validates and renders an exact BSB passage while leaving Reader translation state untouched', async () => {
  const dialog = new FakeDialog();
  const { reader, getLexicalCalls } = readerHarness();
  const lab = createContextLab({ reader, dialog });

  await lab.open({ code: 'JHN', chapter: 3, verse: 16 });

  assert.equal(getLexicalCalls(), 1);
  assert.match(dialog.innerHTML, /BSB · John 3:16/);
  assert.match(dialog.innerHTML, /fixture sixteen/);
  assert.equal(reader.getState().translation, 'jko');
});

test('live Context Lab rejects a mismatched provider response instead of rendering out-of-context Scripture', async () => {
  const dialog = new FakeDialog();
  const { reader } = readerHarness(() => contextSnapshot({
    book: { code: 'GEN', name: 'Genesis', chapters: 50 },
    reference: 'Genesis 3:16',
  }));
  const lab = createContextLab({ reader, dialog });

  await lab.open({ code: 'JHN', chapter: 3, verse: 16 });

  assert.match(dialog.innerHTML, /Could not load the context tools/);
  assert.match(dialog.innerHTML, /does not match the requested BSB passage/);
  assert.doesNotMatch(dialog.innerHTML, /Genesis 3:16/);
});

test('live Context Lab rejects an unavailable verse before lexical provider I/O', async () => {
  const dialog = new FakeDialog();
  const { reader, getLexicalCalls } = readerHarness();
  const lab = createContextLab({ reader, dialog });

  await lab.open({ code: 'JHN', chapter: 3, verse: 99 });

  assert.equal(getLexicalCalls(), 0);
  assert.match(dialog.innerHTML, /requested BSB verse is unavailable/);
});

test('live Context Lab rejects invalid numeric input instead of coercing it to verse one', async () => {
  const dialog = new FakeDialog();
  const { reader, getLexicalCalls } = readerHarness();
  const lab = createContextLab({ reader, dialog });

  await lab.open({ code: 'JHN', chapter: 3, verse: Number.NaN });

  assert.equal(getLexicalCalls(), 0);
  assert.match(dialog.innerHTML, /requires an exact Bible book, chapter, and verse/);
});
