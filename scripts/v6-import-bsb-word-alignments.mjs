import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCRIPTURE_PACKAGE_SOURCES, buildScripturePackageManifest } from './v6-generate-scripture-manifests.mjs';
import { buildBsbAlignmentManifest } from './v6-bsb-alignment-manifest.mjs';
import { validateHaysAudioInventory } from './v6-hays-source-inventory.mjs';
import { validateChapterAlignment } from '../src/v6/reader/audio-alignment.ts';

const BOOK_CHAPTERS = Object.freeze({
  GEN:50,EXO:40,LEV:27,NUM:36,DEU:34,JOS:24,JDG:21,RUT:4,'1SA':31,'2SA':24,'1KI':22,'2KI':25,'1CH':29,'2CH':36,
  EZR:10,NEH:13,EST:10,JOB:42,PSA:150,PRO:31,ECC:12,SNG:8,ISA:66,JER:52,LAM:5,EZK:48,DAN:12,HOS:14,JOL:3,AMO:9,
  OBA:1,JON:4,MIC:7,NAM:3,HAB:3,ZEP:3,HAG:2,ZEC:14,MAL:4,MAT:28,MRK:16,LUK:24,JHN:21,ACT:28,ROM:16,'1CO':16,
  '2CO':13,GAL:6,EPH:6,PHP:4,COL:4,'1TH':5,'2TH':3,'1TI':6,'2TI':4,TIT:3,PHM:1,HEB:13,JAS:5,'1PE':5,'2PE':3,
  '1JN':5,'2JN':1,'3JN':1,JUD:1,REV:22,
});

function fail(message) { throw new Error(message); }
const keyOf = (book, chapter) => `${book.toUpperCase()}-${chapter}`;

function alignmentTokens(value) {
  return String(value ?? '').normalize('NFKD').replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}_\s]/gu, ' ').toLowerCase().trim().split(/\s+/u).filter(Boolean);
}

function currentBibleChapters(bookPacks) {
  const output = new Map();
  for (const [book, rows] of Object.entries(bookPacks)) {
    if (!Array.isArray(rows)) fail(`BSB pack ${book} must be an array.`);
    const chapters = new Map();
    for (const row of rows) {
      if (!Number.isSafeInteger(row?.c) || row.c < 1 || !Number.isSafeInteger(row?.v) || row.v < 1 || typeof row.t !== 'string') {
        fail(`BSB pack ${book} contains a malformed verse row.`);
      }
      const verses = chapters.get(row.c) ?? new Map();
      if (verses.has(row.v)) fail(`BSB pack ${book} has a duplicate verse ${row.c}:${row.v}.`);
      verses.set(row.v, row.t);
      chapters.set(row.c, verses);
    }
    output.set(book.toUpperCase(), chapters);
  }
  return output;
}


/** Remaps the aligner's line-ordinal verse keys back to canonical Bible verse numbers. */
export function remapBsbAlignmentVerseIds({ records, exportManifest, scriptureContentVersion }) {
  if (!Array.isArray(records)) fail('Word alignment records must be an array.');
  if (!exportManifest || exportManifest.translationId !== 'bsb' || !Array.isArray(exportManifest.files)) {
    fail('BSB text-export manifest is invalid.');
  }
  if (exportManifest.scriptureContentVersion !== scriptureContentVersion) {
    fail('BSB text-export manifest belongs to a different Scripture content revision.');
  }
  const byChapter = new Map();
  for (const row of exportManifest.files) {
    const book = String(row?.book ?? '').toUpperCase(), chapter = Number(row?.chapter);
    const verseNumbers = row?.verseNumbers;
    if (!BOOK_CHAPTERS[book] || !Number.isSafeInteger(chapter) || chapter < 1 || chapter > BOOK_CHAPTERS[book]
      || !Array.isArray(verseNumbers) || !verseNumbers.length
      || verseNumbers.some((verse, index) => !Number.isSafeInteger(verse) || verse < 1 || (index > 0 && verse <= verseNumbers[index - 1]))) {
      fail('BSB text-export manifest contains an invalid canonical verse map.');
    }
    const key = keyOf(book, chapter);
    if (byChapter.has(key)) fail(`BSB text-export manifest duplicates ${key}.`);
    byChapter.set(key, verseNumbers);
  }

  return records.map(record => {
    const book = String(record?.book ?? '').toUpperCase(), chapter = Number(record?.chapter);
    const key = keyOf(book, chapter);
    const verseNumbers = byChapter.get(key);
    if (!verseNumbers) fail(`BSB text-export manifest has no verse map for ${key}.`);
    if (!record?.verses || typeof record.verses !== 'object' || Array.isArray(record.verses)) {
      fail(`Word alignment ${key} has no verse map.`);
    }
    const ordinalKeys = Object.keys(record.verses).map(Number).sort((a, b) => a - b);
    if (ordinalKeys.length !== verseNumbers.length
      || ordinalKeys.some((verse, index) => verse !== index + 1)) {
      fail(`Word alignment ${key} does not use the expected line-ordinal verse keys.`);
    }
    const verses = {};
    verseNumbers.forEach((canonicalVerse, index) => {
      verses[String(canonicalVerse)] = record.verses[String(index + 1)];
    });
    return Object.freeze({ ...record, book, verses: Object.freeze(verses) });
  });
}

