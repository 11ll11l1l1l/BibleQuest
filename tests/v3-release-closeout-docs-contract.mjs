import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const files = {
  status: read('DEVELOPMENT_STATUS_V3.md'),
  priority: read('DEVELOPMENT_PRIORITY_V3.md'),
  handoff: read('DEVELOPMENT_HANDOFF_V3.md'),
  reconciliation: read('RECONCILIATION_V3.md'),
  prompt: read('CONTINUE_PROMPT_V3.md'),
  assignment: read('ASSIGNMENT_RESPONSE_PRESENCE_MIGRATION_V3.md'),
  closeout: read('RELEASE_CLOSEOUT_V3.md')
};

const RELEASE = '04bd51bfc4ff16a3b42d13e47e95e637999b4880';
const PRODUCT = 'cf17f36f9f041aee4715271eaebbe8581fc2c067';
const PROD_RUN = '34612873935';

for (const [name, text] of Object.entries(files)) {
  assert(text.trim().length > 200, `${name} closeout document is unexpectedly short.`);
}

for (const key of ['status','priority','handoff','reconciliation','prompt','closeout']) {
  assert(files[key].includes(RELEASE), `${key} is missing the promoted release commit.`);
  assert(files[key].includes(PRODUCT), `${key} is missing the exact-green product SHA.`);
}

for (const key of ['status','priority','handoff','reconciliation','closeout']) {
  assert(files[key].includes(PROD_RUN), `${key} is missing production verifier evidence.`);
}

for (const key of ['status','handoff','reconciliation','prompt','assignment','closeout']) {
  assert(files[key].includes('20260911144939'), `${key} is missing Assignment migration history.`);
}

for (const key of ['status','handoff','reconciliation','prompt','closeout']) {
  assert(files[key].includes('20260911144950'), `${key} is missing Calendar v1 migration history.`);
  assert(files[key].includes('20260911145003'), `${key} is missing Calendar v1.5 migration history.`);
}

assert(files.assignment.includes('APPLIED + LIVE VERIFIED'), 'Assignment migration guide did not close the migration state.');
assert(files.status.includes('No credible P0/P1 release blocker'), 'Status must record the executed release-gate outcome without claiming bug-free status.');
assert(files.priority.includes('production-integration gate are complete'), 'Priority still treats the completed release gate as unfinished.');
assert(files.handoff.includes('Do not reapply these migrations'), 'Handoff must protect against replaying the release migrations.');
assert(files.prompt.includes('Do **not** reapply them'), 'Continuation prompt must protect against replaying the release migrations.');
assert(files.reconciliation.includes('integrated, promoted and live verified'), 'Reconciliation status is stale.');
assert(files.closeout.includes('released and live verified'), 'Release closeout does not state its final status.');

console.log('BibleQuest v3 release-closeout documentation contract passed.');
