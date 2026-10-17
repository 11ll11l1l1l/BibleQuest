/**
 * Technical evidence for MANUALLY generated V7 three-file image candidates.
 * Does not add entries to the release registry or grant publication approval.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIBRARY_EMOTIONS, LIBRARY_NEEDS } from '../src/features/library/emotion-taxonomy.js';
import { candidateQuarantineReason } from './v7-visual-candidate-policy.mjs';

const DEFAULT_ROOT = fileURLToPath(new URL('../', import.meta.url));
const digest = data => createHash('sha256').update(data).digest('hex');
const blobSha = data => createHash('sha1')
  .update(Buffer.from('blob ' + data.length)).update(Buffer.from([0])).update(data).digest('hex');
const safeId = /^bqv7-(?:emotion|need)-[a-z0-9-]+-[0-9]{2,}$/;
const safePath = /^\/v7\/images\/(?:emotion|need)\/bqv7-[a-z0-9-]+\.(?:webp|png|svg)$/;

function imageDimensions(data, format) {
  if (format === 'png') {
    assert(data.length >= 24 && data.subarray(0, 8).toString('hex') === '89504e470d0a1a0a', 'Invalid PNG signature');
    return [data.readUInt32BE(16), data.readUInt32BE(20)];
  }
  if (format === 'svg') {
    const xml = data.toString('utf8');
    assert(/^<svg\s|^\s*<\?xml[^>]*>\s*<svg\s/i.test(xml), 'Invalid SVG root');
    assert(!/<!DOCTYPE\b|<!ENTITY\b|<script\b|<foreignObject\b|<\?xml-stylesheet\b|@font-face|@import|javascript:|\bon\w+\s*=/i.test(xml), 'Unsafe SVG content');
    for (const m of xml.matchAll(/\b(?:xlink:)?href\s*=\s*(["'])(.*?)\1/gi))
      assert(/^#[A-Za-z_][\w:.-]*$/.test(m[2].trim()), 'External SVG href');
    for (const m of xml.matchAll(/\burl\s*\(\s*(["']?)(.*?)\1\s*\)/gi))
      assert(/^#[A-Za-z_][\w:.-]*$/.test(m[2].trim()), 'External SVG URL');
    const head = xml.match(/<svg\s[^>]*>/i)?.[0] || '';
    const width = Number(head.match(/\bwidth=["'](\d+)(?:px)?["']/i)?.[1]);
    const height = Number(head.match(/\bheight=["'](\d+)(?:px)?["']/i)?.[1]);
    assert(width && height, 'SVG dimensions missing');
    return [width, height];
  }
  assert.equal(format, 'webp', 'Unsupported image format');
  assert(data.length > 20 && data.toString('ascii', 0, 4) === 'RIFF'
    && data.toString('ascii', 8, 12) === 'WEBP', 'Invalid WebP header');
  for (let i = 12; i + 8 <= data.length;) {
    const tag = data.toString('ascii', i, i + 4);
    const len = data.readUInt32LE(i + 4);
    const p = i + 8;
    assert(p + len <= data.length, 'Truncated WebP chunk');
    if (tag === 'VP8X' && len >= 10)
      return [1 + data.readUIntLE(p + 4, 3), 1 + data.readUIntLE(p + 7, 3)];
    if (tag === 'VP8L' && len >= 5 && data[p] === 0x2f)
      return [1 + (data[p + 1] | ((data[p + 2] & 63) << 8)),
        1 + ((data[p + 2] >> 6) | (data[p + 3] << 2) | ((data[p + 4] & 15) << 10))];
    if (tag === 'VP8 ' && len >= 10 && data[p + 3] === 0x9d
      && data[p + 4] === 1 && data[p + 5] === 0x2a)
      return [data.readUInt16LE(p + 6) & 16383, data.readUInt16LE(p + 8) & 16383];
    i = p + len + (len % 2);
  }
  throw new Error('WebP dimensions unavailable');
}

/**
 * Read a candidate directly from repository files; never trust a sidecar's
 * claim of hashed assets unless these bytes match independently.
 */
