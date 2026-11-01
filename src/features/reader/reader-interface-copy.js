// Bounded, opt-in Reader preview. These labels never transform provider text.
const copy = Object.freeze({
  en: Object.freeze({
    searchTranslation: 'Search this translation', search: 'Search',
    external: 'Open this passage externally', translation: 'Translation',
    tools: 'Reader tools', context: 'Context', settings: 'Reading and offline settings',
    previous: 'Previous', next: 'Next', close: 'Close',
    results: 'Search results', shown: '{count} shown', empty: 'No matches found.',
    skipped: '{count} book pack(s) were unavailable during this search.',
    markRead: 'Mark read', markedRead: 'Marked read', alreadyRead: 'Already marked read.',
    credited: 'Marked read · progress already credited', awarded: 'Marked read · +{count} XP',
    markError: 'Could not mark chapter read.', searching: 'Searching…',
    searchingDownloads: 'Searching downloads…', searchingSource: 'Searching Scripture source…',
    searchingBooks: 'Searching downloaded Bible books…', searchError: 'Search failed.',
  }),
  ilo: Object.freeze({
    searchTranslation: 'Agbiruk iti daytoy a patarus', search: 'Agbiruk',
    external: 'Lukatan daytoy a teksto iti sabali a pagbasa', translation: 'Patarus',
    tools: 'Dagiti ramit iti panagbasa', context: 'Konteksto',
    settings: 'Dagiti pagpilian iti panagbasa ken offline',
    previous: 'Napalabas', next: 'Sumaruno', close: 'Irikep',
    results: 'Dagiti resulta ti panagbiruk', shown: '{count} ti naipakita', empty: 'Awan ti nasarakan.',
    skipped: '{count} a pakete ti libro ti saan a magamit iti daytoy a panagbiruk.',
    markRead: 'Markaan a nabasa', markedRead: 'Namarkaan a nabasa', alreadyRead: 'Namarkaanen a nabasa.',
    credited: 'Namarkaan a nabasa · naibilangen ti progreso', awarded: 'Namarkaan a nabasa · +{count} XP',
    markError: 'Saan a namarkaan ti kapitulo a nabasa.', searching: 'Agbirbiruk…',
    searchingDownloads: 'Agbirbiruk kadagiti na-download…', searchingSource: 'Agbirbiruk iti pagtaudan ti Nasantoan a Surat…',
    searchingBooks: 'Agbirbiruk kadagiti na-download a libro ti Biblia…', searchError: 'Saan a nagballigi ti panagbiruk.',
  }),
});

export function readerInterfaceText(language, key, count = 0) {
  if (!Object.hasOwn(copy.en, key)) throw new Error('Unknown Reader interface label.');
  return (language === 'ilo' ? copy.ilo : copy.en)[key].replace('{count}', String(Number.isSafeInteger(count) && count >= 0 ? count : 0));
}
