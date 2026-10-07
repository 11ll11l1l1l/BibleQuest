import { createLibraryRepository } from './repository.js';
import { libraryError } from './contracts.js';
import { normalizeLibraryTaxonomyId } from './discovery.js';
import { normalizeLibraryDiscoveryRequest, toLibraryDiscoveryTaxonomyFilters } from './discovery-query-contract.js';

const CATALOG_URL = 'data/v7/library-public-catalog.json';
let catalogPromise;

function validPageSize(value) {
  return Math.max(1, Math.min(60, Math.floor(Number(value) || 24)));
}
function decodeOffset(cursor) {
  if (cursor === null || cursor === undefined || cursor === '') return 0;
  const offset = Number(cursor);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 1_000_000) {
    throw libraryError('Library page cursor is invalid.', 'BQ_LIBRARY_CURSOR');
  }
  return offset;
}
function canonicalLocale(value) {
  try { return Intl.getCanonicalLocales(String(value || 'en'))[0] || 'en'; }
  catch { return 'en'; }
}
function translated(item, locale) {
  const requestedRaw = canonicalLocale(locale).split('-')[0];
  const requested = requestedRaw === 'tl' ? 'fil' : requestedRaw;
  const match = (item.translations || []).find(row => canonicalLocale(row.locale).split('-')[0] === requested);
  if (!match) return { ...item, locale: item.sourceLocale || 'en' };
  return {
    ...item,
    locale: match.locale,
    title: match.content?.title || item.title,
    summary: match.content?.summary || item.summary,
    sourceContent: {
      ...item.sourceContent,
      title: match.content?.title || item.sourceContent?.title,
      summary: match.content?.summary || item.sourceContent?.summary,
      body: match.content?.body || item.sourceContent?.body,
    },
  };
}
async function loadCatalog() {
  if (!catalogPromise) catalogPromise = fetch(CATALOG_URL, { cache: 'force-cache' }).then(async response => {
    if (!response.ok) throw libraryError(`Library catalog request failed with HTTP ${response.status}.`, 'BQ_LIBRARY_CATALOG');
    const value = await response.json();
    if (value?.schemaVersion !== 1 || !Array.isArray(value.items) || !Array.isArray(value.taxonomy)) {
      throw libraryError('Library catalog is invalid.', 'BQ_LIBRARY_CATALOG');
    }
    return value;
  }).catch(error => {
    catalogPromise = undefined;
    throw error;
  });
  return catalogPromise;
}
function containsAny(links, ids) {
  if (!ids.length) return true;
  const available = new Set((links || []).map(link => link.id));
  return ids.some(id => available.has(id));
}
function itemMatchesDiscovery(item, filters) {
  return Object.values(filters).every(ids => containsAny(item.taxonomyLinks, ids));
}
function searchable(item) {
  return [item.title, item.summary, item.sourceContent?.title, item.sourceContent?.summary, item.sourceContent?.body]
    .filter(Boolean).join(' ').toLocaleLowerCase();
}

export function createLibraryStaticAdapter() {
  return Object.freeze({
    async listPublished(options = {}) {
      const catalog = await loadCatalog();
      const limit = validPageSize(options.limit);
      const offset = decodeOffset(options.cursor);
      const locale = options.locale || 'en';
      const taxonomyId = normalizeLibraryTaxonomyId(options.taxonomyId);
      const discovery = normalizeLibraryDiscoveryRequest(options);
      const filters = toLibraryDiscoveryTaxonomyFilters(discovery);
      const query = String(options.query || '').trim().toLocaleLowerCase();
      const contentType = String(options.contentType || '').trim();

      const rows = catalog.items
        .map(item => translated(item, locale))
        .filter(item => !contentType || item.contentType === contentType)
        .filter(item => !taxonomyId || (item.taxonomyLinks || []).some(link => link.id === taxonomyId))
        .filter(item => itemMatchesDiscovery(item, filters))
        .filter(item => !query || searchable(item).includes(query));

      return Object.freeze({
        items: Object.freeze(rows.slice(offset, offset + limit)),
        nextCursor: offset + limit < rows.length ? String(offset + limit) : null,
        ...(options.includeTaxonomy ? { taxonomy: Object.freeze([...catalog.taxonomy]) } : {}),
      });
    },
    async getPublishedById(id) {
      const catalog = await loadCatalog();
      const item = catalog.items.find(row => row.id === String(id));
      return item ? translated(item, 'en') : null;
    },
  });
}

export function createLibraryStaticRepository() {
  return createLibraryRepository(createLibraryStaticAdapter());
}
