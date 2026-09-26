import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createRecordingsMediaRuntime,
} from '../../src/v6/media/recordings-runtime.ts';
import type {
  YouTubePlayer,
  YouTubePlayerApi,
  YouTubePlayerReadyEvent,
} from '../../src/v6/media/youtube-iframe-adapter.ts';
import type {
  MediaLifecycleEventTarget,
  MediaVisibilityTarget,
} from '../../src/v6/media/visibility-lifecycle.ts';

class FakeElement {
  dataset: Record<string, string> = {};
  attributes = new Map<string, string>();
  children: unknown[] = [];

  replaceChildren(...nodes: unknown[]) {
    this.children = nodes;
  }
  getAttribute(name: string) {
    return this.attributes.get(name) ?? null;
  }
  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }
  removeAttribute(name: string) {
    this.attributes.delete(name);
  }
}

class FakeLifecycleTarget implements MediaVisibilityTarget, MediaLifecycleEventTarget {
  visibilityState = 'visible';
  private readonly listeners = new Map<string, Set<() => void>>();

  addEventListener(type: string, listener: () => void) {
    const set = this.listeners.get(type) ?? new Set<() => void>();
    set.add(listener);
    this.listeners.set(type, set);
  }
  removeEventListener(type: string, listener: () => void) {
    this.listeners.get(type)?.delete(listener);
  }
  dispatch(type: string) {
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener();
  }
  count(type: string) {
    return this.listeners.get(type)?.size ?? 0;
  }
}

function harness() {
  const calls: string[] = [];
  const lifecycle = new FakeLifecycleTarget();

  class Player implements YouTubePlayer {
    constructor(element: HTMLElement | string, options?: Record<string, unknown>) {
      calls.push(`construct:${String((element as unknown as FakeElement).dataset?.bqMediaTarget ?? element)}`);
      const events = (options?.events ?? {}) as {
        onReady?: (event: YouTubePlayerReadyEvent) => void;
      };
      queueMicrotask(() => events.onReady?.({ target: this }));
    }
    cueVideoById(input: { videoId: string; startSeconds?: number }) {
      calls.push(`cue:${input.videoId}@${input.startSeconds ?? 0}`);
    }
    loadVideoById() {}
    playVideo() { calls.push('play'); }
    pauseVideo() { calls.push('pause'); }
    stopVideo() { calls.push('stop'); }
    seekTo(seconds: number) { calls.push(`seek:${seconds}`); }
    destroy() { calls.push('destroy'); }
  }

  const api: YouTubePlayerApi = { Player };
  const document = {
    visibilityState: 'visible',
    createElement(tag: string) {
      assert.equal(tag, 'div');
      return new FakeElement();
    },
    addEventListener: lifecycle.addEventListener.bind(lifecycle),
    removeEventListener: lifecycle.removeEventListener.bind(lifecycle),
  } as unknown as Document;

  const runtime = createRecordingsMediaRuntime({
    document,
    global: { YT: api },
    visibilityTarget: lifecycle,
    pageTarget: lifecycle,
    playerReadyTimeoutMs: 100,
  });

  return { calls, lifecycle, runtime };
}

test('Recordings Media runtime composes a ready YouTube player into the released audio contract', async () => {
  const h = harness();
  const host = new FakeElement();

  await h.runtime.audio.mount(host, {
    kind: 'youtube',
    id: 'abcDEF12345',
    title: 'Sunday Worship',
  });

  assert.equal(h.runtime.audio.getState().status, 'ready');
  assert.equal(h.runtime.audio.getPlayerCount(), 1);
  assert.equal(h.runtime.host.getTargetCount(), 1);
  assert.equal(host.children.length, 1);
  assert.equal(host.getAttribute('data-bq-media-host-owner'), 'recordings-player');
  assert.equal((host.children[0] as FakeElement).dataset.bqMediaTarget, 'recordings-player');
  assert.deepEqual(h.calls.slice(0, 2), [
    'construct:recordings-player',
    'cue:abcDEF12345@0',
  ]);

  await h.runtime.audio.play();
  assert.equal(h.runtime.session.snapshot().activeAudibleInstanceId, 'recordings-player');

  await h.runtime.audio.seek(30);
  await h.runtime.audio.pause();
  assert.equal(h.runtime.audio.getState().status, 'paused');

  await h.runtime.audio.unload();
  assert.equal(h.runtime.audio.getPlayerCount(), 0);
  assert.equal(h.runtime.host.getTargetCount(), 0);
  assert.equal(host.children.length, 0);
  assert.equal(host.getAttribute('data-bq-media-host-owner'), null);
  assert.equal(h.calls.filter((call) => call === 'destroy').length, 1);
});

