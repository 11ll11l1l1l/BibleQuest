import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createBibleDataService } from '../src/core/bible.js';
import { createOfflineScriptureAvailability } from '../src/app/offline-scripture-status.js';

const helperSource = await readFile(new URL('../src/app/offline-scripture-status.js', import.meta.url), 'utf8');
const bibleSource = await readFile(new URL('../src/core/bible.js', import.meta.url), 'utf8');

function makePackStore(initialPayload) {
  let payload = initialPayload;
  let removeCount = 0;
  return {
    supported: true,
    async read(path) {
      assert.equal(path, 'data/packs/bible/JHN.json');
      return payload;
    },
    async write() { throw new Error('availability probe must not write'); },
    async remove(path) {
      assert.equal(path, 'data/packs/bible/JHN.json');
      removeCount += 1;
      payload = null;
      return true;
    },
    get removeCount() { return removeCount; }
  };
}

function createServices(payload) {
  const packStore = makePackStore(payload);
  const metadataService = createBibleDataService({ fetcher: async () => { throw new Error('unused'); }, packStore });
  const probeService = createBibleDataService({ fetcher: async () => { throw new TypeError('network disabled'); }, packStore });
  return { packStore, metadataService, probeService };
}

test('availability helper delegates cache identity and validation to the Bible service owner', () => {
  assert.match(helperSource, /createBibleDataService/);
  assert.doesNotMatch(helperSource, /biblequest-v3-opened-bible-packs-v1/);
  assert.doesNotMatch(helperSource, /data\/packs\/\$\{/);
  assert.match(bibleSource, /const OFFLINE_PACK_CACHE = 'biblequest-v3-opened-bible-packs-v1'/);
  assert.match(bibleSource, /Offline .* pack for .* is malformed and was removed/);
});

test('reports a valid cached bundled book as available through the real Bible cache owner', async () => {
  const { metadataService, probeService } = createServices([{ c: 1, v: 1, t: 'In the beginning.' }]);
  const availability = createOfflineScriptureAvailability({ bibleService: metadataService, probeService });
  const status = await availability.getStatus('bsb', 'JHN');
  assert.deepEqual(status, {
    translationId: 'bsb',
    bookCode: 'JHN',
    available: true,
    supported: true,
    reason: 'Available offline.'
  });
});

test('never-opened bundled Scripture fails clearly without network access', async () => {
  const { metadataService, probeService } = createServices(null);
  const availability = createOfflineScriptureAvailability({ bibleService: metadataService, probeService });
  const status = await availability.getStatus('bsb', 'JHN');
  assert.equal(status.available, false);
  assert.equal(status.supported, true);
  assert.match(status.reason, /Open this book while online/);
});

test('malformed cached Scripture fails closed and is removed by the real Bible cache owner', async () => {
  const { packStore, metadataService, probeService } = createServices([{ c: 999, v: 1, t: 'invalid chapter' }]);
  const availability = createOfflineScriptureAvailability({ bibleService: metadataService, probeService });
  const status = await availability.getStatus('bsb', 'JHN');
  assert.equal(status.available, false);
  assert.equal(status.supported, true);
  assert.match(status.reason, /saved offline copy was invalid and was removed/i);
  assert.equal(packStore.removeCount, 1);
});

test('live translations remain explicitly network-required', async () => {
  const { metadataService, probeService } = createServices(null);
  const availability = createOfflineScriptureAvailability({ bibleService: metadataService, probeService });
  const status = await availability.getStatus('jko', 'JHN');
  assert.equal(status.available, false);
  assert.equal(status.supported, false);
  assert.match(status.reason, /requires a network connection/);
});

test('licensed external-reader translations are never implied cached', async () => {
  const { metadataService, probeService } = createServices(null);
  const availability = createOfflineScriptureAvailability({ bibleService: metadataService, probeService });
  const status = await availability.getStatus('nlt', 'JHN');
  assert.equal(status.available, false);
  assert.equal(status.supported, false);
  assert.match(status.reason, /licensed external reader/);
});
