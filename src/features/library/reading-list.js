import {normalizeLibraryItem, libraryError} from './contracts.js';
const types = new Set(['book', 'devotional', 'past_teaching']);
const idValid = id => typeof id === 'string' && id.trim() === id && id.length > 0 && id.length <= 200 && !/[\x00-\x1f\x7f]/.test(id);
export function createLibraryReadingList({storage, getOwner}) {
  if (!storage?.read || !storage?.write || typeof getOwner !== 'function') throw new Error('Reading list requires private storage and an owner.');
  const check = expected => { if (!expected || expected !== getOwner()) throw libraryError('Reading list account changed.', 'BQ_READING_LIST_OWNER'); };
  const key = owner => `library-reading-list.v1.${owner}`;
  function list(expected = getOwner()) {
    check(expected);
    const raw = storage.read(key(expected), null);
    if (raw == null) return [];
    if (raw.version !== 1 || !Array.isArray(raw.items) || raw.items.length > 100) throw libraryError('Reading list format unavailable.', 'BQ_READING_LIST_FORMAT');
    const seen = new Set();
    const rows = raw.items.filter(row => {
      if (!idValid(row?.id) || seen.has(row.id) || !types.has(row.contentType) || typeof row.title !== 'string' || !row.title.trim() || row.title.length > 240 || typeof row.savedAt !== 'string' || !Number.isFinite(Date.parse(row.savedAt))) return false;
      seen.add(row.id); return true;
    }).slice(0, 100).map(({id, title, contentType, savedAt}) => Object.freeze({id, title, contentType, savedAt}));
    check(expected); return rows;
  }
  function save(item, expected = getOwner()) {
    check(expected);
    const record = normalizeLibraryItem(item);
    if (!idValid(record.id) || !record.rights.allowedUses.some(use => ['display', 'external_link', 'host', 'hosted_reading'].includes(use))) throw libraryError('Reading cannot be saved.', 'BQ_READING_LIST_ITEM');
    const previous = list(expected), existing = previous.find(row => row.id === record.id);
    if (!existing && previous.length >= 100) throw libraryError('Reading list is full.', 'BQ_READING_LIST_FULL');
    const row = {id: record.id, title: record.title.slice(0, 240), contentType: record.contentType, savedAt: existing?.savedAt || new Date().toISOString()};
    const items = [row, ...previous.filter(old => old.id !== row.id)];
    check(expected); storage.write(key(expected), {version: 1, items});
    return items;
  }
  function remove(id, expected = getOwner()) {
    check(expected);
    const items = list(expected).filter(row => row.id !== id);
    check(expected); storage.write(key(expected), {version: 1, items}); return items;
  }
  return Object.freeze({owner: getOwner, list, save, remove});
}
const COPY = {
  en: {title:'Saved for later',save:'Save for later',remove:'Remove from saved',refresh:'Refresh saved list',empty:'No saved readings yet.',note:'This device only. Saved links may become unavailable; opening rechecks publication and access.',saved:'Saved on this device.',removed:'Removed from this device.',error:'Reading list unavailable. Retry without clearing your data.',full:'Reading list is full (100). Remove an item before saving another.',retry:'Retry'},
  tl: {title:'Naka-save para basahin mamaya',save:'I-save para basahin mamaya',remove:'Alisin sa naka-save',refresh:'I-refresh ang naka-save',empty:'Wala pang naka-save na babasahin.',note:'Sa device na ito lamang. Maaaring hindi na magamit ang naka-save na link; muling sinusuri ang publikasyon at access sa pagbukas.',saved:'Na-save sa device na ito.',removed:'Inalis sa device na ito.',error:'Hindi magamit ang listahan. Subukang muli nang hindi binubura ang data.',full:'Puno na ang listahan (100). Mag-alis muna bago mag-save.',retry:'Subukang muli'},
  ceb: {title:'Gi-save aron basahon unya',save:'I-save aron basahon unya',remove:'Tangtanga sa gi-save',refresh:'I-refresh ang gi-save',empty:'Wala pay gi-save nga basahon.',note:'Dinhi ra sa device. Mahimong dili na magamit ang gi-save nga link; susihon pag-usab ang publikasyon ug access sa pag-abli.',saved:'Natipig niining device.',removed:'Gitangtang niining device.',error:'Dili magamit ang listahan. Sulayi pag-usab nga dili papason ang data.',full:'Puno na ang listahan (100). Pagtangtang una sa dili pa mag-save.',retry:'Sulayi pag-usab'},
};
export const readingListCopy = locale => Object.hasOwn(COPY, locale) ? COPY[locale] : COPY.en;
