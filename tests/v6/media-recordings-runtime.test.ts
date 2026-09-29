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

function harness(options: { storage?: Map<string, unknown>; owner?: () => string; maxInstances?: number } = {}) {
  const calls: string[] = [];
  const lifecycle = new FakeLifecycleTarget();
  const positions = options.storage ?? new Map<string, unknown>();
  let currentTime = 0;

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
    getCurrentTime() { return currentTime; }
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
    sessionOwner: options.owner ?? (() => 'guest'),
    maxInstances: options.maxInstances,
    storage: { read: (key, fallback) => positions.get(key) ?? fallback, write: (key, value) => { positions.set(key, value); return value; } },
  });

  return { calls, lifecycle, runtime, positions, setCurrentTime: (seconds: number) => { currentTime = seconds; } };
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
  await h.runtime.dispose();
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

test('Recordings Media runtime bounds independent players and keeps only one audible', async () => {
  const h = harness({ maxInstances: 2 });
  const firstHost = new FakeElement();
  const secondHost = new FakeElement();
  const second = h.runtime.createAudioInstance('recordings-secondary', 'recordings-secondary-route');

  await h.runtime.audio.mount(firstHost, { kind: 'youtube', id: 'abcDEF12345', title: 'Primary' });
  await second.mount(secondHost, { kind: 'youtube', id: 'ZYXWV987654', title: 'Secondary' });
  assert.throws(
    () => h.runtime.createAudioInstance('recordings-overflow'),
    /at most 2 audio instances/,
  );
  assert.equal(h.runtime.host.getTargetCount(), 2);
  assert.equal(h.runtime.session.snapshot().instances.length, 2);
  assert.equal(h.calls.filter((call) => call.startsWith('construct:')).length, 2);

  await h.runtime.audio.play();
  await second.play();
  assert.equal(h.runtime.session.snapshot().activeAudibleInstanceId, 'recordings-secondary');
  assert.equal(h.runtime.audio.getState().status, 'paused');
  assert.equal(second.getState().status, 'playing');
  assert.ok(h.calls.filter((call) => call === 'play').length === 2);

  await second.dispose();
  assert.equal(h.runtime.host.getTargetCount(), 1);
  assert.equal(firstHost.children.length, 1);
  assert.equal(secondHost.children.length, 0);
  assert.throws(
    () => h.runtime.createAudioInstance('recordings-secondary'),
    /id cannot be reused/,
  );
  const replacement = h.runtime.createAudioInstance('recordings-replacement');
  await replacement.dispose();

  await h.runtime.dispose();
  assert.equal(h.runtime.session.snapshot().instances.length, 0);
  assert.equal(h.runtime.host.getTargetCount(), 0);
  assert.equal(firstHost.children.length, 0);
});

test('additional recording instances keep resume progress scoped to their initiating account', async () => {
  const storage = new Map<string, unknown>();
  let activeOwner = 'account:alice';
  const h = harness({ storage, owner: () => activeOwner, maxInstances: 2 });
  const secondary = h.runtime.createAudioInstance('secondary');
  await secondary.mount(new FakeElement(), { kind: 'youtube', id: 'ZYXWV987654', title: 'Secondary' });
  activeOwner = 'account:bob';
  h.setCurrentTime(29);
  await secondary.pause();

  assert.equal(storage.size, 1);
  const [saved] = [...storage.values()] as Array<{ owner: string; sourceId: string; seconds: number }>;
  assert.deepEqual(saved, { schema: 1, owner: 'account:alice', sourceId: 'ZYXWV987654', seconds: 29 });
  await h.runtime.dispose();
});

test('Recordings Media runtime restores saved position only for the matching authenticated owner', async () => {
  const storage = new Map<string, unknown>();
  const first = harness({ storage, owner: () => 'account:alice' });
  await first.runtime.audio.mount(new FakeElement(), { kind: 'youtube', id: 'abcDEF12345', title: 'Saved service' });
  first.setCurrentTime(73);
  await first.runtime.audio.pause();
  assert.equal(first.positions.size, 1);
  assert.equal(first.runtime.audio.getSavedPosition('abcDEF12345'), 73);
  await first.runtime.dispose();

  const otherAccount = harness({ storage, owner: () => 'account:bob' });
  await otherAccount.runtime.audio.mount(new FakeElement(), { kind: 'youtube', id: 'abcDEF12345', title: 'Saved service' });
  assert.ok(otherAccount.calls.includes('cue:abcDEF12345@0'));
  assert.equal(otherAccount.runtime.audio.getSavedPosition('abcDEF12345'), 0);
  await otherAccount.runtime.dispose();

  const sameAccount = harness({ storage, owner: () => 'account:alice' });
  await sameAccount.runtime.audio.mount(new FakeElement(), { kind: 'youtube', id: 'abcDEF12345', title: 'Saved service' });
  assert.ok(sameAccount.calls.includes('cue:abcDEF12345@73'));
  assert.equal(sameAccount.runtime.audio.getState().status, 'ready', 'restoring a position never auto-starts playback');
  await sameAccount.runtime.dispose();
});

test('Recordings Media runtime keeps a mounted recording resume write with its original account after a session switch', async () => {
  const storage = new Map<string, unknown>();
  let activeOwner = 'account:alice';
  const h = harness({ storage, owner: () => activeOwner });
  await h.runtime.audio.mount(new FakeElement(), { kind: 'youtube', id: 'abcDEF12345', title: 'Private progress' });
  activeOwner = 'account:bob';
  assert.equal(h.runtime.audio.getSavedPosition('abcDEF12345'), 0, 'saved position lookup follows the current account');
  h.setCurrentTime(48);
  await h.runtime.audio.pause();
  assert.equal(storage.size, 1);
  const [saved] = [...storage.values()] as Array<{ owner: string; seconds: number }>;
  assert.equal(saved.owner, 'account:alice');
  assert.equal(saved.seconds, 48);
  await h.runtime.dispose();
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
