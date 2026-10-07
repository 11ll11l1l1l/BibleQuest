import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const CURATION_DIR = join(ROOT, 'data/v7/curation');
const BATCH_PATTERN = /^release-content-batch-\d+-summary\.json$/;
const REQUIRED_LOCALES = Object.freeze(['en', 'tl', 'ceb', 'ilo']);
const REQUIRED_TRANSLATIONS = Object.freeze(['tl', 'ceb', 'ilo']);
const SHA256 = /^sha256:[0-9a-f]{64}$/i;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function json(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function batchNames() {
  try {
    return (await readdir(CURATION_DIR)).filter(name => BATCH_PATTERN.test(name)).sort();
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

function sameMembers(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && expected.every(value => actual.includes(value));
}

function validateTranslation(item, locale) {
  const translation = item.translations?.find(row => row?.locale === locale);
  assert(translation, `${item.id}: missing ${locale} translation`);
  assert(translation.translatedFromRevision === item.revision,
    `${item.id}: ${locale} translation is stale for revision ${item.revision}`);
  assert(translation.reviewStatus === 'reviewed',
    `${item.id}: ${locale} translation is not reviewed`);
  assert(String(translation.content?.title || '').trim(),
    `${item.id}: ${locale} translated title is empty`);
  assert(String(translation.content?.body || '').trim(),
    `${item.id}: ${locale} translated body is empty`);
}

const names = await batchNames();
const seenItems = new Set();
const emotions = new Set();
const taxonomy = {
  emotion: new Set(),
  need: new Set(),
  topic: new Set(),
  life_situation: new Set(),
};
const batches = [];
let totalDevotionals = 0;
let totalReviewedTranslations = 0;
let totalVerifiedRights = 0;

for (const name of names) {
  const summaryPath = join(CURATION_DIR, name);
  const summary = await json(summaryPath);
  assert(summary.schemaVersion === 1, `${name}: schemaVersion must be 1`);
  assert(summary.status === 'ready_for_automated_policy_review',
    `${name}: status must be ready_for_automated_policy_review`);
  assert(summary.sourceKind === 'first_party_original',
    `${name}: sourceKind must be first_party_original`);
  assert(sameMembers(summary.requiredLocales, REQUIRED_LOCALES),
    `${name}: requiredLocales must be exactly en/tl/ceb/ilo`);
  assert(summary.qaPolicy?.allDimensionsMustPass === true,
    `${name}: translation QA must fail closed`);
  assert(summary.qaPolicy?.translationMustMatchSourceRevision === true,
    `${name}: translation QA must bind the source revision`);
  assert(summary.qaPolicy?.humanReviewRequired === false,
    `${name}: Lane A summary unexpectedly requires human review`);
  assert(Array.isArray(summary.contentFiles) && summary.contentFiles.length > 0,
    `${name}: contentFiles are required`);
  assert(Array.isArray(summary.items) && summary.items.length > 0,
    `${name}: items are required`);
  assert(summary.counts?.devotionals === summary.items.length,
    `${name}: devotional count does not match item count`);
  assert(summary.counts?.reviewedTranslations === summary.items.length * REQUIRED_TRANSLATIONS.length,
    `${name}: reviewed translation count is incomplete`);
  assert(summary.counts?.verifiedRights === summary.items.length,
    `${name}: verified-rights count is incomplete`);
  assert(summary.counts?.pendingPublicationReview === summary.items.length,
    `${name}: Lane A items must hand off to Lane B pending review`);

  const contentItems = new Map();
  for (const relativePath of summary.contentFiles) {
    const bundle = await json(join(ROOT, relativePath));
    assert(bundle.schemaVersion === 1, `${relativePath}: schemaVersion must be 1`);
    assert(Array.isArray(bundle.items), `${relativePath}: items array is required`);
    for (const item of bundle.items) {
      assert(!contentItems.has(item.id), `${name}: duplicate item ${item.id} within batch content`);
      contentItems.set(item.id, item);
    }
  }
  assert(contentItems.size === summary.items.length,
    `${name}: content files contain ${contentItems.size} items but summary declares ${summary.items.length}`);

  for (const record of summary.items) {
    const item = contentItems.get(record.contentId);
    assert(item, `${name}: summary item ${record.contentId} is missing from declared content files`);
    assert(!seenItems.has(item.id), `duplicate release-content id across batches: ${item.id}`);
    seenItems.add(item.id);

    assert(item.type === 'devotional', `${item.id}: Lane A launch factory item must be devotional`);
    assert(item.sourceLocale === 'en', `${item.id}: sourceLocale must be en`);
    assert(item.publicationState === 'pending_review',
      `${item.id}: Lane A handoff must remain pending_review until Lane B policy review`);
    assert(item.review?.status === 'pending_review',
      `${item.id}: review.status must remain pending_review until Lane B policy review`);
    assert(item.source?.kind === 'first_party', `${item.id}: release devotional source must be first_party`);
    assert(item.source?.revision === item.revision, `${item.id}: source revision does not match item revision`);
    assert(SHA256.test(String(item.source?.checksum || '')), `${item.id}: source checksum is not SHA-256`);
    assert(item.source.checksum === record.sourceChecksum, `${item.id}: summary/source checksum mismatch`);
    assert(record.sourceRevision === item.revision, `${item.id}: summary/source revision mismatch`);
    assert(item.rights?.status === 'verified', `${item.id}: rights are not verified`);
    assert(Array.isArray(item.rights?.allowedUses) && item.rights.allowedUses.length > 0,
      `${item.id}: verified rights require permitted uses`);
    assert(Array.isArray(record.bsbReferences) && record.bsbReferences.length > 0,
      `${item.id}: at least one BSB reference is required`);

    for (const locale of REQUIRED_TRANSLATIONS) {
      assert(record.translationRevisions?.[locale] === item.revision,
        `${item.id}: summary ${locale} revision is stale`);
      assert(record.qaPass?.[locale] === true,
        `${item.id}: summary ${locale} translation QA did not pass`);
      validateTranslation(item, locale);
    }

    for (const link of item.taxonomyLinks || []) {
      if (taxonomy[link.kind]) taxonomy[link.kind].add(link.id);
      if (link.kind === 'emotion') emotions.add(link.id);
    }
  }

  totalDevotionals += summary.counts.devotionals;
  totalReviewedTranslations += summary.counts.reviewedTranslations;
  totalVerifiedRights += summary.counts.verifiedRights;
  batches.push({
    file: `data/v7/curation/${name}`,
    scope: summary.scope,
    devotionals: summary.counts.devotionals,
    reviewedTranslations: summary.counts.reviewedTranslations,
    verifiedRights: summary.counts.verifiedRights,
    canonicalEmotionsClaimed: summary.counts.canonicalEmotionsCovered,
  });
}

const launchFloorMet = totalDevotionals >= 150;
const canonicalEmotionCoverageMet = emotions.size >= 30;
const translationCoverageMet = totalReviewedTranslations === totalDevotionals * REQUIRED_TRANSLATIONS.length;
const rightsCoverageMet = totalVerifiedRights === totalDevotionals;
const readyForAutomatedPolicyReview = names.length > 0
  && launchFloorMet
  && canonicalEmotionCoverageMet
  && translationCoverageMet
  && rightsCoverageMet;

const report = {
  schemaVersion: 1,
  candidateSha: String(process.env.BQ_EXACT_SHA || '').trim().toLowerCase() || null,
  status: readyForAutomatedPolicyReview ? 'READY_FOR_AUTOMATED_POLICY_REVIEW' : 'OPEN',
  readyForAutomatedPolicyReview,
  launchFloorMet,
  canonicalEmotionCoverageMet,
  translationCoverageMet,
  rightsCoverageMet,
  target: {
    launchFloor: 150,
    expansionGoal: 300,
    launchProgress: Math.min(1, totalDevotionals / 150),
    expansionProgress: Math.min(1, totalDevotionals / 300),
  },
  counts: {
    batches: batches.length,
    devotionals: totalDevotionals,
    reviewedTranslations: totalReviewedTranslations,
    verifiedRights: totalVerifiedRights,
    distinctCanonicalEmotions: emotions.size,
    taxonomy: Object.fromEntries(Object.entries(taxonomy).map(([kind, values]) => [kind, values.size])),
  },
  requiredLocales: REQUIRED_LOCALES,
  batches,
  exclusions: [
    'lane-b-automated-policy-decision-coverage',
    'books-release-catalog',
    'past-teachings-release-catalog',
  ],
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
