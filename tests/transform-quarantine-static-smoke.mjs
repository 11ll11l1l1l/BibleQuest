import fs from 'node:fs';
import assert from 'node:assert/strict';

const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const quarantine=fs.readFileSync(new URL('../transform-quarantine.js',import.meta.url),'utf8');

for(const retired of ['transformation.js','transformation-taglish.js','transformation-safe.js','transformation-state-guard.js','operational-hardening.js']){
  assert.ok(!index.includes(`<script src="${retired}"></script>`),`${retired} must remain outside production boot while Transform is quarantined`);
  assert.ok(!sw.includes(`'./${retired}'`),`${retired} must remain outside the active PWA cache while Transform is quarantined`);
}
for(const retired of ['transformation.css','transformation-taglish.css','transformation-safe.css']){
  assert.ok(!index.includes(`href="${retired}"`),`${retired} must remain outside production styles while Transform is quarantined`);
  assert.ok(!sw.includes(`'./${retired}'`),`${retired} must remain outside the active PWA cache while Transform is quarantined`);
}
assert.match(index,/transform-quarantine\.css/);
assert.match(index,/transform-quarantine\.js/);
assert.match(quarantine,/stopImmediatePropagation\(\)/,'Transform clicks must fail closed before stale handlers can run');
assert.match(quarantine,/delete window\.BQ_TRANSFORMATION/,'quarantine must remove the public Transform runtime');
assert.ok(!/MutationObserver/.test(quarantine),'quarantine itself must not add a mutation observer');
console.log('Transform quarantine static smoke passed');
