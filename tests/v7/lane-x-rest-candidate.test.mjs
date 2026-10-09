import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { verifyV7ManualCandidate } from '../../scripts/v7-manual-candidate-integrity.mjs';
import { LIBRARY_NEEDS } from '../../src/features/library/emotion-taxonomy.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const id = 'bqv7-need-rest-01';
const sha256 = data => createHash('sha256').update(data).digest('hex');
const image = async kind => readFile(join(root, 'public/v7/images/need',
  id + (kind === 'CLEAN' ? '' : kind === 'TYPE' ? '-with-text-en' : '-thumbnail') + '.svg'));
const meta = async () => JSON.parse(await readFile(
  join(root, 'data/v7/visual-assets/records', id + '.json'), 'utf8'));

test('Lane X Rest is a real, 3-file candidate with measured integrity, never published', async () => {
  const [source, record] = await Promise.all([
    verifyV7ManualCandidate(root, id), meta()
  ]);
  assert.equal(source.technicalIntegrity, 'PASS');
  assert.equal(source.files.length, 3);
  assert.equal(source.publicationApproval,
    'NOT APPROVED: manual candidate remains excluded from release manifest');
  assert.notEqual(record.status, 'production_ready');
  assert.equal(record.contentType, 'need');
  assert.equal(record.contentId, 'rest');
  assert.equal(record.qc.productionReady, false);
  for (const item of source.files) {
    assert.equal(item.sha256, record.variants.find(v => v.kind === item.kind).sha256);
  }
});

test('CLEAN and THUMB are standalone self-contained text-free SVG; TYPE contains ONLY approved words', async () => {
  const [clean, type, thumb] = await Promise.all(['CLEAN','TYPE','THUMB'].map(image));
  const unsafe = /<!DOCTYPE\b|<!ENTITY\b|<script\b|<foreignObject\b|<image\b|<iframe\b|<object\b|<embed\b|@import\b|@font-face\b|javascript:|data:image|\bon\w+\s*=|\b(?:xlink:)?href\s*=|\burl\s*\(\s*['"]?(?!#)/i;
  for (const svg of [clean, type, thumb]) {
    const s = svg.toString('utf8');
    assert(!unsafe.test(s), 'SVG must not include external resources or scripting');
    assert.equal((s.match(/<svg\b/g) || []).length, 1);
    assert(!/BibleQuest|https?:\/\//.test(s.replace('xmlns="http://www.w3.org/2000/svg"', '')), 'No logos or remote URLs');
  }
  for (const svg of [clean, thumb]) {
    const s = svg.toString('utf8');
    assert(!/<text\b|<tspan\b|<foreignObject\b/i.test(s), 'CLEAN/THUMB must not contain lettering');
  }
  const words = [...type.toString('utf8').matchAll(/<text\b[^>]*>([^<]+)<\/text>/gi)]
    .map(([, words]) => words.trim());
  assert.deepEqual(words, ['Rest', 'Matthew 11:28-30']);
  const need = LIBRARY_NEEDS.find(item => item.id === 'rest');
  assert.equal(words[0], need.labels.en);
  assert(need.scripture.includes(words[1]));
  assert.notEqual(sha256(clean), sha256(type));
  assert.notEqual(sha256(clean), sha256(thumb));
  assert.notEqual(sha256(type), sha256(thumb));
});

test('CLEAN / TYPE / THUMB aspect, safe-geometry and immutable metadata agree', async () => {
  const record = await meta();
  const byKind = Object.fromEntries(record.variants.map(v => [v.kind, v]));
  const declared = [
    ['CLEAN', 1024, 1280], ['TYPE', 1024, 1280], ['THUMB', 384, 480]
  ];
  for (const [kind, width, height] of declared) {
    const bytes = await image(kind), svg = bytes.toString('utf8'), variant = byKind[kind];
    assert.equal(variant.width, width);
    assert.equal(variant.height, height);
    assert.equal(variant.fileBytes, bytes.length);
    assert.equal(variant.sha256, sha256(bytes));
    assert(svg.includes('width="' + width + '" height="' + height + '"'));
    assert.equal(width / height, 4/5);
  }
  assert.equal(byKind.THUMB.crop.targetAspectRatio, '4:5');
  assert.equal(byKind.TYPE.embeddedWording.scriptureTextIncluded, false);
  assert.equal(record.wordingEvidence.sourcePath, 'src/features/library/emotion-taxonomy.js');
  assert.equal(record.qc.builtAppBrowserQA, 'pending');
});
