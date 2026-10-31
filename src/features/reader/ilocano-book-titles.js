// Canonical code -> publisher's displayed Ilocano book name.
// Source: Ti Biblia / Ilocano ULB, © 2019 Door43 World Missions Community,
// https://ebible.org/iloulb/ (CC BY-SA 4.0, see data/packs/ilocano/LICENSE.html).
// Labels are display-only. Canonical book identity, search, saved references,
// progress, licensed verses and navigation stay under the existing Reader owner.
export const ILOCANO_BOOK_TITLES = Object.freeze({
  GEN: 'Genesis', EXO: 'Exodo', LEV: 'Levitico', NUM: 'Numero', DEU: 'Deuteronomio',
  JOS: 'Josue', JDG: 'Uk-ukom', RUT: 'Ruth', '1SA': 'I Samuel', '2SA': 'II Samuel',
  '1KI': '1 Ar-ari', '2KI': '2 Ar-Ari', '1CH': '1 Cronicas', '2CH': '2 Cronicas',
  EZR: 'Ezra', NEH: 'Nehemias', EST: 'Ester', JOB: 'Job',
  PSA: 'Dagiti Salmo', PRO: 'Dagiti Proverbio', ECC: 'Eclesiastes', SNG: 'Kanta ni Solomon',
  ISA: 'Isaias', JER: 'Jeremias', LAM: 'Un-unnoy', EZK: 'Ezekiel',
  DAN: 'Daniel', HOS: 'Oseas', JOL: 'Joel', AMO: 'Amos',
  OBA: 'Obidias', JON: 'Jonas', MIC: 'Mikias', NAM: 'Nahum',
  HAB: 'Habakkuk', ZEP: 'Sofonias', HAG: 'Haggeo', ZEC: 'Zacarias', MAL: 'Malakias',
  MAT: 'Mateo', MRK: 'Marcos', LUK: 'Lucas', JHN: 'Juan',
  ACT: 'Dagiti Aramid', ROM: 'Roma', '1CO': '1 taga-Corinto', '2CO': '2 Corinto',
  GAL: 'Taga-Galacia', EPH: 'Taga-Efeso', PHP: 'Pilipos', COL: 'Colosas',
  '1TH': '1 Taga-Tesalonica', '2TH': '2 Taga-Tesalonica',
  '1TI': '1 Timoteo', '2TI': '2 Timoteo', TIT: 'Tito', PHM: 'Filemon',
  HEB: 'Hebreo', JAS: 'Santiago', '1PE': '1 Pedro', '2PE': 'Maikaddua a Pedro',
  '1JN': '1 Juan', '2JN': '2 Juan', '3JN': '3 Juan', JUD: 'Judas', REV: 'Paltiing',
});
export function ilocanoReaderBookName(code, fallback = '') {
  return Object.prototype.hasOwnProperty.call(ILOCANO_BOOK_TITLES, code)
    ? ILOCANO_BOOK_TITLES[code] : fallback;
}
export function ilocanoReaderBookOptions(books) {
  return books.map(book => ({ ...book, displayName: ilocanoReaderBookName(book.code, book.name) }));
}
