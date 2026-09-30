import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

import type { ScriptureTranslationManifest } from '../../src/v6/reader/content-manifest.ts';
import {
  ScripturePackageManager,
  type InstalledScripturePackage,
  type ScripturePackageRepository,
  type ScripturePackageTransport,
} from '../../src/v6/reader/package-manager.ts';

const serviceWorkerSource = readFileSync(new URL('../../offline-shell-sw.js', import.meta.url), 'utf8');
const currentShellCache = 'biblequest-v3-offline-shell-v2';
const staleShellCache = 'biblequest-v3-offline-shell-v1';

async function activateServiceWorker(cacheNames: string[]) {
  const handlers = new Map<string, (event: { waitUntil(promise: Promise<unknown>): void }) => void>();
  const deleted: string[] = [];
  const navigated: string[] = [];
  let claims = 0;

  const clients = [
    {
      url: 'https://biblequest.example/app/#/home',
      async navigate(url: string) { navigated.push(url); },
    },
    {
      url: 'https://biblequest.example/outside/#/home',
      async navigate(url: string) { navigated.push(`outside:${url}`); },
    },
    {
      url: 'https://other.example/app/#/home',
      async navigate(url: string) { navigated.push(`foreign:${url}`); },
    },
  ];

  const selfMock = {
    location: new URL('https://biblequest.example/app/offline-shell-sw.js'),
    registration: { scope: 'https://biblequest.example/app/' },
    clients: {
      async claim() { claims += 1; },
      async matchAll() { return clients; },
      async openWindow() { return undefined; },
    },
    addEventListener(type: string, handler: (event: { waitUntil(promise: Promise<unknown>): void }) => void) {
      handlers.set(type, handler);
    },
  };

  const cacheStorage = {
    async keys() { return [...cacheNames]; },
    async delete(name: string) {
      deleted.push(name);
      return true;
    },
    async open() {
      throw new Error('activate migration must not need to open the shell cache');
    },
  };

  vm.runInNewContext(serviceWorkerSource, {
    self: selfMock,
    caches: cacheStorage,
    URL,
    console,
  }, { filename: 'offline-shell-sw.js' });

  const activate = handlers.get('activate');
  assert.ok(activate, 'service worker must register an activate handler');

  let activation: Promise<unknown> | undefined;
  activate({
    waitUntil(promise) {
      activation = Promise.resolve(promise);
    },
  });
  assert.ok(activation, 'activate handler must extend lifetime with waitUntil');
  await activation;

  return { deleted, navigated, claims };
}

test('service-worker upgrade removes only stale BibleQuest shell caches and refreshes controlled in-scope clients', async () => {
  const result = await activateServiceWorker([
    staleShellCache,
    currentShellCache,
    'third-party-cache',
  ]);

  assert.deepEqual(result.deleted, [staleShellCache]);
  assert.equal(result.claims, 1);
  assert.deepEqual(result.navigated, ['https://biblequest.example/app/#/home']);
});

test('service-worker activation without an older BibleQuest cache claims clients without forced reload', async () => {
  const result = await activateServiceWorker([
    currentShellCache,
    'third-party-cache',
  ]);

  assert.deepEqual(result.deleted, []);
  assert.equal(result.claims, 1);
  assert.deepEqual(result.navigated, []);
});

const oldSha = '0'.repeat(64);
const newSha = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

function upgradeManifest(): ScriptureTranslationManifest {
  return {
    schemaVersion: 1,
    translationId: 'bsb',
    label: 'English · BSB',
    contentVersion: '2026-09-30.2',
    delivery: 'downloadable',
    license: {
      source: 'Berean Standard Bible',
      license: 'Public domain',
      attribution: 'BibleQuest attribution',
      redistribution: 'allowed',
    },
    books: [{
      bookCode: 'GEN',
      url: '/packs/bsb/GEN.json',
      sha256: newSha,
      bytes: 3,
    }],
  };
}

function upgradeRepository(initial: InstalledScripturePackage) {
  let installed = initial;
  let writes = 0;
  const repository: ScripturePackageRepository = {
    async readInstalled(translationId, bookCode) {
      return installed.translationId === translationId && installed.bookCode === bookCode ? installed : null;
    },
    async listInstalled() { return [installed]; },
    async replaceInstalled(record) {
      installed = record;
      writes += 1;
    },
    async removeInstalled() {
      throw new Error('upgrade must not delete the prior package before verified replacement');
    },
    async usage() {
      return { bytes: installed.bytes, packages: 1 };
    },
  };
  return {
    repository,
    snapshot: () => ({ installed, writes }),
  };
}

test('content-package version upgrade atomically replaces a stale verified package with the exact manifest version', async () => {
  const stale: InstalledScripturePackage = {
    key: `bsb:2026-09-29.1:GEN:${oldSha}`,
    translationId: 'bsb',
    contentVersion: '2026-09-29.1',
    bookCode: 'GEN',
    sha256: oldSha,
    bytes: 3,
    installedAt: '2026-09-29T00:00:00.000Z',
  };
  const state = upgradeRepository(stale);
  const transport: ScripturePackageTransport = {
    async download() {
      return new TextEncoder().encode('abc').buffer;
    },
  };
  const manager = new ScripturePackageManager(
    state.repository,
    transport,
    () => '2026-09-30T10:30:00.000Z',
  );

  const result = await manager.install(upgradeManifest(), 'GEN');

  assert.equal(result.status, 'installed');
  assert.equal(state.snapshot().writes, 1);
  assert.equal(state.snapshot().installed.contentVersion, '2026-09-30.2');
  assert.equal(state.snapshot().installed.sha256, newSha);
  assert.equal(state.snapshot().installed.key, `bsb:2026-09-30.2:GEN:${newSha}`);
});

test('content-package upgrade keeps the prior installed version when replacement bytes fail checksum verification', async () => {
  const stale: InstalledScripturePackage = {
    key: `bsb:2026-09-29.1:GEN:${oldSha}`,
    translationId: 'bsb',
    contentVersion: '2026-09-29.1',
    bookCode: 'GEN',
    sha256: oldSha,
    bytes: 3,
    installedAt: '2026-09-29T00:00:00.000Z',
  };
  const state = upgradeRepository(stale);
  const manager = new ScripturePackageManager(state.repository, {
    async download() {
      return new TextEncoder().encode('abd').buffer;
    },
  });

  await assert.rejects(manager.install(upgradeManifest(), 'GEN'), /checksum/i);

  assert.equal(state.snapshot().writes, 0);
  assert.equal(state.snapshot().installed, stale);
  assert.equal(state.snapshot().installed.contentVersion, '2026-09-29.1');
});
