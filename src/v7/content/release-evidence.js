import { assessV7RepresentativeLibraryContent } from './representative-readiness.js';

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

/**
 * Build deterministic P5-D preparation evidence for already parsed V7 content.
 *
 * The report intentionally excludes source/translation bodies. It records
 * identity, provenance, rights, review, publication and localization state,
 * but cannot approve content, infer rights or certify a release by itself.
 */
export function buildV7ContentReleaseEvidence({
  candidateSha: sha,
  items,
  supportedLocales,
  v7KeyCount,
  missingV7KeysByLocale
}) {
  if (!Array.isArray(items)) throw new TypeError('items must be an array');
  const representative = assessV7RepresentativeLibraryContent(items);
  const localization = localizationEvidence({ supportedLocales, v7KeyCount, missingV7KeysByLocale });
  const evidenceItems = items.map(itemEvidence).sort((a, b) => a.type.localeCompare(b.type) || a.id.localeCompare(b.id));

  return Object.freeze({
    schemaVersion: 1,
    candidateSha: candidateSha(sha),
    ready: representative.ready && localization.ready,
    representative,
    localization,
    items: Object.freeze(evidenceItems)
  });
}
