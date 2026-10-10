import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIBRARY_EMOTIONS, LIBRARY_NEEDS } from '../src/features/library/emotion-taxonomy.js';
import { knownRejectedVisualReason } from './v7-visual-candidate-policy.mjs';

const DEFAULT_ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const REQUIRED_QC = [
  'noBakedText', 'noLogo', 'anatomyAcceptable',
  'subjectReadableAtThumbnail', 'cropSafe',
  'matchesVisualSystem', 'duplicateChecked'
];
const IMAGE_FORMATS = new Set(['webp', 'png', 'jpg', 'jpeg', 'svg']);
const REGIONS = new Set(['bottom', 'top', 'left', 'right', 'none']);
const CONTENT_TYPES = new Set(['emotion', 'need', 'devotional', 'book', 'past_teaching', 'hero']);
// Keep distinct artwork ownership deterministic without a second mutable queue file.
// This only allocates Needs AFTER the 30-feeling P0 queue; it does not publish artwork.
export const NEED_VISUAL_ASSIGNMENTS = Object.freeze(Object.fromEntries(
  LIBRARY_NEEDS.map((item, i) => [item.id, 'visual-agent-' + (i % 5 + 1)])
));
// Immutable bridge between the image-agent queues and the app's published 30-feeling taxonomy.
// Validate every queue assignment against this bridge before publishing any artwork.
export const EMOTION_QUEUE_CANONICAL = Object.freeze({
  anxiety_worry: 'anxious',
  fear: 'afraid',
  sadness: 'sad',
  grief_loss: 'grieving',
  loneliness: 'lonely',
  anger: 'angry',
  hurt_betrayal: 'hurt',
  rejection: 'rejected',
  guilt: 'guilty',
  shame: 'ashamed',
  insecurity_unworthiness: 'insecure',
  doubt: 'doubtful',
  confusion_uncertainty: 'confused',
  discouragement: 'discouraged',
  hopelessness: 'hopeless',
  overwhelm: 'overwhelmed',
  stress: 'stressed',
  tiredness_weariness: 'tired',
  spiritual_dryness_distance: 'spiritually_dry',
  temptation: 'tempted',
  impatience_waiting: 'impatient',
  jealousy_envy: 'jealous',
  frustration: 'frustrated',
  numbness_emptiness: 'numb',
  joy: 'joyful',
  gratitude: 'grateful',
  peace_contentment: 'peaceful',
  hope: 'hopeful',
  excitement: 'excited',
  love_connection: 'connected',
});
const EMOTION_BY_CANONICAL = new Map(LIBRARY_EMOTIONS.map(item => [item.id, item]));
if (Object.keys(EMOTION_QUEUE_CANONICAL).length !== LIBRARY_EMOTIONS.length
  || new Set(Object.values(EMOTION_QUEUE_CANONICAL)).size !== LIBRARY_EMOTIONS.length
  || Object.values(EMOTION_QUEUE_CANONICAL).some(id => !EMOTION_BY_CANONICAL.has(id)))
  throw new Error('V7 visual queue mapping is out of sync with emotion-taxonomy.js');

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const gitBlobSha = bytes => createHash('sha1')
  .update(Buffer.from('blob ' + bytes.length)).update(Buffer.from([0])).update(bytes).digest('hex');

