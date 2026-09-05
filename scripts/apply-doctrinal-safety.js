const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const packsDir = path.join(root, 'data', 'packs', 'questions');
const manifestPath = path.join(root, 'data', 'packs', 'manifest.json');
const quarantineDir = path.join(root, 'data', 'quarantine', 'questions');
fs.mkdirSync(quarantineDir, { recursive: true });

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'data', 'doctrinal-safety.js'), 'utf8'), sandbox, { filename: 'data/doctrinal-safety.js' });
const policy = sandbox.window.BQ_DOCTRINAL_SAFETY;
if (!policy || typeof policy.classify !== 'function') throw new Error('Doctrinal safety policy is unavailable');

const bookNames = {
  GEN:'Genesis',EXO:'Exodus',LEV:'Leviticus',NUM:'Numbers',DEU:'Deuteronomy',JOS:'Joshua',JDG:'Judges',RUT:'Ruth',
  '1SA':'1 Samuel','2SA':'2 Samuel','1KI':'1 Kings','2KI':'2 Kings','1CH':'1 Chronicles','2CH':'2 Chronicles',EZR:'Ezra',NEH:'Nehemiah',
  EST:'Esther',JOB:'Job',PSA:'Psalms',PRO:'Proverbs',ECC:'Ecclesiastes',SNG:'Song of Songs',ISA:'Isaiah',JER:'Jeremiah',LAM:'Lamentations',
  EZK:'Ezekiel',DAN:'Daniel',HOS:'Hosea',JOL:'Joel',AMO:'Amos',OBA:'Obadiah',JON:'Jonah',MIC:'Micah',NAM:'Nahum',HAB:'Habakkuk',
  ZEP:'Zephaniah',HAG:'Haggai',ZEC:'Zechariah',MAL:'Malachi',MAT:'Matthew',MRK:'Mark',LUK:'Luke',JHN:'John',ACT:'Acts',ROM:'Romans',
  '1CO':'1 Corinthians','2CO':'2 Corinthians',GAL:'Galatians',EPH:'Ephesians',PHP:'Philippians',COL:'Colossians','1TH':'1 Thessalonians',
  '2TH':'2 Thessalonians','1TI':'1 Timothy','2TI':'2 Timothy',TIT:'Titus',PHM:'Philemon',HEB:'Hebrews',JAS:'James','1PE':'1 Peter',
  '2PE':'2 Peter','1JN':'1 John','2JN':'2 John','3JN':'3 John',JUD:'Jude',REV:'Revelation'
};

const CURATED_REWRITES = {
  'GAL:h9tg': 'In Galatians 2:16, how does Paul describe justification in relation to faith in Jesus Christ?',
  'ROM:yca7': 'In Romans 2:13, whom does Paul say are justified in the statement made in that verse?',
  'ROM:moo6': 'In Romans 3:24, how does Paul describe the way people are justified?',
  'ROM:rwo3': 'In Romans 3:28, what contrast does Paul make between faith and works of the law when discussing justification?'
};

function readItems(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(parsed)) throw new Error(`Expected question array in ${filePath}`);
  return parsed;
}

function stableKey(item) {
  if (item && item.id) return `id:${item.id}`;
  return `row:${item?.r || ''}\u0000${item?.q || ''}\u0000${item?.a || ''}`;
}

const stats = { total: 0, allow: 0, context: 0, quarantine: 0, rewritten: 0, recovered: 0, duplicateInputs: 0 };
const bookCounts = {};
const packFiles = fs.existsSync(packsDir) ? fs.readdirSync(packsDir).filter(x => x.endsWith('.json')) : [];
const heldFiles = fs.existsSync(quarantineDir) ? fs.readdirSync(quarantineDir).filter(x => x.endsWith('.json')) : [];
const files = [...new Set([...packFiles, ...heldFiles])].sort();

for (const file of files) {
  const code = path.basename(file, '.json');
  const sourcePath = path.join(packsDir, file);
  const quarantinePath = path.join(quarantineDir, file);
  const activeItems = readItems(sourcePath);
  const heldItems = readItems(quarantinePath);
  const heldKeys = new Set(heldItems.map(stableKey));
  const merged = new Map();

  for (const item of [...activeItems, ...heldItems]) {
    const key = stableKey(item);
    if (merged.has(key)) {
      stats.duplicateInputs++;
      continue;
    }
    merged.set(key, item);
  }

  const safe = [];
  const quarantined = [];

  for (const [key, raw] of merged) {
    stats.total++;
    const item = { ...raw };
    delete item.safety;
    const rewrite = CURATED_REWRITES[`${code}:${item.id}`];
    if (rewrite) {
      item.q = rewrite;
      stats.rewritten++;
    }
    const safety = policy.classify({ ...item, bookName: bookNames[code] || '' });
    stats[safety.action]++;
    const tagged = {
      ...item,
      safety: {
        action: safety.action,
        topics: safety.topics || [],
        ...(rewrite ? { curatedRewrite: true } : {})
      }
    };
    if (safety.action === 'quarantine') quarantined.push(tagged);
    else {
      safe.push(tagged);
      if (heldKeys.has(key)) stats.recovered++;
    }
  }

  if (safe.length || fs.existsSync(sourcePath)) fs.writeFileSync(sourcePath, JSON.stringify(safe) + '\n');
  bookCounts[code] = { questions: safe.length, quarantined_questions: quarantined.length };

  if (quarantined.length) fs.writeFileSync(quarantinePath, JSON.stringify(quarantined, null, 2) + '\n');
  else if (fs.existsSync(quarantinePath)) fs.unlinkSync(quarantinePath);
}

if (!fs.existsSync(manifestPath)) throw new Error('Imported-pack manifest is missing');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
for (const row of manifest.question_books || []) {
  if (bookCounts[row.code]) Object.assign(row, bookCounts[row.code]);
}
manifest.doctrinal_safety = {
  version: policy.version || 1,
  policy: 'Scripture + CAMACOP alignment; sensitive imported questions screened before normal play',
  ...stats
};
fs.writeFileSync(manifestPath, JSON.stringify(manifest) + '\n');

console.log(JSON.stringify(stats, null, 2));
