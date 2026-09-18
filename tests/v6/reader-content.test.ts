import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertScriptureDownloadAllowed,
  packageNeedsUpdate,
  scripturePackageKey,
  sha256Hex,
  validateScriptureManifest,
  verifyPackageChecksum,
} from '../../src/v6/reader/content-manifest.ts';
import { translationPackagingPolicy, V6_TRANSLATION_PACKAGING_POLICY } from '../../src/v6/reader/license-policy.ts';

const abcSha = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

function validManifest() {
  return {
    schemaVersion: 1 as const,
    translationId: 'bsb',
    label: 'English · BSB',
    contentVersion: '2026-09-18.1',
    delivery: 'downloadable' as const,
    license: {
      source: 'Berean Standard Bible',
      license: 'Public domain',
      attribution: 'Source attribution',
      redistribution: 'allowed' as const,
    },
    books: [{ bookCode: 'GEN', url: 'data/scripture/bsb/GEN.json', sha256: abcSha, bytes: 3 }],
  };
}

test('manifest validation requires checksum, attribution and redistribution permission', () => {
  const manifest = validManifest();
  assert.equal(validateScriptureManifest(manifest).valid, true);
  assert.equal(assertScriptureDownloadAllowed(manifest), true);

  const forbidden = { ...manifest, license: { ...manifest.license, redistribution: 'forbidden' as const } };
  const result = validateScriptureManifest(forbidden);
  assert.equal(result.valid, false);
  assert.match(result.issues.join(' '), /redistribution permission/i);
});

test('live and external translations cannot masquerade as downloadable packages', () => {
  const live = { ...validManifest(), delivery: 'live' as const, books: validManifest().books };
  assert.equal(validateScriptureManifest(live).valid, false);
  assert.throws(() => assertScriptureDownloadAllowed(live));
});

test('package identity includes translation, content version, book and checksum', () => {
  const manifest = validManifest();
  const key = scripturePackageKey(manifest, manifest.books[0]);
  assert.equal(key, `bsb:2026-09-18.1:GEN:${abcSha}`);
  assert.equal(packageNeedsUpdate(null, manifest.books[0]), true);
  assert.equal(packageNeedsUpdate(manifest.books[0], manifest.books[0]), false);
  assert.equal(packageNeedsUpdate({ ...manifest.books[0], sha256: '0'.repeat(64) }, manifest.books[0]), true);
});

test('checksum helper verifies immutable package bytes', async () => {
  const bytes = new TextEncoder().encode('abc');
  assert.equal(await sha256Hex(bytes), abcSha);
  assert.equal(await verifyPackageChecksum(bytes, abcSha), true);
  assert.equal(await verifyPackageChecksum(bytes, '0'.repeat(64)), false);
  assert.equal(await verifyPackageChecksum(bytes, 'bad'), false);
});

test('packaging policy preserves current V5 redistribution boundaries', () => {
  assert.equal(V6_TRANSLATION_PACKAGING_POLICY.length, 5);
  assert.equal(translationPackagingPolicy('bsb')?.license.redistribution, 'allowed');
  assert.equal(translationPackagingPolicy('tl')?.license.redistribution, 'allowed');
  assert.equal(translationPackagingPolicy('cebocb')?.license.redistribution, 'allowed');
  assert.equal(translationPackagingPolicy('jko')?.delivery, 'live');
  assert.equal(translationPackagingPolicy('jko')?.license.redistribution, 'review-required');
  assert.equal(translationPackagingPolicy('nlt')?.delivery, 'external');
  assert.equal(translationPackagingPolicy('nlt')?.license.redistribution, 'forbidden');
});
