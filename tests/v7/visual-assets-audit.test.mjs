import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { auditV7VisualAssets, NEED_VISUAL_ASSIGNMENTS } from '../../scripts/v7-visual-assets-audit.mjs';

const ID = 'bqv7-emotion-anxiety-worry-01';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/tAAAAABJRU5ErkJggg==', 'base64');

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'bqv7-visual-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const records = join(root, 'data/v7/visual-assets/records');
  const queues = join(root, 'data/v7/visual-assets/queues');
  const images = join(root, 'public/v7/images/emotion');
  await Promise.all([mkdir(records, { recursive: true }), mkdir(queues, { recursive: true }), mkdir(images, { recursive: true })]);
  const queuesByAgent = [
    ['anxiety_worry', 'fear', 'sadness', 'grief_loss', 'loneliness', 'anger'],
    ['hurt_betrayal', 'rejection', 'guilt', 'shame', 'insecurity_unworthiness', 'doubt'],
    ['confusion_uncertainty', 'discouragement', 'hopelessness', 'overwhelm', 'stress', 'tiredness_weariness'],
    ['spiritual_dryness_distance', 'temptation', 'impatience_waiting', 'jealousy_envy', 'frustration', 'numbness_emptiness'],
    ['joy', 'gratitude', 'peace_contentment', 'hope', 'excitement', 'love_connection']
  ];
  await Promise.all(queuesByAgent.map((initialQueue, index) =>
    writeFile(join(queues, 'visual-agent-' + (index + 1) + '.json'),
      JSON.stringify({ schemaVersion: 1, agentId: 'visual-agent-' + (index + 1), initialQueue }))));
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
  assert.deepEqual(first.manifest.byContent['emotion:anxious'], [ID]);
  assert.equal(first.manifest.assets[0].canonicalContentId, 'anxious');
  assert.equal(first.manifest.assets[0].queueConcept, 'anxiety_worry');
  assert.equal(first.counts.emotionQueueTotal, 30);
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
  assert.match(result.errors.join('\n'), /agent ownership mismatch/);
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

test('rejects conflicting visual canonical ID instead of publishing a wrongly tagged feeling', async t => {
  const f = await fixture(t);
  f.record.canonicalEmotionId = 'afraid';
  await f.save();
  const result = await auditV7VisualAssets(f.root);
  assert.equal(result.status, 'FAIL');
  assert.match(result.errors.join('\n'), /queue\/canonical ID\/agent ownership mismatch/);
});

test('canonical emotion stored as contentId still resolves its original image-agent queue', async t => {
  const f = await fixture(t);
  f.record.contentId = 'anxious';
  f.record.queueConcept = 'anxiety_worry';
  f.record.canonicalEmotionId = 'anxious';
  await f.save();
  const result = await auditV7VisualAssets(f.root);
  assert.equal(result.status, 'PASS', result.errors.join('\n'));
  assert.deepEqual(result.manifest.byContent['emotion:anxious'], [ID]);
  assert.deepEqual(result.manifest.byContent['emotion:anxiety_worry'], [ID]);
  assert.equal(result.queues[0].completed, 1);
  assert.equal(result.queues[0].next, 'fear');
});

async function needFixture(t) {
  const f = await fixture(t);
  const id = 'bqv7-need-peace-01';
  const newFolder = join(f.root, 'public/v7/images/need');
  await mkdir(newFolder, { recursive: true });
  const newImage = join(newFolder, id + '.png');
  const newRecord = join(f.root, 'data/v7/visual-assets/records', id + '.json');
  f.record.assetId = id;
  f.record.family = 'need';
  f.record.contentType = 'need';
  f.record.contentId = 'peace';
  f.record.visualRole = 'need_tile';
  f.record.agentId = NEED_VISUAL_ASSIGNMENTS.peace;
  f.record.usage = ['needs_carousel'];
  f.record.imagePath = '/v7/images/need/' + id + '.png';
  await Promise.all([rm(f.imagePath), rm(f.metadataPath)]);
  await Promise.all([
    writeFile(newImage, PNG),
    writeFile(newRecord, JSON.stringify(f.record))
  ]);
  return { ...f, newImage, newRecord, saveNeed: () => writeFile(newRecord, JSON.stringify(f.record)) };
}

