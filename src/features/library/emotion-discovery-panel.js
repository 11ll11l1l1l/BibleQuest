import {
  LIBRARY_EMOTIONS,
  LIBRARY_NEEDS,
  getLibraryDiscoveryEmptyState,
  libraryDiscoveryLabel,
  libraryDiscoveryShellLabel,
  normalizeLibraryDiscoveryQuery,
} from './emotion-taxonomy.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

function chip(item, selected, locale) {
  const { label, locale: labelLocale } = libraryDiscoveryLabel(item, locale);
  return `<button type="button" class="bq-library-discovery__chip" data-library-discovery-kind="${item.kind}" data-library-discovery-id="${escapeHtml(item.id)}" aria-pressed="${String(selected.has(item.id))}" lang="${escapeHtml(labelLocale)}">${escapeHtml(label)}</button>`;
}

function section({ kind, title, items, selected, locale }) {
  return `<section class="bq-library-discovery__section" data-library-discovery-section="${kind}" aria-labelledby="bq-library-discovery-${kind}-title">
    <h2 id="bq-library-discovery-${kind}-title" class="bq-library-discovery__title">${escapeHtml(title)}</h2>
    <div class="bq-library-discovery__chips" role="group" aria-labelledby="bq-library-discovery-${kind}-title">${items.map(item => chip(item, selected, locale)).join('')}</div>
  </section>`;
}

export function renderLibraryEmotionDiscovery(query = {}, locale = 'en') {
  const normalized = normalizeLibraryDiscoveryQuery(query);
  return `<div class="bq-library-discovery" data-library-emotion-discovery>
    ${section({
      kind: 'emotion',
      title: libraryDiscoveryShellLabel('feelingQuestion', locale),
      items: LIBRARY_EMOTIONS,
      selected: new Set(normalized.emotions),
      locale,
    })}
    ${section({
      kind: 'need',
      title: libraryDiscoveryShellLabel('needQuestion', locale),
      items: LIBRARY_NEEDS,
      selected: new Set(normalized.needs),
      locale,
    })}
  </div>`;
}

export function renderLibraryDiscoveryEmptyState(query = {}, locale = 'en') {
  const state = getLibraryDiscoveryEmptyState(query, locale);
  const suggestions = state.suggestions.length
    ? `<div class="bq-library-discovery__empty-suggestions"><strong>${escapeHtml(libraryDiscoveryShellLabel('suggestions', locale))}</strong><ul>${state.suggestions.map(item => {
      const { label, locale: labelLocale } = libraryDiscoveryLabel(item, locale);
      return `<li><button type="button" class="bq-library-discovery__suggestion" data-library-discovery-suggestion data-library-discovery-kind="${item.kind}" data-library-discovery-id="${escapeHtml(item.id)}" lang="${escapeHtml(labelLocale)}">${escapeHtml(label)}</button></li>`;
    }).join('')}</ul></div>` : '';
  const scripture = state.scriptures.length
    ? `<div class="bq-library-discovery__scripture"><strong>${escapeHtml(libraryDiscoveryShellLabel('scripture', locale))}</strong><ul>${state.scriptures.map(reference => `<li>${escapeHtml(reference)}</li>`).join('')}</ul></div>` : '';
  return `<div class="bq-library-discovery__empty" data-library-discovery-empty><p>${escapeHtml(state.message)}</p>${suggestions}${scripture}</div>`;
}

function itemDiscovery(item) {
  const direct = item?.discovery && typeof item.discovery === 'object' ? item.discovery : {};
  const fromTaxonomy = Array.isArray(item?.taxonomyLinks) ? item.taxonomyLinks.reduce((result, link) => {
    const id = String(link?.id || '');
    const [prefix, value] = id.split('.', 2);
    if (prefix === 'emotion' && value) result.emotions.push(value);
    if (prefix === 'need' && value) result.needs.push(value);
    if (prefix === 'topic' && value) result.topics.push(value);
    if (prefix === 'life' && value) result.lifeSituations.push(value);
    return result;
  }, { emotions: [], needs: [], topics: [], lifeSituations: [] }) : {};
  return normalizeLibraryDiscoveryQuery({
    emotions: [...(direct.emotions || []), ...(fromTaxonomy.emotions || [])],
    needs: [...(direct.needs || []), ...(fromTaxonomy.needs || [])],
    topics: [...(direct.topics || []), ...(fromTaxonomy.topics || [])],
    lifeSituations: [...(direct.lifeSituations || []), ...(fromTaxonomy.lifeSituations || [])],
  });
}

const containsAll = (available, selected) => selected.every(value => available.includes(value));

export function filterLibraryDiscoveryItems(items, query = {}) {
  const normalized = normalizeLibraryDiscoveryQuery(query);
  return Object.freeze((Array.isArray(items) ? items : []).filter(item => {
    const tags = itemDiscovery(item);
    return containsAll(tags.emotions, normalized.emotions)
      && containsAll(tags.needs, normalized.needs)
      && containsAll(tags.topics, normalized.topics)
      && containsAll(tags.lifeSituations, normalized.lifeSituations);
  }));
}
