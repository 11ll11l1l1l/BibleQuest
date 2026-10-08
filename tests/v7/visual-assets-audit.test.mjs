import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { auditV7VisualAssets } from '../../scripts/v7-visual-assets-audit.mjs';

const ID = 'bqv7-emotion-anxiety-worry-01';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/tAAAAABJRU5ErkJggg==', 'base64');

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'bqv7-visual-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const records = join(root, 'data/v7/visual-assets/records');
  const queues = join(root, 'data/v7/visual-assets/queues');
  const images = join(root, 'public/v7/images/emotion');
  await Promise.all([mkdir(records, { recursive: true }), mkdir(queues, { recursive: true }), mkdir(images, { recursive: true })]);
  await writeFile(join(queues, 'visual-agent-1.json'),
    JSON.stringify({ schemaVersion: 1, agentId: 'visual-agent-1', initialQueue: ['anxiety_worry', 'fear'] }));
  const imagePath = join(images, ID + '.png');
  const metadataPath = join(records, ID + '.json');
  const record = {
    schemaVersion: 1, assetId: ID, agentId: 'visual-agent-1', status: 'production_ready',
    imagePath: '/v7/images/emotion/' + ID + '.png', family: 'emotion', visualRole: 'emotion_tile',
    contentType: 'emotion', contentId: 'anxiety_worry', usage: ['feelings_carousel'],
    format: 'png', width: 1, height: 1, fileBytes: PNG.length,
    sha256: createHash('sha256').update(PNG).digest('hex'), focalPoint: { x: 0.5, y: 0.5 },
    textSafeRegion: 'bottom', generation: { provider: 'OpenAI image generation' },
    rights: { sourceType: 'generated', thirdPartyAsset: false, attributionRequired: false },
    accessibility: { decorative: false, altText: 'A person thinking quietly' },
    qc: {
      noBakedText: true, noLogo: true, anatomyAcceptable: true,
      subjectReadableAtThumbnail: true, cropSafe: true,
      matchesVisualSystem: true, duplicateChecked: true
    }
  };
  const save = () => writeFile(metadataPath, JSON.stringify(record));
  await Promise.all([writeFile(imagePath, PNG), save()]);
  return { root, images, imagePath, metadataPath, record, save };
}

test('builds deterministic, rights-aware lookup and next agent assignment', async t => {
  const f = await fixture(t);
  const first = await auditV7VisualAssets(f.root);
  const second = await auditV7VisualAssets(f.root);
  assert.equal(first.status, 'PASS');
  assert.deepEqual(first.manifest, second.manifest);
  assert.equal(first.counts.productionReady, 1);
  assert.equal(first.queues[0].next, 'fear');
  assert.deepEqual(first.manifest.byContent['emotion:anxiety_worry'], [ID]);
  assert.equal(first.manifest.assets[0].src, '/v7/images/emotion/' + ID + '.png');
  assert.equal(first.manifest.assets[0].rights.sourceType, 'generated');
});

test('fails closed when a stored image is modified without updating its hash', async t => {
  const f = await fixture(t);
  await writeFile(f.imagePath, Buffer.concat([PNG, Buffer.from([0])]));
  const result = await auditV7VisualAssets(f.root);
  assert.equal(result.status, 'FAIL');
  assert.match(result.errors.join('\n'), /SHA-256 mismatch/);
});

test('does not expose image without accessibility description', async t => {
  const f = await fixture(t);
  f.record.accessibility.altText = '';
  await f.save();
  const result = await auditV7VisualAssets(f.root);
  assert.equal(result.status, 'FAIL');
  assert.deepEqual(result.manifest.assets, []);
  assert.match(result.errors.join('\n'), /missing alt text/);
});

test('rejects an image with mismatched emotion queue ownership', async t => {
  const f = await fixture(t);
  f.record.agentId = 'visual-agent-3';
  await f.save();
  const result = await auditV7VisualAssets(f.root);
  assert.equal(result.status, 'FAIL');
  assert.match(result.errors.join('\n'), /queue owner/);
});

test('detects untracked image files instead of silently publishing them', async t => {
  const f = await fixture(t);
  await writeFile(join(f.images, 'untracked.png'), PNG);
  const result = await auditV7VisualAssets(f.root);
  assert.equal(result.status, 'FAIL');
  assert.match(result.errors.join('\n'), /orphan or rejected image file/);
});

test('rejects failed visual quality claims even if binary and hash are valid', async t => {
  const f = await fixture(t);
  f.record.qc.duplicateChecked = false;
  await f.save();
  const result = await auditV7VisualAssets(f.root);
  assert.equal(result.status, 'FAIL');
  assert.match(result.errors.join('\n'), /QC failed: duplicateChecked/);
});
