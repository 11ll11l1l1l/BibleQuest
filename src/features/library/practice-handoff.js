import { normalizeLibraryItem } from './contracts.js';

// Deterministic links from reviewed public topic tags. Never read learner answers,
// reading prose, emotion selections or practice reflections for recommendations.
const choices = Object.freeze([
  { id: 'morning-10', topics: ['topic.prayer', 'topic.life-in-christ'], titles: { en: 'Morning surrender · 10 minutes', tl: 'Pagsuko sa Diyos sa umaga · 10 minuto', ceb: 'Pagtugyan sa Diyos sa buntag · 10 minuto' } },
  { id: 'silencio-10', topics: ['topic.trust'], titles: { en: 'Silencio · 10 minutes', tl: 'Silencio · 10 minuto', ceb: 'Silencio · 10 minuto' } },
  { id: 'fellowship', topics: ['topic.community', 'topic.relationships'], titles: { en: 'Fellowship', tl: 'Pakikisama sa pananampalataya', ceb: 'Pakig-uban sa pagtuo' } },
  { id: 'service', topics: ['topic.love'], titles: { en: 'Service', tl: 'Paglilingkod', ceb: 'Pag-alagad' } },
]);
const copy = Object.freeze({
  en: { title: 'Put this into practice', note: 'Based on this reading’s public topics. Open a guide, then choose when to begin. Your reflections stay private.' },
  tl: { title: 'Isabuhay ito', note: 'Batay sa pampublikong paksa ng babasahin. Buksan ang gabay at piliin kung kailan magsisimula. Mananatiling pribado ang iyong pagninilay.' },
  ceb: { title: 'Ikinabuhi kini', note: 'Gibase sa publikong mga hilisgutan sa basahon. Ablihi ang giya ug pilia kon kanus-a magsugod. Pribado gihapon ang imong pagpamalandong.' },
});
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function libraryPracticeRecommendations(item) {
  let record;
  try { record = normalizeLibraryItem(item); } catch { return []; }
  if (!['devotional', 'past_teaching'].includes(record.contentType) || !record.rights.allowedUses.includes('display')) return [];
  const topics = new Set(record.taxonomyLinks.filter(link => link.kind === 'topic').map(link => link.id));
  return choices.filter(choice => choice.topics.some(id => topics.has(id))).slice(0, 3).map(choice => Object.freeze({ id: choice.id, titles: Object.freeze({ ...choice.titles }) }));
}
export function renderLibraryPracticeHandoff(item, requestedLocale = 'en') {
  const recommendations = libraryPracticeRecommendations(item);
  if (!recommendations.length) return '';
  const locale = Object.hasOwn(copy, requestedLocale) ? requestedLocale : 'en', t = copy[locale];
  return `<section class="bq-library-practices" data-library-practice-handoff lang="${locale}"><h2>${esc(t.title)}</h2><p>${esc(t.note)}</p><div class="bq-account-actions">${recommendations.map(choice => `<a class="bq-secondary-button" href="#/spiritual-practices?practice=${choice.id}" data-library-practice="${choice.id}">${esc(choice.titles[locale])}</a>`).join('')}</div></section>`;
}
