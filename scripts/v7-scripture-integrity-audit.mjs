import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const REVIEW_DIR = 'data/v7/scripture-reviews';
const RECORD_DIR = 'data/v7/visual-assets/records';
const ALLOWED = new Set(['reference_only','scripture_quote','paraphrase','non_scripture_text']);
const SHA = /^[a-f0-9]{64}$/i;
const GIT_BLOB_SHA = /^[a-f0-9]{40}$/i;
const gitBlobSha = bytes => createHash('sha1').update(Buffer.from('blob ' + bytes.length)).update(Buffer.from([0])).update(bytes).digest('hex');
const nonempty = x => typeof x === 'string' && x.trim().length > 0;

export function checkScriptureReview(row) {
  const errors = [];
  if (!row || typeof row !== 'object' || Array.isArray(row)) return ['review must be an object'];
  if (row.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (!nonempty(row.contentPath) || row.contentPath.includes('..') || row.contentPath.startsWith('/') || row.contentPath.includes('\\\\')) errors.push('invalid contentPath');
  if (!nonempty(row.locale)) errors.push('locale missing');
  if (!ALLOWED.has(row.displayKind)) errors.push('invalid displayKind');
  if (!['pending','failed','approved'].includes(row.status)) errors.push('invalid status');
  if (row.status !== 'approved') return errors;
  for (const field of ['referenceVerified','contextVerified','applicationVerified']) {
    if (row[field] !== true) errors.push(field + ' must be true');
  }
  if (!nonempty(row.reviewer) || !nonempty(row.reviewedAt) || Number.isNaN(Date.parse(row.reviewedAt))) errors.push('reviewer and valid reviewedAt required');
  if (!GIT_BLOB_SHA.test(row.canonicalSourceBlobSha || '')) errors.push('canonicalSourceBlobSha required for the reviewed source revision');
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
  const errors = [], pending = [], approved = [], covered = new Set(), coveredSources = new Set();
  let filenames = [];
  try { filenames = (await readdir(join(root, REVIEW_DIR))).filter(x => x.endsWith('.json')).sort(); }
  catch (e) { if (e.code !== 'ENOENT') throw e; errors.push('required Scripture review directory is missing: ' + REVIEW_DIR); }
  for (const name of filenames) {
    try {
      const row = JSON.parse(await readFile(join(root, REVIEW_DIR, name), 'utf8'));
      const problems = checkScriptureReview(row);
      for (const problem of problems) errors.push(name + ': ' + problem);
if (row.status === 'approved') {
        const sourcePath = resolve(root, row.contentPath);
        const relativeSource = sourcePath.startsWith(resolve(root) + '/') ? sourcePath.slice(resolve(root).length + 1) : '';
        if (!relativeSource || relativeSource.startsWith('..')) errors.push(name + ': contentPath escapes repository root');
        else {
          const sourceBytes = await readFile(sourcePath);
          if (gitBlobSha(sourceBytes) !== row.canonicalSourceBlobSha) errors.push(name + ': canonical source revision is stale');
        }
      }
      const coverageKey = row.contentPath + '::' + row.locale;
      if (coveredSources.has(coverageKey)) errors.push(name + ': duplicate source/locale review');
      coveredSources.add(coverageKey);
      if (row.assetId) {
        if (covered.has(row.assetId)) errors.push(name + ': duplicate asset review');
        covered.add(row.assetId);
        if (row.status === 'approved') {
          if (row.contentPath !== RECORD_DIR + '/' + row.assetId + '.json') errors.push(name + ': asset review must point to its canonical record');
          const asset = JSON.parse(await readFile(join(root, RECORD_DIR, row.assetId + '.json'), 'utf8'));
          const matches = [{ sha256: asset.sha256, imagePath: asset.imagePath }, ...(asset.variants || []).map(v => ({ sha256: v.sha256, imagePath: v.imagePath }))];
          const match = matches.find(v => v.sha256 === row.imageSha256);
          if (!match) errors.push(name + ': image hash is stale');
          else {
            const imagePath = String(match.imagePath || '').replace(/^\\/+/, '');
            const imageBytes = await readFile(join(root, 'public', imagePath));
            if (createHash('sha256').update(imageBytes).digest('hex') !== row.imageSha256) errors.push(name + ': image bytes do not match the reviewed SHA-256');
          }
          const rights = asset.rights;
          if (!rights || !nonempty(rights.sourceType) || !nonempty(rights.artRights)
            || typeof rights.thirdPartyAsset !== 'boolean' || typeof rights.attributionRequired !== 'boolean')
            errors.push(name + ': source art rights/provenance evidence is incomplete');
          if (rights?.thirdPartyAsset === true && !nonempty(row.licenseEvidence)) errors.push(name + ': third-party art license evidence missing');
          if (rights?.attributionRequired === true && !nonempty(rights.attribution)) errors.push(name + ': required art attribution missing');
        }
      } else if (row.contentPath.includes('/visual-assets/records/')) {
        errors.push(name + ': assetId required for visual record review');
      }
      (row.status === 'approved' && !problems.length ? approved : pending).push(name);
    } catch (e) { errors.push(name + ': ' + e.message); }
  }
  let records = [];
  try { records = (await readdir(join(root, RECORD_DIR))).filter(x => x.endsWith('.json') && !x.endsWith('-derivatives.json')); }
  catch (e) { if (e.code !== 'ENOENT') throw e; errors.push('required visual record directory is missing: ' + RECORD_DIR); }
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
