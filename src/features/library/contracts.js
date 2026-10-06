export const LIBRARY_ROUTE_KEYS = Object.freeze({
  browse: 'library',
  item: 'library-item',
});

export const LIBRARY_CONTENT_TYPES = Object.freeze({
  book: 'book',
  devotional: 'devotional',
  pastTeaching: 'past_teaching',
});

export const LIBRARY_PUBLICATION_STATES = Object.freeze({
  published: 'published',
});

const LIBRARY_SOURCE_KINDS = new Set(['first_party', 'external', 'licensed', 'fixture']);
const LIBRARY_TAXONOMY_KINDS = new Set(['category', 'topic', 'tag', 'emotion', 'need', 'life_situation']);
const LIBRARY_TAXONOMY_ID_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

const BUILT_IN_CONTENT_TYPES = [
  { id: LIBRARY_CONTENT_TYPES.book, label: 'Books', description: 'Books and structured learning material.' },
  { id: LIBRARY_CONTENT_TYPES.devotional, label: 'Devotionals', description: 'Short readings for daily reflection.' },
  { id: LIBRARY_CONTENT_TYPES.pastTeaching, label: 'Past Teachings', description: 'Reviewed articles adapted from teachings.' },
];

export function libraryError(message, code = 'BQ_LIBRARY_INVALID') {
  const error = new Error(message);
  error.code = code;
  return error;
}

function snapshotData(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(snapshotData));
  if (value && typeof value === 'object') {
    return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, snapshotData(entry)])));
  }
  return value;
}

function isHttpsUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function canonicalLocale(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    return Intl.getCanonicalLocales(value.trim())[0] ?? null;
  } catch {
    return null;
  }
}

function normalizeTaxonomyLinks(links) {
  const seenIds = new Set();
  const seenOrders = new Set();
  const normalized = links.map(link => {
    if (!link || typeof link !== 'object' || Array.isArray(link)) {
      throw libraryError('Published Library taxonomy links must be structured records.', 'BQ_LIBRARY_TAXONOMY');
    }
    const id = typeof link.id === 'string' ? link.id.trim() : '';
    const kind = typeof link.kind === 'string' ? link.kind.trim() : '';
    const order = link.order;
    if (!LIBRARY_TAXONOMY_ID_PATTERN.test(id) || !LIBRARY_TAXONOMY_KINDS.has(kind)
        || !Number.isInteger(order) || order < 0) {
      throw libraryError('Published Library taxonomy links require a stable id, supported kind, and non-negative order.', 'BQ_LIBRARY_TAXONOMY');
    }
    const orderKey = `${kind}:${order}`;
    if (seenIds.has(id) || seenOrders.has(orderKey)) {
      throw libraryError('Published Library taxonomy links cannot contain duplicate ids or kind/order positions.', 'BQ_LIBRARY_TAXONOMY');
    }
    seenIds.add(id);
    seenOrders.add(orderKey);
    return { ...link, id, kind, order };
  });
  return normalized.sort((a, b) => a.kind.localeCompare(b.kind) || a.order - b.order || a.id.localeCompare(b.id));
}

export function createLibraryContentTypeRegistry(additionalTypes = []) {
  const definitions = new Map();
  for (const definition of [...BUILT_IN_CONTENT_TYPES, ...additionalTypes]) {
    const id = String(definition?.id ?? '').trim();
    const label = String(definition?.label ?? '').trim();
    if (!/^[a-z][a-z0-9_-]*$/.test(id) || !label) {
      throw libraryError('A Library content type needs a stable id and display label.', 'BQ_LIBRARY_CONTENT_TYPE');
    }
    if (definitions.has(id)) {
      throw libraryError(`Library content type "${id}" is already registered.`, 'BQ_LIBRARY_CONTENT_TYPE');
    }
    definitions.set(id, Object.freeze({
      id,
      label,
      description: String(definition.description ?? '').trim(),
    }));
  }

  return Object.freeze({
    list: () => Object.freeze([...definitions.values()]),
    get: id => definitions.get(String(id ?? '').trim()) ?? null,
    has: id => definitions.has(String(id ?? '').trim()),
  });
}

