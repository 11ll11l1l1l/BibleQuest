import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  MediaProviderAdapter,
  MediaProviderHandle,
  MediaProviderKind,
  MediaQueueEntry,
  MediaSource,
} from '../../src/v6/media/contracts.ts';
import { createMediaProviderRegistry } from '../../src/v6/media/registry.ts';
import { createMediaSessionManager } from '../../src/v6/media/session.ts';

interface Call {
  readonly instanceId: string;
  readonly provider: MediaProviderKind;
  readonly operation: string;
  readonly value?: number | string;
}

function harness() {
  const calls: Call[] = [];
  const handles = new Map<string, MediaProviderHandle>();

  const makeAdapter = (
    kind: MediaProviderKind,
    capabilities: { seek: boolean; pictureInPicture: boolean },
  ): MediaProviderAdapter => ({
    kind,
    capabilities,
    create(instanceId) {
      const handle: MediaProviderHandle = {
        load(source, startAtSeconds) {
          calls.push({ instanceId, provider: kind, operation: 'load', value: `${source.id}@${startAtSeconds}` });
        },
        play() { calls.push({ instanceId, provider: kind, operation: 'play' }); },
        pause() { calls.push({ instanceId, provider: kind, operation: 'pause' }); },
        stop() { calls.push({ instanceId, provider: kind, operation: 'stop' }); },
        seek(seconds) { calls.push({ instanceId, provider: kind, operation: 'seek', value: seconds }); },
        unload() { calls.push({ instanceId, provider: kind, operation: 'unload' }); },
        requestPictureInPicture() { calls.push({ instanceId, provider: kind, operation: 'pip' }); },
      };
      handles.set(`${instanceId}:${kind}`, handle);
      return handle;
    },
  });

  const providers = createMediaProviderRegistry([
    makeAdapter('youtube', { seek: true, pictureInPicture: false }),
    makeAdapter('native', { seek: true, pictureInPicture: true }),
  ]);
  const manager = createMediaSessionManager({ providers, maxInstances: 4 });

  return { calls, handles, manager };
}

function source(id: string, provider: MediaProviderKind, durationSeconds = 600): MediaSource {
  return {
    id,
    provider,
    externalId: `${provider}-${id}`,
    title: id,
    durationSeconds,
  };
}

function queue(...sources: MediaSource[]): readonly MediaQueueEntry[] {
  return sources.map((item, index) => ({
    source: item,
    resumeSeconds: index === 0 ? 15 : 0,
  }));
}

test('only one registered media instance may be audible at a time', async () => {
  const h = harness();
  await h.manager.register('home-video', 'home');
  await h.manager.register('media-page', 'recordings');
  await h.manager.setQueue('home-video', queue(source('service-a', 'youtube')));
  await h.manager.setQueue('media-page', queue(source('service-b', 'youtube')));

  await h.manager.play('home-video');
  assert.equal(h.manager.snapshot().activeAudibleInstanceId, 'home-video');

  await h.manager.play('media-page');
  const state = h.manager.snapshot();
  assert.equal(state.activeAudibleInstanceId, 'media-page');
  assert.equal(state.instances.find((row) => row.instanceId === 'home-video')?.status, 'paused');

  assert.deepEqual(
    h.calls.filter((call) => ['play', 'pause'].includes(call.operation)).map((call) => `${call.instanceId}:${call.operation}`),
    ['home-video:play', 'home-video:pause', 'media-page:play'],
  );
});

test('queue navigation preserves resume position and switches providers explicitly', async () => {
  const h = harness();
  const events: string[] = [];
  h.manager.subscribe((event) => events.push(event.type));

  await h.manager.register('player', 'recordings');
  await h.manager.setQueue('player', queue(
    source('youtube-one', 'youtube', 300),
    source('native-two', 'native', 900),
  ));

  await h.manager.seek('player', 42);
  assert.equal(h.manager.snapshot().instances[0].queue[0].resumeSeconds, 42);

  await h.manager.next('player');
  let state = h.manager.snapshot().instances[0];
  assert.equal(state.activeSource?.id, 'native-two');
  assert.equal(state.positionSeconds, 0);
  assert.equal(events.includes('provider-switched'), true);

  await h.manager.previous('player');
  state = h.manager.snapshot().instances[0];
  assert.equal(state.activeSource?.id, 'youtube-one');
  assert.equal(state.positionSeconds, 42);
  assert.equal(h.calls.some((call) => call.operation === 'load' && call.value === 'youtube-one@42'), true);
});

test('route teardown releases provider resources and clears audible ownership', async () => {
  const h = harness();
  await h.manager.register('recordings-main', 'recordings');
  await h.manager.register('home-preview', 'home');
  await h.manager.setQueue('recordings-main', queue(source('service-a', 'youtube')));
  await h.manager.setQueue('home-preview', queue(source('service-b', 'youtube')));
  await h.manager.play('recordings-main');

  await h.manager.teardownRoute('recordings');

  const state = h.manager.snapshot();
  assert.equal(state.activeAudibleInstanceId, null);
  assert.deepEqual(state.instances.map((row) => row.instanceId), ['home-preview']);
  assert.equal(
    h.calls.some((call) => call.instanceId === 'recordings-main' && call.operation === 'unload'),
    true,
  );
});

test('picture-in-picture and instance limits fail closed by provider capability', async () => {
  const h = harness();
  await h.manager.register('youtube-player', 'recordings');
  await h.manager.setQueue('youtube-player', queue(source('service-a', 'youtube')));
  await assert.rejects(
    h.manager.requestPictureInPicture('youtube-player'),
    /does not support picture-in-picture/,
  );

  await h.manager.register('native-player', 'recordings');
  await h.manager.setQueue('native-player', queue(source('native-a', 'native')));
  await h.manager.requestPictureInPicture('native-player');
  assert.equal(h.calls.some((call) => call.instanceId === 'native-player' && call.operation === 'pip'), true);

  await h.manager.register('third', 'home');
  await h.manager.register('fourth', 'home');
  await assert.rejects(h.manager.register('fifth', 'home'), /resource limit/);
});
