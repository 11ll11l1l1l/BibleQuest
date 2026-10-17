import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildReleaseAutomatedApprovalLedger,
  collectReleaseApprovalEntries,
} from './v7-release-automated-approval-decisions.mjs';
import { normalizeLibraryItem } from '../src/features/library/contracts.js';

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));

const readJson = relative => readFile(join(ROOT, relative), 'utf8').then(JSON.parse);
const words = value => String(value || '').trim().split(/\s+/).filter(Boolean).length;
const minutes = value => Math.max(1, Math.ceil(words(value) / 210));

function publishedRecord(item, review) {
  const record = {
    id: item.id,
    contentType: item.type,
    publishedRevisionId: item.revision,
    publicationState: 'published',
    title: item.sourceContent?.title || item.source?.title || item.id,
    summary: item.sourceContent?.summary || '',
    locale: item.sourceLocale || 'en',
    sourceLocale: item.sourceLocale || 'en',
    readingMinutes: minutes(item.sourceContent?.body || ''),
    updatedAt: review.decidedAt,
    source: item.source,
    sourceContent: item.sourceContent,
    rights: item.rights,
    review,
    taxonomyLinks: item.taxonomyLinks || [],
    translations: item.translations || [],
    revisionHistory: item.revisionHistory || [],
    derivatives: item.derivatives || [],
  };
  normalizeLibraryItem(record);
  return record;
}


const canonicalJson = value => Array.isArray(value) ? '[' + value.map(canonicalJson).join(',') + ']'
  : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonicalJson(value[key])).join(',') + '}'
  : JSON.stringify(value);

export function verifyExternalBookReleaseReview(item, packet) {
  const review = packet.items.find(row => row.itemId === item.id);
  const snapshot = Object.fromEntries(['id','revision','sourceLocale','source','sourceContent','rights'].map(key => [key,item[key]]));
  const digest = createHash('sha256').update(canonicalJson(snapshot)).digest('hex');
  if (!review || review.sourceSnapshotSha256 !== digest || review.revision !== item.revision
      || review.decision !== 'approved_external_link_only'
      || !Object.values(review.checks || {}).every(value => value === true)
      || Object.keys(review.checks || {}).length !== 5
      || item.review?.reviewer !== packet.reviewer
      || item.rights?.status !== 'verified' || JSON.stringify(item.rights.allowedUses) !== '["external_link"]'
      || !/^https:\/\/www\.gutenberg\.org\/ebooks\/\d+$/.test(item.source?.uri || '')
      || Object.keys(item.sourceContent || {}).some(key => key !== 'title')) {
    throw new Error('External-link book release review is missing or stale: ' + item.id);
  }
}

async function approvedRepresentative(path) {
  const bundle = await readJson(path);
  const items = (bundle.items || [])
    .filter(item => item.publicationState === 'published' && item.review?.status === 'approved')
    .map(item => publishedRecord(item, item.review));
  return { items, taxonomy: bundle.taxonomy || [] };
}

function taxonomyKey(row) {
  return `${row.kind}:${row.id}`;
}

export async function buildV7PublicLibraryCatalog({ candidateSha = '', generatedAt } = {}) {
  const exactSha = /^[0-9a-f]{40}$/i.test(String(candidateSha || '').trim()) ? String(candidateSha).trim().toLowerCase() : '';
  // Reproducible build epoch: the immutable source commit time, never a fresh
  // wall clock. Derived policy timestamps identify that source revision; they
  // do not claim an additional human review took place at build time.
  const epoch = new Date(generatedAt ?? execFileSync('git',
    ['show', '-s', '--format=%cI', exactSha || 'HEAD'], {cwd: ROOT, encoding: 'utf8'}).trim()).toISOString();
  const entries = await collectReleaseApprovalEntries();
  const ledger = buildReleaseAutomatedApprovalLedger({ candidateSha: exactSha, entries, decidedAt: epoch });
  const approved = new Map(ledger.decisions
    .filter(row => row.outcome === 'auto_approved')
    .map(row => [row.itemId, row]));

  const devotionals = entries
    .filter(entry => approved.has(entry.item.id))
    .map(entry => {
      const decision = approved.get(entry.item.id);
      return publishedRecord(entry.item, {
        status: 'approved',
        reviewer: `${decision.policyId}@${decision.policyVersion}`,
        decidedAt: decision.decidedAt,
      });
    });

  const [books, expansion, teaching] = await Promise.all([
    approvedRepresentative('data/v7/books/representative-catalog.json'),
    approvedRepresentative('data/v7/books/library-expansion-candidates.json'),
    approvedRepresentative('data/v7/past-teachings/prayer-source-example.json'),
  ]);

  const bookReview = await readJson('data/v7/curation/launch-books-release-review-20261017.json');
  const rawExpansion = await readJson('data/v7/books/library-expansion-candidates.json');
  for (const item of rawExpansion.items) verifyExternalBookReleaseReview(item, bookReview);
  const taxonomy = new Map();
  for (const relative of [...new Set(entries.map(entry => entry.contentPath))]) {
    const bundle = await readJson(relative);
    for (const row of bundle.taxonomy || []) taxonomy.set(taxonomyKey(row), row);
  }
  for (const row of [...books.taxonomy, ...expansion.taxonomy, ...teaching.taxonomy]) taxonomy.set(taxonomyKey(row), row);

  const items = [...devotionals, ...books.items, ...expansion.items, ...teaching.items]
    .sort((a, b) => a.contentType.localeCompare(b.contentType) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id));

  return {
    schemaVersion: 1,
    candidateSha: exactSha || null,
    generatedAt: epoch,
    counts: {
      items: items.length,
      devotionals: devotionals.length,
      books: books.items.length + expansion.items.length,
      pastTeachings: teaching.items.length,
    },
    taxonomy: [...taxonomy.values()].sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id)),
    items,
  };
}

export async function writeV7PublicLibraryCatalog({ candidateSha = '', outputPath } = {}) {
  if (!outputPath) throw new Error('V7 public Library catalog outputPath is required.');
  const catalog = await buildV7PublicLibraryCatalog({ candidateSha });
  if (catalog.counts.devotionals < 300) {
    throw new Error(`V7 public Library requires 300 approved devotionals; found ${catalog.counts.devotionals}.`);
  }
  if (catalog.counts.books < 8) throw new Error('V7 public Library requires eight reviewed external-link book entries.');
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(catalog)}\n`, 'utf8');
  return catalog;
}
