import { createV7TaxonomyIndex, normalizeV7Locale } from '../../v7/content/contract.js';
import { libraryError } from './contracts.js';

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
