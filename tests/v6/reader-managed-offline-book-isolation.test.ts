import assert from 'node:assert/strict';
import test from 'node:test';
import { createBrowserScripturePackageController } from '../../src/v6/reader/browser-packages.ts';

const installedJohn = Object.freeze({
  key: 'bsb:v1:JHN',
  translationId: 'bsb',
  contentVersion: 'v1',
  bookCode: 'JHN',
  sha256: 'a'.repeat(64),
  bytes: 128,
  installedAt: '2026-09-27T00:00:00.000Z',
});

function repository() {
  return {
    async readInstalled(translationId, bookCode) {
      return translationId === 'bsb' && bookCode === 'JHN' ? installedJohn : null;
    },
    async replaceInstalled() { throw new Error('not used'); },
    async removeInstalled() {},
    async usage() { return { bytes: installedJohn.bytes, packages: 1 }; },
  };
}

test('managed offline snapshot never substitutes an installed book for a different requested book', async () => {
  const controller = createBrowserScripturePackageController({
    repository: repository(),
    fetcher: async () => { throw new Error('network unavailable'); },
  });

  const john = await controller.snapshot('bsb', 'JHN');
  assert.equal(john.installed?.bookCode, 'JHN');

  const genesis = await controller.snapshot('bsb', 'GEN');
  assert.equal(genesis.translationId, 'bsb');
  assert.equal(genesis.bookCode, 'GEN');
  assert.equal(genesis.installed, null);
  assert.equal(genesis.packageBytes, null);
  assert.match(genesis.reason, /manifest is unavailable|Reconnect/i);
  assert.doesNotMatch(genesis.reason, /installed and verified/i);
});

test('managed offline identity is translation-scoped as well as book-scoped', async () => {
  const controller = createBrowserScripturePackageController({
    repository: repository(),
    fetcher: async () => { throw new Error('network unavailable'); },
  });

  const tagalogJohn = await controller.snapshot('tl', 'JHN');
  assert.equal(tagalogJohn.translationId, 'tl');
  assert.equal(tagalogJohn.bookCode, 'JHN');
  assert.equal(tagalogJohn.installed, null);
  assert.equal(tagalogJohn.packageBytes, null);
});
