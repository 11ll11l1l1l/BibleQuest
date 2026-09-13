import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/app/offline-scripture-status.js', import.meta.url), 'utf8');
const { createOfflineScriptureAvailability } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

const bibleService = {
  getTranslation(id) {
    const rows = {
      bsb: { id: 'bsb', bundled: true, mode: 'bundled', folder: 'bible' },
      jko: { id: 'jko', bundled: false, mode: 'live-kougo' },
      nlt: { id: 'nlt', bundled: false, mode: 'licensed-link' }
    };
    if (!rows[id]) throw new Error('bad translation');
    return rows[id];
  },
  getBook(code) {
    if (code !== 'JHN') throw new Error('bad book');
    return { code: 'JHN' };
  }
};

function cacheStorageWith(hit) {
  return {
    async open(name) {
      assert.equal(name, 'biblequest-v3-opened-bible-packs-v1');
      return {
        async match(key) {
          assert.equal(key, 'https://example.test/data/packs/bible/JHN.json');
          return hit ? { ok: true } : undefined;
        }
      };
    }
  };
}

test('reports a cached bundled book as available offline', async () => {
  const availability = createOfflineScriptureAvailability({
    bibleService,
    cacheStorage: cacheStorageWith(true),
    locationRef: { href: 'https://example.test/reader' }
  });
  const status = await availability.getStatus('bsb', 'JHN');
  assert.equal(status.available, true);
  assert.equal(status.supported, true);
  assert.equal(status.reason, 'Available offline.');
});

test('reports a never-opened bundled book as unavailable without guessing', async () => {
  const availability = createOfflineScriptureAvailability({
    bibleService,
    cacheStorage: cacheStorageWith(false),
    locationRef: { href: 'https://example.test/' }
  });
  const status = await availability.getStatus('bsb', 'JHN');
  assert.equal(status.available, false);
  assert.match(status.reason, /Open this book while online/);
});

test('reports live translations as network-required in V5', async () => {
  const availability = createOfflineScriptureAvailability({ bibleService, cacheStorage: cacheStorageWith(true) });
  const status = await availability.getStatus('jko', 'JHN');
  assert.equal(status.available, false);
  assert.equal(status.supported, false);
  assert.match(status.reason, /requires a network connection/);
});

test('does not imply BibleQuest caches licensed external-reader translations', async () => {
  const availability = createOfflineScriptureAvailability({ bibleService, cacheStorage: cacheStorageWith(true) });
  const status = await availability.getStatus('nlt', 'JHN');
  assert.equal(status.available, false);
  assert.match(status.reason, /licensed external reader/);
});

test('fails closed when Cache Storage is unavailable', async () => {
  const availability = createOfflineScriptureAvailability({ bibleService, cacheStorage: null });
  const status = await availability.getStatus('bsb', 'JHN');
  assert.equal(status.available, false);
  assert.equal(status.supported, false);
});

test('fails closed when cache inspection throws', async () => {
  const availability = createOfflineScriptureAvailability({
    bibleService,
    cacheStorage: { async open() { throw new Error('blocked'); } }
  });
  const status = await availability.getStatus('bsb', 'JHN');
  assert.equal(status.available, false);
  assert.equal(status.supported, false);
  assert.match(status.reason, /could not be checked/);
});
