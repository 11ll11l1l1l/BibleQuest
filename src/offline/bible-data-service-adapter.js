import { createBibleDataService } from '../core/bible.js';

const BUNDLED_PACK_PATH = /^data\/packs\/(bible|tagalog|cebuano)\/([A-Z0-9]{3})\.json$/;

const NOOP_OPENED_PACK_STORE = Object.freeze({
  supported: false,
  async read() { return null; },
  async write() { return false; },
  async remove() { return false; }
});

function jsonResponse(payload) {
  return Object.freeze({
    ok: true,
    status: 200,
    async json() { return payload; }
  });
}

export function createOfflineFirstBibleDataService({
  contentProvider,
  manifestResolver,
  fetcher = (...args) => fetch(...args),
  legacyPackStore = false
} = {}) {
  if (!contentProvider || typeof contentProvider.load !== 'function') {
    throw new TypeError('A Scripture content provider with load() is required.');
  }
  if (typeof manifestResolver !== 'function') {
    throw new TypeError('manifestResolver must be a function.');
  }
  if (typeof fetcher !== 'function') {
    throw new TypeError('fetcher must be a function.');
  }

  async function offlineFirstFetcher(input, init) {
    const path = typeof input === 'string' ? input : input?.url;
    const match = typeof path === 'string' ? path.match(BUNDLED_PACK_PATH) : null;
    if (!match) return fetcher(input, init);

    const [, folder, bookCode] = match;
    const manifest = await manifestResolver({ folder, bookCode, path });
    if (!manifest) return fetcher(input, init);

    const loaded = await contentProvider.load(manifest, {
      allowNetwork: init?.allowNetwork !== false,
      signal: init?.signal
    });
    return jsonResponse(loaded.payload);
  }

  const packStore = legacyPackStore || NOOP_OPENED_PACK_STORE;
  return createBibleDataService({ fetcher: offlineFirstFetcher, packStore });
}