async function verifyV2Wording(record, variant, root) {
  if (!['emotion', 'need'].includes(record.contentType))
    throw new Error('V2 TYPE needs a verified content-specific title source');
  // V2 TYPE can have independently reviewed lettering for each locale.
  // A locale map, when present, is authoritative: never borrow EN evidence for
  // missing TL/CEB/ILO art. Older single-locale sidecars remain compatible.
  const byLocale = record.wordingEvidenceByLocale;
  if (byLocale !== undefined && (!byLocale || typeof byLocale !== 'object'
    || Array.isArray(byLocale)))
    throw new Error('TYPE per-locale wording evidence must be an object');
  const proof = byLocale === undefined
    ? record.wordingEvidence : byLocale[variant.locale];
  if (!proof || proof.sourcePath !== 'src/features/library/emotion-taxonomy.js')
    throw new Error('TYPE wording source missing or unsupported');
  const bytes = await readFile(join(root, proof.sourcePath));
  if (gitBlobSha(bytes) !== proof.sourceBlobSha)
    throw new Error('TYPE taxonomy source revision changed');
  const isNeed = record.contentType === 'need';
  const key = isNeed ? 'canonicalNeedId' : 'canonicalEmotionId';
  const item = (isNeed ? LIBRARY_NEEDS : LIBRARY_EMOTIONS)
    .find(row => row.id === record[key]);
  if (!item || proof[key] !== item.id || !item.labels[variant.locale])
    throw new Error('TYPE content ID or locale cannot be resolved');
  const words = variant.embeddedWording;
  if (!words || proof.locale !== variant.locale || proof.exactLabel !== item.labels[variant.locale]
    || words.label !== proof.exactLabel || words.scriptureReference !== proof.reference)
    throw new Error('TYPE embedded wording does not match reviewed taxonomy');
  if (proof.reference && !item.scripture.includes(proof.reference))
    throw new Error('TYPE Scripture reference is not approved for emotion');
  if (proof.scriptureTextIncluded !== false || words.scriptureTextIncluded !== false)
    throw new Error('TYPE Scripture prose requires a separately verified text-source contract');
  if (variant.qa?.spellingCheckedAgainstTaxonomy !== true
    || variant.qa?.typeReadableAt320px !== true || variant.qa?.visualInspected !== true)
    throw new Error('TYPE typography review evidence is incomplete');
}


