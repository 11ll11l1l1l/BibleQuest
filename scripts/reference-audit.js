const fs = require('fs');
const path = require('path');

const manifestPath = path.join('data', 'packs', 'manifest.json');
const questionDir = path.join('data', 'packs', 'questions');
const bibleDir = path.join('data', 'packs', 'bible');
const errors = [];
const warnings = [];

function fail(message) { errors.push(message); }
function warn(message) { warnings.push(message); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function text(value) { return typeof value === 'string' && value.trim().length > 0; }

if (!fs.existsSync(manifestPath)) fail('Imported-pack manifest is missing');
const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath) : {};
const bibleMeta = new Map((manifest.bible_books || []).map(x => [x.code, x]));
const questionMeta = new Map((manifest.question_books || []).map(x => [x.code, x]));

function verseIndexFor(code) {
  const meta = bibleMeta.get(code);
  if (!meta) {
    fail(`${code}: question pack has no matching Bible metadata entry`);
    return null;
  }
  const expectedPath = path.join('data', 'packs', 'bible', `${code}.json`).replace(/\\/g, '/');
  if (String(meta.path || '').replace(/\\/g, '/') !== expectedPath) {
    fail(`${code}: Bible manifest path mismatch (${meta.path || 'missing'} != ${expectedPath})`);
  }
  const file = path.join(bibleDir, `${code}.json`);
  if (!fs.existsSync(file)) {
    fail(`${code}: Bible pack is missing at ${file}`);
    return null;
  }
  const rows = readJson(file);
  if (!Array.isArray(rows) || !rows.length) {
    fail(`${code}: Bible pack is empty or invalid`);
    return null;
  }
  const verses = new Set();
  const maxVerse = new Map();
  for (const [index, row] of rows.entries()) {
    const c = Number(row?.c), v = Number(row?.v);
    if (!Number.isInteger(c) || c < 1 || !Number.isInteger(v) || v < 1 || !text(row?.t)) {
      fail(`${code}: invalid Bible row at index ${index}`);
      continue;
    }
    const key = `${c}:${v}`;
    if (verses.has(key)) fail(`${code}: duplicate Bible verse ${key}`);
    verses.add(key);
    maxVerse.set(c, Math.max(maxVerse.get(c) || 0, v));
  }
  if (Number(meta.verses || 0) !== verses.size) {
    fail(`${code}: manifest verse count ${meta.verses} does not match pack count ${verses.size}`);
  }
  return { verses, maxVerse };
}

function parseReference(raw) {
  const value = String(raw || '').trim();
  const m = /^(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/.exec(value);
  if (!m) return null;
  const start = { c: Number(m[1]), v: Number(m[2]) };
  const end = m[4] ? { c: Number(m[3] || m[1]), v: Number(m[4]) } : { ...start };
  if (![start.c, start.v, end.c, end.v].every(Number.isInteger)) return null;
  if (start.c < 1 || start.v < 1 || end.c < 1 || end.v < 1) return null;
  if (end.c < start.c || (end.c === start.c && end.v < start.v)) return null;
  return { value, start, end };
}

let audited = 0;
let rangeCount = 0;
let bookCount = 0;

for (const [code, meta] of questionMeta) {
  bookCount++;
  const expectedPath = path.join('data', 'packs', 'questions', `${code}.json`).replace(/\\/g, '/');
  if (String(meta.path || '').replace(/\\/g, '/') !== expectedPath) {
    fail(`${code}: question manifest path mismatch (${meta.path || 'missing'} != ${expectedPath})`);
  }
  const file = path.join(questionDir, `${code}.json`);
  if (!fs.existsSync(file)) {
    fail(`${code}: question pack is missing at ${file}`);
    continue;
  }
  const rows = readJson(file);
  if (!Array.isArray(rows)) {
    fail(`${code}: question pack is not an array`);
    continue;
  }
  if (Number(meta.questions || 0) !== rows.length) {
    fail(`${code}: manifest question count ${meta.questions} does not match pack count ${rows.length}`);
  }
  const bible = verseIndexFor(code);
  if (!bible) continue;
  const ids = new Set();

  for (const [index, item] of rows.entries()) {
    audited++;
    const at = `${code}[${index}]${item?.id ? ` ${item.id}` : ''}`;
    if (!text(item?.id)) fail(`${at}: missing source question id`);
    else if (ids.has(item.id)) fail(`${at}: duplicate question id within book`);
    else ids.add(item.id);
    if (!text(item?.q)) fail(`${at}: missing question text`);
    if (!text(item?.a)) fail(`${at}: missing source answer`);

    const ref = parseReference(item?.r);
    if (!ref) {
      fail(`${at}: unsupported or malformed Scripture reference ${JSON.stringify(item?.r || '')}`);
      continue;
    }
    const startKey = `${ref.start.c}:${ref.start.v}`;
    const endKey = `${ref.end.c}:${ref.end.v}`;
    if (!bible.verses.has(startKey)) fail(`${at}: reference start ${startKey} does not exist in the bundled BSB ${code} pack`);
    if (!bible.verses.has(endKey)) fail(`${at}: reference end ${endKey} does not exist in the bundled BSB ${code} pack`);

    if (ref.start.c === ref.end.c && ref.start.v !== ref.end.v) {
      rangeCount++;
      for (let v = ref.start.v; v <= ref.end.v; v++) {
        if (!bible.verses.has(`${ref.start.c}:${v}`)) {
          fail(`${at}: range ${ref.value} crosses missing verse ${ref.start.c}:${v}`);
          break;
        }
      }
    } else if (ref.start.c !== ref.end.c) {
      rangeCount++;
      const startMax = bible.maxVerse.get(ref.start.c) || 0;
      if (ref.start.v > startMax) fail(`${at}: range start ${startKey} exceeds chapter ${ref.start.c}`);
    }
  }
}

const questionFiles = fs.existsSync(questionDir) ? fs.readdirSync(questionDir).filter(x => x.endsWith('.json')) : [];
for (const file of questionFiles) {
  const code = path.basename(file, '.json');
  if (!questionMeta.has(code)) warn(`${code}: question file exists but is absent from manifest.question_books`);
}

for (const message of warnings) console.warn(`WARN: ${message}`);
if (errors.length) {
  for (const message of errors) console.error(`ERROR: ${message}`);
  console.error(`\nScripture reference audit failed with ${errors.length} error(s).`);
  process.exit(1);
}

console.log(`Scripture reference audit passed: ${audited} imported questions across ${bookCount} books; ${rangeCount} verse ranges checked against bundled BSB coordinates.`);
