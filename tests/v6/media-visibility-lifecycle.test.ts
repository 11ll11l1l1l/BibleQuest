import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  MediaInstanceState,
  MediaSessionSnapshot,
} from '../../src/v6/media/contracts.ts';
import {
  createMediaVisibilityLifecycle,
  type MediaLifecycleEventTarget,
  type MediaVisibilityTarget,
} from '../../src/v6/media/visibility-lifecycle.ts';

class FakeTarget implements MediaVisibilityTarget {
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
    for (const listener of this.listeners.get(type) ?? []) listener();
  }
}

function instance(instanceId: string, status: MediaInstanceState['status']): MediaInstanceState {
  return {
    instanceId,
    routeKey: 'recordings',
    status,
    queue: [],
    index: 0,
    activeSource: null,
    positionSeconds: 0,
    error: '',
  };
}

function sessionHarness() {
  let active: string | null = 'player';
  let rows: MediaInstanceState[] = [instance('player', 'playing')];
  const pauses: string[] = [];
  let pauseError = '';

  const snapshot = (): MediaSessionSnapshot => ({
    activeAudibleInstanceId: active,
    instances: rows,
  });

  return {
    pauses,
    session: {
      snapshot,
      async pause(instanceId: string) {
        pauses.push(instanceId);
        if (pauseError) throw new Error(pauseError);
        rows = rows.map((row) => (
          row.instanceId === instanceId ? instance(row.instanceId, 'paused') : row
        ));
        if (active === instanceId) active = null;
      },
    },
    failPause(message: string) { pauseError = message; },
    remove(instanceId: string) {
      rows = rows.filter((row) => row.instanceId !== instanceId);
      if (active === instanceId) active = null;
    },
    setActive(instanceId: string | null) { active = instanceId; },
  };
}

test('background lifecycle pauses audible media once and never auto-resumes on foreground', async () => {
  const target = new FakeTarget();
  const h = sessionHarness();
  const lifecycle = createMediaVisibilityLifecycle({
    session: h.session,
    visibilityTarget: target,
  });

  target.visibilityState = 'hidden';
  target.dispatch('visibilitychange');
  target.dispatch('pagehide');
  await lifecycle.flush();

  assert.deepEqual(h.pauses, ['player']);
  assert.deepEqual(lifecycle.snapshot(), {
    backgrounded: true,
    resumeCandidateInstanceId: 'player',
    lastError: '',
  });

  target.visibilityState = 'visible';
  target.dispatch('visibilitychange');
  target.dispatch('pageshow');
  await lifecycle.flush();

  assert.deepEqual(h.pauses, ['player']);
  assert.equal(lifecycle.snapshot().backgrounded, false);
  assert.equal(lifecycle.snapshot().resumeCandidateInstanceId, 'player');
  assert.equal(lifecycle.consumeResumeCandidate(), 'player');
  assert.equal(lifecycle.consumeResumeCandidate(), null);
});

test('resume candidate is invalidated when its media instance disappears while backgrounded', async () => {
  const target = new FakeTarget();
  const h = sessionHarness();
  const lifecycle = createMediaVisibilityLifecycle({
    session: h.session,
    visibilityTarget: target,
  });

  target.visibilityState = 'hidden';
  target.dispatch('visibilitychange');
  await lifecycle.flush();
  h.remove('player');

  target.visibilityState = 'visible';
  target.dispatch('visibilitychange');
  await lifecycle.flush();

  assert.equal(lifecycle.snapshot().resumeCandidateInstanceId, null);
  assert.equal(lifecycle.consumeResumeCandidate(), null);
});

test('pause failures fail closed without exposing a stale resume candidate', async () => {
  const target = new FakeTarget();
  const h = sessionHarness();
  h.failPause('provider pause failed');
  const lifecycle = createMediaVisibilityLifecycle({
    session: h.session,
    visibilityTarget: target,
  });

  target.visibilityState = 'hidden';
  target.dispatch('visibilitychange');
  await lifecycle.flush();

  assert.deepEqual(h.pauses, ['player']);
  assert.equal(lifecycle.snapshot().backgrounded, true);
  assert.equal(lifecycle.snapshot().resumeCandidateInstanceId, null);
  assert.equal(lifecycle.snapshot().lastError, 'provider pause failed');
});

test('initial hidden state pauses immediately and dispose removes lifecycle listeners', async () => {
  const target = new FakeTarget();
  target.visibilityState = 'hidden';
  const h = sessionHarness();
  const lifecycle = createMediaVisibilityLifecycle({
    session: h.session,
    visibilityTarget: target,
    pageTarget: target as MediaLifecycleEventTarget,
  });

  await lifecycle.flush();
  assert.deepEqual(h.pauses, ['player']);

  lifecycle.dispose();
  h.setActive('player');
  target.dispatch('pagehide');
  target.dispatch('visibilitychange');
  await lifecycle.flush();

  assert.deepEqual(h.pauses, ['player']);
  assert.equal(lifecycle.snapshot().resumeCandidateInstanceId, null);
});