/** Converts BSB-publishing/bsb-align word rows after checking verse text against this checkout's BSB packs. */
export function convertBsbWordAlignments({ records, durations, bookPacks, metadata, scriptureContentVersion, audioInventory = null, requireComplete = true }) {
  if (!metadata || metadata.translationId !== 'bsb') fail('Audio metadata must declare translationId "bsb".');
  for (const key of ['source', 'license', 'alignmentSource', 'alignmentRevision', 'contentVersion']) {
    if (typeof metadata[key] !== 'string' || !metadata[key].trim()) fail(`Audio metadata requires ${key}.`);
  }
  if (!/^[a-f0-9]{40}$/i.test(metadata.alignmentRevision.trim())) {
    fail('Audio metadata alignmentRevision must be an immutable 40-hex Git commit.');
  }
  if (!Array.isArray(records) || !Array.isArray(durations)) fail('Word alignment records and duration records must be arrays.');
  if (typeof scriptureContentVersion !== 'string' || !scriptureContentVersion.trim()) fail('Current BSB Scripture content version is required.');
  let audioByChapter = null;
  if (audioInventory !== null) {
    const audioValidation = validateHaysAudioInventory(audioInventory, { requireComplete });
    if (!audioValidation.valid) fail('Hays audio inventory is invalid: ' + audioValidation.issues.join('; ') + '.');
    if (metadata.contentVersion !== audioInventory.contentVersion) {
      fail('Audio metadata contentVersion does not match the exact Hays audio inventory.');
    }
    audioByChapter = new Map(audioInventory.files.map(row => [keyOf(row.book, row.chapter), row]));
  } else if (requireComplete) {
    fail('Full BSB timing import requires the exact Hays audio inventory.');
  }
  const bible = currentBibleChapters(bookPacks);
  const durationByChapter = new Map();
  for (const row of durations) {
    const book = String(row?.book ?? '').toUpperCase(), chapter = Number(row?.chapter);
    if (!BOOK_CHAPTERS[book] || !Number.isSafeInteger(chapter) || chapter < 1 || chapter > BOOK_CHAPTERS[book]
      || !Number.isFinite(row?.durationSeconds) || row.durationSeconds <= 0) fail('Audio duration manifest contains an invalid chapter or duration.');
    const key = keyOf(book, chapter);
    if (durationByChapter.has(key)) fail(`Duplicate audio duration for ${key}.`);
    const audioRow = audioByChapter?.get(key);
    if (audioByChapter && !audioRow) fail(`Exact Hays audio inventory has no chapter ${key}.`);
    if (audioRow && Number(Number(row.durationSeconds).toFixed(6)) !== Number(Number(audioRow.durationSeconds).toFixed(6))) {
      fail(`Measured duration for ${key} does not match the exact Hays audio inventory.`);
    }
    durationByChapter.set(key, row.durationSeconds);
  }

  const alignments = [], chapterKeys = new Set(), audit = [];
  for (const record of records) {
    const book = String(record?.book ?? '').toUpperCase(), chapterText = String(record?.chapter ?? ''), chapter = Number(chapterText);
    if (!BOOK_CHAPTERS[book] || !Number.isSafeInteger(chapter) || chapter < 1 || chapter > BOOK_CHAPTERS[book]) fail('Word alignment contains an invalid BSB chapter identity.');
    const key = keyOf(book, chapter);
    if (chapterKeys.has(key)) fail(`Duplicate word alignment for ${key}.`);
    chapterKeys.add(key);
    const durationSeconds = durationByChapter.get(key);
    if (!durationSeconds) fail(`Missing measured audio duration for ${key}.`);
    const audioRow = audioByChapter?.get(key) ?? null;
    const expectedVerses = bible.get(book)?.get(chapter);
    if (!expectedVerses) fail(`Current BSB pack has no text for ${key}.`);
    if (!record.verses || typeof record.verses !== 'object' || Array.isArray(record.verses)) fail(`Word alignment ${key} has no verse map.`);
    const verseRows = [];
    let averageWordScoreTotal = 0, scoredWords = 0, lowConfidenceWords = 0, unscoredWords = 0;
    const expectedVerseEntries = [...expectedVerses.entries()].sort((a, b) => a[0] - b[0]);
    const expectedVerseNumbers = expectedVerseEntries.map(([verse]) => verse);
    const verseKeys = Object.keys(record.verses).map(Number).sort((a, b) => a - b);
    if (verseKeys.length !== expectedVerses.size) fail(`Word alignment ${key} covers ${verseKeys.length} verses; current BSB text has ${expectedVerses.size}.`);
    if (verseKeys.some((verse, index) => !Number.isSafeInteger(verse) || verse !== expectedVerseNumbers[index])) {
      fail(`Word alignment ${key} verse identities do not match current BSB text.`);
    }
    for (const [verse, expectedText] of expectedVerseEntries) {
      const words = record.verses[String(verse)];
      if (!Array.isArray(words) || words.length === 0) fail(`Word alignment ${key}:${verse} is missing timed words.`);
      const scriptureWords = alignmentTokens(expectedText), timingWords = [];
      let previousEnd = -Infinity;
      for (const word of words) {
        if (typeof word?.text !== 'string' || !Number.isFinite(word.start) || !Number.isFinite(word.end)
          || word.start < 0 || word.end <= word.start || word.start < previousEnd || word.end > durationSeconds) {
          fail(`Word timing in ${key}:${verse} has invalid, overlapping, or out-of-duration bounds.`);
        }
        timingWords.push(...alignmentTokens(word.text));
        previousEnd = word.end;
        if (Number.isFinite(word.score) && word.score >= 0 && word.score <= 1) {
          averageWordScoreTotal += word.score; scoredWords += 1;
          if (word.score < 0.3) lowConfidenceWords += 1;
        } else unscoredWords += 1;
      }
      if (scriptureWords.length !== timingWords.length || scriptureWords.some((token, index) => token !== timingWords[index])) {
        fail(`Word text mismatch against current BSB ${key}:${verse}; regenerate the timings for this Scripture revision.`);
      }
      verseRows.push({ verse, startSeconds: words[0].start, endSeconds: words.at(-1).end });
    }
    const alignment = {
      schemaVersion: 1, translationId: 'bsb', contentVersion: metadata.contentVersion,
      scriptureContentVersion, book, chapter, durationSeconds,
      ...(audioRow ? { audioSha256: audioRow.sha256, audioByteLength: audioRow.byteLength } : {}),
      source: metadata.source, license: metadata.license,
      alignmentSource: `${metadata.alignmentSource}@${metadata.alignmentRevision.trim().toLowerCase()}`,
      verses: verseRows,
    };
    const validation = validateChapterAlignment(alignment, {
      translationId: 'bsb', book, chapter, verseCount: expectedVerses.size, verseNumbers: expectedVerseNumbers,
    });
    if (!validation.valid) fail(`Converted alignment ${key} is invalid: ${validation.issues.join('; ')}.`);
    alignments.push(Object.freeze(alignment));
    audit.push(Object.freeze({
      book, chapter, verseCount: verseRows.length, wordCount: scoredWords + unscoredWords,
      scoredWords,
      averageWordScore: scoredWords ? averageWordScoreTotal / scoredWords : null,
      lowConfidenceWords, unscoredWords,
    }));
  }
  if (requireComplete) {
    const expected = Object.entries(BOOK_CHAPTERS).flatMap(([book, chapters]) => Array.from({ length: chapters }, (_, index) => keyOf(book, index + 1)));
    const missingAlignments = expected.filter(key => !chapterKeys.has(key));
    const missingDurations = expected.filter(key => !durationByChapter.has(key));
    if (missingAlignments.length || missingDurations.length) {
      fail(`Full BSB timing import incomplete: ${missingAlignments.length} chapter alignments and ${missingDurations.length} durations missing.`);
    }
    const extraDurations = [...durationByChapter.keys()].filter(key => !chapterKeys.has(key));
    if (extraDurations.length) fail(`Full BSB timing import has ${extraDurations.length} extra duration rows.`);
    if (!audioByChapter || audioByChapter.size !== expected.length) fail('Full BSB timing import requires all 1,189 exact Hays audio identities.');
  }
  const frozenAlignments = Object.freeze(alignments);
  const manifest = buildBsbAlignmentManifest({
    alignments: frozenAlignments, metadata, scriptureContentVersion,
    audioInventorySha256: audioInventory?.inventorySha256 ?? null, complete: requireComplete,
  });
  return Object.freeze({
    translationId: 'bsb', scriptureContentVersion,
    alignments: frozenAlignments,
    manifest,
    audit: Object.freeze({ chapters: audit.length, verses: audit.reduce((sum, row) => sum + row.verseCount, 0), words: audit.reduce((sum, row) => sum + row.wordCount, 0), lowConfidenceWords: audit.reduce((sum, row) => sum + row.lowConfidenceWords, 0), rows: Object.freeze(audit) }),
  });
}