test('Need cards are verified, available by need ID and assigned to one visual agent', async t => {
  const f = await needFixture(t);
  const result = await auditV7VisualAssets(f.root);
  assert.equal(result.status, 'PASS', result.errors.join('\n'));
  assert.deepEqual(result.manifest.byContent['need:peace'], ['bqv7-need-peace-01']);
  assert.equal(result.manifest.assets[0].canonicalContentId, 'peace');
  assert.equal(result.manifest.assets[0].visualRole, 'need_tile');
  assert.equal(result.manifest.assets[0].rights.sourceType, 'generated');
});

test('Need image IDs and agent ownership reject cross-category or wrong assignments', async t => {
  const f = await needFixture(t);
  f.record.agentId = 'visual-agent-5';
  await f.saveNeed();
  const denied = await auditV7VisualAssets(f.root);
  assert.equal(denied.status, 'FAIL');
  assert.match(denied.errors.join('\n'), /need taxonomy ID\/agent ownership mismatch/);
  f.record.agentId = NEED_VISUAL_ASSIGNMENTS.peace;
  f.record.contentId = 'not_in_taxonomy';
  await f.saveNeed();
  const unknown = await auditV7VisualAssets(f.root);
  assert.equal(unknown.status, 'FAIL');
  assert.match(unknown.errors.join('\n'), /need taxonomy ID\/agent ownership mismatch/);
});

test('Need art cannot spoof a mismatched canonical taxonomy ID', async t => {
  const f = await needFixture(t);
  f.record.canonicalNeedId = 'hope';
  await f.saveNeed();
  const denied = await auditV7VisualAssets(f.root);
  assert.equal(denied.status, 'FAIL');
  assert.match(denied.errors.join('\n'), /need taxonomy ID\/agent ownership mismatch/);
});

test('Needs are allocated across five agents without overlap, independently of queue order', () => {
  const ids = Object.keys(NEED_VISUAL_ASSIGNMENTS);
  assert.equal(ids.length, 19);
  assert.equal(new Set(ids).size, 19);
  assert.deepEqual(
    [...new Set(Object.values(NEED_VISUAL_ASSIGNMENTS))].sort(),
    ['visual-agent-1','visual-agent-2','visual-agent-3','visual-agent-4','visual-agent-5']
  );
});


