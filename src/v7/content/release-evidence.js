import { assessV7RepresentativeLibraryContent } from './representative-readiness.js';
import { validateRepresentativeReviewDecisionLedger } from './representative-review-decisions.js';

const SHA40 = /^[0-9a-f]{40}$/;

function candidateSha(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!SHA40.test(normalized)) throw new TypeError('candidateSha must be a full 40-character hexadecimal Git SHA');
  return normalized;
}

function optionalFields(source, names) {
  return Object.fromEntries(names.filter(name => source?.[name] !== undefined).map(name => [name, source[name]]));
}

function itemEvidence(item) {
  const translations = [...(item.translations || [])]
    .map(translation => Object.freeze({
      locale: translation.locale,
      translatedFromRevision: translation.translatedFromRevision,
      reviewStatus: translation.reviewStatus,
      translatedBy: translation.translatedBy,
      ...optionalFields(translation, ['reviewedBy', 'reviewedAt'])
    }))
    .sort((a, b) => a.locale.localeCompare(b.locale) || a.translatedFromRevision.localeCompare(b.translatedFromRevision));

  return Object.freeze({
    id: item.id,
    type: item.type,
    revision: item.revision,
    sourceLocale: item.sourceLocale,
    publicationState: item.publicationState,
    source: Object.freeze({
      kind: item.source.kind,
      title: item.source.title,
      ...optionalFields(item.source, ['uri', 'catalogId', 'revision', 'date', 'checksum', 'creator', 'organization'])
    }),
    rights: Object.freeze({
      status: item.rights.status,
      allowedUses: Object.freeze([...(item.rights.allowedUses || [])].sort()),
      ...optionalFields(item.rights, ['holder', 'basis', 'attribution', 'evidenceUri', 'verifiedAt'])
    }),
    review: Object.freeze({ ...item.review }),
    translations: Object.freeze(translations)
  });
}

function localizationEvidence({ supportedLocales, v7KeyCount, missingV7KeysByLocale }) {
  if (!Array.isArray(supportedLocales) || !Number.isInteger(v7KeyCount) || v7KeyCount <= 0) {
    throw new TypeError('supportedLocales and positive integer v7KeyCount are required');
  }
  if (missingV7KeysByLocale === null || typeof missingV7KeysByLocale !== 'object' || Array.isArray(missingV7KeysByLocale)) {
    throw new TypeError('missingV7KeysByLocale must explicitly inventory every supported locale');
  }

  const locales = [...new Set(supportedLocales.map(locale => String(locale).trim()).filter(Boolean))].sort();
  if (!locales.length) throw new TypeError('supportedLocales must contain at least one locale');

  const byLocale = {};
  for (const locale of locales) {
    if (!Object.hasOwn(missingV7KeysByLocale, locale) || !Array.isArray(missingV7KeysByLocale[locale])) {
      throw new TypeError(`missingV7KeysByLocale.${locale} must be an explicit array`);
    }
    const missing = [...new Set(missingV7KeysByLocale[locale].map(String))].sort();
    byLocale[locale] = Object.freeze({ ready: missing.length === 0, missingV7Keys: Object.freeze(missing) });
  }
  return Object.freeze({
    ready: locales.every(locale => byLocale[locale].ready),
    v7KeyCount,
    supportedLocales: Object.freeze(locales),
    byLocale: Object.freeze(byLocale)
  });
}

function reviewDecisionEvidence({ items, reviewPacket, reviewDecisionLedger }) {
  if (!reviewPacket || !Array.isArray(reviewPacket.items)) {
    throw new TypeError('reviewPacket with an explicit items array is required');
  }

  const itemIds = items.map(item => item.id).sort();
  const packetIds = reviewPacket.items.map(item => item.itemId).sort();
  if (new Set(packetIds).size !== packetIds.length || itemIds.length !== packetIds.length || itemIds.some((id, index) => id !== packetIds[index])) {
    throw new TypeError('reviewPacket must cover every release-evidence item exactly once');
  }

  const normalized = validateRepresentativeReviewDecisionLedger(reviewDecisionLedger, items, reviewPacket);
  const decisions = normalized.decisions
    .map(decision => Object.freeze({
      itemId: decision.itemId,
      revision: decision.revision,
      outcome: decision.outcome,
      reviewer: decision.reviewer,
      decidedAt: decision.decidedAt,
      rightsStatusSnapshot: decision.rightsStatusSnapshot,
      evidenceRefs: Object.freeze([...decision.evidenceRefs].sort()),
      checks: Object.freeze(decision.checks.map(check => Object.freeze({ ...check }))),
      ...optionalFields(decision, ['note'])
    }))
    .sort((a, b) => a.itemId.localeCompare(b.itemId) || a.revision.localeCompare(b.revision));

  return Object.freeze({
    status: normalized.status,
    decisionCount: decisions.length,
    representativeItemCount: reviewPacket.items.length,
    approvedItemIds: Object.freeze(decisions.filter(decision => decision.outcome === 'approved').map(decision => decision.itemId).sort()),
    rejectedItemIds: Object.freeze(decisions.filter(decision => decision.outcome === 'rejected').map(decision => decision.itemId).sort()),
    decisions: Object.freeze(decisions)
  });
}

/**
 * Build deterministic P5-D preparation evidence for already parsed V7 content.
 *
 * The report intentionally excludes source/translation bodies. It records
 * identity, provenance, rights, authorized review-decision evidence,
 * publication and localization state, but cannot approve content, infer rights
 * or certify a release by itself.
 */
export function buildV7ContentReleaseEvidence({
  candidateSha: sha,
  items,
  reviewPacket,
  reviewDecisionLedger,
  supportedLocales,
  v7KeyCount,
  missingV7KeysByLocale
}) {
  if (!Array.isArray(items)) throw new TypeError('items must be an array');
  const normalizedCandidateSha = candidateSha(sha);
  const representative = assessV7RepresentativeLibraryContent(items);
  const reviewDecisions = reviewDecisionEvidence({ items, reviewPacket, reviewDecisionLedger });
  const localization = localizationEvidence({ supportedLocales, v7KeyCount, missingV7KeysByLocale });
  const evidenceItems = items.map(itemEvidence).sort((a, b) => a.type.localeCompare(b.type) || a.id.localeCompare(b.id));

  return Object.freeze({
    schemaVersion: 1,
    candidateSha: normalizedCandidateSha,
    ready: representative.ready && localization.ready,
    representative,
    reviewDecisions,
    localization,
    items: Object.freeze(evidenceItems)
  });
}
