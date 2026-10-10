import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIBRARY_EMOTIONS } from '../../src/features/library/emotion-taxonomy.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const id = 'bqv7-emotion-hurt-betrayal-01';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const expected = Object.freeze({
  CLEAN: ['a62aa4bc1634457a97feb705bedb072f13f0d4fc59990c1a73642dc9ff30957c', 108974, 1024, 1024],
  TYPE: ['530b122c24b088199e4bbfb81f32cc465091da25486a1a65ba4aa3edeff73987', 165908, 1024, 1280],
  THUMB: ['d55a743c0d295a1b46b1072f422325ba2f4e3becee220c0a4599dd034b29b5d4', 67402, 512, 640],
});

function webpDimensions(bytes) {
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', 'real RIFF image required');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', 'real WebP required');
  const chunk = bytes.toString('ascii', 12, 16);
  if (chunk === 'VP8X') return [
    1 + bytes.readUIntLE(24, 3),
    1 + bytes.readUIntLE(27, 3),
  ];
  if (chunk === 'VP8 ') {
    assert.equal(bytes.toString('hex', 23, 26), '9d012a', 'VP8 start marker');
    return [bytes.readUInt16LE(26) & 0x3fff, bytes.readUInt16LE(28) & 0x3fff];
  }
  if (chunk === 'VP8L') {
    assert.equal(bytes[20], 0x2f);
    return [
      1 + (bytes[21] | ((bytes[22] & 0x3f) << 8)),
      1 + ((bytes[22] >> 6) | (bytes[23] << 2) | ((bytes[24] & 0x0f) << 10)),
    ];
  }
  assert.fail('Unrecognized WebP encoding: ' + chunk);
}
async function verifyPath(path, [hash, length, w, h]) {
  const bytes = await readFile(join(root, 'public', path.slice(1)));
  assert.equal(bytes.length, length, path + ' actual file size');
  assert.equal(sha256(bytes), hash, path + ' actual SHA-256');
  assert.deepEqual(webpDimensions(bytes), [w, h], path + ' decoded header geometry');
}

test('Lane Y Hurt preserves CLEAN and introduces two isolated real WebPs', async () => {
  const dir = join(root, 'data/v7/visual-assets/records');
  const master = JSON.parse(await readFile(join(dir, id + '.json')));
  const record = JSON.parse(await readFile(join(dir, id + '-derivatives.json')));
  assert.equal(master.imagePath, '/v7/images/emotion/' + id + '.webp');
  assert.equal(master.sha256, expected.CLEAN[0]);
  await verifyPath(master.imagePath, expected.CLEAN);
  assert.equal(record.sourceMasterAssetId, id);
  assert.equal(record.productionCertified, false);
  assert.equal(record.qa.productionReady, false);
  assert.equal(record.qa.browserRenderedTypeQA, 'pending_exact_head');
  assert.match(record.status, /^candidate_/);
  const type = record.variants.find(v => v.kind === 'TYPE');
  const thumb = record.variants.find(v => v.kind === 'THUMB');
  assert.ok(type && thumb);
  assert.equal(record.imagePath, type.imagePath, 'primary path must not point to retired SVG');
  assert.equal(record.format, 'webp');
  assert.equal(record.sha256, expected.TYPE[0]);
  for (const [kind, variant] of [['TYPE', type], ['THUMB', thumb]]) {
    const values = expected[kind];
    const suffix = kind === 'TYPE' ? '-with-text-en.webp' : '-thumbnail.webp';
    assert.equal(variant.imagePath, '/v7/images/emotion/' + id + suffix);
    assert.equal(variant.format, 'webp');
    assert.equal(variant.sha256, values[0]);
    assert.equal(variant.fileBytes, values[1]);
    assert.deepEqual([variant.width, variant.height], values.slice(2));
    assert.equal(variant.qc.independentVisualApproval, false);
    await verifyPath(variant.imagePath, values);
    await assert.rejects(access(join(root,'public',variant.legacySvgSource.path.slice(1))), {code:'ENOENT'});
  }
  const proof = record.wordingEvidence;
  const taxonomy = LIBRARY_EMOTIONS.find(x => x.id === proof.canonicalEmotionId);
  assert.ok(taxonomy, 'taxonomy concept exists');
  assert.equal(proof.exactLabel, taxonomy.labels.en);
  assert.ok(taxonomy.scripture.includes(proof.reference), 'reference listed for canonical emotion');
  assert.equal(type.includedWording, proof.exactLabel);
  assert.equal(type.includedReference, proof.reference);
  assert.equal(proof.scriptureTextIncluded, false, 'no verse quotation embedded');
  assert.equal(type.locale, 'en');
  assert.equal(thumb.locale, null);
  assert.equal(record.laneYIsolation.verifiedIndependentVisualApproval, false);
});
