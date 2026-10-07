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

export async function buildV7PublicLibraryCatalog({ candidateSha = '' } = {}) {
  const exactSha = /^[0-9a-f]{40}$/i.test(String(candidateSha || '').trim()) ? String(candidateSha).trim().toLowerCase() : '';
  const entries = await collectReleaseApprovalEntries();
  const ledger = buildReleaseAutomatedApprovalLedger({ candidateSha: exactSha, entries });
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

  const [books, teaching] = await Promise.all([
    approvedRepresentative('data/v7/books/representative-catalog.json'),
    approvedRepresentative('data/v7/past-teachings/prayer-source-example.json'),
  ]);

  const taxonomy = new Map();
  for (const relative of [...new Set(entries.map(entry => entry.contentPath))]) {
    const bundle = await readJson(relative);
    for (const row of bundle.taxonomy || []) taxonomy.set(taxonomyKey(row), row);
  }
  for (const row of [...books.taxonomy, ...teaching.taxonomy]) taxonomy.set(taxonomyKey(row), row);

  const items = [...devotionals, ...books.items, ...teaching.items]
    .sort((a, b) => a.contentType.localeCompare(b.contentType) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id));

  return {
    schemaVersion: 1,
    candidateSha: exactSha || null,
    generatedAt: new Date().toISOString(),
    counts: {
      items: items.length,
      devotionals: devotionals.length,
      books: books.items.length,
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
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(catalog)}\n`, 'utf8');
  return catalog;
}
