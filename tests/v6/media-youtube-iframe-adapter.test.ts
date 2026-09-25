import assert from 'node:assert/strict';
import test from 'node:test';
import type { MediaSource } from '../../src/v6/media/contracts.ts';
import {
  createYouTubeIframeAdapter,
  type YouTubePlayer,
  type YouTubePlayerApi,
  type YouTubePlayerErrorEvent,
  type YouTubePlayerReadyEvent,
} from '../../src/v6/media/youtube-iframe-adapter.ts';

function source(externalId = 'abcdefghijk'): MediaSource {
  return {
    id: 'service-1',
    provider: 'youtube',
    externalId,
    title: 'Sunday Service',
    durationSeconds: 3600,
  };
}

interface PlayerEvents {
  readonly onReady?: (event: YouTubePlayerReadyEvent) => void;
  readonly onError?: (event: YouTubePlayerErrorEvent) => void;
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

function harness({ autoReady = true } = {}) {
  const calls: string[] = [];
  let target: HTMLElement | string | null = null;
  const players: Player[] = [];

  class Player implements YouTubePlayer {
    readonly events: PlayerEvents;

    constructor(element: HTMLElement | string, options?: Record<string, unknown>) {
      target = element;
      calls.push(`construct:${JSON.stringify(options)}`);
      this.events = (options?.events ?? {}) as PlayerEvents;
      players.push(this);
      if (autoReady) queueMicrotask(() => this.events.onReady?.({ target: this }));
    }

    cueVideoById(input: { videoId: string; startSeconds?: number }) {
      calls.push(`cue:${input.videoId}@${input.startSeconds ?? 0}`);
    }
    loadVideoById(input: { videoId: string; startSeconds?: number }) {
      calls.push(`load:${input.videoId}@${input.startSeconds ?? 0}`);
    }
    playVideo() { calls.push('play'); }
    pauseVideo() { calls.push('pause'); }
    stopVideo() { calls.push('stop'); }
    seekTo(seconds: number, allowSeekAhead: boolean) {
      calls.push(`seek:${seconds}:${allowSeekAhead}`);
    }
    destroy() { calls.push('destroy'); }
  }

  const api: YouTubePlayerApi = { Player };
  const adapter = createYouTubeIframeAdapter({
    api: async () => api,
    resolveElement: (instanceId) => `youtube-${instanceId}`,
  });

  return {
    api,
    adapter,
    calls,
    players,
    getTarget: () => target,
    ready(index = 0) {
      const current = players[index];
      if (!current) throw new Error('No fake YouTube player exists.');
      current.events.onReady?.({ target: current });
    },
    error(code = 101, index = 0) {
      const current = players[index];
      if (!current) throw new Error('No fake YouTube player exists.');
      current.events.onError?.({ target: current, data: code });
    },
  };
}

async function settleConstruction() {
  await Promise.resolve();
  await Promise.resolve();
}

test('YouTube adapter waits for onReady before issuing IFrame Player API commands', async () => {
  const h = harness({ autoReady: false });
  const handle = h.adapter.create('recordings-main');

  const loading = handle.load(source(), 25);
  await settleConstruction();

  assert.equal(h.calls.some((call) => call.startsWith('construct:')), true);
  assert.equal(h.calls.some((call) => call.startsWith('cue:')), false);

  h.ready();
  await loading;
  await handle.play();
  await handle.seek(42);
  await handle.pause();
  await handle.stop();
  await handle.unload();

  assert.equal(h.getTarget(), 'youtube-recordings-main');
  assert.equal(h.adapter.capabilities.seek, true);
  assert.equal(h.adapter.capabilities.pictureInPicture, false);
  assert.equal(h.calls.some((call) => call.includes('\"enablejsapi\":1')), true);
  assert.equal(h.calls.some((call) => call.includes('\"playsinline\":1')), true);
  assert.deepEqual(
    h.calls.filter((call) => !call.startsWith('construct:')),
    ['cue:abcdefghijk@25', 'play', 'seek:42:true', 'pause', 'stop', 'destroy'],
  );
});

test('YouTube adapter creates one ready player lazily and reuses it for subsequent sources', async () => {
  const h = harness();
  const handle = h.adapter.create('player');

  await handle.load(source('abcdefghijk'), 0);
  await handle.load(source('ZYXWVUTsrqp'), 15);

  assert.equal(h.calls.filter((call) => call.startsWith('construct:')).length, 1);
  assert.equal(h.calls.includes('cue:abcdefghijk@0'), true);
  assert.equal(h.calls.includes('cue:ZYXWVUTsrqp@15'), true);
});

test('YouTube adapter rejects provider error before ready and destroys the half-created player', async () => {
  const h = harness({ autoReady: false });
  const handle = h.adapter.create('player');
  const loading = handle.load(source(), 0);
  await settleConstruction();

  h.error(101);
  await assert.rejects(loading, /code 101/);
  assert.equal(h.calls.filter((call) => call === 'destroy').length, 1);
  assert.throws(() => handle.play(), /not loaded/);
});

test('YouTube adapter times out while waiting for onReady without leaking a player', async () => {
  const clock = timers();
  const calls: string[] = [];

  class TimedPlayer implements YouTubePlayer {
    constructor(_element: HTMLElement | string, _options?: Record<string, unknown>) {
      calls.push('construct');
    }
    cueVideoById() { calls.push('cue'); }
    loadVideoById() {}
    playVideo() {}
    pauseVideo() {}
    stopVideo() {}
    seekTo() {}
    destroy() { calls.push('destroy'); }
  }

  const handle = createYouTubeIframeAdapter({
    api: { Player: TimedPlayer },
    resolveElement: () => 'target',
    readyTimeoutMs: 50,
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
  }).create('player');

  const loading = handle.load(source(), 0);
  await settleConstruction();
  clock.fire();

  await assert.rejects(loading, /timed out/);
  assert.deepEqual(calls, ['construct', 'destroy']);
});

test('YouTube adapter unloads a player that is still waiting for onReady exactly once', async () => {
  const h = harness({ autoReady: false });
  const handle = h.adapter.create('player');
  const loading = handle.load(source(), 0);
  await settleConstruction();

  await handle.unload();
  await assert.rejects(loading, /handle is unloaded/);
  await handle.unload();

  assert.equal(h.calls.filter((call) => call === 'destroy').length, 1);
});

test('YouTube adapter fails closed for invalid identity, missing API, invalid timeout, and use after unload', async () => {
  const h = harness();
  const handle = h.adapter.create('player');

  await assert.rejects(handle.load(source('bad id'), 0), /source id is invalid/);
  await assert.rejects(handle.load(source(), -1), /start position is invalid/);

  const unavailable = createYouTubeIframeAdapter({
    api: async () => ({ Player: null } as unknown as YouTubePlayerApi),
    resolveElement: () => 'target',
  }).create('player');
  await assert.rejects(unavailable.load(source(), 0), /API is unavailable/);

  assert.throws(
    () => createYouTubeIframeAdapter({
      api: h.api,
      resolveElement: () => 'target',
      readyTimeoutMs: 0,
    }),
    /ready timeout must be from 1/,
  );

  await handle.load(source(), 0);
  await handle.unload();
  await handle.unload();
  assert.equal(h.calls.filter((call) => call === 'destroy').length, 1);
  await assert.rejects(handle.load(source(), 0), /handle is unloaded/);
  assert.throws(() => handle.play(), /handle is unloaded/);
});
