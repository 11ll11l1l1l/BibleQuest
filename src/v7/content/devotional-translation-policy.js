export const V7_DEVOTIONAL_TRANSLATION_RULEBOOK_VERSION = '1.0';
export const V7_REQUIRED_DEVOTIONAL_TRANSLATION_LOCALES = Object.freeze(['tl', 'ceb', 'ilo']);

const BLOCKER_ORDER = Object.freeze([
  'missing_translation',
  'stale_revision',
  'not_reviewed',
  'missing_title',
  'missing_body',
  'missing_translator',
  'missing_reviewer',
  'invalid_reviewed_at'
]);

function canonicalLocale(value) {
  try { return Intl.getCanonicalLocales(String(value ?? '').trim().replace(/_/g, '-'))[0] || null; }
  catch { return null; }
}

const REQUIRED_TARGETS = Object.freeze(V7_REQUIRED_DEVOTIONAL_TRANSLATION_LOCALES.map(locale => Object.freeze({
  locale,
  canonicalLocale: canonicalLocale(locale)
})));

function textPresent(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function blockersForTranslation(translation, revision) {
  if (!translation) return Object.freeze(['missing_translation']);
  const blockers = [];
  if (translation.translatedFromRevision !== revision) blockers.push('stale_revision');
  if (translation.reviewStatus !== 'reviewed') blockers.push('not_reviewed');
  if (!textPresent(translation.content?.title)) blockers.push('missing_title');
  if (!textPresent(translation.content?.body)) blockers.push('missing_body');
  if (!textPresent(translation.translatedBy)) blockers.push('missing_translator');
  if (!textPresent(translation.reviewedBy)) blockers.push('missing_reviewer');
  if (!Number.isFinite(Date.parse(translation.reviewedAt))) blockers.push('invalid_reviewed_at');
  return Object.freeze(blockers.sort((a, b) => BLOCKER_ORDER.indexOf(a) - BLOCKER_ORDER.indexOf(b)));
}

export function assessV7DevotionalTranslationCoverage(item) {
  if (!item || item.type !== 'devotional') {
    throw new TypeError('item must be a V7 devotional content record');
  }
  const translations = Array.isArray(item.translations) ? item.translations : [];
  const targets = {};
  for (const target of REQUIRED_TARGETS) {
    const translation = translations.find(row => canonicalLocale(row?.locale) === target.canonicalLocale);
    const blockers = blockersForTranslation(translation, item.revision);
    targets[target.locale] = Object.freeze({
      locale: target.locale,
      canonicalLocale: target.canonicalLocale,
      ready: blockers.length === 0,
      blockers
    });
  }
  return Object.freeze({
    ready: V7_REQUIRED_DEVOTIONAL_TRANSLATION_LOCALES.every(locale => targets[locale].ready),
    rulebookVersion: V7_DEVOTIONAL_TRANSLATION_RULEBOOK_VERSION,
    requiredLocales: V7_REQUIRED_DEVOTIONAL_TRANSLATION_LOCALES,
    targets: Object.freeze(targets)
  });
}

export function assessV7DevotionalCatalogTranslationCoverage(items) {
  if (!Array.isArray(items)) throw new TypeError('items must be an array');
  const devotionals = items.filter(item => item?.type === 'devotional');
  const reports = devotionals.map(item => Object.freeze({
    id: item.id,
    revision: item.revision,
    ...assessV7DevotionalTranslationCoverage(item)
  }));
  return Object.freeze({
    ready: reports.length > 0 && reports.every(report => report.ready),
    devotionalCount: reports.length,
    rulebookVersion: V7_DEVOTIONAL_TRANSLATION_RULEBOOK_VERSION,
    requiredLocales: V7_REQUIRED_DEVOTIONAL_TRANSLATION_LOCALES,
    items: Object.freeze(reports)
  });
}
