import fs from 'node:fs';
import assert from 'node:assert/strict';

const runtime=fs.readFileSync(new URL('../runtime-feature-registry.js',import.meta.url),'utf8');

assert.match(runtime,/window\.addEventListener\('bq-modern-home-rendered',install\)/,'Kids Games injection must follow the explicit modern Home render lifecycle');
assert.doesNotMatch(runtime,/new\s+MutationObserver\s*\(/,'Runtime feature registry must not observe the entire document for Home-only button injection');
assert.match(runtime,/if\(!hubs\|\|hubs\.querySelector\('\[data-kids-games\]'\)\)return/,'Kids Games injection must remain idempotent');

console.log('Runtime feature registry stays event-driven and avoids document-wide mutation churn');
