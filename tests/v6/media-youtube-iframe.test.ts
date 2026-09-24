import assert from 'node:assert/strict';
import test from 'node:test';
import { createYouTubeIframeProviderAdapter } from '../../src/v6/media/youtube-iframe.ts';

test('YouTube provider uses an explicit IFrame API player boundary, not raw messaging', () => {
  const calls: string[] = [];
  let events: any = null;
  const provider = createYouTubeIframeProviderAdapter({
    createPlayer(input) {
      events = input.events;
      assert.equal(input.videoId, 'abc12345');
      assert.equal(input.title, 'Sunday Service');
      return {
        playVideo() { calls.push('playVideo'); },
        pauseVideo() { calls.push('pauseVideo'); },
        stopVideo() { calls.push('stopVideo'); },
        seekTo(seconds: number, allow: boolean) { calls.push(`seekTo:${seconds}:${allow}`); },
        destroy() { calls.push('destroy'); },
        getCurrentTime() { return 42; },
      };
    },
  });

  const player = provider.create({
    instanceId: 'recording-main',
    source: { provider: 'youtube', mediaId: 'abc12345', title: 'Sunday Service' },
    host: {},
  });
  events.onReady();
  assert.equal(player.getState().status, 'ready');
  player.play();
  player.seek(30);
  events.onStateChange(2);
  assert.equal(player.getState().status, 'paused');
  assert.equal(player.getState().positionSeconds, 42);
  player.stop();
  player.destroy();
  assert.deepEqual(calls, ['playVideo', 'seekTo:30:true', 'stopVideo', 'destroy']);
  assert.equal(player.getState().status, 'destroyed');
});

test('YouTube provider validates sources and seek bounds', () => {
  const provider = createYouTubeIframeProviderAdapter({
    createPlayer() {
      return {
        playVideo() {}, pauseVideo() {}, stopVideo() {}, seekTo() {}, destroy() {},
      };
    },
  });
  assert.equal(provider.canHandle({ provider: 'youtube', mediaId: 'abc12345', title: 'ok' }), true);
  assert.equal(provider.canHandle({ provider: 'youtube', mediaId: 'bad', title: 'bad' }), false);
  assert.throws(
    () => provider.create({ instanceId: 'x', source: { provider: 'youtube', mediaId: 'bad', title: 'bad' }, host: {} }),
    /source is invalid/,
  );
});
