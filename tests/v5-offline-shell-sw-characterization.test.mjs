import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const WORKER_PATH = new URL('../offline-shell-sw.js', import.meta.url);
const ACTIVE_CACHE = 'biblequest-v3-offline-shell-v1';

function keyOf(request) {
  return typeof request === 'string' ? request : request.url;
}

function makeHarness({ fetchImpl = async () => new Response('network', { status: 200 }), initialCaches = {} } = {}) {
  const listeners = new Map();
  const stores = new Map(
    Object.entries(initialCaches).map(([name, entries]) => [name, new Map(Object.entries(entries))])
  );
  const deleted = [];
  let claimed = false;
  let skipped = false;

  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name);
      return {
        async put(request, response) {
          entries.set(keyOf(request), response.clone());
        },
        async match(request, options = {}) {
          const requested = keyOf(request);
          if (!options.ignoreSearch) return entries.get(requested)?.clone();
          const target = new URL(requested);
          for (const [key, response] of entries) {
            const candidate = new URL(key);
            if (candidate.origin === target.origin && candidate.pathname === target.pathname) {
              return response.clone();
            }
          }
          return undefined;
        }
      };
    },
    async keys() {
      return [...stores.keys()];
    },
    async delete(name) {
      deleted.push(name);
      return stores.delete(name);
    }
  };

  const self = {
    location: new URL('https://app.example.test/app/'),
    registration: { scope: 'https://app.example.test/app/' },
    clients: { async claim() { claimed = true; } },
    async skipWaiting() { skipped = true; },
    addEventListener(type, listener) { listeners.set(type, listener); }
  };

  return {
    context: vm.createContext({
      self,
      caches,
      fetch: fetchImpl,
      Request,
      Response,
      URL,
      console,
      setTimeout,
      clearTimeout
    }),
    listeners,
    stores,
    deleted,
    state: {
      get claimed() { return claimed; },
      get skipped() { return skipped; }
    }
  };
}

async function loadHarness(options) {
  const harness = makeHarness(options);
  const source = await readFile(WORKER_PATH, 'utf8');
  vm.runInContext(source, harness.context, { filename: 'offline-shell-sw.js' });
  return harness;
}

function dispatchFetch(listener, request) {
  let responsePromise;
  listener({
    request,
    respondWith(value) {
      responsePromise = Promise.resolve(value);
    }
  });
  return responsePromise;
}

function request(url, { mode = 'cors', destination = '', method = 'GET' } = {}) {
  return { url, mode, destination, method };
}

test('Scripture/data requests bypass shell interception so integrity acquisition remains the owner', async () => {
  const harness = await loadHarness();
  const response = dispatchFetch(
    harness.listeners.get('fetch'),
    request('https://app.example.test/app/offline/web/jhn.json')
  );
  assert.equal(response, undefined);
  assert.equal(harness.stores.size, 0);
});

test('network probes and out-of-scope shell-looking URLs are not intercepted', async () => {
  const harness = await loadHarness();
  assert.equal(
    dispatchFetch(
      harness.listeners.get('fetch'),
      request('https://app.example.test/app/main.js?bq-net-probe=1', { destination: 'script' })
    ),
    undefined
  );
  assert.equal(
    dispatchFetch(
      harness.listeners.get('fetch'),
      request('https://app.example.test/outside/main.js', { destination: 'script' })
    ),
    undefined
  );
});

test('shell assets are network-first and successful responses refresh the active cache', async () => {
  const harness = await loadHarness({
    fetchImpl: async () => new Response('fresh-script', { status: 200 })
  });
  const req = request('https://app.example.test/app/main.js', { destination: 'script' });
  const response = await dispatchFetch(harness.listeners.get('fetch'), req);
  assert.equal(await response.text(), 'fresh-script');

  const stored = harness.stores.get(ACTIVE_CACHE).get(req.url);
  assert.ok(stored);
  assert.equal(await stored.text(), 'fresh-script');
});

test('shell assets fall back to the warmed cache on network failure', async () => {
  const url = 'https://app.example.test/app/main.js';
  const harness = await loadHarness({
    fetchImpl: async () => { throw new TypeError('offline'); },
    initialCaches: {
      [ACTIVE_CACHE]: { [url]: new Response('cached-script', { status: 200 }) }
    }
  });
  const response = await dispatchFetch(
    harness.listeners.get('fetch'),
    request(url, { destination: 'script' })
  );
  assert.equal(await response.text(), 'cached-script');
});

test('offline navigation falls back to the cached app scope root when the exact route is absent', async () => {
  const root = 'https://app.example.test/app/';
  const harness = await loadHarness({
    fetchImpl: async () => { throw new TypeError('offline'); },
    initialCaches: {
      [ACTIVE_CACHE]: { [root]: new Response('app-shell', { status: 200 }) }
    }
  });
  const response = await dispatchFetch(
    harness.listeners.get('fetch'),
    request('https://app.example.test/app/reader?book=JHN', { mode: 'navigate' })
  );
  assert.equal(await response.text(), 'app-shell');
});

test('activation removes only obsolete BibleQuest shell caches and claims clients', async () => {
  const harness = await loadHarness({
    initialCaches: {
      'biblequest-v3-offline-shell-v0': {},
      [ACTIVE_CACHE]: {},
      'unrelated-cache': {}
    }
  });
  let completion;
  harness.listeners.get('activate')({
    waitUntil(value) { completion = Promise.resolve(value); }
  });
  await completion;

  assert.deepEqual(harness.deleted, ['biblequest-v3-offline-shell-v0']);
  assert.equal(harness.state.claimed, true);
  assert.equal(harness.stores.has(ACTIVE_CACHE), true);
  assert.equal(harness.stores.has('unrelated-cache'), true);
});