test('Recordings Media runtime replaces a selected source without retaining a second player', async () => {
  const h = harness();
  const host = new FakeElement();

  await h.runtime.audio.mount(host, { kind: 'youtube', id: 'abcDEF12345', title: 'First' });
  await h.runtime.audio.mount(host, { kind: 'youtube', id: 'ZYXWV987654', title: 'Second' });

  assert.equal(h.runtime.audio.getPlayerCount(), 1);
  assert.equal(h.runtime.session.snapshot().instances.length, 1);
  assert.equal(h.runtime.session.snapshot().instances[0].activeSource?.externalId, 'ZYXWV987654');
  assert.equal(h.calls.filter((call) => call.startsWith('construct:')).length, 2);
  assert.equal(h.calls.filter((call) => call === 'destroy').length, 1);

  await h.runtime.dispose();
  assert.equal(h.calls.filter((call) => call === 'destroy').length, 2);
  assert.equal(host.children.length, 0);
});

test('Recordings Media runtime background lifecycle pauses through the audio owner without silent resume', async () => {
  const h = harness();
  const host = new FakeElement();

  await h.runtime.audio.mount(host, { kind: 'youtube', id: 'abcDEF12345', title: 'Service' });
  await h.runtime.audio.play();
  assert.equal(h.runtime.audio.getState().status, 'playing');

  h.lifecycle.visibilityState = 'hidden';
  h.lifecycle.dispatch('visibilitychange');
  await h.runtime.visibility?.flush();

  assert.equal(h.runtime.audio.getState().status, 'paused');
  assert.equal(h.runtime.session.snapshot().activeAudibleInstanceId, null);
  assert.equal(h.runtime.visibility?.snapshot().resumeCandidateInstanceId, 'recordings-player');

  h.lifecycle.visibilityState = 'visible';
  h.lifecycle.dispatch('visibilitychange');
  await h.runtime.visibility?.flush();

  assert.equal(h.runtime.audio.getState().status, 'paused');
  assert.equal(h.calls.filter((call) => call === 'play').length, 1);
  assert.equal(h.runtime.visibility?.consumeResumeCandidate(), 'recordings-player');

  await h.runtime.dispose();
  assert.equal(h.lifecycle.count('visibilitychange'), 0);
  assert.equal(h.lifecycle.count('pagehide'), 0);
  assert.equal(h.lifecycle.count('pageshow'), 0);
});

test('Recordings Media host ownership fails closed and does not clear a host it no longer owns', async () => {
  const h = harness();
  const invalid = {};
  assert.throws(
    () => h.runtime.host.mount('recordings-player', invalid),
    /host is invalid/,
  );

  const host = new FakeElement();
  h.runtime.host.mount('recordings-player', host);
  host.setAttribute('data-bq-media-host-owner', 'someone-else');
  host.replaceChildren('replacement-content');

  h.runtime.host.release('recordings-player');
  assert.deepEqual(host.children, ['replacement-content']);
  assert.equal(host.getAttribute('data-bq-media-host-owner'), 'someone-else');

  await h.runtime.dispose();
});

test('Recordings Media runtime validates identity and can disable visibility ownership explicitly', async () => {
  const lifecycle = new FakeLifecycleTarget();
  const document = {
    visibilityState: 'visible',
    createElement() { return new FakeElement(); },
    addEventListener: lifecycle.addEventListener.bind(lifecycle),
    removeEventListener: lifecycle.removeEventListener.bind(lifecycle),
  } as unknown as Document;

  assert.throws(
    () => createRecordingsMediaRuntime({
      document,
      global: { YT: { Player: class {} as unknown as YouTubePlayerApi['Player'] } },
      instanceId: '   ',
    }),
    /instance and route identity/,
  );

  const h = harness();
  await h.runtime.dispose();

  const noLifecycle = createRecordingsMediaRuntime({
    document,
    global: { YT: { Player: class {} as unknown as YouTubePlayerApi['Player'] } },
    visibilityTarget: lifecycle,
    pageTarget: lifecycle,
    enableVisibilityLifecycle: false,
  });
  assert.equal(noLifecycle.visibility, null);
  assert.equal(lifecycle.count('visibilitychange'), 0);
  assert.equal(lifecycle.count('pagehide'), 0);
  assert.equal(lifecycle.count('pageshow'), 0);
  await noLifecycle.dispose();
});
