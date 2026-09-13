import assert from 'node:assert/strict';
import { createView } from '../src/v5/features/assignments/view.ts';

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.className = '';
    this.attributes = new Map();
    this.children = [];
    this.textContent = '';
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  append(...nodes) {
    this.children.push(...nodes);
  }

  replaceChildren(...nodes) {
    this.children = [...nodes];
  }
}

globalThis.document = {
  createElement(tagName) {
    return new FakeElement(tagName);
  }
};

const textOf = (node) => [node.textContent, ...node.children.map(textOf)].filter(Boolean).join(' ');
const flush = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const authenticatedSession = (id = 'user-a') => ({
  status: 'authenticated',
  authenticated: true,
  remoteAvailable: true,
  user: { id, email: `${id}@example.test`, displayName: id },
  error: ''
});

const guestSession = (remoteAvailable = true) => ({
  status: remoteAvailable ? 'guest' : 'unavailable',
  authenticated: false,
  remoteAvailable,
  user: null,
  error: remoteAvailable ? '' : 'offline'
});

const selectedCongregation = (id = 'cong-a', name = 'Congregation A') => ({
  status: 'selected',
  active: { id, name, role: 'member' },
  error: ''
});

const noCongregation = (status = 'none') => ({ status, active: null, error: '' });

const observableService = (initial) => {
  let snapshot = initial;
  const listeners = new Set();
  let unsubscribeCount = 0;
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        unsubscribeCount += 1;
        listeners.delete(listener);
      };
    },
    set(next) {
      snapshot = next;
      for (const listener of [...listeners]) listener(next);
    },
    get unsubscribeCount() {
      return unsubscribeCount;
    }
  };
};

const makeContext = ({ session, congregation, listVisible }) => ({
  session,
  congregation,
  assignments: { listVisible }
});

const mount = (context) => {
  const container = new FakeElement('main');
  const cleanup = createView(context).mount(container);
  return { container, cleanup };
};

async function testRemoteUnavailableFailsClosed() {
  const session = observableService(guestSession(false));
  const congregation = observableService(selectedCongregation());
  let calls = 0;
  const { container, cleanup } = mount(makeContext({
    session,
    congregation,
    listVisible: async () => { calls += 1; return []; }
  }));
  await flush();
  assert.equal(calls, 0);
  assert.match(textOf(container), /Assignments unavailable/);
  cleanup();
}

async function testGuestFailsClosed() {
  const session = observableService(guestSession(true));
  const congregation = observableService(selectedCongregation());
  let calls = 0;
  const { container, cleanup } = mount(makeContext({
    session,
    congregation,
    listVisible: async () => { calls += 1; return []; }
  }));
  await flush();
  assert.equal(calls, 0);
  assert.match(textOf(container), /Sign in to view assignments/);
  cleanup();
}

async function testMissingCongregationFailsClosed() {
  const session = observableService(authenticatedSession());
  const congregation = observableService(noCongregation());
  let calls = 0;
  const { container, cleanup } = mount(makeContext({
    session,
    congregation,
    listVisible: async () => { calls += 1; return []; }
  }));
  await flush();
  assert.equal(calls, 0);
  assert.match(textOf(container), /Select a congregation/);
  cleanup();
}

async function testAuthorizedRequestUsesExplicitScope() {
  const session = observableService(authenticatedSession('user-42'));
  const congregation = observableService(selectedCongregation('cong-9', 'North Congregation'));
  const calls = [];
  const { container, cleanup } = mount(makeContext({
    session,
    congregation,
    listVisible: async (scope) => {
      calls.push(scope);
      return [{
        id: 'assignment-1',
        title: 'Read John 1',
        type: 'reading',
        progressStatus: 'not-started',
        dueState: 'open',
        dueAt: null
      }];
    }
  }));
  await flush();
  assert.deepEqual(calls, [{ userId: 'user-42', congregationId: 'cong-9' }]);
  assert.match(textOf(container), /North Congregation/);
  assert.match(textOf(container), /Read John 1/);
  cleanup();
}

async function testContextChangeSuppressesStaleResult() {
  const session = observableService(authenticatedSession('user-a'));
  const congregation = observableService(selectedCongregation('cong-a', 'Congregation A'));
  const first = deferred();
  const second = deferred();
  const calls = [];
  const { container, cleanup } = mount(makeContext({
    session,
    congregation,
    listVisible: (scope) => {
      calls.push(scope);
      return calls.length === 1 ? first.promise : second.promise;
    }
  }));

  await flush();
  congregation.set(selectedCongregation('cong-b', 'Congregation B'));
  await flush();
  assert.deepEqual(calls, [
    { userId: 'user-a', congregationId: 'cong-a' },
    { userId: 'user-a', congregationId: 'cong-b' }
  ]);

  second.resolve([{ id: 'b', title: 'Current B', type: 'reading', progressStatus: 'open', dueState: 'open', dueAt: null }]);
  await flush();
  assert.match(textOf(container), /Current B/);
  assert.doesNotMatch(textOf(container), /Stale A/);

  first.resolve([{ id: 'a', title: 'Stale A', type: 'reading', progressStatus: 'open', dueState: 'open', dueAt: null }]);
  await flush();
  assert.match(textOf(container), /Current B/);
  assert.doesNotMatch(textOf(container), /Stale A/);
  cleanup();
}

async function testCleanupUnsubscribesAndSuppressesPendingResult() {
  const session = observableService(authenticatedSession());
  const congregation = observableService(selectedCongregation());
  const pending = deferred();
  const { container, cleanup } = mount(makeContext({ session, congregation, listVisible: () => pending.promise }));
  await flush();
  assert.match(textOf(container), /Loading assignments/);

  cleanup();
  assert.equal(session.unsubscribeCount, 1);
  assert.equal(congregation.unsubscribeCount, 1);

  pending.resolve([{ id: 'late', title: 'Must not render', type: 'reading', progressStatus: 'open', dueState: 'open', dueAt: null }]);
  await flush();
  assert.doesNotMatch(textOf(container), /Must not render/);
}

const tests = [
  testRemoteUnavailableFailsClosed,
  testGuestFailsClosed,
  testMissingCongregationFailsClosed,
  testAuthorizedRequestUsesExplicitScope,
  testContextChangeSuppressesStaleResult,
  testCleanupUnsubscribesAndSuppressesPendingResult
];

for (const test of tests) {
  await test();
  console.log(`PASS ${test.name}`);
}

console.log(`V5 assignments behavior: ${tests.length}/${tests.length} PASS`);
