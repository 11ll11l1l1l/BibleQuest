import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const REQUIRED_QC = [
  'noBakedText', 'noLogo', 'anatomyAcceptable',
  'subjectReadableAtThumbnail', 'cropSafe',
  'matchesVisualSystem', 'duplicateChecked'
];
const IMAGE_FORMATS = new Set(['webp', 'png', 'jpg', 'jpeg']);
const REGIONS = new Set(['bottom', 'top', 'left', 'right', 'none']);
const CONTENT_TYPES = new Set(['emotion', 'devotional', 'book', 'past_teaching', 'hero']);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

function dimensions(buffer, format) {
  if (format === 'png') {
    if (buffer.length < 24 || buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a')
      throw new Error('not a valid PNG');
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (format === 'jpg' || format === 'jpeg') {
    if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) throw new Error('not a valid JPEG');
    let at = 2;
    while (at + 4 < buffer.length) {
      if (buffer[at++] !== 0xff) continue;
      let marker = buffer[at++];
      while (marker === 0xff && at < buffer.length) marker = buffer[at++];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) continue;
      if (at + 2 > buffer.length) break;
      const length = buffer.readUInt16BE(at);
      if (length < 2 || at + length > buffer.length) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        if (length < 7) break;
        return { width: buffer.readUInt16BE(at + 5), height: buffer.readUInt16BE(at + 3) };
      }
      at += length;
    }
    throw new Error('JPEG dimensions missing');
  }
  if (buffer.length < 20 || buffer.toString('ascii', 0, 4) !== 'RIFF'
    || buffer.toString('ascii', 8, 12) !== 'WEBP') throw new Error('not a valid WebP');
  let at = 12;
  while (at + 8 <= buffer.length) {
    const tag = buffer.toString('ascii', at, at + 4);
    const length = buffer.readUInt32LE(at + 4);
    const data = at + 8;
    if (data + length > buffer.length) throw new Error('truncated WebP chunk');
    if (tag === 'VP8X' && length >= 10) {
      return {
        width: 1 + buffer.readUIntLE(data + 4, 3),
        height: 1 + buffer.readUIntLE(data + 7, 3)
      };
    }
    if (tag === 'VP8L' && length >= 5 && buffer[data] === 0x2f) {
      return {
        width: 1 + (buffer[data + 1] | ((buffer[data + 2] & 0x3f) << 8)),
        height: 1 + ((buffer[data + 2] >> 6) | (buffer[data + 3] << 2) | ((buffer[data + 4] & 0x0f) << 10))
      };
    }
    if (tag === 'VP8 ' && length >= 10
      && buffer[data + 3] === 0x9d && buffer[data + 4] === 0x01 && buffer[data + 5] === 0x2a) {
      return {
        width: buffer.readUInt16LE(data + 6) & 0x3fff,
        height: buffer.readUInt16LE(data + 8) & 0x3fff
      };
    }
    at = data + length + (length % 2);
  }
  throw new Error('WebP dimensions missing');
}

