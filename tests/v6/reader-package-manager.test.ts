import assert from 'node:assert/strict';
import test from 'node:test';

import type { ScriptureTranslationManifest } from '../../src/v6/reader/content-manifest.ts';
import {
  ScripturePackageIntegrityError,
  ScripturePackageManager,
  type InstalledScripturePackage,
  type ScripturePackageRepository,
  type ScripturePackageTransport,
} from '../../src/v6/reader/package-manager.ts';

const abcSha = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

function manifest(overrides: Partial<ScriptureTranslationManifest> = {}): ScriptureTranslationManifest {
  return {
    schemaVersion: 1,
    translationId: 'bsb',
    label: 'English · BSB',
    contentVersion: '2026-09-19.1',
    delivery: 'downloadable',
    license: {
      source: 'Berean Standard Bible',
      license: 'Public domain',
      attribution: 'BibleQuest attribution',
      redistribution: 'allowed',
    },
    books: [{ bookCode: 'GEN', url: '/packs/bsb/GEN.json', sha256: abcSha, bytes: 3 }],
    ...overrides,
  };
}

function repository(initial: InstalledScripturePackage | null = null) {
  let installed = initial;
  let payload: ArrayBuffer | null = null;
  let writes = 0;
  let removals = 0;

  const value: ScripturePackageRepository = {
    async readInstalled(translationId, bookCode) {
      if (!installed) return null;
      return installed.translationId === translationId && installed.bookCode === bookCode ? installed : null;
    },
    async replaceInstalled(record, bytes) {
      installed = record;
      payload = bytes;
      writes += 1;
    },
    async removeInstalled(translationId, bookCode) {
      if (installed?.translationId === translationId && installed.bookCode === bookCode) installed = null;
      removals += 1;
    },
    async usage() {
      return { bytes: installed?.bytes ?? 0, packages: installed ? 1 : 0 };
    },
  };

  return {
    value,
    state: () => ({ installed, payload, writes, removals }),
  };
}

test('installs an allowed package only after size and checksum verification', async () => {
  const repo = repository();
  const phases: string[] = [];
  const transport: ScripturePackageTransport = {
    async download(_url, options) {
      options.onProgress?.(1, 3);
      options.onProgress?.(3, 3);
      return new TextEncoder().encode('abc').buffer;
    },
  };
  const manager = new ScripturePackageManager(repo.value, transport, () => '2026-09-19T15:00:00.000Z');

  const result = await manager.install(manifest(), 'gen', { onProgress: (progress) => phases.push(progress.phase) });

  assert.equal(result.status, 'installed');
  assert.equal(result.package.bookCode, 'GEN');
  assert.equal(result.package.sha256, abcSha);
  assert.equal(result.package.installedAt, '2026-09-19T15:00:00.000Z');
  assert.equal(repo.state().writes, 1);
  assert.equal(repo.state().payload?.byteLength, 3);
  assert.ok(phases.includes('downloading'));
  assert.ok(phases.includes('verifying'));
  assert.equal(phases.at(-1), 'storing');
});

test('a current package is reused without another transport request', async () => {
  const installed: InstalledScripturePackage = {
    key: `bsb:2026-09-19.1:GEN:${abcSha}`,
    translationId: 'bsb',
    contentVersion: '2026-09-19.1',
    bookCode: 'GEN',
    sha256: abcSha,
    bytes: 3,
    installedAt: '2026-09-19T14:00:00.000Z',
  };
  const repo = repository(installed);
  let downloads = 0;
  const manager = new ScripturePackageManager(repo.value, {
    async download() {
      downloads += 1;
      return new TextEncoder().encode('abc').buffer;
    },
  });

  const result = await manager.install(manifest(), 'GEN');
  assert.equal(result.status, 'current');
  assert.equal(result.package, installed);
  assert.equal(downloads, 0);
  assert.equal(repo.state().writes, 0);
});

test('forbidden or live Scripture delivery fails before transport or storage', async () => {
  const repo = repository();
  let downloads = 0;
  const manager = new ScripturePackageManager(repo.value, {
    async download() {
      downloads += 1;
      return new TextEncoder().encode('abc').buffer;
    },
  });
  const live = manifest({
    delivery: 'live',
    books: [],
    license: {
      source: 'Japanese source',
      license: 'Review required',
      attribution: 'Source',
      redistribution: 'review-required',
    },
  });

  await assert.rejects(manager.install(live, 'GEN'), /redistribution|offline-package|manifest/i);
  assert.equal(downloads, 0);
  assert.equal(repo.state().writes, 0);
});

test('corrupt or truncated payloads are never committed', async () => {
  for (const payload of [new TextEncoder().encode('abd').buffer, new TextEncoder().encode('ab').buffer]) {
    const repo = repository();
    const manager = new ScripturePackageManager(repo.value, {
      async download() {
        return payload;
      },
    });

    await assert.rejects(
      manager.install(manifest(), 'GEN'),
      (error: unknown) => error instanceof ScripturePackageIntegrityError,
    );
    assert.equal(repo.state().writes, 0);
  }
});

test('active downloads can be cancelled without storing partial data', async () => {
  const repo = repository();
  let started!: () => void;
  const active = new Promise<void>((resolve) => { started = resolve; });

  const transport: ScripturePackageTransport = {
    async download(_url, options) {
      started();
      return new Promise<ArrayBuffer>((_resolve, reject) => {
        const rejectAbort = () => {
          const error = new Error('cancelled');
          error.name = 'AbortError';
          reject(error);
        };
        if (options.signal.aborted) rejectAbort();
        else options.signal.addEventListener('abort', rejectAbort, { once: true });
      });
    },
  };
  const manager = new ScripturePackageManager(repo.value, transport);
  const pending = manager.install(manifest(), 'GEN');

  await active;
  assert.equal(manager.cancel('bsb', 'GEN'), true);
  await assert.rejects(pending, (error: unknown) => error instanceof Error && error.name === 'AbortError');
  assert.equal(repo.state().writes, 0);
  assert.equal(manager.cancel('bsb', 'GEN'), false);
});

test('remove and usage stay behind the package repository boundary', async () => {
  const installed: InstalledScripturePackage = {
    key: `bsb:2026-09-19.1:GEN:${abcSha}`,
    translationId: 'bsb',
    contentVersion: '2026-09-19.1',
    bookCode: 'GEN',
    sha256: abcSha,
    bytes: 3,
    installedAt: '2026-09-19T14:00:00.000Z',
  };
  const repo = repository(installed);
  const manager = new ScripturePackageManager(repo.value, { async download() { throw new Error('unused'); } });

  assert.deepEqual(await manager.usage(), { bytes: 3, packages: 1 });
  await manager.remove('bsb', 'gen');
  assert.deepEqual(await manager.usage(), { bytes: 0, packages: 0 });
  assert.equal(repo.state().removals, 1);
});
