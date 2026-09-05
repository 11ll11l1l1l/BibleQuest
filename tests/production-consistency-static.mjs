import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const doctrinalAudit=read('scripts/doctrinal-audit.js');
const doctrinalApply=read('scripts/apply-doctrinal-safety.js');
const release=read('scripts/validate-release.mjs');

assert.match(doctrinalAudit,/manifest\.doctrinal_safety\?\.version/,'doctrinal audit must verify generated corpus policy version');
assert.match(doctrinalAudit,/high-risk questions remain in normal play/,'high-risk normal-play leakage must block release');
assert.match(doctrinalAudit,/questions remain quarantined even though the current policy now permits/,'recoverable quarantined questions must block release');
assert.match(doctrinalAudit,/committed safety tags do not match the current classifier/,'stale committed safety tags must block release');
assert.match(doctrinalAudit,/manifest counts do not match the committed corpus/,'stale generated manifest counts must block release');
assert.match(doctrinalApply,/const files = \[\.\.\.new Set\(\[\.\.\.packFiles, \.\.\.heldFiles\]\)\]\.sort\(\)/,'sanitizer must reconcile active and held corpus together');
assert.match(doctrinalApply,/stats\.recovered\+\+/,'sanitizer must record recovered questions');
assert.match(doctrinalApply,/version: policy\.version \|\| 1/,'generated manifest must record the current doctrinal policy version');
assert.match(release,/doctrinal/i,'canonical release validation must include doctrinal validation');

console.log('BibleQuest doctrinal production consistency guard passed');
