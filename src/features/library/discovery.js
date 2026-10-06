import { createV7TaxonomyIndex, normalizeV7Locale } from '../../v7/content/contract.js';
import { libraryError } from './contracts.js';

const LIBRARY_DISCOVERY_CONCEPTS = Object.freeze([
  Object.freeze({ intent: 'emotion', aliases: Object.freeze(['worry']) }),
  Object.freeze({ intent: 'emotion', aliases: Object.freeze(['hope']) }),
  Object.freeze({ intent: 'emotion', aliases: Object.freeze(['trust']) }),
  Object.freeze({ intent: 'emotion', aliases: Object.freeze(['perseverance']) }),
  Object.freeze({ intent: 'need', aliases: Object.freeze(['prayer']) }),
  Object.freeze({ intent: 'need', aliases: Object.freeze(['faith', 'daily_faith']) }),
  Object.freeze({ intent: 'need', aliases: Object.freeze(['spiritual_growth', 'discipleship']) }),
  Object.freeze({ intent: 'need', aliases: Object.freeze(['abiding']) }),
]);

function discoverySlug(id) {
  return String(id ?? '')
    .trim()
    .toLowerCase()
    .replace(/^(?:category|topic|tag)[._-]/, '')
    .replace(/[.-]+/g, '_');
}

export function normalizeLibraryTaxonomyId(value) {
  const id = String(value ?? '').trim();
  if (id && !/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(id)) {
    throw libraryError('Choose a valid Library category, topic, or tag.', 'BQ_LIBRARY_TAXONOMY');
  }
  return id;
}

export function normalizeLibraryTaxonomy(entries) {
  return Object.freeze([...createV7TaxonomyIndex(entries ?? []).values()]);
}

export function libraryTaxonomyLabel(term, requestedLocale = 'en') {
  const locale = normalizeV7Locale(requestedLocale);
  const labels = term.labels ?? {};
  const base = locale.split('-')[0];
  const actualLocale = [locale, base, 'en', ...Object.keys(labels).sort()]
    .find(language => typeof labels[language] === 'string' && labels[language].trim());
  return Object.freeze({
    label: actualLocale ? labels[actualLocale] : term.id,
    locale: actualLocale ?? null,
    fallback: actualLocale !== locale,
  });
}

export function resolveLibraryDiscoveryTerms(entries) {
  const terms = normalizeLibraryTaxonomy(entries ?? []);
  const eligible = terms.filter(term => term.kind === 'topic' || term.kind === 'tag');
  const claimed = new Set();
  const options = [];

  for (const concept of LIBRARY_DISCOVERY_CONCEPTS) {
    const term = eligible.find(candidate => !claimed.has(candidate.id)
      && concept.aliases.includes(discoverySlug(candidate.id)));
    if (!term) continue;
    claimed.add(term.id);
    options.push(Object.freeze({ id: term.id, intent: concept.intent, term }));
  }

  return Object.freeze(options);
}