export function normalizeLibraryItem(record, registry = createLibraryContentTypeRegistry()) {
  const id = String(record?.id ?? '').trim();
  const contentType = String(record?.contentType ?? '').trim();
  const revisionId = String(record?.publishedRevisionId ?? '').trim();
  const title = String(record?.title ?? '').trim();

  if (!id || !registry.has(contentType)) {
    throw libraryError('Library returned an item with an invalid id or content type.', 'BQ_LIBRARY_ITEM');
  }
  if (record?.publicationState !== LIBRARY_PUBLICATION_STATES.published || !revisionId) {
    throw libraryError('Library returned an item that is not a published revision.', 'BQ_LIBRARY_PUBLICATION');
  }
  if (!title) throw libraryError('Library returned a published item without a title.', 'BQ_LIBRARY_ITEM');

  const source = record.source;
  const sourceContent = record.sourceContent;
  const rights = record.rights;
  const review = record.review;
  const taxonomyLinks = record.taxonomyLinks;
  const translations = record.translations;
  const sourceLocale = canonicalLocale(record.sourceLocale ?? record.locale);
  const sourceTitle = String(source?.title ?? '').trim();
  const sourceKind = String(source?.kind ?? '').trim();
  const sourceUriProvided = source?.uri !== undefined && source?.uri !== null && source?.uri !== '';
  const sourceUri = typeof source?.uri === 'string' ? source.uri.trim() : '';
  const sourceCatalogIdProvided = source?.catalogId !== undefined && source?.catalogId !== null && source?.catalogId !== '';
  const sourceCatalogId = typeof source?.catalogId === 'string' ? source.catalogId.trim() : '';
  const sourceContentTitle = String(sourceContent?.title ?? '').trim();

  if (!source || !sourceTitle || !LIBRARY_SOURCE_KINDS.has(sourceKind) || sourceKind === 'fixture'
      || (!sourceUri && !sourceCatalogId) || (sourceUriProvided && !isHttpsUrl(source?.uri))
      || (sourceCatalogIdProvided && !sourceCatalogId)) {
    throw libraryError('Published Library items require a supported non-fixture HTTPS or catalog source identity.', 'BQ_LIBRARY_PROVENANCE');
  }
  if (!sourceContent || !sourceContentTitle || !sourceLocale) {
    throw libraryError('Published Library items require source-language content with a valid BCP 47 locale.', 'BQ_LIBRARY_LOCALE');
  }
  if (rights?.status !== 'verified' || !String(rights.holder ?? '').trim()
      || !String(rights.basis ?? '').trim() || typeof rights.attribution !== 'string'
      || !Array.isArray(rights.allowedUses) || !rights.allowedUses.length
      || rights.allowedUses.some(use => typeof use !== 'string' || !use.trim())) {
    throw libraryError('Published Library items require verified rights and an attribution basis.', 'BQ_LIBRARY_RIGHTS');
  }
  if (review?.status !== 'approved' || !String(review.reviewer ?? '').trim()
      || !Number.isFinite(Date.parse(review.decidedAt))) {
    throw libraryError('Published Library items require an approved publication review.', 'BQ_LIBRARY_REVIEW');
  }
  if (!Array.isArray(taxonomyLinks) || !Array.isArray(translations)) {
    throw libraryError('Published Library items require taxonomy links and translation records.', 'BQ_LIBRARY_CONTENT_CONTRACT');
  }
  const normalizedTaxonomyLinks = normalizeTaxonomyLinks(taxonomyLinks);
  const normalizedTranslations = [];
  const seenTranslationLocales = new Set();
  for (const translation of translations) {
    const translationLocale = canonicalLocale(translation?.locale);
    if (translation?.reviewStatus !== 'reviewed' || translation.translatedFromRevision !== revisionId
        || !translationLocale || translationLocale === sourceLocale || seenTranslationLocales.has(translationLocale)
        || !String(translation.translatedBy ?? '').trim()
        || !String(translation.reviewedBy ?? '').trim() || !Number.isFinite(Date.parse(translation.reviewedAt))
        || !String(translation.content?.title ?? '').trim()) {
      throw libraryError('Published Library items can expose only unique reviewed translations for the current revision and a valid non-source locale.', 'BQ_LIBRARY_TRANSLATION');
    }
    seenTranslationLocales.add(translationLocale);
    normalizedTranslations.push({ ...translation, locale: translationLocale });
  }

  const summary = String(record.summary ?? '').trim();
  const requestedLocale = canonicalLocale(record.locale ?? sourceLocale);
  if (!requestedLocale) {
    throw libraryError('Library returned an invalid requested locale.', 'BQ_LIBRARY_LOCALE');
  }
  const readingMinutes = Number(record.readingMinutes);
  return Object.freeze({
    id,
    contentType,
    publishedRevisionId: revisionId,
    publicationState: LIBRARY_PUBLICATION_STATES.published,
    title,
    summary,
    locale: requestedLocale,
    sourceLocale,
    readingMinutes: Number.isFinite(readingMinutes) && readingMinutes > 0 ? Math.ceil(readingMinutes) : null,
    updatedAt: String(record.updatedAt ?? '').trim() || null,
    source: snapshotData(source),
    sourceContent: snapshotData(sourceContent),
    rights: snapshotData(rights),
    review: snapshotData(review),
    taxonomyLinks: snapshotData(normalizedTaxonomyLinks),
    translations: snapshotData(normalizedTranslations),
    revisionHistory: snapshotData(Array.isArray(record.revisionHistory) ? record.revisionHistory : []),
    derivatives: snapshotData(Array.isArray(record.derivatives) ? record.derivatives : []),
  });
}

export function createLibraryViewState(patch = {}) {
  return Object.freeze({
    status: 'idle',
    items: Object.freeze([]),
    selectedItem: null,
    query: '',
    contentType: '',
    nextCursor: null,
    error: null,
    ...patch,
    items: Object.freeze([...(patch.items ?? [])]),
  });
}

export function presentLibraryItem(item, registry = createLibraryContentTypeRegistry()) {
  const definition = registry.get(item?.contentType);
  if (!item?.id || !definition) {
    throw libraryError('Cannot present an item with an unregistered content type.', 'BQ_LIBRARY_ITEM');
  }
  return Object.freeze({
    id: item.id,
    title: item.title,
    supportingText: item.summary || definition.description,
    contentTypeLabel: definition.label,
    locale: item.locale,
    readingMinutes: item.readingMinutes,
    destination: Object.freeze({
      routeKey: LIBRARY_ROUTE_KEYS.item,
      resourceId: item.id,
    }),
  });
}
