import assert from 'node:assert/strict';
import test from 'node:test';
import type { YouTubePlayerApi } from '../../src/v6/media/youtube-iframe-adapter.ts';
import {
  loadYouTubeIframeApi,
  YOUTUBE_IFRAME_API_URL,
  type YouTubeIframeApiGlobal,
} from '../../src/v6/media/youtube-iframe-loader.ts';

function api(): YouTubePlayerApi {
  return {
    Player: class {
      cueVideoById() {}
      loadVideoById() {}
      playVideo() {}
      pauseVideo() {}
      stopVideo() {}
      seekTo() {}
      destroy() {}
    },
  } as unknown as YouTubePlayerApi;
}

class FakeScript {
  src = '';
  async = false;
  dataset: Record<string, string> = {};
  removed = false;
  private listeners = new Map<string, Set<() => void>>();

  addEventListener(type: string, listener: () => void) {
    const set = this.listeners.get(type) ?? new Set<() => void>();
    set.add(listener);
    this.listeners.set(type, set);
  }

  removeEventListener(type: string, listener: () => void) {
    this.listeners.get(type)?.delete(listener);
  }

  fire(type: string) {
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener();
  }

  remove() {
    this.removed = true;
  }
}

function documentHarness() {
  const scripts: FakeScript[] = [];
  const document = {
    head: {
      append(node: FakeScript) {
        scripts.push(node);
      },
    },
    documentElement: null,
    createElement(tag: string) {
      assert.equal(tag, 'script');
      return new FakeScript();
    },
    querySelector(selector: string) {
      assert.equal(selector, `script[src="${YOUTUBE_IFRAME_API_URL}"]`);
      return scripts.find((script) => script.src === YOUTUBE_IFRAME_API_URL && !script.removed) ?? null;
    },
  } as unknown as Document;

  return { document, scripts };
}

function timers() {
  let callback: (() => void) | null = null;
  return {
    setTimeout(next: () => void) {
      callback = next;
      return 1;
    },
    clearTimeout() {
      callback = null;
    },
    fire() {
      const current = callback;
      callback = null;
      current?.();
    },
  };
}

test('YouTube loader resolves immediately when the official API is already present', async () => {
  const loaded = api();
  const global: YouTubeIframeApiGlobal = { YT: loaded };
  const docs = documentHarness();

  assert.strictEqual(
    await loadYouTubeIframeApi({ global, document: docs.document }),
    loaded,
  );
  assert.equal(docs.scripts.length, 0);
});

test('YouTube loader deduplicates concurrent loads and preserves an existing ready callback', async () => {
  const global: YouTubeIframeApiGlobal = {};
  const docs = documentHarness();
  const clock = timers();
  let previousReadyCalls = 0;
  const previousReady = () => { previousReadyCalls += 1; };
  global.onYouTubeIframeAPIReady = previousReady;

  const first = loadYouTubeIframeApi({
    global,
    document: docs.document,
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
  });
  const second = loadYouTubeIframeApi({
    global,
    document: docs.document,
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
  });

  assert.strictEqual(first, second);
  assert.equal(docs.scripts.length, 1);
  assert.equal(docs.scripts[0].src, YOUTUBE_IFRAME_API_URL);
  assert.equal(docs.scripts[0].async, true);
  assert.equal(docs.scripts[0].dataset.bqYoutubeIframeApi, '1');

  const loaded = api();
  global.YT = loaded;
  global.onYouTubeIframeAPIReady?.();

  assert.strictEqual(await first, loaded);
  assert.strictEqual(await second, loaded);
  assert.equal(previousReadyCalls, 1);
  assert.strictEqual(global.onYouTubeIframeAPIReady, previousReady);
});

test('YouTube loader fails closed on script error, removes its failed script, and allows retry', async () => {
  const global: YouTubeIframeApiGlobal = {};
  const docs = documentHarness();
  const clock = timers();

  const first = loadYouTubeIframeApi({
    global,
    document: docs.document,
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
  });
  assert.equal(docs.scripts.length, 1);
  docs.scripts[0].fire('error');
  await assert.rejects(first, /failed to load/);
  assert.equal(docs.scripts[0].removed, true);

  const second = loadYouTubeIframeApi({
    global,
    document: docs.document,
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
  });
  assert.equal(docs.scripts.length, 2);

  const loaded = api();
  global.YT = loaded;
  global.onYouTubeIframeAPIReady?.();
  assert.strictEqual(await second, loaded);
});

test('YouTube loader restores global state after timeout and rejects unsafe loader configuration', async () => {
  const global: YouTubeIframeApiGlobal = {};
  const docs = documentHarness();
  const clock = timers();

  const pending = loadYouTubeIframeApi({
    global,
    document: docs.document,
    timeoutMs: 50,
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
  });
  clock.fire();
  await assert.rejects(pending, /timed out/);
  assert.equal(global.onYouTubeIframeAPIReady, undefined);
  assert.equal(docs.scripts[0].removed, true);

  await assert.rejects(
    loadYouTubeIframeApi({ global: {}, document: docs.document, timeoutMs: 0 }),
    /timeout must be from 1/,
  );
  await assert.rejects(
    loadYouTubeIframeApi({
      global: {},
      document: docs.document,
      scriptUrl: 'https://example.com/iframe_api',
    }),
    /script URL is invalid/,
  );
  await assert.rejects(
    loadYouTubeIframeApi({ global: {}, document: undefined }),
    /requires a browser document/,
  );
});
