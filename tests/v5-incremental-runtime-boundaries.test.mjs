import test from 'node:test';
import assert from 'node:assert/strict';

import { createRouter, requestNavigation } from '../src/app/router.js';
import { createSessionService } from '../src/app/session.js';

class TestCustomEvent extends Event {
  constructor(type, init = {}) {
    super(type);
    this.detail = init.detail;
  }
}

function withBrowserGlobals(run) {
  const previous = {
    window: globalThis.window,
    location: globalThis.location,
    history: globalThis.history,
    CustomEvent: globalThis.CustomEvent
  };

  const eventTarget = new EventTarget();
  let currentUrl = new URL('https://example.test/');
  const location = {
    get href() { return currentUrl.href; },
    get hash() { return currentUrl.hash; }
  };
  const applyUrl = value => {
    currentUrl = new URL(String(value), currentUrl);
  };
  const history = {
    pushes: [],
    replacements: [],
    pushState(_state, _title, value) {
      this.pushes.push(String(value));
      applyUrl(value);
    },
    replaceState(_state, _title, value) {
      this.replacements.push(String(value));
      applyUrl(value);
    }
  };
  const window = {
    addEventListener: eventTarget.addEventListener.bind(eventTarget),
    removeEventListener: eventTarget.removeEventListener.bind(eventTarget),
    dispatchEvent: eventTarget.dispatchEvent.bind(eventTarget)
  };

  globalThis.window = window;
  globalThis.location = location;
  globalThis.history = history;
  globalThis.CustomEvent = TestCustomEvent;

  try {
    return run({ location, history, window });
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
}

function createStoreProbe() {
  let state = { session: null };
  const snapshots = [];
  return {
    snapshots,
    setState(updater) {
      state = updater(state);
      snapshots.push(state.session);
      return state;
    },
    current() { return state; }
  };
}

function validSession(overrides = {}) {
  return {
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: 'user-1',
      email: 'member@example.test',
      user_metadata: { preferred_name: 'Mark' }
    },
    ...overrides
  };
}

test('router starts at home and preserves the not-found fallback contract', { concurrency: false }, () => {
  withBrowserGlobals(({ history }) => {
    const resolved = [];
    const routes = {
      home: () => 'home',
      reader: () => 'reader',
      'not-found': () => 'not-found'
    };
    const router = createRouter({
      routes,
      onRoute(route, owner, requested) {
        resolved.push({ route, owner, requested });
      }
    });

    router.start();
    assert.equal(history.replacements.at(-1), '#/home');
    assert.deepEqual(resolved.at(-1), {
      route: 'home',
      owner: routes.home,
      requested: 'home'
    });

    router.navigate('missing-route');
    assert.equal(history.pushes.at(-1), '#/missing-route');
    assert.deepEqual(resolved.at(-1), {
      route: 'not-found',
      owner: routes['not-found'],
      requested: 'missing-route'
    });
  });
});

test('router navigation requests use the same router owner instead of a parallel navigation path', { concurrency: false }, () => {
  withBrowserGlobals(({ history }) => {
    const resolved = [];
    const routes = {
      home: () => 'home',
      reader: () => 'reader',
      'not-found': () => 'not-found'
    };
    const router = createRouter({ routes, onRoute: route => resolved.push(route) });
    router.start();

    requestNavigation('reader');

    assert.equal(history.pushes.at(-1), '#/reader');
    assert.equal(router.current(), 'reader');
    assert.equal(resolved.at(-1), 'reader');
  });
});

test('session boot publishes a verified authenticated user without leaking auth-provider metadata', async () => {
  const store = createStoreProbe();
  const session = validSession();
  const auth = {
    enabled: () => true,
    subscribe: async () => () => {},
    getSession: async () => ({ session }),
    getUser: async () => ({ user: session.user }),
    signOut: async () => {}
  };
  const service = createSessionService({ auth, store, clock: () => Date.now() });

  const state = await service.boot();

  assert.equal(state.status, 'authenticated');
  assert.equal(state.authenticated, true);
  assert.deepEqual(state.user, {
    id: 'user-1',
    email: 'member@example.test',
    displayName: 'Mark'
  });
  assert.equal('user_metadata' in state.user, false);
  assert.equal(store.current().session, state);
});

test('session boot fails closed for an expired session and signs it out remotely', async () => {
  const store = createStoreProbe();
  let signOutCalls = 0;
  const session = validSession({ expires_at: 100 });
  const auth = {
    enabled: () => true,
    subscribe: async () => () => {},
    getSession: async () => ({ session }),
    getUser: async () => ({ user: session.user }),
    signOut: async () => { signOutCalls += 1; }
  };
  const service = createSessionService({ auth, store, clock: () => 101_000 });

  const state = await service.boot();

  assert.equal(signOutCalls, 1);
  assert.equal(state.status, 'guest');
  assert.equal(state.authenticated, false);
  assert.match(state.error, /expired/i);
});

test('session sign-out waits for registered cleanup before clearing the published session', async () => {
  const store = createStoreProbe();
  const order = [];
  const auth = {
    enabled: () => false,
    signOut: async () => { order.push('auth-sign-out'); }
  };
  const service = createSessionService({ auth, store });
  await service.boot();
  service.beforeSignOut(async () => {
    await Promise.resolve();
    order.push('cleanup');
  });

  const state = await service.signOut();

  assert.deepEqual(order, ['cleanup', 'auth-sign-out']);
  assert.equal(state.status, 'guest');
  assert.equal(state.authenticated, false);
  assert.equal(store.current().session, state);
});
