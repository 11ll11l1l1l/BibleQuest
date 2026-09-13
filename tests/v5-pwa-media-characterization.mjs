import test from 'node:test';
import assert from 'node:assert/strict';
import { createOfflineShellService } from '../src/app/offline-shell.js';
import { createAudioManager } from '../src/app/audio.js';

test('offline shell reports unsupported without service worker capability', async () => {
  const service = createOfflineShellService({
    serviceWorker: null,
    locationRef: { href: 'https://example.test/app/', origin: 'https://example.test' }
  });
  assert.deepEqual(await service.start(), { status: 'unsupported', ready: false });
});

test('offline shell registers scoped worker and warms only same-origin shell resources', async () => {
  const messages = [];
  const worker = { postMessage(message) { messages.push(message); } };
  let registrations = 0;
  const serviceWorker = {
    async register(script, options) {
      registrations += 1;
      assert.equal(script, 'offline-shell-sw.js');
      assert.deepEqual(options, { scope: './' });
      return { active: worker };
    }
  };
  const service = createOfflineShellService({
    serviceWorker,
    locationRef: {
      href: 'https://example.test/app/?mode=reader',
      origin: 'https://example.test'
    },
    performanceRef: {
      getEntriesByType(type) {
        assert.equal(type, 'resource');
        return [
          { initiatorType: 'script', name: '/app/app.js' },
          { initiatorType: 'css', name: '/app/app.css' },
          { initiatorType: 'fetch', name: '/api/private' },
          { initiatorType: 'img', name: 'https://cdn.example.test/a.png' },
          { initiatorType: 'script', name: '/app/app.js' }
        ];
      }
    },
    MessageChannelCtor: null,
    documentRef: { readyState: 'complete' }
  });

  assert.deepEqual(await service.start(), { status: 'ready', ready: true });
  assert.deepEqual(await service.start(), { status: 'ready', ready: true });
  assert.equal(registrations, 1);
  assert.deepEqual(messages, [{
    type: 'BIBLEQUEST_WARM_SHELL',
    urls: [
      'https://example.test/app/?mode=reader',
      'https://example.test/app/app.js',
      'https://example.test/app/app.css'
    ]
  }]);
});

test('offline shell waits for page load before warming discovered assets', async () => {
  let loadHandler;
  const posted = [];
  const worker = { postMessage(message) { posted.push(message); } };
  const service = createOfflineShellService({
    serviceWorker: { async register() { return { active: worker }; } },
    locationRef: { href: 'https://example.test/app/', origin: 'https://example.test' },
    performanceRef: { getEntriesByType() { return []; } },
    MessageChannelCtor: null,
    documentRef: { readyState: 'loading' },
    loadTarget: {
      addEventListener(type, handler) { assert.equal(type, 'load'); loadHandler = handler; },
      removeEventListener() {}
    }
  });
  const starting = service.start();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(posted.length, 0);
  loadHandler();
  assert.deepEqual(await starting, { status: 'ready', ready: true });
  assert.equal(posted.length, 1);
});

class FakeElement {
  constructor() {
    this.children = [];
    this.isConnected = false;
  }
  replaceChildren() {
    for (const child of this.children) child.isConnected = false;
    this.children = [];
  }
  append(child) {
    child.isConnected = true;
    this.children.push(child);
  }
}

function audioEnvironment() {
  const previous = { Element: globalThis.Element, document: globalThis.document, location: globalThis.location };
  const frames = [];
  class FakeFrame extends FakeElement {
    constructor() {
      super();
      this.dataset = {};
      this.listeners = new Map();
      this.sent = [];
      this.contentWindow = { postMessage: (...args) => this.sent.push(args) };
      this.src = '';
    }
    addEventListener(type, handler) { this.listeners.set(type, handler); }
    remove() { this.isConnected = false; }
    emit(type) { this.listeners.get(type)?.(); }
  }
  globalThis.Element = FakeElement;
  globalThis.document = {
    createElement(type) {
      assert.equal(type, 'iframe');
      const frame = new FakeFrame();
      frames.push(frame);
      return frame;
    }
  };
  globalThis.location = { origin: 'https://biblequest.test' };
  return {
    frames,
    restore() {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete globalThis[key];
        else globalThis[key] = value;
      }
    }
  };
}

test('audio manager mounts privacy-enhanced YouTube source without autoplay', () => {
  const env = audioEnvironment();
  try {
    const host = new FakeElement();
    const manager = createAudioManager();
    const state = manager.mount(host, { kind: 'youtube', id: 'abc123_DEF', title: 'Psalm recording' });
    assert.equal(state.status, 'loading');
    assert.equal(manager.getPlayerCount(), 1);
    const frame = env.frames[0];
    assert.match(frame.src, /^https:\/\/www\.youtube-nocookie\.com\/embed\/abc123_DEF\?/);
    assert.match(frame.src, /playsinline=1/);
    assert.doesNotMatch(frame.src, /autoplay=1/);
    assert.equal(frame.referrerPolicy, 'strict-origin-when-cross-origin');
    frame.emit('load');
    assert.equal(manager.getState().status, 'ready');
  } finally {
    env.restore();
  }
});

test('audio manager keeps exactly one mounted player when source changes', () => {
  const env = audioEnvironment();
  try {
    const host = new FakeElement();
    const manager = createAudioManager();
    manager.mount(host, { kind: 'youtube', id: 'abcdef1', title: 'First' });
    const first = env.frames[0];
    manager.mount(host, { kind: 'youtube', id: 'abcdef2', title: 'Second' });
    assert.equal(first.isConnected, false);
    assert.equal(manager.getPlayerCount(), 1);
    assert.equal(host.children.length, 1);
    assert.equal(manager.getState().source.id, 'abcdef2');
  } finally {
    env.restore();
  }
});

test('audio controls target only youtube-nocookie and preserve explicit user control state', () => {
  const env = audioEnvironment();
  try {
    const manager = createAudioManager();
    manager.mount(new FakeElement(), { kind: 'youtube', id: 'abcdef1', title: 'Recording' });
    const frame = env.frames[0];
    manager.play();
    manager.seek(42);
    manager.pause();
    manager.stop();
    assert.deepEqual(frame.sent.map(([payload, origin]) => [JSON.parse(payload).func, origin]), [
      ['playVideo', 'https://www.youtube-nocookie.com'],
      ['seekTo', 'https://www.youtube-nocookie.com'],
      ['pauseVideo', 'https://www.youtube-nocookie.com'],
      ['stopVideo', 'https://www.youtube-nocookie.com']
    ]);
    assert.equal(manager.getState().status, 'stopped');
    assert.equal(manager.getState().position, 0);
  } finally {
    env.restore();
  }
});

test('audio manager rejects invalid sources and controls after disposal', () => {
  const env = audioEnvironment();
  try {
    const manager = createAudioManager();
    const host = new FakeElement();
    assert.throws(() => manager.mount(host, { kind: 'youtube', id: 'bad!' }), /valid YouTube/);
    manager.mount(host, { kind: 'youtube', id: 'abcdef1' });
    manager.dispose();
    assert.equal(manager.getPlayerCount(), 0);
    assert.throws(() => manager.play(), /disposed/);
    assert.throws(() => manager.mount(host, { kind: 'youtube', id: 'abcdef2' }), /disposed/);
  } finally {
    env.restore();
  }
});
