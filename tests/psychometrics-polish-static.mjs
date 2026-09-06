import fs from 'node:fs';
import assert from 'node:assert/strict';

const polish=fs.readFileSync(new URL('../psychometrics-polish.js',import.meta.url),'utf8');

assert.doesNotMatch(polish,/new\s+MutationObserver\s*\(/,'Psychometrics polish must not create a self-triggering subtree mutation loop');
assert.match(polish,/root\.addEventListener\('click',\(\)=>setTimeout\(polish,50\)\)/,'Psychometrics polish must remain event-driven after user interactions');
assert.match(polish,/if\(order\.innerHTML!==html\)order\.innerHTML=html/,'Psychometrics result-order rewrite must be idempotent');

console.log('Psychometrics polish stays event-driven and idempotent');
