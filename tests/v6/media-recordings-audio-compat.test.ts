import assert from 'node:assert/strict';
import test from 'node:test';
import { createRecordingsService } from '../../src/app/recordings.js';
import type {
  MediaInstanceState,
  MediaQueueEntry,
  MediaSessionSnapshot,
} from '../../src/v6/media/contracts.ts';
import {
  createRecordingsAudioCompatibility,
} from '../../src/v6/media/recordings-audio-compat.ts';

function sessionHarness() {
  const calls: string[] = [];
  let instance: MediaInstanceState | null = null;
  let failQueue = '';

  const snapshot = (): MediaSessionSnapshot => ({
    activeAudibleInstanceId: instance?.status === 'playing' ? instance.instanceId : null,
    instances: instance ? [instance] : [],
  });

  const setStatus = (status: MediaInstanceState['status'], queue = instance?.queue ?? []) => {
    instance = {
      instanceId: 'recordings-player',
      routeKey: 'recordings',
      status,
      queue,
      index: 0,
      activeSource: queue[0]?.source ?? null,
      positionSeconds: 0,
      error: '',
    };
  };

  return {
    calls,
    failNextQueue(message: string) { failQueue = message; },
    session: {
      snapshot,
      async register(instanceId: string, routeKey: string) {
        calls.push(`register:${instanceId}:${routeKey}`);
        setStatus('idle');
      },
      async unregister(instanceId: string) {
        calls.push(`unregister:${instanceId}`);
        instance = null;
      },
      async setQueue(instanceId: string, queue: readonly MediaQueueEntry[]) {
        calls.push(`queue:${instanceId}:${queue[0]?.source.externalId}`);
        if (failQueue) {
          const message = failQueue;
          failQueue = '';
          throw new Error(message);
        }
        setStatus('ready', queue);
      },
      async play(instanceId: string) {
        calls.push(`play:${instanceId}`);
        if (instance) setStatus('playing', instance.queue);
      },
      async pause(instanceId: string) {
        calls.push(`pause:${instanceId}`);
        if (instance) setStatus('paused', instance.queue);
      },
      async stop(instanceId: string) {
        calls.push(`stop:${instanceId}`);
        if (instance) setStatus('stopped', instance.queue);
      },
      async seek(instanceId: string, seconds: number) {
        calls.push(`seek:${instanceId}:${seconds}`);
      },
    },
  };
}

function hostHarness() {
  const calls: string[] = [];
  return {
    calls,
    owner: {
      mount(instanceId: string, host: unknown) {
        calls.push(`mount:${instanceId}:${String(host)}`);
      },
      release(instanceId: string) {
        calls.push(`release:${instanceId}`);
      },
    },
  };
}

test('Recordings compatibility maps the released audio contract onto one V6 media session', async () => {
  const media = sessionHarness();
  const host = hostHarness();
  const audio = createRecordingsAudioCompatibility({
    session: media.session,
    host: host.owner,
  });

  await audio.mount('host-a', { kind: 'youtube', id: 'abcDEF12345', title: 'Sunday Worship' });
  assert.equal(audio.getState().status, 'ready');
  assert.equal(audio.getState().source?.id, 'abcDEF12345');
  assert.equal(audio.getPlayerCount(), 1);
  assert.equal(media.calls.includes('queue:recordings-player:abcDEF12345'), true);

  await audio.play();
  await audio.seek(45);
  await audio.pause();
  await audio.stop();

  assert.equal(audio.getState().status, 'stopped');
  assert.equal(audio.getState().position, 0);
  assert.deepEqual(
    media.calls.filter((call) => /^(play|seek|pause|stop):/.test(call)),
    [
      'play:recordings-player',
      'seek:recordings-player:45',
      'pause:recordings-player',
      'stop:recordings-player',
    ],
  );

  await audio.mount('host-b', { kind: 'youtube', id: 'ZyxWV987654', title: 'Bible Study' });
  assert.equal(audio.getState().source?.id, 'ZyxWV987654');
  assert.equal(audio.getPlayerCount(), 1);
  assert.equal(media.calls.filter((call) => call.startsWith('unregister:')).length, 1);

  await audio.unload();
  assert.equal(audio.getPlayerCount(), 0);
  assert.equal(audio.getState().status, 'idle');
  assert.equal(host.calls.at(-1), 'release:recordings-player');
});

test('Recordings compatibility exposes async mount errors and tears the failed player down', async () => {
  const media = sessionHarness();
  const host = hostHarness();
  const audio = createRecordingsAudioCompatibility({
    session: media.session,
    host: host.owner,
  });
  media.failNextQueue('provider init failed');

  await assert.rejects(
    audio.mount('host-a', { kind: 'youtube', id: 'abcDEF12345', title: 'Sunday Worship' }),
    /provider init failed/,
  );

  assert.equal(audio.getState().status, 'error');
  assert.equal(audio.getState().error, 'provider init failed');
  assert.equal(audio.getPlayerCount(), 0);
  assert.equal(host.calls.at(-1), 'release:recordings-player');
  assert.equal(media.session.snapshot().instances.length, 0);
});

test('Recordings service preserves synchronous legacy owners and also awaits a V6 async owner', async () => {
  const mediaSession = sessionHarness();
  const host = hostHarness();
  const audio = createRecordingsAudioCompatibility({
    session: mediaSession.session,
    host: host.owner,
  });
  const cloud = {
    async listLiveRecordings() {
      return [
        {
          id: 'rec-1',
          youtube_id: 'abcDEF12345',
          title: 'Sunday Worship',
          description: 'Replay',
          featured: true,
        },
      ];
    },
  };
  const session = {
    isAuthenticated: () => true,
    getState: () => ({ authenticated: true, user: { id: 'u1' } }),
  };
  const recordings = createRecordingsService({
    media: cloud,
    audio,
    session,
    congregation: { load: async () => [{ congregationId: 'c1' }] },
  });

  await recordings.load();
  const selected = recordings.select('rec-1', 'host-a');
  assert.equal(typeof selected?.then, 'function');
  await selected;
  assert.equal(recordings.getState().selectedId, 'rec-1');

  await recordings.play();
  await recordings.seek(30);
  await recordings.pause();
  await recordings.stop();

  assert.equal(mediaSession.calls.includes('play:recordings-player'), true);
  assert.equal(mediaSession.calls.includes('seek:recordings-player:30'), true);
  recordings.leave();
  assert.equal(recordings.getState().selectedId, null);
  assert.equal(audio.getPlayerCount(), 0);
  await audio.flush();
});

test('Recordings compatibility rejects malformed sources, invalid seek and use after dispose', async () => {
  const media = sessionHarness();
  const host = hostHarness();
  const audio = createRecordingsAudioCompatibility({
    session: media.session,
    host: host.owner,
  });

  assert.throws(
    () => audio.mount('host', { kind: 'youtube', id: 'bad id', title: 'Bad' }),
    /valid YouTube source/,
  );

  await audio.mount('host', { kind: 'youtube', id: 'abcDEF12345', title: 'Good' });
  await assert.rejects(audio.seek(-1), /Seek position/);
  await audio.dispose();
  await assert.rejects(
    audio.mount('host', { kind: 'youtube', id: 'abcDEF12345', title: 'Good' }),
    /disposed/,
  );
  assert.throws(() => audio.play(), /disposed/);
});
