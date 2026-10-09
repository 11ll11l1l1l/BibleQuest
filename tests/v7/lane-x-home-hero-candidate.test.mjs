import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const id = 'bqv7-hero-home-01';
const imageDir = join(root, 'public/v7/images/hero');
const registry = join(root, 'data/v7/visual-assets/records', id + '.json');
const hash = data => createHash('sha256').update(data).digest('hex');
const load = async () => ({
  meta: JSON.parse(await readFile(registry, 'utf8')),
  clean: await readFile(join(imageDir, id + '.svg')),
  thumb: await readFile(join(imageDir, id + '-thumbnail.svg'))
});

test('Lane X Home hero remains an unpublished candidate and never fabricates TYPE', async () => {
  const {meta} = await load();
  assert.equal(meta.assetId, id);
  assert.equal(meta.family, 'hero');
  assert.equal(meta.contentType, 'hero');
  assert.equal(meta.contentId, 'home');
  assert.notEqual(meta.status, 'production_ready');
  assert.equal(meta.qc.artisticDirectionApproved, false);
  assert.equal(meta.qc.builtAppBrowserQA, 'not_performed');
  assert.deepEqual(meta.variants.map(v => v.kind), ['CLEAN', 'THUMB']);
  assert.equal(meta.accessibility.essentialLiveTextRequired, true);
});

test('Home images are two independent, hashed self-contained SVG bytes without text', async () => {
  const {meta,clean,thumb} = await load();
  assert.notEqual(hash(clean), hash(thumb));
  for (const [kind,bytes] of [['CLEAN',clean],['THUMB',thumb]]) {
    const variant = meta.variants.find(v => v.kind === kind);
    const svg = bytes.toString('utf8');
    assert.equal(bytes.length, variant.fileBytes);
    assert.equal(hash(bytes), variant.sha256);
    assert(svg.startsWith('<svg'), 'Standalone XML/SVG file required');
    assert(!/<text\b|<tspan\b|<image\b|<script\b|<foreignObject\b|<!DOCTYPE|<!ENTITY|@import|@font-face|javascript:|\bon\w+\s*=/i.test(svg));
    for (const match of svg.matchAll(/\b(?:xlink:)?href\s*=\s*(['"])(.*?)\1/g))
      assert(/^#[a-z_][\w:.-]*$/i.test(match[2]), 'External SVG resource is forbidden');
    for (const match of svg.matchAll(/\burl\s*\(\s*(['"]?)(.*?)\1\s*\)/g))
      assert(/^#[a-z_][\w:.-]*$/i.test(match[2]), 'CSS fragment resource must be internal');
  }
});

test('Home wide master and focal portrait crop have correct dimensions and remain QA-gated', async () => {
  const {meta,clean,thumb} = await load();
  assert.equal(meta.width, 1600);
  assert.equal(meta.height, 900);
  assert.equal(meta.width / meta.height, 16 / 9);
  assert.equal(meta.variants[1].width, 800);
  assert.equal(meta.variants[1].height, 1000);
  assert.equal(meta.variants[1].crop.outputAspectRatio, '4:5');
  assert(clean.toString('utf8').includes('width="1600" height="900"'));
  assert(thumb.toString('utf8').includes('width="800" height="1000"'));
  assert(meta.focalPoint.x >= 0 && meta.focalPoint.x <= 1);
  assert(meta.focalPoint.y >= 0 && meta.focalPoint.y <= 1);
  assert.equal(meta.qc.releaseCertification, 'not_claimed');
});
