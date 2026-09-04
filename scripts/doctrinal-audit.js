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

const dir = path.join('data', 'packs', 'questions');
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(x => x.endsWith('.json')).sort() : [];
let total = 0;
let allowed = 0;
let contextual = 0;
let quarantined = 0;
const examples = [];

for (const file of files) {
  const items = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  for (const item of items) {
    total++;
    const result = policy.classify(item);
    if (result.action === 'allow') allowed++;
    else if (result.action === 'context') contextual++;
    else {
      quarantined++;
      if (examples.length < 20) examples.push(`${file}:${item.r || ''} ${item.q}`);
    }
  }
}

console.log(`Doctrinal audit scanned ${total} imported questions.`);
console.log(`Allowed: ${allowed}`);
console.log(`Context-required: ${contextual}`);
console.log(`Quarantined from normal play: ${quarantined}`);
if (examples.length) {
  console.log('\nSample quarantined items:');
  for (const x of examples) console.log(`- ${x}`);
}

// Quarantined imported items are expected; this script verifies that the classifier runs
// over every pack. Core authored questions are enforced separately by content-audit.js.