export async function auditV7VisualAssets(root = DEFAULT_ROOT) {
  const recordsDir = join(root, 'data/v7/visual-assets/records');
  const queuesDir = join(root, 'data/v7/visual-assets/queues');
  const imagesDir = join(root, 'public/v7/images');
  const errors = [];
  const entries = [];
  const queueRows = [];
  const recordNames = (await readdir(recordsDir)).filter(name => name.endsWith('.json')).sort();

  for (const name of (await readdir(queuesDir)).filter(n => n.endsWith('.json')).sort()) {
    try {
      const queue = JSON.parse(await readFile(join(queuesDir, name), 'utf8'));
      if (queue.schemaVersion !== 1 || !Array.isArray(queue.initialQueue) || !queue.agentId)
        throw new Error('invalid queue schema');
      queueRows.push({ agentId: queue.agentId, assignments: queue.initialQueue });
    } catch (error) { errors.push(queuesDir + '/' + name + ': ' + error.message); }
  }
  const owners = new Map();
  for (const row of queueRows) {
    for (const concept of row.assignments) {
      if (owners.has(concept)) errors.push('duplicate emotion queue assignment: ' + concept);
      owners.set(concept, row.agentId);
    }
  }
  const ids = new Set();
  const seenPaths = new Set();
  const seenHashes = new Map();
  for (const name of recordNames) {
    try {
      const record = JSON.parse(await readFile(join(recordsDir, name), 'utf8'));
      const id = record.assetId;
      if (record.schemaVersion !== 1 || typeof id !== 'string'
        || !/^bqv7-[a-z0-9]+-[a-z0-9-]+-[0-9]{2,}$/.test(id)
        || name !== id + '.json') throw new Error('invalid ID or schema');
      if (ids.has(id)) throw new Error('duplicate asset ID');
      ids.add(id);
      if (record.status !== 'production_ready') continue;
      if (!record.family || !id.startsWith('bqv7-' + record.family + '-')) throw new Error('family/ID mismatch');
      if (!CONTENT_TYPES.has(record.contentType) || !record.contentId) throw new Error('unknown content type or missing content ID');
      if (!Array.isArray(record.usage) || !record.usage.length) throw new Error('missing usage');
      if (record.contentType === 'emotion') {
        if (record.family !== 'emotion' || record.visualRole !== 'emotion_tile'
          || !owners.has(record.contentId) || owners.get(record.contentId) !== record.agentId)
          throw new Error('emotion assignment does not match initial queue owner');
      }
      const imagePath = record.imagePath;
      const ext = typeof imagePath === 'string' ? imagePath.split('.').pop()?.toLowerCase() : null;
      if (!IMAGE_FORMATS.has(ext) || record.format !== ext
        || imagePath !== '/v7/images/' + record.family + '/' + id + '.' + ext)
        throw new Error('imagePath/format/ID mismatch');
      const imageFile = resolve(root, 'public' + imagePath);
      if (!imageFile.startsWith(imagesDir + sep)) throw new Error('image escapes public assets directory');
      if (seenPaths.has(imagePath)) throw new Error('duplicate imagePath');
      seenPaths.add(imagePath);
      if (!REGIONS.has(record.textSafeRegion)) throw new Error('invalid textSafeRegion');
      if (record.focalPoint && (record.focalPoint.x < 0 || record.focalPoint.x > 1
        || record.focalPoint.y < 0 || record.focalPoint.y > 1
        || !Number.isFinite(record.focalPoint.x) || !Number.isFinite(record.focalPoint.y)))
        throw new Error('focalPoint outside 0..1');
      if (record.accessibility?.decorative !== true
        && !String(record.accessibility?.altText || '').trim())
        throw new Error('missing alt text');
      if (!record.rights || !['generated', 'licensed', 'public_domain', 'owned'].includes(record.rights.sourceType))
        throw new Error('invalid rights source type');
      if (record.rights.sourceType === 'generated') {
        if (record.rights.thirdPartyAsset !== false || !record.generation?.provider)
          throw new Error('generated image provenance missing');
      } else if (!record.rights.evidenceUri && !record.rights.basis && !record.rights.notes) {
        throw new Error('non-generated image has no rights evidence');
      }
      for (const flag of REQUIRED_QC) if (record.qc?.[flag] !== true) throw new Error('QC failed: ' + flag);
      if (record.qc?.conceptAccurate === false) throw new Error('concept QC failed');
      const bytes = await readFile(imageFile);
      const actualHash = sha256(bytes);
      if (record.sha256 !== null && record.sha256 !== undefined
        && record.sha256.toLowerCase() !== actualHash) throw new Error('SHA-256 mismatch');
      if (record.fileBytes != null && record.fileBytes !== bytes.length) throw new Error('byte length mismatch');
      const { width, height } = dimensions(bytes, ext);
      if (width <= 0 || height <= 0) throw new Error('invalid dimensions');
      if ((record.width != null && record.width !== width)
        || (record.height != null && record.height !== height)) throw new Error('dimensions mismatch');
      if (record.family === 'emotion' && width !== height) throw new Error('emotion art must be square');
      if (seenHashes.has(actualHash)) throw new Error('duplicate image bytes: ' + seenHashes.get(actualHash));
      seenHashes.set(actualHash, id);
      // Every optional derivative is validated independently; the text-free master remains canonical.
      const derivatives = [];
      const variantIds = new Set();
      if (record.variants !== undefined && !Array.isArray(record.variants))
        throw new Error('variants must be an array');
      for (const variant of record.variants || []) {
        const kind = variant?.kind;
        const locale = kind === 'with_text' ? variant.locale : null;
        if (!['with_text', 'thumbnail'].includes(kind)) throw new Error('unknown visual variant kind');
        if (kind === 'with_text' && (!/^[a-z]{2,3}(?:-[a-z]{2})?$/i.test(String(locale || ''))
          || !String(variant.text || '').trim())) throw new Error('with_text variant missing locale or embedded text');
        const key = kind + ':' + (locale || '');
        if (variantIds.has(key)) throw new Error('duplicate visual variant: ' + key);
        variantIds.add(key);
        const path = variant.imagePath;
        const extension = typeof path === 'string' ? path.split('.').pop()?.toLowerCase() : null;
        const expectedSuffix = kind === 'thumbnail' ? '-thumbnail' : '-with-text-' + locale.toLowerCase();
        if (!IMAGE_FORMATS.has(extension) || variant.format !== extension
          || path !== '/v7/images/' + record.family + '/' + id + expectedSuffix + '.' + extension)
          throw new Error('variant path/format/ID mismatch');
        if (seenPaths.has(path)) throw new Error('duplicate variant path');
        const file = resolve(root, 'public' + path);
        if (!file.startsWith(imagesDir + sep)) throw new Error('variant escapes image directory');
        const data = await readFile(file);
        const hash = sha256(data);
        if (variant.sha256 !== hash || variant.fileBytes !== data.length)
          throw new Error('variant SHA-256 or bytes mismatch: ' + kind);
        const actual = dimensions(data, extension);
        if (variant.width !== actual.width || variant.height !== actual.height)
          throw new Error('variant dimensions mismatch: ' + kind);
        if (kind === 'thumbnail' && (actual.width > width || actual.height > height))
          throw new Error('thumbnail exceeds master dimensions');
        if (seenHashes.has(hash)) throw new Error('duplicate variant bytes: ' + seenHashes.get(hash));
        seenHashes.set(hash, id + ':' + key);
        seenPaths.add(path);
        derivatives.push({ kind, src: path, width: actual.width, height: actual.height,
          sha256: hash, ...(locale ? { locale, embeddedText: variant.text } : {}) });
      }
      entries.push({
        assetId: id, contentType: record.contentType, contentId: record.contentId,
        family: record.family, visualRole: record.visualRole, src: imagePath,
        width, height, sha256: actualHash,
        focalPoint: record.focalPoint || { x: 0.5, y: 0.5 },
        textSafeRegion: record.textSafeRegion,
        alt: record.accessibility?.decorative ? '' : record.accessibility.altText,
        decorative: record.accessibility?.decorative === true,
        rights: {
          sourceType: record.rights.sourceType,
          attribution: record.rights.attributionRequired ? (record.rights.attribution || '') : null
        },
        fallbackKey: record.fallbackKey || record.family,
        variants: derivatives
      });
    } catch (error) { errors.push(name + ': ' + error.message); }
  }
  async function scanImages(dir) {
    for (const item of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, item.name);
      if (item.isDirectory()) await scanImages(path);
      else if (item.isFile() && IMAGE_FORMATS.has(item.name.split('.').pop()?.toLowerCase())) {
        const publicPath = '/v7/images/' + path.slice(imagesDir.length + 1).split(sep).join('/');
        if (!seenPaths.has(publicPath)) errors.push('orphan or rejected image file: ' + publicPath);
      }
    }
  }
  await scanImages(imagesDir);
  entries.sort((a, b) => a.assetId.localeCompare(b.assetId, 'en'));
  const byContent = {};
  for (const entry of entries) {
    const key = entry.contentType + ':' + entry.contentId;
    (byContent[key] ||= []).push(entry.assetId);
  }
  const queues = queueRows.map(row => {
    const remaining = row.assignments.filter(concept => !byContent['emotion:' + concept]?.length);
    return {
      agentId: row.agentId, total: row.assignments.length,
      completed: row.assignments.length - remaining.length,
      next: remaining[0] || null, remaining
    };
  });
  const manifest = { schemaVersion: 1, assets: entries, byContent };
  return {
    status: errors.length ? 'FAIL' : 'PASS',
    counts: { productionReady: entries.length, emotionQueueTotal: owners.size,
      emotionQueueCompleted: owners.size - queues.reduce((n, q) => n + q.remaining.length, 0) },
    queues, errors, manifest
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const outputIndex = args.indexOf('--write');
  const output = outputIndex >= 0 ? args[outputIndex + 1] : null;
  if (outputIndex >= 0 && (!output || output.startsWith('--'))) {
    console.error('Usage: node scripts/v7-visual-assets-audit.mjs [--manifest] [--write <output-path>]');
    process.exit(2);
  }
  try {
    const result = await auditV7VisualAssets();
    if (result.status === 'PASS' && output) {
      await mkdir(dirname(resolve(output)), { recursive: true });
      await writeFile(resolve(output), JSON.stringify(result.manifest, null, 2) + '\n');
    }
    process.stdout.write(JSON.stringify(args.includes('--manifest') ? result : {
      status: result.status, counts: result.counts, queues: result.queues, errors: result.errors,
      output: result.status === 'PASS' ? (output || null) : null
    }, null, 2) + '\n');
    if (result.status !== 'PASS') process.exitCode = 1;
  } catch (error) { console.error('Visual asset audit failed:', error.message); process.exitCode = 1; }
}