async function walkJson(root, directory = root) {
  const rows = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) rows.push(...await walkJson(root, path));
    else if (entry.isFile() && /_\d{3}_words\.json$/i.test(entry.name)) rows.push(path);
  }
  return rows;
}

async function main(argv) {
  let allowPartial = false, verseMapPath = null, manifestOutputPath = null, audioInventoryPath = null;
  const args = [];
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--allow-partial') { allowPartial = true; continue; }
    if (value === '--verse-map') {
      verseMapPath = argv[index + 1];
      if (!verseMapPath) fail('--verse-map requires the BibleQuest BSB text-export manifest path.');
      index += 1;
      continue;
    }
    if (value === '--audio-inventory') {
      audioInventoryPath = argv[index + 1];
      if (!audioInventoryPath) fail('--audio-inventory requires the exact Hays audio inventory path.');
      index += 1;
      continue;
    }
    if (value === '--manifest-output') {
      manifestOutputPath = argv[index + 1];
      if (!manifestOutputPath) fail('--manifest-output requires an output path.');
      index += 1;
      continue;
    }
    args.push(value);
  }
  const [wordAlignmentDir, metadataPath, durationsPath, outputPath] = args;
  if (!wordAlignmentDir || !metadataPath || !durationsPath || !outputPath || args.length !== 4) {
    fail('Usage: node scripts/v6-import-bsb-word-alignments.mjs <bsb-align-output-dir> <audio-source.json> <durations.json> <alignments.json> [--verse-map <text-export-manifest.json>] [--audio-inventory <audio-source-inventory.json>] [--manifest-output <alignment-manifest.json>] [--allow-partial]');
  }
  const root = resolve(wordAlignmentDir);
  const paths = (await walkJson(root)).sort();
  let records = await Promise.all(paths.map(async path => JSON.parse(await readFile(path, 'utf8'))));
  const metadata = JSON.parse(await readFile(resolve(metadataPath), 'utf8'));
  const durations = JSON.parse(await readFile(resolve(durationsPath), 'utf8'));
  const audioInventory = audioInventoryPath ? JSON.parse(await readFile(resolve(audioInventoryPath), 'utf8')) : null;
  if (!allowPartial && !audioInventory) fail('Full BSB timing import requires --audio-inventory from the exact staged Hays source.');
  const bsb = SCRIPTURE_PACKAGE_SOURCES.find(source => source.translationId === 'bsb');
  const scriptureContentVersion = buildScripturePackageManifest(process.cwd(), bsb).contentVersion;
  if (verseMapPath) {
    const exportManifest = JSON.parse(await readFile(resolve(verseMapPath), 'utf8'));
    records = remapBsbAlignmentVerseIds({ records, exportManifest, scriptureContentVersion });
  }
  const result = convertBsbWordAlignments({
    records, durations, metadata, scriptureContentVersion, audioInventory,
    bookPacks: Object.fromEntries(await Promise.all(Object.keys(BOOK_CHAPTERS).map(async book => [book, JSON.parse(await readFile(join(process.cwd(), 'data', 'packs', 'bible', `${book}.json`), 'utf8'))]))),
    requireComplete: !allowPartial,
  });
  await writeFile(resolve(outputPath), `${JSON.stringify(result.alignments, null, 2)}\n`, { flag: 'wx' });
  if (manifestOutputPath) {
    await writeFile(resolve(manifestOutputPath), `${JSON.stringify(result.manifest, null, 2)}\n`, { flag: 'wx' });
  }
  const scoredWords = result.audit.rows.reduce((sum, row) => sum + row.scoredWords, 0);
  const scoreTotal = result.audit.rows.reduce((sum, row) => sum + (row.averageWordScore ?? 0) * row.scoredWords, 0);
  console.log(`Converted ${result.audit.chapters} BSB chapter alignments / ${result.audit.verses} verses / ${result.audit.words} words for ${scriptureContentVersion}; average available word score ${scoredWords ? (scoreTotal / scoredWords).toFixed(3) : 'unavailable'}; ${result.audit.lowConfidenceWords} words below 0.30.`);
  if (result.audit.lowConfidenceWords || result.audit.rows.some(row => row.unscoredWords)) console.warn('Review the imported alignment scores before marking textAlignment exact in source.json.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main(process.argv.slice(2));