function dimensions(buffer, format) {
  if (format === 'svg') {
    const xml = buffer.toString('utf8');
    // SVG is served from the app origin. A syntactically valid document may
    // still import attacker-controlled fonts/images or XML entities. Release
    // artwork must be self-contained; only local fragment references are safe.
    const unsafeMarkup = /<!DOCTYPE\b|<!ENTITY\b|<\?xml-stylesheet\b|<script\b|<foreignObject\b|<iframe\b|<object\b|<embed\b|\bon\w+\s*=|javascript:|@import\b|@font-face\b/i;
    const hrefs = [...xml.matchAll(/\b(?:xlink:)?href\s*=\s*(["'])(.*?)\1/gi)];
    const urls = [...xml.matchAll(/\burl\s*\(\s*(["']?)(.*?)\1\s*\)/gi)];
    const internalFragment = target => /^#[A-Za-z_][\w:.-]*$/.test(target.trim());
    if (!/^\s*(?:<\?xml[^>]*>\s*)?<svg\s/i.test(xml)
      || unsafeMarkup.test(xml)
      || hrefs.some(([, , target]) => !internalFragment(target))
      || urls.some(([, , target]) => !internalFragment(target)))
      throw new Error('unsafe or unrecognized SVG');
    const opening = xml.match(/<svg\s[^>]*>/i)?.[0] || '';
    const width = Number(opening.match(/\bwidth=["'](\d+)(?:px)?["']/i)?.[1]);
    const height = Number(opening.match(/\bheight=["'](\d+)(?:px)?["']/i)?.[1]);
    if (!width || !height) throw new Error('SVG pixel dimensions missing');
    return { width, height };
  }
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
  const warnings = [];
  const entries = [];
  const queueRows = [];
  const candidatePaths = new Set();
  const nonProductionRecords = [];
  const derivativeCandidateRecords = [];
  const recordNames = (await readdir(recordsDir)).filter(name => name.endsWith('.json')).sort();
  const masterNames = new Set(recordNames.filter(name => !name.endsWith('-derivatives.json')));
  const candidatePath = path => {
    if (typeof path === 'string'
      && /^\/v7\/images\/[a-z_]+\/bqv7-[a-z0-9-]+\.(?:webp|png|jpg|jpeg|svg)$/.test(path))
      candidatePaths.add(path);
  };

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
  for (const [queueId, canonicalId] of Object.entries(EMOTION_QUEUE_CANONICAL))
    if (!owners.has(queueId) || !EMOTION_BY_CANONICAL.has(canonicalId))
      errors.push('Missing or unrecognized initial emotion queue entry: ' + queueId);
  for (const queueId of owners.keys())
    if (!Object.hasOwn(EMOTION_QUEUE_CANONICAL, queueId))
      errors.push('Unknown initial emotion queue entry: ' + queueId);
  const ids = new Set();
  const seenPaths = new Set();
  const seenHashes = new Map();
  for (const name of recordNames) {
    try {
      const record = JSON.parse(await readFile(join(recordsDir, name), 'utf8'));
      if (name.endsWith('-derivatives.json')) {
        const parentId = record.sourceMasterAssetId || record.parentAssetId
          || name.slice(0, -'-derivatives.json'.length);
        if (record.schemaVersion !== 2 || !masterNames.has(parentId + '.json')
          || !Array.isArray(record.variants))
          throw new Error('orphan or invalid derivative sidecar');
        for (const variant of record.variants) {
          if (variant.kind !== 'CLEAN')
            candidatePath(String(variant.imagePath || '').replace(/^\/public(?=\/v7\/images\/)/, ''));
        }
        derivativeCandidateRecords.push(name);
        warnings.push(name + ': candidate derivatives await independent release QA');
        continue;
      }
      const id = record.assetId;
      if (![1, 2].includes(record.schemaVersion) || typeof id !== 'string'
        || !/^bqv7-[a-z0-9]+-[a-z0-9-]+-[0-9]{2,}$/.test(id)
        || name !== id + '.json') throw new Error('invalid ID or schema');
      if (ids.has(id)) throw new Error('duplicate asset ID');
      ids.add(id);
      if (record.status !== 'production_ready') {
        nonProductionRecords.push({ assetId: id, status: String(record.status || 'unknown') });
        candidatePath(record.imagePath);
        for (const variant of record.variants || []) candidatePath(variant.imagePath);
        warnings.push(name + ': excluded non-production status ' + record.status);
        continue;
      }
      // Image producers may mark a record ready only after the editorial denylist
      // is cleared by replacing rejected bytes, not by flipping QA booleans.
      const quarantined = knownRejectedVisualReason(record);
      if (quarantined) throw new Error('production visual quarantined: ' + quarantined);
      if (!record.family || !id.startsWith('bqv7-' + record.family + '-')) throw new Error('family/ID mismatch');
      if (!CONTENT_TYPES.has(record.contentType) || !record.contentId) throw new Error('unknown content type or missing content ID');
      if (!Array.isArray(record.usage) || !record.usage.length) throw new Error('missing usage');
      let queueConcept = null;
      let canonicalContentId = record.contentId;
      if (record.contentType === 'emotion') {
        // V1 masters use queue IDs; newer V2 producers may use the app's canonical
        // ID and provide the original queue concept separately.
        queueConcept = record.queueConcept || record.contentId;
        if (!Object.hasOwn(EMOTION_QUEUE_CANONICAL, queueConcept)) {
          const matches = Object.entries(EMOTION_QUEUE_CANONICAL)
            .filter(([, id]) => id === record.contentId);
          if (matches.length === 1) queueConcept = matches[0][0];
        }
        canonicalContentId = EMOTION_QUEUE_CANONICAL[queueConcept];
        if (!canonicalContentId || (record.contentId !== queueConcept
          && record.contentId !== canonicalContentId)
          || (record.canonicalEmotionId && record.canonicalEmotionId !== canonicalContentId)
          || (record.canonicalContentId && record.canonicalContentId !== canonicalContentId)
          || record.family !== 'emotion' || record.visualRole !== 'emotion_tile'
          || owners.get(queueConcept) !== record.agentId)
          throw new Error('emotion queue/canonical ID/agent ownership mismatch');
      } else if (record.contentType === 'need') {
        // Needs use their own canonical IDs, not visual-agent emotion queue aliases.
        canonicalContentId = record.contentId;
        if (!Object.hasOwn(NEED_VISUAL_ASSIGNMENTS, canonicalContentId)
          || record.family !== 'need' || record.visualRole !== 'need_tile'
          || (record.canonicalNeedId && record.canonicalNeedId !== canonicalContentId)
          || (record.canonicalContentId && record.canonicalContentId !== canonicalContentId)
          || NEED_VISUAL_ASSIGNMENTS[canonicalContentId] !== record.agentId)
          throw new Error('need taxonomy ID/agent ownership mismatch');
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
      const inferredGenerated = record.schemaVersion === 1
        && record.generation?.provider === 'OpenAI image generation'
        && /^OpenAI-generated original scene/.test(String(record.rights?.image || ''));
      const sourceType = record.rights?.sourceType || (inferredGenerated ? 'generated' : null);
      if (!['generated', 'licensed', 'public_domain', 'owned'].includes(sourceType))
        throw new Error('invalid rights source type');
      if (inferredGenerated)
        warnings.push(name + ': normalize legacy generated rights.sourceType in source record');
      if (sourceType === 'generated') {
        if ((record.rights.thirdPartyAsset !== false && !(inferredGenerated && record.rights.thirdPartyCover === false))
          || !record.generation?.provider)
          throw new Error('generated image provenance missing');
      } else if (!record.rights.evidenceUri && !record.rights.basis && !record.rights.notes) {
        throw new Error('non-generated image has no rights evidence');
      }
      if (record.schemaVersion === 1) {
        for (const flag of REQUIRED_QC) if (record.qc?.[flag] !== true) throw new Error('QC failed: ' + flag);
        if (record.qc?.conceptAccurate === false) throw new Error('concept QC failed');
      } else if (record.qc?.allThreeLocalWebPDecodingAndSHA256Verified !== true
        || record.qc?.localTypeAndThumbnailInspected !== true) {
        throw new Error('V2 bundle inspection and hash QC missing');
      }
      const bytes = await readFile(imageFile);
      const actualHash = sha256(bytes);
      if (!/^[a-f0-9]{64}$/.test(String(record.sha256 || '')) || record.sha256 !== actualHash)
        throw new Error('SHA-256 mismatch');
      if (!Number.isInteger(record.fileBytes) || record.fileBytes !== bytes.length)
        throw new Error('byte length mismatch');
      const { width, height } = dimensions(bytes, ext);
      if (width <= 0 || height <= 0) throw new Error('invalid dimensions');
      if (record.width !== width || record.height !== height) throw new Error('dimensions mismatch');
      if (record.family === 'emotion' && width !== height) throw new Error('emotion art must be square');
      if (seenHashes.has(actualHash)) throw new Error('duplicate image bytes: ' + seenHashes.get(actualHash));
      seenHashes.set(actualHash, id);
      // Every optional derivative is validated independently; the text-free master remains canonical.
      const derivatives = [];
      const variantIds = new Set();
      if (record.variants !== undefined && !Array.isArray(record.variants))
        throw new Error('variants must be an array');
      // Early V1 producers embedded draft V2-style derivatives without reviewed
      // typography source bindings. Preserve their clean master but quarantine TYPE
      // and THUMB until the producer completes the canonical QA/evidence contract.
      const quarantineLegacyVariants = record.schemaVersion === 1
        && (record.variants || []).some(v => ['CLEAN', 'TYPE', 'THUMB'].includes(v.kind));
      if (quarantineLegacyVariants) {
        for (const variant of record.variants) if (variant.kind !== 'CLEAN') candidatePath(variant.imagePath);
        warnings.push(name + ': legacy bundled derivative typography awaits source-linked QA');
      }
      const v2Kinds = new Set();
      for (const variant of quarantineLegacyVariants ? [] : record.variants || []) {
        const rawKind = variant?.kind;
        const kind = rawKind === 'TYPE' ? 'with_text' :
          rawKind === 'THUMB' ? 'thumbnail' :
          rawKind === 'CLEAN' ? 'clean' : rawKind;
        const locale = kind === 'with_text' ? variant.locale : null;
        if (!['with_text', 'thumbnail', 'clean'].includes(kind))
          throw new Error('unknown visual variant kind');
        if (kind === 'clean' && record.schemaVersion !== 2)
          throw new Error('CLEAN variant only valid for V2');
        if (kind === 'with_text' && !/^[a-z]{2,3}(?:-[a-z]{2})?$/i.test(String(locale || '')))
          throw new Error('TYPE locale missing or invalid');
        if (kind === 'with_text' && record.schemaVersion === 1 && !String(variant.text || '').trim())
          throw new Error('with_text variant missing embedded text');
        const key = kind + ':' + (locale || '');
        if (variantIds.has(key)) throw new Error('duplicate visual variant: ' + key);
        variantIds.add(key);
        v2Kinds.add(kind);
        const path = variant.imagePath;
        const extension = typeof path === 'string' ? path.split('.').pop()?.toLowerCase() : null;
        const expectedSuffix = kind === 'clean' ? '' :
          kind === 'thumbnail' ? '-thumbnail' : '-with-text-' + locale.toLowerCase();
        if (!IMAGE_FORMATS.has(extension) || variant.format !== extension
          || path !== '/v7/images/' + record.family + '/' + id + expectedSuffix + '.' + extension)
          throw new Error('variant path/format/ID mismatch');
        if (kind === 'clean') {
          if (path !== imagePath || variant.sha256 !== actualHash
            || variant.fileBytes !== bytes.length || variant.width !== width || variant.height !== height)
            throw new Error('CLEAN metadata does not match canonical master');
          const qa = variant.qa || {};
          for (const flag of ['imageDecoded', 'dimensionsMeasured', 'sha256Measured', 'visualInspected',
            'anatomyAcceptable', 'noBakedText', 'cropReviewed'])
            if (qa[flag] !== true) throw new Error('CLEAN QA failed: ' + flag);
          continue; // CLEAN is the master, not another binary.
        }
        if (seenPaths.has(path)) throw new Error('duplicate variant path');
        const file = resolve(root, 'public' + path);
        if (!file.startsWith(imagesDir + sep)) throw new Error('variant escapes image directory');
        const data = await readFile(file);
        const hash = sha256(data);
        if (!/^[a-f0-9]{64}$/.test(String(variant.sha256 || ''))
          || variant.sha256 !== hash || variant.fileBytes !== data.length)
          throw new Error('variant SHA-256 or bytes mismatch: ' + kind);
        const actual = dimensions(data, extension);
        if (variant.width !== actual.width || variant.height !== actual.height)
          throw new Error('variant dimensions mismatch: ' + kind);
        if (kind === 'thumbnail' && (actual.width > width || actual.height > height))
          throw new Error('thumbnail exceeds master dimensions');
        if (record.schemaVersion === 2) {
          for (const flag of ['imageDecoded', 'dimensionsMeasured', 'sha256Measured', 'visualInspected'])
            if (variant.qa?.[flag] !== true) throw new Error(kind + ' QA failed: ' + flag);
          if (kind === 'thumbnail' && (variant.qa?.noBakedText !== true
            || variant.qa?.subjectReadableAtThumbnail !== true
            || variant.qa?.cropReviewed !== true))
            throw new Error('THUMB crop/thumbnail QA failed');
          if (kind === 'with_text') await verifyV2Wording(record, variant, root);
        }
        if (seenHashes.has(hash)) throw new Error('duplicate variant bytes: ' + seenHashes.get(hash));
        seenHashes.set(hash, id + ':' + key);
        seenPaths.add(path);
        const embeddedText = kind === 'with_text'
          ? (record.schemaVersion === 2 ? variant.embeddedWording.label : variant.text)
          : undefined;
        derivatives.push({ kind, src: path, width: actual.width, height: actual.height,
          sha256: hash, ...(locale ? { locale, embeddedText } : {}) });
      }
      const completeBundle = v2Kinds.has('with_text') && v2Kinds.has('thumbnail')
        && (record.schemaVersion === 1 || v2Kinds.has('clean'));
      if (record.schemaVersion === 2
        && (record.bundleStatus === 'complete_three_real_files') !== completeBundle)
        throw new Error('V2 bundleStatus disagrees with verified files');
      entries.push({
        assetId: id, contentType: record.contentType, contentId: record.contentId,
        family: record.family, visualRole: record.visualRole, src: imagePath,
        width, height, sha256: actualHash,
        focalPoint: record.focalPoint || { x: 0.5, y: 0.5 },
        textSafeRegion: record.textSafeRegion,
        alt: record.accessibility?.decorative ? '' : record.accessibility.altText,
        decorative: record.accessibility?.decorative === true,
        rights: {
          sourceType,
          attribution: record.rights.attributionRequired ? (record.rights.attribution || '') : null
        },
        fallbackKey: record.fallbackKey || record.family,
        canonicalContentId, ...(queueConcept ? { queueConcept } : {}),
        bundleStatus: completeBundle ? 'complete' : 'partial',
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
        if (!seenPaths.has(publicPath) && !candidatePaths.has(publicPath))
          errors.push('orphan or rejected image file: ' + publicPath);
      }
    }
  }
  await scanImages(imagesDir);
  entries.sort((a, b) => a.assetId.localeCompare(b.assetId, 'en'));
  const byContent = {};
  for (const entry of entries) {
    const key = entry.contentType + ':' + entry.contentId;
    (byContent[key] ||= []).push(entry.assetId);
    if (entry.contentType === 'emotion') {
      for (const alias of [entry.canonicalContentId, entry.queueConcept])
        if (alias && alias !== entry.contentId) {
          const values = (byContent['emotion:' + alias] ||= []);
          if (!values.includes(entry.assetId)) values.push(entry.assetId);
        }
    }
  }
  // Count concepts, not image files. A verified CLEAN master is useful for
  // live localized fallback but is NOT a verified three-file bundle.
  // Candidate records are declared-only: their referenced bytes are excluded.
  const emotionMasters = new Set(entries.filter(e => e.contentType === 'emotion')
    .map(e => e.canonicalContentId));
  const emotionBundles = new Set(entries.filter(e => e.contentType === 'emotion'
    && e.bundleStatus === 'complete').map(e => e.canonicalContentId));
  const needMasters = new Set(entries.filter(e => e.contentType === 'need')
    .map(e => e.canonicalContentId));
  const needBundles = new Set(entries.filter(e => e.contentType === 'need'
    && e.bundleStatus === 'complete').map(e => e.canonicalContentId));
  const queueConceptBundles = new Set(entries.filter(e => e.contentType === 'emotion'
    && e.bundleStatus === 'complete').map(e => e.queueConcept));
  const coverage = {
    emotions: {
      total: LIBRARY_EMOTIONS.length,
      verifiedCleanMasterConcepts: emotionMasters.size,
      verifiedCompleteBundleConcepts: emotionBundles.size,
      missingCleanMasters: LIBRARY_EMOTIONS.map(e => e.id).filter(id => !emotionMasters.has(id)),
      missingCompleteBundles: LIBRARY_EMOTIONS.map(e => e.id).filter(id => !emotionBundles.has(id))
    },
    needs: {
      total: LIBRARY_NEEDS.length,
      verifiedCleanMasterConcepts: needMasters.size,
      verifiedCompleteBundleConcepts: needBundles.size,
      missingCleanMasters: LIBRARY_NEEDS.map(e => e.id).filter(id => !needMasters.has(id)),
      missingCompleteBundles: LIBRARY_NEEDS.map(e => e.id).filter(id => !needBundles.has(id))
    },
    // Neither group is a production-ready count, even when asset paths exist.
    unapprovedRecordClaims: nonProductionRecords,
    candidateDerivativeSidecars: derivativeCandidateRecords
  };
  const queues = queueRows.map(row => {
    const remaining = row.assignments.filter(concept => !byContent['emotion:' + concept]?.length);
    const bundleRemaining = row.assignments.filter(concept => !queueConceptBundles.has(concept));
    return {
      agentId: row.agentId, total: row.assignments.length,
      completed: row.assignments.length - remaining.length,
      next: remaining[0] || null, remaining,
      completeBundles: row.assignments.length - bundleRemaining.length,
      nextIncompleteBundle: bundleRemaining[0] || null,
      incompleteBundles: bundleRemaining
    };
  });
  const manifest = { schemaVersion: 1, assets: entries, byContent };
  return {
    status: errors.length ? 'FAIL' : 'PASS',
    counts: { productionReady: entries.length,
      completeBundles: entries.filter(entry => entry.bundleStatus === 'complete').length,
      partialBundles: entries.filter(entry => entry.bundleStatus === 'partial').length,
      emotionQueueTotal: owners.size,
      emotionQueueCompleted: owners.size - queues.reduce((n, q) => n + q.remaining.length, 0),
      emotionCompleteBundleConcepts: emotionBundles.size,
      needQueueTotal: LIBRARY_NEEDS.length,
      needMastersVerified: needMasters.size,
      needCompleteBundleConcepts: needBundles.size,
      unapprovedRecordClaims: nonProductionRecords.length,
      candidateDerivativeSidecars: derivativeCandidateRecords.length },
    coverage, queues, warnings, errors, manifest
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
      status: result.status, counts: result.counts, coverage: result.coverage, queues: result.queues,
      warnings: result.warnings, errors: result.errors,
      output: result.status === 'PASS' ? (output || null) : null
    }, null, 2) + '\n');
    if (result.status !== 'PASS') process.exitCode = 1;
  } catch (error) { console.error('Visual asset audit failed:', error.message); process.exitCode = 1; }
}
