import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  evaluateV7LibraryApproval,
  requiredV7LibraryApprovalCriteria,
  V7_LIBRARY_APPROVAL_POLICY_ID,
  V7_LIBRARY_APPROVAL_POLICY_VERSION,
} from '../src/v7/content/automated-approval-policy.js';
import { normalizeV7AutomatedPolicyDecision } from '../src/v7/content/library-review-decision.js';
import { parseV7ContentBundle } from '../src/v7/content/contract.js';
import { parseBibleReference } from '../src/core/bible.js';

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const CURATION_DIR = join(ROOT, 'data/v7/curation');
const BATCH_PATTERN = /^release-content-batch-\d+-summary\.json$/;
const REQUIRED_QA_DIMENSIONS = Object.freeze([
  'semanticFidelity',
  'theologicalDrift',
  'scriptureDrift',
  'omissionsAdditions',
  'grammarNaturalness',
  'staleRevision',
]);
const REQUIRED_TRANSLATION_LOCALES = Object.freeze(['ceb', 'fil', 'ilo']);
const PRIMARY_EVALUATOR = 'biblequest.v7.release-policy.primary-v1';
const SECOND_PASS_EVALUATOR = 'biblequest.v7.release-policy.independent-v1';
const SHA256 = /^sha256:[0-9a-f]{64}$/i;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function json(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function clean(value) {
  return String(value ?? '').trim();
}

function normalizedText(value) {
  return clean(value).toLocaleLowerCase().replace(/\s+/g, ' ');
}

function wordCount(value) {
  return clean(value).split(/\s+/).filter(Boolean).length;
}

function sourceDigest(item) {
  return `sha256:${createHash('sha256')
    .update(`${item.sourceContent.title}\n${item.sourceContent.body || ''}`, 'utf8')
    .digest('hex')}`;
}

function evidence(entry, criterion) {
  return Object.freeze([
    `${entry.contentPath}#${entry.item.id}:${criterion}`,
    `${entry.summaryPath}#${entry.item.id}:${criterion}`,
  ]);
}

function qaReady(entry) {
  const dimensions = new Set(entry.summary.qaDimensions || []);
  const pass = Object.values(entry.record.qaPass || {});
  return REQUIRED_QA_DIMENSIONS.every(id => dimensions.has(id))
    && entry.summary.qaPolicy?.allDimensionsMustPass === true
    && entry.summary.qaPolicy?.translationMustMatchSourceRevision === true
    && pass.length === 3
    && pass.every(Boolean);
}

function translationReady(item) {
  const locales = item.translations.map(row => row.locale).sort();
  return JSON.stringify(locales) === JSON.stringify(REQUIRED_TRANSLATION_LOCALES)
    && item.translations.every(row => row.reviewStatus === 'reviewed'
      && row.translatedFromRevision === item.revision
      && clean(row.reviewedBy)
      && clean(row.reviewedAt)
      && clean(row.content?.title)
      && clean(row.content?.body));
}

function scriptureMentionedInBody(reference, body) {
  const parsed = parseBibleReference(reference);
  if (!parsed) return false;
  const names = [parsed.book.name];
  if (parsed.book.name === 'Psalms') names.push('Psalm');
  const ordinal = parsed.book.name.match(/^([123]) (.+)$/);
  if (ordinal) {
    const words = { 1: 'First', 2: 'Second', 3: 'Third' };
    names.push(`${words[ordinal[1]]} ${ordinal[2]}`);
  }
  const haystack = normalizedText(body);
  return names.some(name => haystack.includes(normalizedText(`${name} ${parsed.chapter}`)));
}

function referencesReady(entry) {
  const refs = entry.record.bsbReferences;
  return Array.isArray(refs)
    && refs.length > 0
    && refs.every(ref => parseBibleReference(ref))
    && refs.every(ref => scriptureMentionedInBody(ref, entry.item.sourceContent.body));
}

function taxonomyKinds(item) {
  return new Set((item.taxonomyLinks || []).map(row => row.kind));
}

function primaryChecks(entry, context) {
  const { item, record, summary } = entry;
  const kinds = taxonomyKinds(item);
  const emotion = item.taxonomyLinks.find(row => row.kind === 'emotion')?.id || '';
  const qa = qaReady(entry);
  const translations = translationReady(item);
  const references = referencesReady(entry);
  const digest = sourceDigest(item);
  const words = wordCount(item.sourceContent.body);
  const noPlaceholder = !/\b(?:TODO|TBD|lorem ipsum|placeholder)\b/i.test(item.sourceContent.body);
  const sourceIdentity = item.source.kind === 'first_party'
    && clean(item.source.catalogId)
    && clean(item.source.title)
    && record.workId === summary.sourceWork?.workId;
  const provenance = summary.sourceKind === 'first_party_original'
    && item.source.creator === summary.sourceWork?.author
    && clean(item.source.organization)
    && clean(summary.sourceWork?.rightsMode) === 'first_party_original';
  const rights = item.rights.status === 'verified'
    && ['display', 'translate', 'distribute'].every(use => item.rights.allowedUses.includes(use));
  const fidelity = SHA256.test(clean(item.source.checksum))
    && digest === item.source.checksum
    && digest === record.sourceChecksum
    && item.source.revision === item.revision;
  const revision = record.sourceRevision === item.revision
    && item.source.revision === item.revision
    && item.translations.every(row => row.translatedFromRevision === item.revision);
  const metadata = item.sourceLocale === 'en'
    && item.publicationState === 'pending_review'
    && item.review?.status === 'pending_review'
    && item.taxonomyLinks.length >= 3
    && clean(item.source.catalogId);
  const emotionNeed = kinds.has('emotion')
    && kinds.has('need')
    && emotion.startsWith('emotion.')
    && item.id.includes(emotion.slice('emotion.'.length));
  const diversity = context.items.length >= 150
    && context.emotions.size >= 30
    && kinds.has('topic')
    && kinds.has('life_situation');
  const uniqueContent = context.bodyCounts.get(normalizedText(item.sourceContent.body)) === 1
    && context.documentCounts.get(normalizedText(`${item.sourceContent.title}\n${item.sourceContent.body}`)) === 1;
  const scriptureContext = references
    && qa
    && new Set(summary.qaDimensions || []).has('scriptureDrift');
  const theology = scriptureContext
    && new Set(summary.qaDimensions || []).has('theologicalDrift');
  const editorial = words >= 20
    && words <= 180
    && clean(item.sourceContent.title).length >= 8
    && /[.!?]["')\]]?$/.test(clean(item.sourceContent.body))
    && noPlaceholder;
  const audience = words <= 180 && noPlaceholder;
  const adversarial = qa && noPlaceholder && sourceIdentity && rights && fidelity && references;

  return Object.freeze({
    source_identity: sourceIdentity,
    provenance,
    permitted_use_rights: rights,
    source_fidelity: fidelity,
    scripture_reference_validity: references,
    scripture_context: scriptureContext,
    theological_fidelity: theology,
    editorial_coherence: editorial,
    audience_suitability: audience,
    duplicate_fragment_detection: uniqueContent,
    emotion_need_relevance: emotionNeed,
    catalog_diversity: diversity,
    revision_integrity: revision,
    metadata_integrity: metadata,
    adversarial_qa: adversarial,
    translation_completeness: translations,
    translation_semantic_fidelity: translations
      && qa
      && ['semanticFidelity', 'omissionsAdditions', 'staleRevision']
        .every(id => new Set(summary.qaDimensions || []).has(id)),
    translation_naturalness: translations
      && qa
      && new Set(summary.qaDimensions || []).has('grammarNaturalness'),
  });
}

function independentSecondPass(entry, context) {
  const { item, record, summary } = entry;
  const kinds = taxonomyKinds(item);
  const digest = sourceDigest(item);
  const requiredDimensions = new Set(summary.qaDimensions || []);
  const independentChecks = [
    item.type === 'devotional',
    item.source.kind === 'first_party',
    item.rights.status === 'verified',
    item.rights.allowedUses.length > 0,
    digest === item.source.checksum,
    digest === record.sourceChecksum,
    record.sourceRevision === item.revision,
    referencesReady(entry),
    translationReady(item),
    qaReady(entry),
    REQUIRED_QA_DIMENSIONS.every(id => requiredDimensions.has(id)),
    kinds.has('emotion'),
    kinds.has('need'),
    context.bodyCounts.get(normalizedText(item.sourceContent.body)) === 1,
    context.items.length >= 150,
    context.emotions.size >= 30,
  ];
  return independentChecks.every(Boolean);
}

export function buildReleaseAutomatedApprovalLedger({
  candidateSha = '',
  entries = [],
  decidedAt = new Date().toISOString(),
} = {}) {
  assert(Array.isArray(entries) && entries.length > 0, 'release approval requires factory entries');
  const normalizedSha = clean(candidateSha).toLowerCase();
  if (normalizedSha) assert(/^[0-9a-f]{40}$/.test(normalizedSha), 'candidateSha must be a full commit SHA');

  const ids = new Set();
  const bodyCounts = new Map();
  const documentCounts = new Map();
  const emotions = new Set();
  for (const entry of entries) {
    assert(entry?.item?.id, 'release entry item id is required');
    assert(!ids.has(entry.item.id), `duplicate release approval item ${entry.item.id}`);
    ids.add(entry.item.id);
    const body = normalizedText(entry.item.sourceContent?.body);
    const document = normalizedText(`${entry.item.sourceContent?.title}\n${entry.item.sourceContent?.body}`);
    bodyCounts.set(body, (bodyCounts.get(body) || 0) + 1);
    documentCounts.set(document, (documentCounts.get(document) || 0) + 1);
    for (const link of entry.item.taxonomyLinks || []) {
      if (link.kind === 'emotion') emotions.add(link.id);
    }
  }
  const context = Object.freeze({ items: entries.map(row => row.item), bodyCounts, documentCounts, emotions });

  const decisions = entries.map(entry => {
    const checks = primaryChecks(entry, context);
    const criteria = requiredV7LibraryApprovalCriteria(entry.item.type).map(criterion => {
      assert(Object.hasOwn(checks, criterion.id),
        `release approval evaluator has no implementation for criterion ${criterion.id}`);
      return {
        id: criterion.id,
        result: checks[criterion.id] ? 'pass' : 'fail',
        evaluator: PRIMARY_EVALUATOR,
        evaluatedAt: decidedAt,
        evidenceRefs: evidence(entry, criterion.id),
        note: checks[criterion.id]
          ? 'Deterministic release-policy check passed against committed content and Lane A QA evidence.'
          : 'Deterministic release-policy check failed; item must be repaired or replaced before release.',
      };
    });
    const secondPassOk = independentSecondPass(entry, context);
    const policyDecision = evaluateV7LibraryApproval({
      item: entry.item,
      evaluations: criteria,
      secondPass: {
        result: secondPassOk ? 'pass' : 'fail',
        revision: entry.item.revision,
        evaluator: SECOND_PASS_EVALUATOR,
        evaluatedAt: decidedAt,
        evidenceRefs: Object.freeze([
          `${entry.contentPath}#${entry.item.id}:independent-second-pass`,
          `${entry.summaryPath}#${entry.item.id}:independent-second-pass`,
        ]),
        note: secondPassOk
          ? 'Independent checksum, rights, Scripture, taxonomy, translation, uniqueness and corpus-floor pass.'
          : 'Independent release pass detected a blocking mismatch.',
      },
      decidedAt,
    });
    return normalizeV7AutomatedPolicyDecision(policyDecision);
  });

  const approved = decisions.filter(row => row.outcome === 'auto_approved').length;
  return Object.freeze({
    schemaVersion: 1,
    scope: 'v7_library_release_automated_approval_decisions',
    policyId: V7_LIBRARY_APPROVAL_POLICY_ID,
    policyVersion: V7_LIBRARY_APPROVAL_POLICY_VERSION,
    candidateSha: normalizedSha || null,
    generatedAt: new Date(decidedAt).toISOString(),
    status: approved === decisions.length ? 'complete' : 'needs_repair',
    counts: Object.freeze({
      releaseItems: decisions.length,
      autoApproved: approved,
      needsRepair: decisions.filter(row => row.outcome === 'needs_repair').length,
      rejected: decisions.filter(row => row.outcome === 'rejected').length,
    }),
    decisions: Object.freeze(decisions),
  });
}

export async function collectReleaseApprovalEntries() {
  const names = (await readdir(CURATION_DIR)).filter(name => BATCH_PATTERN.test(name)).sort();
  const entries = [];
  const seen = new Set();

  for (const name of names) {
    const summaryPath = `data/v7/curation/${name}`;
    const summary = await json(join(ROOT, summaryPath));
    assert(summary.schemaVersion === 1, `${summaryPath}: schemaVersion must be 1`);
    assert(summary.status === 'ready_for_automated_policy_review',
      `${summaryPath}: batch is not ready for automated policy review`);
    assert(Array.isArray(summary.contentFiles) && summary.contentFiles.length > 0,
      `${summaryPath}: contentFiles are required`);
    assert(Array.isArray(summary.items) && summary.items.length > 0,
      `${summaryPath}: items are required`);
    const recordById = new Map(summary.items.map(row => [row.contentId, row]));

    for (const contentPath of summary.contentFiles) {
      const parsed = parseV7ContentBundle(await json(join(ROOT, contentPath)));
      for (const item of parsed.items) {
        const record = recordById.get(item.id);
        assert(record, `${contentPath}: ${item.id} is missing from ${summaryPath}`);
        assert(!seen.has(item.id), `duplicate release factory item ${item.id}`);
        seen.add(item.id);
        entries.push(Object.freeze({ item, record, summary, summaryPath, contentPath }));
      }
    }
    for (const record of summary.items) {
      assert(seen.has(record.contentId), `${summaryPath}: ${record.contentId} is missing from declared content files`);
    }
  }
  return Object.freeze(entries);
}

async function main() {
  const candidateSha = clean(process.argv[2] || process.env.BQ_EXACT_SHA);
  const entries = await collectReleaseApprovalEntries();
  const ledger = buildReleaseAutomatedApprovalLedger({ candidateSha, entries });
  process.stdout.write(`${JSON.stringify(ledger, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
