import assert from 'node:assert/strict';
import test from 'node:test';

import { createBrowserScripturePackageController } from '../../src/v6/reader/browser-packages.ts';

test('managed offline snapshot fails closed when manifest cannot be validated', async () => {
  const repository = {
    readInstalled: async () => null,
    replaceInstalled: async () => {},
    removeInstalled: async () => {},
    usage: async () => ({ bytes: 0, packages: 0 }),
  };
  const transport = {
    download: async () => new ArrayBuffer(0),
  };
  const fetcher = async () => new Response('', { status: 503 });

  const controller = createBrowserScripturePackageController({
    repository,
    transport,
    fetcher: fetcher as typeof fetch,
  });

  const snapshot = await controller.snapshot('bsb', 'JHN');

  assert.equal(snapshot.installed, null);
  assert.equal(snapshot.downloadable, false);
  assert.match(snapshot.reason, /manifest|offline package/i);
});
