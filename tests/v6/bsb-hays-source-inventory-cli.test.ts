import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = resolve(new URL('../../', import.meta.url).pathname);
const script = join(root, 'scripts', 'v6-hays-source-inventory.mjs');

test('standalone Hays inventory CLI requires an explicit staged directory', () => {
  const run = spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' });
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /Usage: node scripts\/v6-hays-source-inventory\.mjs/);
});

test('standalone Hays inventory CLI fails closed before hashing an incomplete corpus', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'bq-v6-hays-inventory-'));
  try {
    const run = spawnSync(process.execPath, [script, directory], { cwd: root, encoding: 'utf8' });
    assert.notEqual(run.status, 0);
    assert.match(run.stderr, /exactly the canonical 1,189 OpenBible chapter MP3s/);
    assert.match(run.stderr, /missing=1189, unexpected=0/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
