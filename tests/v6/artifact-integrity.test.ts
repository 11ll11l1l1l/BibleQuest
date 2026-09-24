import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  V6_ARTIFACT_INTEGRITY_FILE,
  verifyArtifactIntegrityManifest,
  writeArtifactIntegrityManifest,
} from '../../scripts/v6-artifact-integrity.mjs';

test('artifact integrity manifest is deterministic and tied to the exact source SHA', async () => {
  const root = await mkdtemp(join(tmpdir(), 'bq-v6-integrity-'));
  try {
    await mkdir(join(root, '_v6'));
    await writeFile(join(root, 'index.html'), '<main>BibleQuest</main>\n');
    await writeFile(join(root, '_v6', 'app.js'), 'console.log("bq");\n');

    const first = await writeArtifactIntegrityManifest(root, 'abc123');
    const firstBytes = await readFile(join(root, V6_ARTIFACT_INTEGRITY_FILE), 'utf8');
    const verified = await verifyArtifactIntegrityManifest(root, 'abc123');

    assert.equal(first.sourceSha, 'abc123');
    assert.equal(first.algorithm, 'sha256');
    assert.equal(first.fileCount, 2);
    assert.equal(verified.artifactSha256, first.artifactSha256);
    assert.deepEqual(verified.files.map((file) => file.path), ['_v6/app.js', 'index.html']);

    await writeArtifactIntegrityManifest(root, 'abc123');
    const secondBytes = await readFile(join(root, V6_ARTIFACT_INTEGRITY_FILE), 'utf8');
    assert.equal(secondBytes, firstBytes);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('artifact integrity verification rejects changed public bytes and wrong source SHA', async () => {
  const root = await mkdtemp(join(tmpdir(), 'bq-v6-integrity-'));
  try {
    await writeFile(join(root, 'index.html'), '<main>before</main>\n');
    await writeArtifactIntegrityManifest(root, 'source-a');

    await assert.rejects(
      () => verifyArtifactIntegrityManifest(root, 'source-b'),
      /sourceSha source-a != source-b/,
    );

    await writeFile(join(root, 'index.html'), '<main>after</main>\n');
    await assert.rejects(
      () => verifyArtifactIntegrityManifest(root, 'source-a'),
      /artifact integrity verification failed/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