async function needV2BundleFixture(t) {
  const f = await needFixture(t);
  const id = f.record.assetId;
  const folder = join(f.root, 'public/v7/images/need');
  const taxonomyBytes = await readFile(new URL('../../src/features/library/emotion-taxonomy.js', import.meta.url));
  const sourceDir = join(f.root, 'src/features/library');
  await mkdir(sourceDir, { recursive: true });
  await writeFile(join(sourceDir, 'emotion-taxonomy.js'), taxonomyBytes);
  const sourceBlobSha = createHash('sha1')
    .update(Buffer.from('blob ' + taxonomyBytes.length))
    .update(Buffer.from([0])).update(taxonomyBytes).digest('hex');
  const typeBytes = Buffer.concat([PNG, Buffer.from('verified-type')]);
  const thumbBytes = Buffer.concat([PNG, Buffer.from('verified-thumb')]);
  await Promise.all([
    writeFile(join(folder, id + '-with-text-en.png'), typeBytes),
    writeFile(join(folder, id + '-thumbnail.png'), thumbBytes)
  ]);
  const qc = { imageDecoded: true, dimensionsMeasured: true, sha256Measured: true, visualInspected: true };
  const variant = (kind, suffix, bytes, extra = {}) => ({
    kind, imagePath: '/v7/images/need/' + id + suffix + '.png',
    format: 'png', width: 1, height: 1, fileBytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'), ...extra
  });
  f.record.schemaVersion = 2;
  f.record.canonicalNeedId = 'peace';
  f.record.bundleStatus = 'complete_three_real_files';
  f.record.qc = {
    allThreeLocalWebPDecodingAndSHA256Verified: true,
    localTypeAndThumbnailInspected: true
  };
  f.record.variants = [
    variant('CLEAN', '', PNG, {
      qa: { ...qc, anatomyAcceptable: true, noBakedText: true, cropReviewed: true }
    }),
    variant('TYPE', '-with-text-en', typeBytes, {
      locale: 'en',
      embeddedWording: {
        label: 'Peace', scriptureReference: 'John 14:27', scriptureTextIncluded: false
      },
      qa: { ...qc, spellingCheckedAgainstTaxonomy: true, typeReadableAt320px: true }
    }),
    variant('THUMB', '-thumbnail', thumbBytes, {
      qa: { ...qc, noBakedText: true, subjectReadableAtThumbnail: true, cropReviewed: true }
    })
  ];
  f.record.wordingEvidence = {
    sourcePath: 'src/features/library/emotion-taxonomy.js',
    sourceBlobSha, canonicalNeedId: 'peace', locale: 'en',
    exactLabel: 'Peace', reference: 'John 14:27',
    scriptureTextIncluded: false
  };
  await f.saveNeed();
  return f;
}

test('publishes verified V2 Need CLEAN/TYPE/THUMB with canonical Need lookup only', async t => {
  const f = await needV2BundleFixture(t);
  const result = await auditV7VisualAssets(f.root);
  assert.equal(result.status, 'PASS', result.errors.join('\\n'));
  assert.equal(result.counts.completeBundles, 1);
  assert.deepEqual(result.manifest.byContent['need:peace'], [f.record.assetId]);
  assert.equal(result.manifest.byContent['need:hope'], undefined);
  assert.deepEqual(result.manifest.assets[0].variants.map(v => v.kind), ['with_text', 'thumbnail']);
  assert.equal(result.manifest.assets[0].variants[0].embeddedText, 'Peace');
});

test('rejects V2 Need with mismatched text or unsupported Scripture reference', async t => {
  const f = await needV2BundleFixture(t);
  f.record.variants[1].embeddedWording.label = 'Courage';
  await f.saveNeed();
  let result = await auditV7VisualAssets(f.root);
  assert.equal(result.status, 'FAIL');
  assert.match(result.errors.join('\\n'), /TYPE embedded wording does not match reviewed taxonomy/);
  assert.deepEqual(result.manifest.assets, []);
  f.record.variants[1].embeddedWording.label = 'Peace';
  f.record.wordingEvidence.reference = 'Proverbs 1:1';
  f.record.variants[1].embeddedWording.scriptureReference = 'Proverbs 1:1';
  await f.saveNeed();
  result = await auditV7VisualAssets(f.root);
  assert.equal(result.status, 'FAIL');
  assert.match(result.errors.join('\\n'), /Scripture reference is not approved/);
});

test('rejects V2 Need when typography source revision or canonical Need ID drifts', async t => {
  const f = await needV2BundleFixture(t);
  f.record.wordingEvidence.sourceBlobSha = '0'.repeat(40);
  await f.saveNeed();
  let result = await auditV7VisualAssets(f.root);
  assert.equal(result.status, 'FAIL');
  assert.match(result.errors.join('\\n'), /TYPE taxonomy source revision changed/);
  f.record.wordingEvidence.sourceBlobSha = createHash('sha1')
    .update(Buffer.from('blob ' + (await readFile(new URL('../../src/features/library/emotion-taxonomy.js', import.meta.url))).length))
    .update(Buffer.from([0]))
    .update(await readFile(new URL('../../src/features/library/emotion-taxonomy.js', import.meta.url)))
    .digest('hex');
  f.record.wordingEvidence.canonicalNeedId = 'hope';
  await f.saveNeed();
  result = await auditV7VisualAssets(f.root);
  assert.equal(result.status, 'FAIL');
  assert.match(result.errors.join('\\n'), /TYPE content ID or locale cannot be resolved/);
});

