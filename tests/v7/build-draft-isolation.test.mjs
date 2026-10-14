import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mayCopyCompatibilityData } from '../../scripts/v7-build-draft-isolation.mjs';

test('compatibility copy excludes staged rasters while preserving runtime data', async t => {
  const root = await mkdtemp(join(tmpdir(), 'bq-draft-isolation-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = join(root, 'data');
  await mkdir(join(source, 'v7/visual-assets/qa-candidates/nested'), { recursive: true });
  await writeFile(join(source, 'v7/visual-assets/qa-candidates/master.webp'), 'unapproved');
  await writeFile(join(source, 'v7/visual-assets/qa-candidates/nested/master.png'), 'unapproved');
  await writeFile(join(source, 'runtime.json'), '{"preserved":true}');
  await writeFile(join(source, 'v7/visual-assets.json'), '{"approved":true}');
  const output = join(root, 'dist/data');
  await cp(source, output, { recursive: true, filter: path => mayCopyCompatibilityData(path, root) });
  assert.equal(await readFile(join(output, 'runtime.json'), 'utf8'), '{"preserved":true}');
  assert.equal(await readFile(join(output, 'v7/visual-assets.json'), 'utf8'), '{"approved":true}');
  await assert.rejects(readFile(join(output, 'v7/visual-assets/qa-candidates/master.webp')), { code: 'ENOENT' });
  assert.equal(mayCopyCompatibilityData(join(source, 'v7/visual-assets/qa-candidates-other/valid.json'), root), true);
});
