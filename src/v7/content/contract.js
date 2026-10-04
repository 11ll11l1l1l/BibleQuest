const CONTENT_TYPES = new Set(['book', 'devotional', 'past_teaching']);
const TAXONOMY_KINDS = new Set(['category', 'topic', 'tag']);
const PUBLICATION_STATES = new Set(['draft', 'pending_review', 'published', 'withdrawn']);
const RIGHTS_STATES = new Set(['verified', 'unknown']);
const SOURCE_KINDS = new Set(['first_party', 'external', 'licensed', 'fixture']);
const REVIEW_STATES = new Set(['draft', 'reviewed', 'rejected']);
const PUBLICATION_REVIEW_STATES = new Set(['draft', 'pending_review', 'approved', 'rejected']);
const ID_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

export class V7ContentContractError extends Error {
  constructor(code, path, message) {
    super(`${path}: ${message}`);
    this.name = 'V7ContentContractError';
    this.code = code;
    this.path = path;
  }
}

function reject(code, path, message) {
  throw new V7ContentContractError(code, path, message);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requiredString(value, path) {
  if (typeof value !== 'string' || !value.trim()) reject('required', path, 'must be a non-empty string');
  return value.trim();
}

function optionalString(value, path) {
  if (value === undefined || value === null || value === '') return undefined;
  return requiredString(value, path);
}

function optionalHttpsUrl(value, path) {
  const uri = optionalString(value, path);
  if (uri === undefined) return undefined;
  let parsed;
  try { parsed = new URL(uri); } catch { reject('source_uri', path, 'must be an absolute HTTPS URL'); }
  if (parsed.protocol !== 'https:') reject('source_uri', path, 'must use HTTPS');
  return uri;
}

function validateTimestamp(value, path, required = false) {
  if (value === undefined && !required) return undefined;
  const timestamp = requiredString(value, path);
  if (!Number.isFinite(Date.parse(timestamp))) reject('timestamp', path, 'must be a valid date/time');
  return timestamp;
}

export function normalizeV7Locale(value, path = 'locale') {
  const input = requiredString(value, path);
  try {
    return Intl.getCanonicalLocales(input)[0];
  } catch {
    return reject('locale', path, `is not a valid BCP 47 language tag: ${input}`);
  }
}

function validateLabels(labels, path) {
  if (!isRecord(labels) || !Object.keys(labels).length) {
    reject('labels', path, 'must contain at least one localized label');
  }
  const normalized = {};
  for (const [locale, label] of Object.entries(labels)) {
    const language = normalizeV7Locale(locale, `${path}.${locale}`);
    if (Object.hasOwn(normalized, language)) reject('duplicate_taxonomy_locale', `${path}.${locale}`, `duplicates canonical locale ${language}`);
    normalized[language] = requiredString(label, `${path}.${locale}`);
  }
  return Object.freeze(normalized);
}

export function createV7TaxonomyIndex(entries) {
  if (!Array.isArray(entries)) reject('taxonomy', 'taxonomy', 'must be an array');
  const index = new Map();
  for (const [position, entry] of entries.entries()) {
    const path = `taxonomy[${position}]`;
    if (!isRecord(entry)) reject('taxonomy_entry', path, 'must be an object');
    const id = requiredString(entry.id, `${path}.id`);
    if (!ID_PATTERN.test(id)) reject('taxonomy_id', `${path}.id`, 'must be a stable lowercase ID');
    if (!TAXONOMY_KINDS.has(entry.kind)) reject('taxonomy_kind', `${path}.kind`, 'must be category, topic, or tag');
    if (index.has(id)) reject('duplicate_taxonomy', `${path}.id`, `duplicates ${id}`);
    index.set(id, Object.freeze({ id, kind: entry.kind, labels: validateLabels(entry.labels, `${path}.labels`) }));
  }
  return index;
}

function validateTaxonomyLinks(links, taxonomy, path) {
  if (!Array.isArray(links)) reject('taxonomy_links', path, 'must be an array');
  const seenIds = new Set();
  const seenOrders = new Set();
  const result = links.map((link, position) => {
    const linkPath = `${path}[${position}]`;
    if (!isRecord(link)) reject('taxonomy_link', linkPath, 'must be an object');
    const id = requiredString(link.id, `${linkPath}.id`);
    const entry = taxonomy.get(id);
    if (!entry) reject('unknown_taxonomy', `${linkPath}.id`, `does not exist in the controlled taxonomy: ${id}`);
    if (link.kind !== entry.kind) reject('taxonomy_kind_mismatch', `${linkPath}.kind`, `must match ${entry.kind} for ${id}`);
    if (seenIds.has(id)) reject('duplicate_taxonomy_link', `${linkPath}.id`, `duplicates ${id}`);
    if (!Number.isInteger(link.order) || link.order < 0) reject('taxonomy_order', `${linkPath}.order`, 'must be a non-negative integer');
    const orderKey = `${entry.kind}:${link.order}`;
    if (seenOrders.has(orderKey)) reject('duplicate_taxonomy_order', `${linkPath}.order`, `duplicates ${entry.kind} order ${link.order}`);
    seenIds.add(id);
    seenOrders.add(orderKey);
    return Object.freeze({ id, kind: entry.kind, order: link.order });
  });
  return Object.freeze(result.sort((a, b) => a.kind.localeCompare(b.kind) || a.order - b.order || a.id.localeCompare(b.id)));
}

function validateTranslation(translation, item, path) {
  if (!isRecord(translation)) reject('translation', path, 'must be an object');
  const locale = normalizeV7Locale(translation.locale, `${path}.locale`);
  if (locale === item.sourceLocale) reject('translation_locale', `${path}.locale`, 'must differ from sourceLocale');
  if (!REVIEW_STATES.has(translation.reviewStatus)) reject('translation_review', `${path}.reviewStatus`, 'must be draft, reviewed, or rejected');
  const translatedFromRevision = requiredString(translation.translatedFromRevision, `${path}.translatedFromRevision`);
  if (translatedFromRevision !== item.revision) reject('translation_revision', `${path}.translatedFromRevision`, 'must identify the source content revision');
  const translatedBy = requiredString(translation.translatedBy, `${path}.translatedBy`);
  const reviewedBy = translation.reviewStatus === 'reviewed'
    ? requiredString(translation.reviewedBy, `${path}.reviewedBy`)
    : optionalString(translation.reviewedBy, `${path}.reviewedBy`);
  const reviewedAt = translation.reviewStatus === 'reviewed'
    ? validateTimestamp(translation.reviewedAt, `${path}.reviewedAt`, true)
    : validateTimestamp(translation.reviewedAt, `${path}.reviewedAt`);
  const content = translation.content;
  if (!isRecord(content)) reject('translation_content', `${path}.content`, 'must be an object');
  const title = requiredString(content.title, `${path}.content.title`);
  if (content.body !== undefined && typeof content.body !== 'string') reject('translation_content', `${path}.content.body`, 'must be a string when present');
  return Object.freeze({ locale, reviewStatus: translation.reviewStatus, translatedFromRevision, translatedBy,
    ...(reviewedBy ? { reviewedBy } : {}), ...(reviewedAt ? { reviewedAt } : {}),
    content: Object.freeze({ title, ...(content.body === undefined ? {} : { body: content.body }) }) });
}

function validateContentItem(item, taxonomy, position) {
  const path = `items[${position}]`;
  if (!isRecord(item)) reject('content_item', path, 'must be an object');
  const id = requiredString(item.id, `${path}.id`);
  if (!ID_PATTERN.test(id)) reject('content_id', `${path}.id`, 'must be a stable lowercase ID');
  if (!CONTENT_TYPES.has(item.type)) reject('content_type', `${path}.type`, 'must be book, devotional, or past_teaching');
  const revision = requiredString(item.revision, `${path}.revision`);
  const sourceLocale = normalizeV7Locale(item.sourceLocale, `${path}.sourceLocale`);
  if (!PUBLICATION_STATES.has(item.publicationState)) reject('publication_state', `${path}.publicationState`, 'is unsupported');
  if (!isRecord(item.source)) reject('source', `${path}.source`, 'must be an object');
  if (!SOURCE_KINDS.has(item.source.kind)) reject('source_kind', `${path}.source.kind`, 'is unsupported');
  const sourceRecordTitle = requiredString(item.source.title, `${path}.source.title`);
  const sourceUri = optionalHttpsUrl(item.source.uri, `${path}.source.uri`);
  const catalogId = optionalString(item.source.catalogId, `${path}.source.catalogId`);
  if (item.source.kind !== 'fixture' && !sourceUri && !catalogId) {
    reject('source_identity', `${path}.source`, 'must include an HTTPS URI or catalogId');
  }
  const sourceRevision = optionalString(item.source.revision, `${path}.source.revision`);
  const sourceDate = validateTimestamp(item.source.date, `${path}.source.date`);
  const sourceChecksum = optionalString(item.source.checksum, `${path}.source.checksum`);
  const creator = optionalString(item.source.creator, `${path}.source.creator`);
  const organization = optionalString(item.source.organization, `${path}.source.organization`);
  const sourceContent = item.sourceContent;
  if (!isRecord(sourceContent)) reject('source_content', `${path}.sourceContent`, 'must be an object');
  const contentTitle = requiredString(sourceContent.title, `${path}.sourceContent.title`);
  if (sourceContent.body !== undefined && typeof sourceContent.body !== 'string') reject('source_content', `${path}.sourceContent.body`, 'must be a string when present');
  if (!isRecord(item.rights)) reject('rights', `${path}.rights`, 'must be an object');
  if (!RIGHTS_STATES.has(item.rights.status)) reject('rights_status', `${path}.rights.status`, 'must be verified or unknown');
  if (!Array.isArray(item.rights.allowedUses) || item.rights.allowedUses.some(use => typeof use !== 'string' || !use.trim())) {
    reject('rights_uses', `${path}.rights.allowedUses`, 'must be an array of non-empty use descriptions');
  }
  if (item.rights.status === 'verified') {
    if (!item.rights.allowedUses.length) reject('rights_uses', `${path}.rights.allowedUses`, 'verified rights require at least one permitted use');
    requiredString(item.rights.holder, `${path}.rights.holder`);
    requiredString(item.rights.basis, `${path}.rights.basis`);
    if (typeof item.rights.attribution !== 'string') reject('rights_attribution', `${path}.rights.attribution`, 'must be an explicit string (empty only when no attribution is required)');
  } else if (item.publicationState === 'published') {
    reject('unverified_rights_published', `${path}.publicationState`, 'content with unknown rights must remain unpublished');
  }
  if (item.source.kind === 'fixture' && item.publicationState === 'published') {
    reject('fixture_published', `${path}.publicationState`, 'fixture content cannot be published');
  }
  const taxonomyLinks = validateTaxonomyLinks(item.taxonomyLinks, taxonomy, `${path}.taxonomyLinks`);
  if (!isRecord(item.review)) reject('review', `${path}.review`, 'must be an object');
  if (!PUBLICATION_REVIEW_STATES.has(item.review.status)) reject('review_status', `${path}.review.status`, 'is unsupported');
  const reviewer = item.review.status === 'approved'
    ? requiredString(item.review.reviewer, `${path}.review.reviewer`)
    : optionalString(item.review.reviewer, `${path}.review.reviewer`);
  const decidedAt = item.review.status === 'approved'
    ? validateTimestamp(item.review.decidedAt, `${path}.review.decidedAt`, true)
    : validateTimestamp(item.review.decidedAt, `${path}.review.decidedAt`);
  if (item.publicationState === 'published' && item.review.status !== 'approved') {
    reject('publication_review', `${path}.review.status`, 'published content must have an approved review');
  }
  if (!Array.isArray(item.revisionHistory) || item.revisionHistory.some(revisionId => typeof revisionId !== 'string' || !revisionId.trim())) {
    reject('revision_history', `${path}.revisionHistory`, 'must be an array of non-empty revision IDs');
  }
  if (item.revisionHistory.includes(revision)) reject('revision_history', `${path}.revisionHistory`, 'must not include the current revision');
  if (item.publicationState === 'withdrawn') {
    if (!isRecord(item.withdrawal)) reject('withdrawal', `${path}.withdrawal`, 'withdrawn content requires a withdrawal record');
    requiredString(item.withdrawal.reason, `${path}.withdrawal.reason`);
    validateTimestamp(item.withdrawal.decidedAt, `${path}.withdrawal.decidedAt`, true);
  }
  const derivatives = item.derivatives === undefined ? [] : item.derivatives;
  if (!Array.isArray(derivatives) || derivatives.some(id => typeof id !== 'string' || !ID_PATTERN.test(id))) {
    reject('derivatives', `${path}.derivatives`, 'must be an array of stable content IDs');
  }
  if (!Array.isArray(item.translations)) reject('translations', `${path}.translations`, 'must be an array');
  const seenLocales = new Set();
  const translations = item.translations.map((translation, index) => {
    const normalized = validateTranslation(translation, { sourceLocale, revision }, `${path}.translations[${index}]`);
    if (seenLocales.has(normalized.locale)) reject('duplicate_translation', `${path}.translations[${index}].locale`, `duplicates ${normalized.locale}`);
    if (item.publicationState === 'published' && normalized.reviewStatus !== 'reviewed') {
      reject('unreviewed_translation_published', `${path}.translations[${index}].reviewStatus`, 'published content may expose only reviewed translations');
    }
    seenLocales.add(normalized.locale);
    return normalized;
  });
  return Object.freeze({ id, type: item.type, revision, sourceLocale, publicationState: item.publicationState,
    source: Object.freeze({ kind: item.source.kind, title: sourceRecordTitle, ...(sourceUri ? { uri: sourceUri } : {}), ...(catalogId ? { catalogId } : {}), ...(sourceRevision ? { revision: sourceRevision } : {}), ...(sourceDate ? { date: sourceDate } : {}), ...(sourceChecksum ? { checksum: sourceChecksum } : {}), ...(creator ? { creator } : {}), ...(organization ? { organization } : {}) }),
    sourceContent: Object.freeze({ title: contentTitle, ...(sourceContent.body === undefined ? {} : { body: sourceContent.body }) }),
    rights: Object.freeze({ ...item.rights, allowedUses: Object.freeze([...item.rights.allowedUses]) }),
    review: Object.freeze({ status: item.review.status, ...(reviewer ? { reviewer } : {}), ...(decidedAt ? { decidedAt } : {}) }),
    revisionHistory: Object.freeze([...item.revisionHistory]), derivatives: Object.freeze([...derivatives]),
    ...(item.withdrawal ? { withdrawal: Object.freeze({ ...item.withdrawal }) } : {}),
    taxonomyLinks, translations: Object.freeze(translations) });
}

export function parseV7ContentBundle(bundle) {
  if (!isRecord(bundle)) reject('bundle', 'bundle', 'must be an object');
  if (bundle.schemaVersion !== 1) reject('schema_version', 'schemaVersion', 'must equal 1');
  const taxonomy = createV7TaxonomyIndex(bundle.taxonomy);
  if (!Array.isArray(bundle.items)) reject('items', 'items', 'must be an array');
  const ids = new Set();
  const items = bundle.items.map((item, index) => {
    const parsed = validateContentItem(item, taxonomy, index);
    if (ids.has(parsed.id)) reject('duplicate_content', `items[${index}].id`, `duplicates ${parsed.id}`);
    ids.add(parsed.id);
    return parsed;
  });
  return Object.freeze({ schemaVersion: 1, taxonomy: Object.freeze([...taxonomy.values()]), items: Object.freeze(items) });
}

export function resolveV7Content(item, requestedLocale) {
  const locale = normalizeV7Locale(requestedLocale, 'requestedLocale');
  if (locale === item.sourceLocale) {
    return Object.freeze({ state: 'source', locale: item.sourceLocale, content: item.sourceContent });
  }
  const translation = item.translations.find(row => row.locale === locale && row.reviewStatus === 'reviewed' && row.translatedFromRevision === item.revision);
  if (translation) return Object.freeze({ state: 'translated', locale, content: translation.content });
  return Object.freeze({ state: 'source_fallback', locale: item.sourceLocale, content: item.sourceContent });
}

export const V7_CONTENT_TYPES = Object.freeze([...CONTENT_TYPES].sort());
export const V7_TAXONOMY_KINDS = Object.freeze([...TAXONOMY_KINDS].sort());