test('rejects V2 Need variants falsely claiming reviewed typography or containing Scripture prose', async t => {
  const f = await needV2BundleFixture(t);
  f.record.variants[1].qa.typeReadableAt320px = false;
  await f.saveNeed();
  let result = await auditV7VisualAssets(f.root);
  assert.equal(result.status, 'FAIL');
  assert.match(result.errors.join('\\n'), /TYPE typography review evidence is incomplete/);
  f.record.variants[1].qa.typeReadableAt320px = true;
  f.record.variants[1].embeddedWording.scriptureTextIncluded = true;
  await f.saveNeed();
  result = await auditV7VisualAssets(f.root);
  assert.equal(result.status, 'FAIL');
  assert.match(result.errors.join('\\n'), /Scripture prose requires a separately verified text-source contract/);
});


async function replaceFixtureWithSvg(f, xml) {
  const buffer = Buffer.from(xml, 'utf8');
  const path = join(f.images, ID + '.svg');
  await rm(f.imagePath, { force: true });
  await writeFile(path, buffer);
  f.record.imagePath = '/v7/images/emotion/' + ID + '.svg';
  f.record.format = 'svg';
  f.record.width = 800;
  f.record.height = 512;
  f.record.fileBytes = buffer.length;
  f.record.sha256 = createHash('sha256').update(buffer).digest('hex');
  await f.save();
}

test('allows self-contained SVG artwork with local paint-server fragments', async t => {
  const f = await fixture(t);
  await replaceFixtureWithSvg(f, '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="512"><defs><linearGradient id="bg"><stop offset="0" stop-color="#fff"/></linearGradient></defs><rect width="800" height="512" fill="url(#bg)"/></svg>');
  const result = await auditV7VisualAssets(f.root);
  assert.equal(result.status, 'PASS', result.errors.join('\n'));
});

test('rejects remotely fetched fonts, CSS, and image references in approved SVG', async t => {
  const f = await fixture(t);
  const prefix = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="512">';
  for (const payload of [
    '<style>@import url(https://attacker.example/a.css)</style>',
    '<style>@font-face {font-family:custom;src:url(https://attacker.example/a.woff)}</style>',
    '<rect width="800" height="512" style="fill:url(https://attacker.example/texture.svg)"/>',
    '<image href="https://attacker.example/photo.png" width="800" height="512"/>',
    '<image href="data:image/svg+xml;base64,PHN2Zz4=" width="800" height="512"/>',
    '<use xlink:href="//attacker.example/asset.svg#shape"/>'
  ]) {
    await replaceFixtureWithSvg(f, prefix + payload + '</svg>');
    const result = await auditV7VisualAssets(f.root);
    assert.equal(result.status, 'FAIL', 'Expected rejection for ' + payload);
    assert.match(result.errors.join('\n'), /unsafe or unrecognized SVG/);
  }
});

test('rejects XML stylesheet instructions and entity declarations in SVG art', async t => {
  const f = await fixture(t);
  for (const svg of [
    '<?xml version="1.0"?><!DOCTYPE svg [ <!ENTITY external SYSTEM "file:///etc/passwd"> ]><svg width="800" height="512"></svg>',
    '<?xml-stylesheet type="text/css" href="https://attacker.example/skin.css"?><svg width="800" height="512"></svg>'
  ]) {
    await replaceFixtureWithSvg(f, svg);
    const result = await auditV7VisualAssets(f.root);
    assert.equal(result.status, 'FAIL');
    assert.match(result.errors.join('\n'), /unsafe or unrecognized SVG/);
  }
});
