import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { BIBLE_BOOKS } from '../src/core/bible.js';
export const ILOCANO_SOURCE_SHA256 = 'f8d3659dad50ae2a24b5b453da1aa2fc8ea1657bc354e456cb1c74512ae45d54';
const ALIASES = Object.freeze({ SOL: 'SNG', EZE: 'EZK', JOE: 'JOL', NAH: 'NAM', MAR: 'MRK', JOH: 'JHN', PHI: 'PHP', JAM: 'JAS', '1JO': '1JN', '2JO': '2JN', '3JO': '3JN' });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export function parseIlocanoVpl(text) {
  const books = new Map(BIBLE_BOOKS.map(book => [book.code, []])), seen = new Set(), empty = [];
  for (const [index, line] of text.replace(/^\uFEFF/, '').split(/\r?\n/).entries()) {
    if (!line && index === text.replace(/\r/g, '').split('\n').length - 1) continue;
    const match = /^([1-3]?[A-Z]{2,3}) (\d+):(\d+) (.*)$/.exec(line);
    if (!match) throw new Error(`Malformed VPL line ${index + 1}.`);
    const code = ALIASES[match[1]] || match[1], book = BIBLE_BOOKS.find(row => row.code === code), c = Number(match[2]), v = Number(match[3]);
    if (!book || c < 1 || c > book.chapters || v < 1 || v > 176) throw new Error(`Invalid source reference on line ${index + 1}.`);
    const key = `${code} ${c}:${v}`;
    if (seen.has(key)) throw new Error(`Duplicate source reference ${key}.`);
    seen.add(key);
    if (!match[4].trim()) { empty.push(key); continue; }
    // Words/punctuation remain exactly as exported; only reference codes/JSON structure change.
    books.get(code).push({ c, v, t: match[4] });
  }
  return { books, empty, sourceAddresses: seen.size };
}
export function importIlocano({ sourcePath, licensePath, output = 'data/packs/ilocano' }) {
  const raw = readFileSync(sourcePath), license = readFileSync(licensePath);
  if (hash(raw) !== ILOCANO_SOURCE_SHA256) throw new Error('Ilocano source checksum changed. Review the new source before importing.');
  const licenseText = license.toString('utf8');
  if (!licenseText.includes('creativecommons.org/licenses/by-sa/4.0/') || !licenseText.includes('Door43 World Missions Community')) throw new Error('Source archive license is missing the expected attribution/CC BY-SA grant.');
  const parsed = parseIlocanoVpl(raw.toString('utf8'));
  const total = [...parsed.books.values()].reduce((sum, rows) => sum + rows.length, 0);
  if (total !== 31090 || parsed.empty.length !== 12 || parsed.sourceAddresses !== 31102) throw new Error('Pinned Ilocano source coverage changed.');
  for (const book of BIBLE_BOOKS) {
    const chapters = new Set(parsed.books.get(book.code).map(row => row.c));
    if (chapters.size !== book.chapters) throw new Error(`Missing chapter text in ${book.code}.`);
  }
  mkdirSync(output, { recursive: true });
  const outputs = [];
  for (const book of BIBLE_BOOKS) {
    const bytes = Buffer.from(JSON.stringify(parsed.books.get(book.code)) + '\n');
    writeFileSync(join(output, `${book.code}.json`), bytes);
    outputs.push({ code: book.code, chapters: book.chapters, records: parsed.books.get(book.code).length, bytes: bytes.length, sha256: hash(bytes) });
  }
  writeFileSync(join(output, 'LICENSE.html'), license);
  const provenance = {
    schemaVersion: 1, translationId: 'ilo', sourceId: 'iloulb', title: 'Ti Biblia / Unlocked Literal Bible',
    sourceUrl: 'https://ebible.org/Scriptures/iloulb_vpl.zip', sourceSha256: ILOCANO_SOURCE_SHA256,
    archiveSha256: '83f76c15b46cb7a20a664ac31aff41d4d0143c43f50ea0658387c2707b1db124', licenseSha256: hash(license),
    copyright: '© 2019 Door43 World Missions Community', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceCopyrightUrl: 'https://ebible.org/iloulb/copyright.htm', modifications: 'Reference code mapping and per-book JSON delivery only; source words and punctuation unchanged. No endorsement implied. Derived packs remain CC BY-SA 4.0.',
    canonicalBooks: 66, chapters: 1189, textRecords: total, sourceAddresses: parsed.sourceAddresses,
    emptySourceVerses: parsed.empty, emptyVersePolicy: 'No text invented or borrowed from another translation; selecting a source-empty address reports verse unavailable.', books: outputs,
  };
  writeFileSync(join(output, 'SOURCE.json'), JSON.stringify(provenance, null, 2) + '\n');
  return provenance;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const sourcePath = process.argv[2], licensePath = process.argv[3];
  if (!sourcePath || !licensePath) throw new Error('Usage: node --experimental-strip-types scripts/import-ilocano-vpl.mjs <iloulb_vpl.txt> <iloulb_about.htm>');
  const result = importIlocano({ sourcePath, licensePath });
  console.log(`Ilocano ULB: ${result.canonicalBooks} books, ${result.chapters} chapters, ${result.textRecords} text records; ${result.emptySourceVerses.length} source-empty addresses retained in provenance.`);
}
