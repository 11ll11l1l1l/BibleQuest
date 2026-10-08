import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { publishV7VisualAssets } from '../../scripts/v7-publish-visual-assets.mjs';

test('Lane D emits a deployable registry of only approved byte-verified assets', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bqv7-publication-test-'));
  try {
    const report = await publishV7VisualAssets({ outDir: dir });
    const manifest = JSON.parse(await readFile(join(dir, report.manifest), 'utf8'));
    assert.equal(manifest.schemaVersion, 1);
    assert.ok(report.approved > 0, 'verified Lane A artwork should be present');
    assert.equal(report.approved, manifest.assets.length);
    const paths = manifest.assets.flatMap(asset => [
      asset.src, ...(asset.variants || []).map(variant => variant.src)
    ]);
    assert.equal(new Set(paths).size, paths.length);
    assert.equal(paths.length, report.files);
    for (const asset of manifest.assets) {
      const bytes = await readFile(join(dir, asset.src.slice(1)));
      assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256);
      assert.deepEqual(manifest.byContent[asset.contentType + ':' + asset.contentId].includes(asset.assetId), true);
      for (const variant of asset.variants || []) {
        const derivative = await readFile(join(dir, variant.src.slice(1)));
        assert.equal(createHash('sha256').update(derivative).digest('hex'), variant.sha256);
      }
    }
    // Only manifest-listed files are copied. Future book/devotional art
    // families must not accidentally break the count or permit extra files.
    const imageRoot = join(dir, 'v7/images');
    const allFiles = [];
    for (const family of await readdir(imageRoot, { withFileTypes: true })) {
      if (!family.isDirectory()) continue;
      for (const file of await readdir(join(imageRoot, family.name), { withFileTypes: true })) {
        if (file.isFile()) allFiles.push('/v7/images/' + family.name + '/' + file.name);
      }
    }
    assert.deepEqual(allFiles.sort(), [...paths].sort(),
      'no unapproved derivative or orphan file may enter the deployment');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
