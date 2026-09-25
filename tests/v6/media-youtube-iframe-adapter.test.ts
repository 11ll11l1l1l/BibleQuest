import assert from 'node:assert/strict';
import test from 'node:test';
import type { MediaSource } from '../../src/v6/media/contracts.ts';
import {
  createYouTubeIframeAdapter,
  type YouTubePlayer,
  type YouTubePlayerApi,
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

function harness() {
  const calls: string[] = [];
  let target: HTMLElement | string | null = null;

  class Player implements YouTubePlayer {
    constructor(element: HTMLElement | string, options?: Record<string, unknown>) {
      target = element;
      calls.push(`construct:${JSON.stringify(options)}`);
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

  return { adapter, calls, getTarget: () => target };
}

test('YouTube adapter maps the media provider contract to IFrame Player API commands', async () => {
  const h = harness();
  const handle = h.adapter.create('recordings-main');

  await handle.load(source(), 25);
  await handle.play();
  await handle.seek(42);
  await handle.pause();
  await handle.stop();
  await handle.unload();

  assert.equal(h.getTarget(), 'youtube-recordings-main');
  assert.equal(h.adapter.capabilities.seek, true);
  assert.equal(h.adapter.capabilities.pictureInPicture, false);
  assert.equal(h.calls.some((call) => call.includes('"enablejsapi":1')), true);
  assert.equal(h.calls.some((call) => call.includes('"playsinline":1')), true);
  assert.deepEqual(
    h.calls.filter((call) => !call.startsWith('construct:')),
    ['cue:abcdefghijk@25', 'play', 'seek:42:true', 'pause', 'stop', 'destroy'],
  );
});

test('YouTube adapter creates one player lazily and reuses it for subsequent sources', async () => {
  const h = harness();
  const handle = h.adapter.create('player');

  await handle.load(source('abcdefghijk'), 0);
  await handle.load(source('ZYXWVUTsrqp'), 15);

  assert.equal(h.calls.filter((call) => call.startsWith('construct:')).length, 1);
  assert.equal(h.calls.includes('cue:abcdefghijk@0'), true);
  assert.equal(h.calls.includes('cue:ZYXWVUTsrqp@15'), true);
});

test('YouTube adapter fails closed for invalid source identity, missing API, and use after unload', async () => {
  const h = harness();
  const handle = h.adapter.create('player');

  await assert.rejects(handle.load(source('bad id'), 0), /source id is invalid/);
  await assert.rejects(handle.load(source(), -1), /start position is invalid/);

  const unavailable = createYouTubeIframeAdapter({
    api: async () => ({ Player: null } as unknown as YouTubePlayerApi),
    resolveElement: () => 'target',
  }).create('player');
  await assert.rejects(unavailable.load(source(), 0), /API is unavailable/);

  await handle.load(source(), 0);
  await handle.unload();
  await handle.unload();
  assert.equal(h.calls.filter((call) => call === 'destroy').length, 1);
  await assert.rejects(handle.load(source(), 0), /handle is unloaded/);
  assert.throws(() => handle.play(), /handle is unloaded/);
});
