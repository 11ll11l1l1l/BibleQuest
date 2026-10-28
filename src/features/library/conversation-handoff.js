import { normalizeLibraryItem } from './contracts.js';
import { CONVERSATION_SERIES, conversationText } from '../../content/conversation-decks.js';

// Public, reviewed taxonomy only. No reading text, item IDs or private responses
// enter session URLs/state. This selects an existing series, never a new prompt.
const topicSeries = Object.freeze({
  'topic.prayer': 'trust', 'topic.trust': 'trust',
  'topic.community': 'together', 'topic.relationships': 'together',
  'topic.love': 'follow', 'topic.life-in-christ': 'follow',
});
const copy = {
  en: { title:'Discuss together', open:'Open discussion cards', note:'Choose a related series for your group. The host previews cards before sending; this reading and your private answers are not shared.' },
  tl: { title:'Sama-samang talakayin', open:'Buksan ang mga card ng talakayan', note:'Pumili ng kaugnay na serye para sa grupo. Mag-preview muna ang namamahala bago magpadala; hindi ibinabahagi ang babasahing ito o ang pribado mong sagot.' },
  ceb: { title:'Hisgoti nga magkauban', open:'Ablihi ang mga card sa panaghisgot', note:'Pilia ang may kalabotang serye alang sa grupo. Mag-preview una ang nagdumala sa dili pa ipadala; dili ipaambit kining basahon o ang imong pribadong tubag.' },
};
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function libraryConversationSeries(item) {
  let record;
  try { record = normalizeLibraryItem(item); } catch { return []; }
  if (!['devotional','past_teaching'].includes(record.contentType) || !record.rights.allowedUses.includes('display')) return [];
  const ids = new Set(record.taxonomyLinks.filter(link => link.kind === 'topic').map(link => topicSeries[link.id]).filter(Boolean));
  return CONVERSATION_SERIES.filter(series => ids.has(series.id));
}
export function renderLibraryConversationHandoff(item, locale='en') {
  const series = libraryConversationSeries(item);
  if (!series.length) return '';
  const t = copy[locale] || copy.en;
  return `<section class="bq-library-conversation" data-library-conversation><h2>${esc(t.title)}</h2><p>${esc(t.note)}</p><div class="bq-account-actions">${series.map(row => `<a class="bq-secondary-button" href="#/conversation-deck?series=${encodeURIComponent(row.id)}" data-library-conversation-series="${esc(row.id)}">${esc(t.open)} · ${esc(conversationText(row.title, locale))}</a>`).join('')}</div></section>`;
}
