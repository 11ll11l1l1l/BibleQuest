import assert from 'node:assert/strict';
import test from 'node:test';

import type { ScriptureTranslationManifest } from '../../src/v6/reader/content-manifest.ts';
import {
  SCRIPTURE_OFFLINE_STORAGE_CEILING_BYTES,
  ScripturePackageManager,
  ScripturePackageStorageLimitError,
  type InstalledScripturePackage,
  type ScripturePackageRepository,
} from '../../src/v6/reader/package-manager.ts';

const abcSha = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

function manifest(bytes: number | undefined = 3): ScriptureTranslationManifest {
  return {
    schemaVersion: 1,
    translationId: 'bsb',
    label: 'English · BSB',
    contentVersion: '2026-09-24.1',
    delivery: 'downloadable',
    license: {
      source: 'Berean Standard Bible',
      license: 'Public domain',
      attribution: 'BibleQuest attribution',
      redistribution: 'allowed',
    },
    books: [{ bookCode: 'GEN', url: '/packs/bsb/GEN.json', sha256: abcSha, ...(bytes === undefined ? {} : { bytes }) }],
  };
}

function repository(options: Readonly<{ usageBytes: number; current?: InstalledScripturePackage | null }>) {
  let installed = options.current ?? null;
  let writes = 0;
  const value: ScripturePackageRepository = {
    async readInstalled(translationId, bookCode) {
      return installed?.translationId === translationId && installed.bookCode === bookCode ? installed : null;
    },
    async replaceInstalled(record) {
      installed = record;
      writes += 1;
    },
    async removeInstalled() {
      installed = null;
    },
    async usage() {
      return { bytes: options.usageBytes, packages: options.usageBytes > 0 ? 1 : 0 };
    },
  };
  return { value, writes: () => writes };
}

test('known-size package fails before transport when projected storage reaches the 10 GB ceiling', async () => {
  const repo = repository({ usageBytes: SCRIPTURE_OFFLINE_STORAGE_CEILING_BYTES - 3 });
  let downloads = 0;
  const manager = new ScripturePackageManager(repo.value, {
    async download() {
      downloads += 1;
      return new TextEncoder().encode('abc').buffer;
    },
  });

  await assert.rejects(
    manager.install(manifest(), 'GEN'),
    (error: unknown) => error instanceof ScripturePackageStorageLimitError
      && error.projectedBytes === SCRIPTURE_OFFLINE_STORAGE_CEILING_BYTES,
  );
  assert.equal(downloads, 0);
  assert.equal(repo.writes(), 0);
});

test('unknown-size package is rechecked against actual verified bytes before persistent storage', async () => {
  const repo = repository({ usageBytes: SCRIPTURE_OFFLINE_STORAGE_CEILING_BYTES - 2 });
  let downloads = 0;
  const manager = new ScripturePackageManager(repo.value, {
    async download() {
      downloads += 1;
      return new TextEncoder().encode('abc').buffer;
    },
  });

  await assert.rejects(
    manager.install(manifest(undefined), 'GEN'),
    (error: unknown) => error instanceof ScripturePackageStorageLimitError,
  );
  assert.equal(downloads, 1);
  assert.equal(repo.writes(), 0);
});

test('replacement budget subtracts the existing package instead of double-counting it', async () => {
  const current: InstalledScripturePackage = {
    key: `bsb:old:GEN:${'0'.repeat(64)}`,
    translationId: 'bsb',
    contentVersion: 'old',
    bookCode: 'GEN',
    sha256: '0'.repeat(64),
    bytes: 3,
    installedAt: '2026-09-23T00:00:00.000Z',
  };
  const repo = repository({ usageBytes: SCRIPTURE_OFFLINE_STORAGE_CEILING_BYTES - 1, current });
  const manager = new ScripturePackageManager(repo.value, {
    async download() {
      return new TextEncoder().encode('abc').buffer;
    },
  });

  const result = await manager.install(manifest(), 'GEN');
  assert.equal(result.status, 'installed');
  assert.equal(repo.writes(), 1);
});