export async function verifyV7ManualCandidate(root = DEFAULT_ROOT, assetId) {
  assert(safeId.test(assetId), 'Invalid visual asset identity');
  const metadata = JSON.parse(await readFile(
    join(root, 'data/v7/visual-assets/records', assetId + '.json'), 'utf8'));
  assert.equal(metadata.assetId, assetId);
  const quarantine = candidateQuarantineReason(metadata);
  assert(!quarantine, 'Manual candidate quarantined: ' + quarantine);
  assert.equal(metadata.schemaVersion, 2, 'Three-variant candidates use schema V2');
  assert(['emotion', 'need'].includes(metadata.contentType), 'Unsupported candidate category');
  assert.equal(metadata.family, metadata.contentType);
  assert.equal(metadata.rights?.thirdPartyAsset, false, 'Unverified third-party art');
  assert(['generated', 'original_programmatic_vector', 'owned'].includes(metadata.rights?.sourceType),
    'Missing source provenance');
  assert(metadata.generation?.provider, 'Missing generation provenance');
  assert(metadata.accessibility?.altText?.trim(), 'Missing descriptive alt text');
  assert(Array.isArray(metadata.variants) && metadata.variants.length === 3,
    'CLEAN + TYPE + THUMB are all required');
  const byKind = new Map(metadata.variants.map(v => [v.kind, v]));
  assert.equal(byKind.size, 3, 'Variant kinds must not repeat');
  assert.deepEqual([...byKind.keys()].sort(), ['CLEAN', 'THUMB', 'TYPE']);
  const taxonomy = (metadata.contentType === 'emotion' ? LIBRARY_EMOTIONS : LIBRARY_NEEDS)
    .find(row => row.id === (metadata.canonicalEmotionId || metadata.canonicalNeedId || metadata.contentId));
  assert(taxonomy, 'Unknown canonical feeling or need');
  const wording = metadata.wordingEvidence;
  assert.equal(wording?.sourcePath, 'src/features/library/emotion-taxonomy.js');
  const taxonomyBytes = await readFile(join(root, wording.sourcePath));
  assert.equal(blobSha(taxonomyBytes), wording.sourceBlobSha, 'Stale taxonomy source revision');
  const type = byKind.get('TYPE');
  assert.equal(type.locale, 'en');
  assert.equal(wording.locale, 'en');
  assert.equal(wording.exactLabel, taxonomy.labels.en);
  assert.equal(type.embeddedWording?.label, taxonomy.labels.en);
  assert(taxonomy.scripture.includes(type.embeddedWording?.scriptureReference),
    'Unverified Scripture reference');
  assert.equal(type.embeddedWording?.scriptureTextIncluded, false,
    'Bible quotations need independent rights and text review');
  assert.equal(wording.reference, type.embeddedWording.scriptureReference,
    'Wording source/reference mismatch');

  const hashes = new Set();
  const paths = new Set();
  const files = [];
  for (const kind of ['CLEAN', 'TYPE', 'THUMB']) {
    const variant = byKind.get(kind);
    assert(safePath.test(variant.imagePath), 'Unsupported or external image path');
    assert(variant.imagePath.startsWith('/v7/images/' + metadata.family + '/' + assetId),
      'Mismatched image owner');
    assert(!paths.has(variant.imagePath), 'File reused for multiple variants');
    paths.add(variant.imagePath);
    const fullPath = resolve(root, 'public', variant.imagePath.slice(1));
    assert(fullPath.startsWith(resolve(root, 'public/v7/images') + '/'), 'Path escaped image root');
    const bytes = await readFile(fullPath);
    const format = variant.imagePath.split('.').pop();
    assert.equal(variant.format, format);
    assert.equal(variant.fileBytes, bytes.length, 'Measured file size disagrees: ' + kind);
    const actualHash = digest(bytes);
    assert.equal(variant.sha256, actualHash, 'SHA mismatch: ' + kind);
    assert(!hashes.has(actualHash), 'Different variants cannot alias the same bytes');
    hashes.add(actualHash);
    const [width, height] = imageDimensions(bytes, format);
    assert.equal(variant.width, width, 'Width mismatch: ' + kind);
    assert.equal(variant.height, height, 'Height mismatch: ' + kind);
    assert(variant.altText?.trim(), 'Variant missing alt text: ' + kind);
    if (kind === 'THUMB') assert(!variant.embeddedWording, 'THUMB must not bake in text');
    files.push({ kind, path: variant.imagePath, width, height, bytes: bytes.length, sha256: actualHash });
  }
  return {
    assetId, status: metadata.status,
    technicalIntegrity: 'PASS',
    files,
    publicationApproval: metadata.status === 'production_ready'
      ? 'requires independent release-registry audit'
      : 'NOT APPROVED: manual candidate remains excluded from release manifest',
    builtAppBrowserQA: metadata.qc?.builtAppBrowserQA || 'not_evidenced'
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const assetId = process.argv[2];
  try {
    console.log(JSON.stringify(await verifyV7ManualCandidate(DEFAULT_ROOT, assetId), null, 2));
  } catch (error) {
    console.error('V7 manual candidate FAILED: ' + error.message);
    process.exitCode = 1;
  }
}
