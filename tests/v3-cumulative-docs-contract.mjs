import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(path, 'utf8');
const docs = {
  priority: read('DEVELOPMENT_PRIORITY_V3.md'),
  reconciliation: read('RECONCILIATION_V3.md'),
  status: read('DEVELOPMENT_STATUS_V3.md'),
  handoff: read('DEVELOPMENT_HANDOFF_V3.md'),
  continuation: read('CONTINUE_PROMPT_V3.md')
};

const candidate = 'cf17f36f9f041aee4715271eaebbe8581fc2c067';
const run = '34610903807';
const production = '77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac';
for (const [name, text] of Object.entries(docs)) {
  assert.ok(text.includes(candidate), `${name} missing cumulative exact-green SHA`);
  assert.ok(text.includes(run), `${name} missing cumulative verifier run`);
  assert.ok(text.includes(production), `${name} missing production baseline`);
}

assert.match(docs.reconciliation, /previous.*divergence.*resolved|divergence is now resolved/is);
assert.match(docs.status, /cumulative exact-green post-release product SHA/i);
assert.match(docs.handoff, /do not restart the Line A \+ Line B merge/i);
assert.match(docs.priority, /previous Line A \/ Line B divergence is resolved/i);
assert.match(docs.continuation, /do \*\*not\*\* redo the former Line A\/Line B integration/i);

for (const text of [docs.reconciliation, docs.status, docs.handoff, docs.priority, docs.continuation]) {
  assert.match(text, /NOT APPLIED \/ UNKNOWN|NOT APPLIED \/ production integration blocked or pending/i, 'migration state must remain explicit');
}

assert.ok(read('ASSIGNMENT_RESPONSE_PRESENCE_MIGRATION_V3.md').includes('bbbceb057c631f08ec32826384ef6fcd61da4527'));
const iconMap = read('docs/V3_ICON_ASSET_MAP.md');
assert.ok(iconMap.includes('70 unique PNG files'));
assert.equal([...iconMap.matchAll(/^\| `[^`]+\.png` \|/gm)].length, 70);

console.log('BibleQuest v3 cumulative documentation contract: PASS');
