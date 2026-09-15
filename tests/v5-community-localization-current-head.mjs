import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const community = await readFile(new URL('../src/features/community/index.js', import.meta.url), 'utf8');
const en = await readFile(new URL('../src/content/locales/en.js', import.meta.url), 'utf8');
const tl = await readFile(new URL('../src/content/locales/tl.js', import.meta.url), 'utf8');

// Current-head characterization for the remaining P0 Community localization gap.
// This deliberately records the exact missing ownership without pretending the
// migration is complete. A later patch-capable tranche should replace these
// assertions with the positive acceptance contract from PR #368.
assert.match(community, /Grow together without exposing private study\./);
assert.match(community, /Community connections could not load\./);
assert.doesNotMatch(community, /localization\?\.t|localization\.t|\bt\('community\./);
assert.doesNotMatch(en, /'community\./);
assert.doesNotMatch(tl, /'community\./);

// Runtime congregation/group values are already escaped and must remain data,
// not translation inventory, when the surface migrates.
assert.match(community, /esc\(row\.name\)/);
assert.match(community, /esc\(row\.roleLabel\)/);
assert.match(community, /esc\(row\.role\)/);
assert.match(community, /esc\(String\(row\.memberCount\)\)/);
assert.match(community, /esc\(String\(row\.maxMembers\)\)/);

console.log('PASS v5 Community current-head localization characterization');