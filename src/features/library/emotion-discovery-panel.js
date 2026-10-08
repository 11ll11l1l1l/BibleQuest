import {
  LIBRARY_EMOTIONS,
  LIBRARY_NEEDS,
  getLibraryDiscoveryEmptyState,
  libraryDiscoveryLabel,
  libraryDiscoveryShellLabel,
  normalizeLibraryDiscoveryQuery,
} from './emotion-taxonomy.js';
import { toLibraryDiscoveryTaxonomyFilters } from './discovery-query-contract.js';
import { findV7Visual } from './visual-assets.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

// Current Library taxonomy IDs predate the short names shown on Feeling cards.
// This only resolves approved visual identities; search filtering stays separate.
const EMOTION_VISUAL_IDS = Object.freeze({
  anxious: 'anxiety_worry', afraid: 'fear', sad: 'sadness',
  grieving: 'grief_loss', lonely: 'loneliness', angry: 'anger',
  hurt: 'hurt_betrayal', rejected: 'rejection', guilty: 'guilt',
  ashamed: 'shame', insecure: 'insecurity_unworthiness', doubtful: 'doubt',
  confused: 'confusion_uncertainty', discouraged: 'discouragement',
  hopeless: 'hopelessness', overwhelmed: 'overwhelm', stressed: 'stress',
  tired: 'tiredness_weariness', spiritually_dry: 'spiritual_dryness_distance',
  tempted: 'temptation', impatient: 'impatience_waiting',
  jealous: 'jealousy_envy', frustrated: 'frustration',
  numb: 'numbness_emptiness', joyful: 'joy', grateful: 'gratitude',
  peaceful: 'peace_contentment', hopeful: 'hope', excited: 'excitement',
  connected: 'love_connection',
});

function discoveryArtwork(item, registry, locale, label) {
  const filters = item.kind === 'emotion'
    ? toLibraryDiscoveryTaxonomyFilters({ emotions: [item.id] }).emotions
    : toLibraryDiscoveryTaxonomyFilters({ needs: [item.id] }).needs;
  const keys = filters.map(id => id.replace('.', ':'));
  if (item.kind === 'emotion' && EMOTION_VISUAL_IDS[item.id]) {
    keys.push('emotion:' + EMOTION_VISUAL_IDS[item.id]);
  }
  return findV7Visual(registry, keys, locale, label);
}

function chip(item, selected, locale, registry) {
  const { label, locale: labelLocale } = libraryDiscoveryLabel(item, locale);
  const visual = discoveryArtwork(item, registry, labelLocale, label);
  const image = visual
    ? `<img loading="lazy" decoding="async" src="${escapeHtml(visual.src)}" alt="${escapeHtml(visual.alt)}" style="object-position:${Math.round(visual.focalPoint.x * 100)}% ${Math.round(visual.focalPoint.y * 100)}%">`
    : '';
  return `<button type="button" class="bq-library-discovery__chip ${visual ? 'has-approved-art' : 'has-visual-fallback'}" data-library-discovery-kind="${item.kind}" data-library-discovery-id="${escapeHtml(item.id)}" aria-pressed="${String(selected.has(item.id))}" lang="${escapeHtml(labelLocale)}"><span class="bq-library-discovery__chip-art">${image}</span><span class="bq-library-discovery__chip-label">${escapeHtml(label)}</span></button>`;
}

function section({ kind, title, items, selected, locale, registry }) {
  return `<section class="bq-library-discovery__section" data-library-discovery-section="${kind}" aria-labelledby="bq-library-discovery-${kind}-title">
    <h2 id="bq-library-discovery-${kind}-title" class="bq-library-discovery__title">${escapeHtml(title)}</h2>
    <div class="bq-library-discovery__chips" role="group" aria-labelledby="bq-library-discovery-${kind}-title">${items.map(item => chip(item, selected, locale, registry)).join('')}</div>
  </section>`;
}

export function renderLibraryEmotionDiscovery(query = {}, locale = 'en', registry = null) {
  const normalized = normalizeLibraryDiscoveryQuery(query);
  return `<div class="bq-library-discovery" data-library-emotion-discovery>
    ${section({
      kind: 'emotion',
      title: libraryDiscoveryShellLabel('feelingQuestion', locale),
      items: LIBRARY_EMOTIONS,
      selected: new Set(normalized.emotions),
      locale,
      registry,
    })}
    ${section({
      kind: 'need',
      title: libraryDiscoveryShellLabel('needQuestion', locale),
      items: LIBRARY_NEEDS,
      selected: new Set(normalized.needs),
      locale,
      registry,
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
