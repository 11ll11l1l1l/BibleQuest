import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const modulePath = new URL('../src/offline/content-manifest.js', import.meta.url);
const source = await readFile(modulePath, 'utf8');
const manifestModule = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const { validateScriptureManifest, scripturePackageKey } = manifestModule;

const validManifest = () => ({
  schemaVersion: 1,
  packageId: 'bsb-genesis-v1',
  translationId: 'bsb',
  contentVersion: '2026.09.13',
  scope: 'book',
  books: ['GEN'],
  contentPath: '/offline-scripture/bsb/2026.09.13/GEN.json',
  byteSize: 123456,
  generatedAt: '2026-09-13T00:00:00.000Z',
  checksum: { algorithm: 'sha256', value: 'a'.repeat(64) },
  license: { redistributionAllowed: true, source: 'Bible source metadata', notice: 'Redistribution verified for this package.' }
});

test('normalizes and freezes a permitted book package', () => {
  const manifest = validateScriptureManifest(validManifest());
  assert.equal(manifest.translationId, 'bsb');
  assert.equal(manifest.scope, 'book');
  assert.deepEqual(manifest.books, ['GEN']);
  assert.equal(Object.isFrozen(manifest), true);
  assert.equal(Object.isFrozen(manifest.books), true);
  assert.equal(scripturePackageKey(validManifest()), 'bsb:2026.09.13:book:GEN');
});

test('blocks packages without explicit redistribution permission', () => {
  const manifest = validManifest();
  manifest.license.redistributionAllowed = false;
  assert.throws(() => validateScriptureManifest(manifest), /redistribution permission/i);
});

test('rejects malformed integrity metadata', () => {
  const manifest = validManifest();
  manifest.checksum.value = 'not-a-sha';
  assert.throws(() => validateScriptureManifest(manifest), /SHA-256/i);
});

test('rejects cross-origin or protocol-relative content locations', () => {
  for (const contentPath of ['https://example.com/package.json', '//example.com/package.json']) {
    const manifest = validManifest();
    manifest.contentPath = contentPath;
    assert.throws(() => validateScriptureManifest(manifest), /same-origin path/i);
  }
});

test('rejects duplicate books and multi-book book scope', () => {
  const duplicate = validManifest();
  duplicate.scope = 'translation';
  duplicate.books = ['GEN', 'GEN'];
  assert.throws(() => validateScriptureManifest(duplicate), /duplicates/i);

  const multiBook = validManifest();
  multiBook.books = ['GEN', 'EXO'];
  assert.throws(() => validateScriptureManifest(multiBook), /exactly one/i);
});

test('accepts a translation package with multiple unique books', () => {
  const manifest = validManifest();
  manifest.packageId = 'bsb-full-v1';
  manifest.scope = 'translation';
  manifest.books = ['GEN', 'EXO', 'MAT', 'JHN'];
  const normalized = validateScriptureManifest(manifest);
  assert.deepEqual(normalized.books, ['GEN', 'EXO', 'MAT', 'JHN']);
});
