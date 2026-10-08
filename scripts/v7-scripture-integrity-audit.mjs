import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const REVIEW_DIR = 'data/v7/scripture-reviews';
const RECORD_DIR = 'data/v7/visual-assets/records';
const ALLOWED = new Set(['reference_only','scripture_quote','paraphrase','non_scripture_text']);
const SHA = /^[a-f0-9]{64}$/i;
const nonempty = x => typeof x === 'string' && x.trim().length > 0;

export function checkScriptureReview(row) {
  const errors = [];
  if (!row || typeof row !== 'object' || Array.isArray(row)) return ['review must be an object'];
  if (row.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (!nonempty(row.contentPath) || row.contentPath.includes('..') || row.contentPath.startsWith('/')) errors.push('invalid contentPath');
  if (!nonempty(row.locale)) errors.push('locale missing');
  if (!ALLOWED.has(row.displayKind)) errors.push('invalid displayKind');
  if (!['pending','failed','approved'].includes(row.status)) errors.push('invalid status');
  if (row.status !== 'approved') return errors;
  for (const field of ['referenceVerified','contextVerified','applicationVerified']) {
    if (row[field] !== true) errors.push(field + ' must be true');
  }
  if (!nonempty(row.reviewer) || !nonempty(row.reviewedAt) || Number.isNaN(Date.parse(row.reviewedAt))) errors.push('reviewer and valid reviewedAt required');
  if (!nonempty(row.contextNotes) || !nonempty(row.textSource)) errors.push('contextNotes and textSource required');
  if (row.displayKind === 'scripture_quote') {
    if (!nonempty(row.translation) || !nonempty(row.reference) || !nonempty(row.displayedWords)) errors.push('quote translation/reference/words missing');
    if (!nonempty(row.licenseEvidence) || row.exactTextVerified !== true) errors.push('quote licensing or exact-text evidence missing');
  }
  if (row.displayKind === 'reference_only' && !nonempty(row.reference)) errors.push('reference missing');
  if (row.assetId) {
    if (!SHA.test(row.imageSha256 || '')) errors.push('imageSha256 required for image review');
    if (row.renderedTextVerifiedAt320px !== true) errors.push('rendered image text review required');
  }
  return errors;
}

export async function auditScriptureReviews(root = ROOT) {
  const errors = [], pending = [], approved = [], covered = new Set();
  let filenames = [];
  try { filenames = (await readdir(join(root, REVIEW_DIR))).filter(x => x.endsWith('.json')).sort(); }
  catch (e) { if (e.code !== 'ENOENT') throw e; }
  for (const name of filenames) {
    try {
      const row = JSON.parse(await readFile(join(root, REVIEW_DIR, name), 'utf8'));
      const problems = checkScriptureReview(row);
      for (const problem of problems) errors.push(name + ': ' + problem);
      if (row.assetId) {
        if (covered.has(row.assetId)) errors.push(name + ': duplicate asset review');
        covered.add(row.assetId);
        if (row.status === 'approved') {
          const asset = JSON.parse(await readFile(join(root, RECORD_DIR, row.assetId + '.json'), 'utf8'));
          const hashes = [asset.sha256, ...(asset.variants || []).map(v => v.sha256)];
          if (!hashes.includes(row.imageSha256)) errors.push(name + ': image hash is stale');
        }
      }
      (row.status === 'approved' && !problems.length ? approved : pending).push(name);
    } catch (e) { errors.push(name + ': ' + e.message); }
  }
  let records = [];
  try { records = (await readdir(join(root, RECORD_DIR))).filter(x => x.endsWith('.json') && !x.endsWith('-derivatives.json')); }
  catch (e) { if (e.code !== 'ENOENT') throw e; }
  const unreviewed = records.filter(name => !covered.has(name.slice(0,-5))).sort();
  return { status: errors.length || pending.length || unreviewed.length ? 'BLOCKED' : 'PASS',
    counts: { records: records.length, approved: approved.length, pending: pending.length, unreviewed: unreviewed.length },
    approved, pending, unreviewed, errors };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await auditScriptureReviews();
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'PASS') process.exitCode = 1;
}
