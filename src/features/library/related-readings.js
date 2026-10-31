import { normalizeLibraryItem } from './contracts.js';

// This is a contextual public-topic lookup, not a profile, a feed, or an
// inference from a reader's private answers, searches, notes, or emotions.
export function relatedLibraryTopics(item) {
  let record;
  try { record = normalizeLibraryItem(item); } catch { return Object.freeze([]); }
  if (!['devotional', 'past_teaching'].includes(record.contentType)
      || !record.rights.allowedUses.includes('display')) return Object.freeze([]);
  return Object.freeze(record.taxonomyLinks
    .filter(link => link.kind === 'topic' && link.id.startsWith('topic.'))
    .map(link => link.id)
    .slice(0, 2));
}

export async function findRelatedPublishedReadings(repository, item, { limit = 3 } = {}) {
  const topics = relatedLibraryTopics(item);
  if (!topics.length) return Object.freeze([]);
  if (typeof repository?.listPublished !== 'function') throw new TypeError('Published Library repository required.');
  const boundedLimit = Math.max(1, Math.min(3, Number.isInteger(limit) ? limit : 3));
  // Keep read amplification bounded. The repository enforces publication; the
  // client independently verifies review, rights and taxonomy after the read.
  const responses = await Promise.all(topics.map(taxonomyId =>
    repository.listPublished({ taxonomyId, limit: 12 })));
  const candidates = new Map();
  for (const response of responses) {
    if (!Array.isArray(response?.items) || response.items.length > 12) throw new Error('Invalid related Library result.');
    for (const raw of response.items) {
      let record;
      try { record = normalizeLibraryItem(raw); } catch { continue; }
      if (record.id === item.id || candidates.has(record.id)
          || !['devotional', 'past_teaching'].includes(record.contentType)
          || !record.rights.allowedUses.includes('display')) continue;
      const matched = record.taxonomyLinks.filter(link => link.kind === 'topic' && topics.includes(link.id)).length;
      if (!matched) continue; // Reject adapters that ignore taxonomy filters.
      candidates.set(record.id, Object.freeze({
        id: record.id, title: record.title, contentType: record.contentType, locale: record.locale, matched,
      }));
    }
  }
  return Object.freeze([...candidates.values()]
    .sort((a, b) => b.matched - a.matched || a.title.localeCompare(b.title) || a.id.localeCompare(b.id))
    .slice(0, boundedLimit).map(({ matched, ...row }) => Object.freeze(row)));
}

const COPY = Object.freeze({
  en: { title: 'Related readings', open: 'Find related readings', loading: 'Finding published readings…', empty: 'No other reviewed readings on these topics yet.', error: 'Related readings are unavailable. Try again.', note: 'Matches public topics only. Your notes, searches and private answers are not used.' },
  tl: { title: 'Kaugnay na babasahin', open: 'Maghanap ng kaugnay na babasahin', loading: 'Hinahanap ang nailathalang babasahin…', empty: 'Wala pang ibang nasuring babasahin sa mga paksang ito.', error: 'Hindi makuha ang kaugnay na babasahin. Subukang muli.', note: 'Pampublikong paksa lamang ang batayan. Hindi ginagamit ang iyong mga tala, paghahanap o pribadong sagot.' },
  ceb: { title: 'May kalabotan nga mga basahon', open: 'Pangitag may kalabotan nga basahon', loading: 'Nangita og gipatik nga mga basahon…', empty: 'Wala pay laing nasusi nga basahon niining mga hilisgutan.', error: 'Dili makuha ang may kalabotan nga mga basahon. Sulayi pag-usab.', note: 'Publikong hilisgutan ra ang basihan. Dili gamiton ang imong nota, pagpangita o pribadong tubag.' },
});
export const relatedReadingsCopy = locale => Object.hasOwn(COPY, locale) ? COPY[locale] : COPY.en;
