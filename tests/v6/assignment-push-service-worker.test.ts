import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

type WaitableEvent = { waitUntil(promise: Promise<unknown>): void };

function loadWorker() {
  const source = fs.readFileSync('offline-shell-sw.js', 'utf8');
  const listeners = new Map<string, (event: any) => void>();
  const notifications: Array<{ title: string; options: Record<string, any> }> = [];
  const navigations: string[] = [];
  let focused = 0;
  let opened: string | null = null;

  const client = {
    url: 'https://biblequest.example/#/home',
    async navigate(url: string) {
      navigations.push(url);
      this.url = url;
      return this;
    },
    async focus() {
      focused += 1;
      return this;
    },
  };

  const self = {
    location: new URL('https://biblequest.example/offline-shell-sw.js'),
    registration: {
      scope: 'https://biblequest.example/',
      async showNotification(title: string, options: Record<string, any>) {
        notifications.push({ title, options });
      },
    },
    clients: {
      async claim() {},
      async matchAll() {
        return [client];
      },
      async openWindow(url: string) {
        opened = url;
        return { url };
      },
    },
    skipWaiting: async () => {},
    addEventListener(type: string, handler: (event: any) => void) {
      listeners.set(type, handler);
    },
  };

  vm.runInNewContext(source, {
    self,
    URL,
    console,
    setTimeout,
    clearTimeout,
  }, { filename: 'offline-shell-sw.js' });

  return {
    listeners,
    notifications,
    navigations,
    get focused() { return focused; },
    get opened() { return opened; },
  };
}

async function dispatchWaitable(
  listener: ((event: any) => void) | undefined,
  event: Record<string, unknown>,
) {
  assert.equal(typeof listener, 'function');
  let pending: Promise<unknown> | null = null;
  listener!({
    ...event,
    waitUntil(promise: Promise<unknown>) {
      pending = Promise.resolve(promise);
    },
  } satisfies WaitableEvent & Record<string, unknown>);
  assert.ok(pending, 'service worker event must register waitUntil work');
  await pending;
}

test('assignment assigned push renders the canonical assignments deep link', async () => {
  const worker = loadWorker();
  await dispatchWaitable(worker.listeners.get('push'), {
    data: {
      json: () => ({
        title: 'New assignment',
        body: 'Read John 1 before Friday.',
        notificationId: '11111111-1111-4111-8111-111111111111',
        type: 'assignments',
        url: '/#/assignments',
      }),
    },
  });

  assert.equal(worker.notifications.length, 1);
  const shown = worker.notifications[0];
  assert.equal(shown.title, 'New assignment');
  assert.equal(shown.options.body, 'Read John 1 before Friday.');
  assert.equal(shown.options.tag, 'bq-11111111-1111-4111-8111-111111111111');
  assert.equal(shown.options.data.url, 'https://biblequest.example/#/assignments');
  assert.equal(
    shown.options.data.notificationId,
    '11111111-1111-4111-8111-111111111111',
  );
  assert.equal(shown.options.data.type, 'assignments');
});

test('assignment due push renders the same canonical assignments deep link', async () => {
  const worker = loadWorker();
  await dispatchWaitable(worker.listeners.get('push'), {
    data: {
      json: () => ({
        title: 'Assignment due soon',
        body: 'Finish John 1 before the deadline.',
        notificationId: '44444444-4444-4444-8444-444444444444',
        type: 'assignments',
        url: '/#/assignments',
      }),
    },
  });

  assert.equal(worker.notifications.length, 1);
  const shown = worker.notifications[0];
  assert.equal(shown.title, 'Assignment due soon');
  assert.equal(shown.options.body, 'Finish John 1 before the deadline.');
  assert.equal(shown.options.tag, 'bq-44444444-4444-4444-8444-444444444444');
  assert.equal(shown.options.data.url, 'https://biblequest.example/#/assignments');
  assert.equal(
    shown.options.data.notificationId,
    '44444444-4444-4444-8444-444444444444',
  );
  assert.equal(shown.options.data.type, 'assignments');
});

test('assignment notification click reuses a same-origin client and focuses it', async () => {
  const worker = loadWorker();
  let closed = 0;

  await dispatchWaitable(worker.listeners.get('notificationclick'), {
    notification: {
      data: {
        url: 'https://biblequest.example/#/assignments',
        notificationId: '22222222-2222-4222-8222-222222222222',
      },
      close() {
        closed += 1;
      },
    },
  });

  assert.equal(closed, 1);
  assert.deepEqual(worker.navigations, ['https://biblequest.example/#/assignments']);
  assert.equal(worker.focused, 1);
  assert.equal(worker.opened, null);
});

test('push and click reject cross-origin notification targets', async () => {
  const worker = loadWorker();

  await dispatchWaitable(worker.listeners.get('push'), {
    data: {
      json: () => ({
        title: 'Unsafe target',
        notificationId: '33333333-3333-4333-8333-333333333333',
        type: 'assignments',
        url: 'https://attacker.example/steal',
      }),
    },
  });

  assert.equal(
    worker.notifications[0].options.data.url,
    'https://biblequest.example/#/notification-center',
  );

  await dispatchWaitable(worker.listeners.get('notificationclick'), {
    notification: {
      data: { url: 'https://attacker.example/steal' },
      close() {},
    },
  });

  assert.equal(
    worker.navigations.at(-1),
    'https://biblequest.example/#/notification-center',
  );
});
