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

function scanDirectory(dir, label) {
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(x => x.endsWith('.json')).sort() : [];
  const stats = { total: 0, allow: 0, context: 0, quarantine: 0 };
  const examples = { allow: [], context: [], quarantine: [] };

  for (const file of files) {
    const code = path.basename(file, '.json');
    const items = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    for (const item of items) {
      stats.total++;
      const clean = { ...item };
      delete clean.safety;
      const result = policy.classify({ ...clean, bookName: BOOK_NAMES[code] || '' });
      stats[result.action]++;
      if (examples[result.action].length < 12) {
        examples[result.action].push(`${file}:${item.r || ''} ${item.q || ''}`);
      }
    }
  }

  console.log(`${label}: ${stats.total} questions — allow ${stats.allow}, context ${stats.context}, quarantine ${stats.quarantine}`);
  return { stats, examples };
}

const normal = scanDirectory(path.join('data', 'packs', 'questions'), 'Normal imported packs');
if (normal.stats.quarantine > 0) {
  console.error('\nERROR: high-risk questions remain in normal play:');
  for (const x of normal.examples.quarantine) console.error(`- ${x}`);
  process.exit(1);
}

const held = scanDirectory(path.join('data', 'quarantine', 'questions'), 'Held imported questions');
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
