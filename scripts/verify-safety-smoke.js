const fs = require('fs');
const vm = require('vm');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('data/doctrinal-safety.js','utf8'), sandbox);
const policy = sandbox.window.BQ_DOCTRINAL_SAFETY;
const cases = JSON.parse(fs.readFileSync('data/safety-smoke-test.json','utf8'));
let failed = 0;
for (const item of cases) {
  const got = policy.classify(item).action;
  if (got !== item.expect) {
    failed++;
    console.error(`FAIL: ${item.q} expected ${item.expect}, got ${got}`);
  } else console.log(`PASS: ${item.expect} - ${item.q}`);
}
if (failed) process.exit(1);
