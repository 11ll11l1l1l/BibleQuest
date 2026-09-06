const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('data/doctrinal-safety.js', 'utf8'), sandbox, { filename: 'data/doctrinal-safety.js' });
const policy = sandbox.window.BQ_DOCTRINAL_SAFETY;

if (!policy || typeof policy.classify !== 'function') {
  console.error('ERROR: doctrinal safety policy is missing or invalid');
  process.exit(1);
}

const manifestPath = path.join('data', 'packs', 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('ERROR: imported-pack manifest is missing');
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const manifestPolicyVersion = Number(manifest.doctrinal_safety?.version || 0);
if (manifestPolicyVersion !== Number(policy.version || 0)) {
  console.error(`ERROR: imported packs were sanitized with doctrinal policy v${manifestPolicyVersion || 'unknown'}, but runtime policy is v${policy.version}. Run scripts/apply-doctrinal-safety.js and commit the reconciled packs before release.`);
  process.exit(1);
}

const BOOK_NAMES = {
  GEN:'Genesis',EXO:'Exodus',LEV:'Leviticus',NUM:'Numbers',DEU:'Deuteronomy',JOS:'Joshua',JDG:'Judges',RUT:'Ruth',
  '1SA':'1 Samuel','2SA':'2 Samuel','1KI':'1 Kings','2KI':'2 Kings','1CH':'1 Chronicles','2CH':'2 Chronicles',EZR:'Ezra',NEH:'Nehemiah',
  EST:'Esther',JOB:'Job',PSA:'Psalms',PRO:'Proverbs',ECC:'Ecclesiastes',SNG:'Song of Songs',ISA:'Isaiah',JER:'Jeremiah',LAM:'Lamentations',
  EZK:'Ezekiel',DAN:'Daniel',HOS:'Hosea',JOL:'Joel',AMO:'Amos',OBA:'Obadiah',JON:'Jonah',MIC:'Micah',NAM:'Nahum',HAB:'Habakkuk',
  ZEP:'Zephaniah',HAG:'Haggai',ZEC:'Zechariah',MAL:'Malachi',MAT:'Matthew',MRK:'Mark',LUK:'Luke',JHN:'John',ACT:'Acts',ROM:'Romans',
  '1CO':'1 Corinthians','2CO':'2 Corinthians',GAL:'Galatians',EPH:'Ephesians',PHP:'Philippians',COL:'Colossians','1TH':'1 Thessalonians',
  '2TH':'2 Thessalonians','1TI':'1 Timothy','2TI':'2 Timothy',TIT:'Titus',PHM:'Philemon',HEB:'Hebrews',JAS:'James','1PE':'1 Peter',
  '2PE':'2 Peter','1JN':'1 John','2JN':'2 John','3JN':'3 John',JUD:'Jude',REV:'Revelation'
};

function sameTopics(stored, current) {
  const a = Array.isArray(stored) ? [...stored].sort() : [];
  const b = Array.isArray(current) ? [...current].sort() : [];
  return JSON.stringify(a) === JSON.stringify(b);
}

function scanDirectory(dir, label) {
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(x => x.endsWith('.json')).sort() : [];
  const stats = { total: 0, allow: 0, context: 0, quarantine: 0 };
  const examples = { allow: [], context: [], quarantine: [] };
  const perBook = {};
  const tagMismatches = [];

  for (const file of files) {
    const code = path.basename(file, '.json');
    const items = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    if (!Array.isArray(items)) {
      console.error(`ERROR: expected question array in ${path.join(dir, file)}`);
      process.exit(1);
    }
    perBook[code] = items.length;
    for (const item of items) {
      stats.total++;
      const clean = { ...item };
      delete clean.safety;
      const result = policy.classify({ ...clean, bookName: BOOK_NAMES[code] || '' });
      stats[result.action]++;
      if (examples[result.action].length < 12) examples[result.action].push(`${file}:${item.r || ''} ${item.q || ''}`);
      const storedAction = item.safety?.action;
      const storedTopics = item.safety?.topics;
      if (storedAction !== result.action || !sameTopics(storedTopics, result.topics || [])) {
        if (tagMismatches.length < 12) {
          tagMismatches.push(`${file}:${item.r || ''} stored=${storedAction || 'missing'} current=${result.action} ${item.q || ''}`);
        }
      }
    }
  }

  console.log(`${label}: ${stats.total} questions — allow ${stats.allow}, context ${stats.context}, quarantine ${stats.quarantine}`);
  return { stats, examples, perBook, tagMismatches };
}

const normal = scanDirectory(path.join('data', 'packs', 'questions'), 'Normal imported packs');
const held = scanDirectory(path.join('data', 'quarantine', 'questions'), 'Held imported questions');

const tagMismatches = [...normal.tagMismatches, ...held.tagMismatches].slice(0, 12);
if (tagMismatches.length) {
  console.error('\nERROR: committed safety tags do not match the current classifier:');
  for (const x of tagMismatches) console.error(`- ${x}`);
  process.exit(1);
}

if (normal.stats.quarantine > 0) {
  console.error('\nERROR: high-risk questions remain in normal play:');
  for (const x of normal.examples.quarantine) console.error(`- ${x}`);
  process.exit(1);
}

const recoverable = held.stats.allow + held.stats.context;
if (held.stats.total) {
  console.log(`Recoverable from current quarantine under policy v${policy.version}: ${recoverable}`);
  console.log(`Still requires quarantine: ${held.stats.quarantine}`);
  if (held.stats.quarantine) {
    console.log('\nRemaining hard-quarantine items:');
    for (const x of held.examples.quarantine) console.log(`- ${x}`);
  }
  if (recoverable) {
    console.error('\nERROR: questions remain quarantined even though the current policy now permits contextual or normal learning use. Reconcile the packs before release:');
    for (const x of [...held.examples.allow, ...held.examples.context].slice(0, 12)) console.error(`- ${x}`);
    process.exit(1);
  }
}

const countErrors = [];
const manifestCodes = new Set();
for (const row of manifest.question_books || []) {
  manifestCodes.add(row.code);
  const active = normal.perBook[row.code] || 0;
  const quarantined = held.perBook[row.code] || 0;
  if (Number(row.questions || 0) !== active || Number(row.quarantined_questions || 0) !== quarantined) {
    countErrors.push(`${row.code}: manifest questions=${row.questions || 0}, quarantined=${row.quarantined_questions || 0}; files questions=${active}, quarantined=${quarantined}`);
  }
}
for (const code of new Set([...Object.keys(normal.perBook), ...Object.keys(held.perBook)])) {
  if (!manifestCodes.has(code)) countErrors.push(`${code}: committed question/quarantine file is missing from manifest.question_books`);
}
const combined = {
  total: normal.stats.total + held.stats.total,
  allow: normal.stats.allow + held.stats.allow,
  context: normal.stats.context + held.stats.context,
  quarantine: normal.stats.quarantine + held.stats.quarantine
};
for (const key of ['total', 'allow', 'context', 'quarantine']) {
  if (Number(manifest.doctrinal_safety?.[key] ?? -1) !== combined[key]) {
    countErrors.push(`doctrinal_safety.${key}: manifest=${manifest.doctrinal_safety?.[key] ?? 'missing'} files=${combined[key]}`);
  }
}
if (countErrors.length) {
  console.error('\nERROR: imported-pack manifest counts do not match the committed corpus:');
  for (const x of countErrors.slice(0, 12)) console.error(`- ${x}`);
  process.exit(1);
}

console.log(`Doctrinal corpus audit passed under policy v${policy.version}.`);
