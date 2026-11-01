// Bounded, opt-in Reader preview. These labels never transform provider text.
const copy = Object.freeze({
  en: Object.freeze({
    searchTranslation: 'Search this translation', search: 'Search',
    external: 'Open this passage externally', translation: 'Translation',
    tools: 'Reader tools', context: 'Context', settings: 'Reading and offline settings',
    previous: 'Previous', next: 'Next', close: 'Close',
  }),
  ilo: Object.freeze({
    searchTranslation: 'Agbiruk iti daytoy a patarus', search: 'Agbiruk',
    external: 'Lukatan daytoy a teksto iti sabali a pagbasa', translation: 'Patarus',
    tools: 'Dagiti ramit iti panagbasa', context: 'Konteksto',
    settings: 'Dagiti pagpilian iti panagbasa ken offline',
    previous: 'Napalabas', next: 'Sumaruno', close: 'Irikep',
  }),
});

export function readerInterfaceText(language, key) {
  if (!Object.hasOwn(copy.en, key)) throw new Error('Unknown Reader interface label.');
  return (language === 'ilo' ? copy.ilo : copy.en)[key];
}
