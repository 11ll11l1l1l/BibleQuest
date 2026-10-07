import {
  LIBRARY_EMOTIONS,
  LIBRARY_NEEDS,
  normalizeLibraryDiscoveryLocale,
  normalizeLibraryDiscoveryQuery,
} from './emotion-taxonomy.js';

export const LIBRARY_DISCOVERY_QUERY_SEMANTICS = Object.freeze({
  withinDimension: 'or',
  acrossDimensions: 'and',
  pagination: 'updated_at_desc_then_id_asc',
});

export const LIBRARY_DISCOVERY_DIMENSIONS = Object.freeze({
  emotions: Object.freeze({ kind: 'emotion', prefix: 'emotion.' }),
  needs: Object.freeze({ kind: 'need', prefix: 'need.' }),
  topics: Object.freeze({ kind: 'topic', prefix: 'topic.' }),
  lifeSituations: Object.freeze({ kind: 'life_situation', prefix: 'life_situation.' }),
});

const canonicalCatalog = Object.freeze({
  emotion: new Set(LIBRARY_EMOTIONS.map(item => item.id)),
  need: new Set(LIBRARY_NEEDS.map(item => item.id)),
});

function freezeRecord(record) {
  return Object.freeze(Object.fromEntries(Object.entries(record).map(([key, value]) => [
    key,
    Array.isArray(value) ? Object.freeze([...value]) : value,
  ])));
}

export function normalizeLibraryDiscoveryRequest(input = {}) {
  const normalized = normalizeLibraryDiscoveryQuery(input);
  return freezeRecord({
    emotions: normalized.emotions,
    needs: normalized.needs,
    topics: normalized.topics,
    lifeSituations: normalized.lifeSituations,
    locale: normalizeLibraryDiscoveryLocale(input.locale),
  });
}

export function toLibraryDiscoveryTaxonomyFilters(input = {}) {
  const request = normalizeLibraryDiscoveryRequest(input);
  const filters = {};
  for (const [key, config] of Object.entries(LIBRARY_DISCOVERY_DIMENSIONS)) {
    filters[key] = Object.freeze(request[key].map(id => `${config.prefix}${id}`));
  }
  return freezeRecord(filters);
}

export function createLibraryDiscoveryTaxonomyLinks(input = {}) {
  const request = normalizeLibraryDiscoveryRequest(input);
  const links = [];
  for (const [key, config] of Object.entries(LIBRARY_DISCOVERY_DIMENSIONS)) {
    request[key].forEach((id, order) => links.push(Object.freeze({
      id: `${config.prefix}${id}`,
      kind: config.kind,
      order,
    })));
  }
  return Object.freeze(links);
}

function coverageKey(link) {
  const kind = String(link?.kind ?? '');
  if (!Object.hasOwn(canonicalCatalog, kind)) return null;
  const prefix = `${kind}.`;
  const raw = String(link?.id ?? '');
  if (!raw.startsWith(prefix)) return null;
  const id = raw.slice(prefix.length);
  return canonicalCatalog[kind].has(id) ? Object.freeze({ kind, id }) : null;
}

function workIdentity(item) {
  return String(item?.source?.catalogId || item?.source?.uri || item?.source?.title || item?.id || '').trim();
}

function authorIdentity(item) {
  return String(item?.source?.creator || '').trim();
}

export function summarizeLibraryDiscoveryCoverage(items = []) {
  const buckets = {
    emotion: Object.fromEntries(LIBRARY_EMOTIONS.map(item => [item.id, { items: new Set(), works: new Set(), authors: new Set() }])),
    need: Object.fromEntries(LIBRARY_NEEDS.map(item => [item.id, { items: new Set(), works: new Set(), authors: new Set() }])),
  };

  for (const item of Array.isArray(items) ? items : []) {
    const itemId = String(item?.id ?? '').trim();
    if (!itemId) continue;
    const work = workIdentity(item);
    const author = authorIdentity(item);
    const seen = new Set();
    for (const link of Array.isArray(item?.taxonomyLinks) ? item.taxonomyLinks : []) {
      const key = coverageKey(link);
      if (!key) continue;
      const identity = `${key.kind}:${key.id}`;
      if (seen.has(identity)) continue;
      seen.add(identity);
      const bucket = buckets[key.kind][key.id];
      bucket.items.add(itemId);
      if (work) bucket.works.add(work);
      if (author) bucket.authors.add(author);
    }
  }

  const summarize = records => Object.freeze(Object.fromEntries(Object.entries(records).map(([id, bucket]) => [
    id,
    Object.freeze({
      count: bucket.items.size,
      distinctWorks: bucket.works.size,
      distinctAuthors: bucket.authors.size,
    }),
  ])));

  return Object.freeze({
    emotions: summarize(buckets.emotion),
    needs: summarize(buckets.need),
  });
}
