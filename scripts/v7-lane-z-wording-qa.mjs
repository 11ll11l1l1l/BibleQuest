import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIBRARY_EMOTIONS, LIBRARY_NEEDS } from '../src/features/library/emotion-taxonomy.js';
import { EMOTION_QUEUE_CANONICAL } from './v7-visual-assets-audit.mjs';

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const RECORDS = 'data/v7/visual-assets/records';
const SOURCE = 'src/features/library/emotion-taxonomy.js';
const ID = /^bqv7-[a-z0-9-]+$/;
const hashGitBlob = bytes => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const str = value => typeof value === 'string' ? value.trim() : '';
const isType = kind => ['TYPE', 'with_text'].includes(kind);

// Checks metadata only. Pixel legibility, Bible quotation text, rights and contextual
// theology require independent review; this audit never implies their approval.
export function validateTypeWording(master, sidecar, variant, sourceBlobSha) {
  const failures = [], pending = [];
  const family = master.contentType;
  const canonicalId = family === 'emotion'
    ? (master.canonicalEmotionId || EMOTION_QUEUE_CANONICAL[master.queueConcept || master.contentId] || master.contentId)
    : (master.canonicalNeedId || master.contentId);
  const item = (family === 'emotion' ? LIBRARY_EMOTIONS : family === 'need' ? LIBRARY_NEEDS : [])
    .find(entry => entry.id === canonicalId);
  if (!item) pending.push(`unknown taxonomy item ${family}:${canonicalId}`);
  const locale = str(variant.locale);
  const label = str(variant.embeddedWording?.label) || str(variant.includedWording)
    || (typeof variant.text === 'string' ? str(variant.text) : '');
  const proof = variant.wordingEvidence || sidecar.wordingEvidence || master.wordingEvidence;
  const reference = str(variant.embeddedWording?.scriptureReference)
    || str(variant.includedReference) || str(variant.scriptureReference)
    || str(proof?.reference);
  if (!locale || !item?.labels?.[locale]) failures.push(`unsupported TYPE locale ${locale || '(missing)'}`);
  if (!label) pending.push('TYPE label not captured in structured metadata');
  else if (item?.labels?.[locale] && label !== item.labels[locale]) {
    failures.push(`TYPE label ${JSON.stringify(label)} differs from canonical ${JSON.stringify(item.labels[locale])}`);
  }
  if (reference && item && !item.scripture.includes(reference)) failures.push(`unapproved taxonomy reference ${reference}`);
  if (proof) {
    if (proof.sourcePath !== SOURCE || proof.sourceBlobSha !== sourceBlobSha) {
      pending.push('wording proof source SHA/path missing or stale');
    }
    if (proof.exactLabel && label && proof.exactLabel !== label) failures.push('TYPE label disagrees with wording proof');
    if (proof.reference && reference && proof.reference !== reference) failures.push('TYPE reference disagrees with wording proof');
    const proofId = family === 'emotion' ? proof.canonicalEmotionId : proof.canonicalNeedId;
    if (proofId && proofId !== canonicalId) failures.push('TYPE proof references a different taxonomy concept');
  } else pending.push('no revision-pinned structured wording proof');
  if (variant.embeddedWording?.scriptureTextIncluded === true
    || variant.scriptureQuoteIncluded === true || str(variant.scriptureText)) {
    pending.push('Bible quotation requires separate exact-edition and context verification');
  }
  if (variant.qa?.visualInspected !== true && variant.qa?.typeReadableAt320px !== true) {
    pending.push('rendered TYPE text not independently certified at 320px');
  }
  return { canonicalId, locale, label, reference, failures, pending };
}

export async function auditV7LaneZWording(root = ROOT) {
  const directory = join(root, RECORDS);
  const sourceSha = hashGitBlob(await readFile(join(root, SOURCE)));
  const names = (await readdir(directory)).filter(name => name.endsWith('.json')).sort();
  const rows = new Map();
  const errors = [], items = [];
  for (const name of names) {
    const record = JSON.parse(await readFile(join(directory, name), 'utf8'));
    rows.set(name, record);
  }
  for (const [name, record] of rows) {
    const derivative = name.endsWith('-derivatives.json');
    const masterId = derivative ? record.sourceMasterAssetId : record.assetId;
    if (!ID.test(masterId || '')) {
      errors.push(`${name}: invalid master asset id`);
      continue;
    }
    const master = derivative ? rows.get(`${masterId}.json`) : record;
    if (!master) {
      errors.push(`${name}: missing source master ${masterId}`);
      continue;
    }
    for (const [index, variant] of (record.variants || []).entries()) {
      if (!isType(variant.kind)) continue;
      const result = validateTypeWording(master, record, variant, sourceSha);
      // Derivative sidecars remain candidates even when a separate CLEAN master is published.
      const published = !derivative && record.status === 'production_ready';
      items.push({ assetId: masterId, record: name, variantIndex: index,
        imagePath: variant.imagePath, published, ...result });
      if (published) errors.push(...result.failures.map(message => `${name}: ${message}`));
    }
  }
  const candidateFailures = items.filter(item => !item.published).flatMap(item =>
    item.failures.map(message => `${item.record}: ${message}`));
  const pending = items.flatMap(item => item.pending.map(message => `${item.record}: ${message}`));
  return {
    status: errors.length ? 'BLOCKED' : candidateFailures.length || pending.length ? 'NEEDS_REVIEW' : 'PASS',
    counts: { records: names.length, typeVariants: items.length,
      published: items.filter(i => i.published).length,
      candidateFailures: candidateFailures.length, pending: pending.length },
    errors, candidateFailures, pending, items
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await auditV7LaneZWording();
  console.log(JSON.stringify(report, null, 2));
  // Default mode blocks only published bad metadata; --strict also blocks bad candidates.
  if (report.errors.length || (process.argv.includes('--strict') && report.candidateFailures.length)) process.exitCode = 1;
}
