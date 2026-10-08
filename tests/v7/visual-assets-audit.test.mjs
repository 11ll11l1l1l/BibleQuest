import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
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

test('all committed production images pass the live V7 asset audit', async () => {
  const result = await auditV7VisualAssets();
  assert.equal(result.status, 'PASS', result.errors.join('\n'));
  assert.equal(result.counts.emotionQueueTotal, 30);
  assert.ok(result.counts.productionReady >= 5);
});

test('validates and registers typography and thumbnail derivatives without modifying master', async t => {
  const f = await fixture(t);
  const textPath = join(f.images, ID + '-with-text-en.png');
  const thumbPath = join(f.images, ID + '-thumbnail.png');
  const textBytes = Buffer.concat([PNG, Buffer.from('text')]);
  const thumbBytes = Buffer.concat([PNG, Buffer.from('thumbnail')]);
  await Promise.all([writeFile(textPath, textBytes), writeFile(thumbPath, thumbBytes)]);
  const variant = (kind, bytes, suffix, extra = {}) => ({
    kind, imagePath: '/v7/images/emotion/' + ID + suffix + '.png',
    format: 'png', width: 1, height: 1, fileBytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'), ...extra
  });
  f.record.variants = [
    variant('with_text', textBytes, '-with-text-en', { locale: 'en', text: 'Fear and trust' }),
    variant('thumbnail', thumbBytes, '-thumbnail')
  ];
  await f.save();
  const result = await auditV7VisualAssets(f.root);
  assert.equal(result.status, 'PASS', result.errors.join('\n'));
  assert.deepEqual(result.manifest.assets[0].variants.map(row => row.kind), ['with_text', 'thumbnail']);
  assert.equal(result.manifest.assets[0].variants[0].embeddedText, 'Fear and trust');
});

test('fails closed on altered with-text artwork or a missing thumbnail', async t => {
  const f = await fixture(t);
  const titleBytes = Buffer.concat([PNG, Buffer.from('localized title')]);
  await writeFile(join(f.images, ID + '-with-text-en.png'), titleBytes);
  f.record.variants = [{
    kind: 'with_text', imagePath: '/v7/images/emotion/' + ID + '-with-text-en.png',
    locale: 'en', text: 'Hope', format: 'png', width: 1, height: 1,
    fileBytes: titleBytes.length, sha256: '0'.repeat(64)
  }];
  await f.save();
  const result = await auditV7VisualAssets(f.root);
  assert.equal(result.status, 'FAIL');
  assert.match(result.errors.join('\n'), /variant SHA-256 or bytes mismatch/);
});

test('recognizes full V2 CLEAN/TYPE/THUMB bundle and canonical emotion lookup', async t => {
  const f = await fixture(t);
  const typeData = Buffer.concat([PNG, Buffer.from('type-image')]);
  const thumbData = Buffer.concat([PNG, Buffer.from('thumb-image')]);
  await writeFile(join(f.images, ID + '-with-text-en.png'), typeData);
  await writeFile(join(f.images, ID + '-thumbnail.png'), thumbData);
  const taxonomy = await readFile(new URL('../../src/features/library/emotion-taxonomy.js', import.meta.url));
  const taxonomyPath = join(f.root, 'src/features/library/emotion-taxonomy.js');
  await mkdir(join(f.root, 'src/features/library'), { recursive: true });
  await writeFile(taxonomyPath, taxonomy);
  const blobSha = createHash('sha1').update(Buffer.from('blob ' + taxonomy.length))
    .update(Buffer.from([0])).update(taxonomy).digest('hex');
  const variant = (kind, pathSuffix, bytes, extra = {}) => ({
    kind, imagePath: '/v7/images/emotion/' + ID + pathSuffix + '.png',
    format: 'png', width: 1, height: 1, fileBytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'), ...extra
  });
  const cleanQA = { imageDecoded: true, dimensionsMeasured: true, sha256Measured: true,
    visualInspected: true, anatomyAcceptable: true, noBakedText: true, cropReviewed: true };
  const typeQA = { imageDecoded: true, dimensionsMeasured: true, sha256Measured: true,
    visualInspected: true, spellingCheckedAgainstTaxonomy: true, typeReadableAt320px: true };
  const thumbQA = { imageDecoded: true, dimensionsMeasured: true, sha256Measured: true,
    visualInspected: true, noBakedText: true, subjectReadableAtThumbnail: true, cropReviewed: true };
  f.record.schemaVersion = 2;
  f.record.canonicalEmotionId = 'anxious';
  f.record.bundleStatus = 'complete_three_real_files';
  f.record.qc = { allThreeLocalWebPDecodingAndSHA256Verified: true, localTypeAndThumbnailInspected: true };
  f.record.variants = [
    variant('CLEAN', '', PNG, { qa: cleanQA }),
    variant('TYPE', '-with-text-en', typeData, {
      locale: 'en',
      embeddedWording: { label: 'Anxious / worried', scriptureReference: 'Philippians 4:6-7',
        scriptureTextIncluded: false },
      qa: typeQA
    }),
    variant('THUMB', '-thumbnail', thumbData, { qa: thumbQA })
  ];
  f.record.wordingEvidence = { sourcePath: 'src/features/library/emotion-taxonomy.js',
    sourceBlobSha: blobSha, canonicalEmotionId: 'anxious', locale: 'en',
    exactLabel: 'Anxious / worried', reference: 'Philippians 4:6-7',
    scriptureTextIncluded: false };
  await f.save();
  const pass = await auditV7VisualAssets(f.root);
  assert.equal(pass.status, 'PASS', pass.errors.join('\n'));
  assert.equal(pass.counts.completeBundles, 1);
  assert.deepEqual(pass.manifest.byContent['emotion:anxious'], [ID]);
  assert.deepEqual(pass.manifest.byContent['emotion:anxiety_worry'], [ID]);
  assert.equal(pass.manifest.assets[0].variants.length, 2); // CLEAN is top-level master.
  f.record.variants[1].embeddedWording.label = 'Anxiety / worried';
  await f.save();
  const fail = await auditV7VisualAssets(f.root);
  assert.equal(fail.status, 'FAIL');
  assert.match(fail.errors.join('\n'), /TYPE embedded wording does not match/);
});

test('reported V2 full bundle fails closed when THUMB is absent', async t => {
  const f = await fixture(t);
  f.record.schemaVersion = 2;
  f.record.bundleStatus = 'complete_three_real_files';
  f.record.qc = { allThreeLocalWebPDecodingAndSHA256Verified: true, localTypeAndThumbnailInspected: true };
  f.record.variants = [{ kind: 'CLEAN', ...{
    imagePath: f.record.imagePath, format: 'png', width: 1, height: 1,
    fileBytes: PNG.length, sha256: f.record.sha256,
    qa: { imageDecoded: true, dimensionsMeasured: true, sha256Measured: true,
      visualInspected: true, anatomyAcceptable: true, noBakedText: true, cropReviewed: true }
  }}];
  await f.save();
  const result = await auditV7VisualAssets(f.root);
  assert.equal(result.status, 'FAIL');
  assert.match(result.errors.join('\n'), /bundleStatus disagrees/);
});
