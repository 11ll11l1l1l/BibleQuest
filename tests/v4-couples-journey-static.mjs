// BibleQuest V4 Couples Communication Journey static acceptance contract.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const baselineSha='c7a78d71354696130efa07e6d7f010deae7795a0';
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');

for(const relative of['src/app/couples-cloud.js','src/features/couples-cloud/index.js']){
  const current=read(relative);
  const baseline=execFileSync('git',['show',`${baselineSha}:${relative}`],{cwd:root,encoding:'utf8'});
  assert.equal(current,baseline,`${relative} must remain byte-for-byte unchanged while adding the local Communication Journey.`);
}

const content=read('src/content/couples-journey.js');
const service=read('src/app/couples-family.js');
const feature=read('src/features/couples-family/index.js');
const css=read('src/ui/couples-journey-v4.css');
const html=read('index.html');
const spec=read('V4_COUPLES_JOURNEY_SPEC.md');
const workflow=read('.github/workflows/v3-regression.yml');

for(const id of['growing-together','mostly-connected','mixed-signals','strained-connection','rebuild-carefully'])
  assert.ok(content.includes(`id:'${id}'`),`Missing Communication Journey level ${id}.`);
assert.equal((content.match(/domain:'/g)||[]).length,12,'Communication Journey must retain exactly 12 assessment items.');
for(const token of['min:52,max:60','min:43,max:51','min:34,max:42','min:25,max:33','min:12,max:24'])
  assert.ok(content.includes(token),`Communication Journey threshold contract disappeared: ${token}.`);
assert.ok(content.includes("COUPLES_JOURNEY_SAFETY_ITEM_ID='safety'"),'Communication Journey safety signal owner disappeared.');

for(const token of[
  "const STORAGE_KEY='couples-family-local'",
  'const VERSION=2',
  'const JOURNEY_LIMIT=12',
  'analyzeJourneyAssessment',
  'recordJourneyAssessment',
  'latestJourneyAssessment',
  'ratings[COUPLES_JOURNEY_SAFETY_ITEM_ID]<=2',
  'journeyAssessments:journeyAssessments.slice(-JOURNEY_LIMIT)'
]) assert.ok(service.includes(token),`Communication Journey service contract disappeared: ${token}.`);
assert.equal((service.match(/STORAGE_KEY=/g)||[]).length,1,'Couples local journey must not introduce a second storage owner.');
assert.ok(!/\bfetch\s*\(/.test(service),'Couples local journey must not create a direct backend/API owner.');
assert.ok(!service.includes('answers:'),'Persisted Couples snapshot must not expose raw journey answers.');

for(const hook of[
  'data-couples-mode="journey"',
  'data-couples-journey',
  'data-journey-rating',
  'data-journey-submit',
  'data-couples-journey-result',
  'data-journey-level',
  'data-journey-safety-priority',
  'data-journey-retake',
  'data-journey-listen',
  'data-journey-repair'
]) assert.ok(feature.includes(hook),`Communication Journey presentation hook disappeared: ${hook}.`);
assert.ok(feature.includes('not a diagnosis, spiritual grade, compatibility score, or partner comparison'),'Journey assessment must retain non-diagnostic/non-competitive framing.');
assert.ok(feature.includes('The saved history keeps only the summary—not your 12 individual answers.'),'Journey UI must explain raw-answer non-persistence.');
assert.ok(feature.includes('fear, threats, coercion, stalking, or violence'),'Journey UI must retain the safety boundary.');
assert.ok(!/\bfetch\s*\(/.test(feature),'Couples journey presentation must not create direct API ownership.');

for(const selector of[
  '.bq-couples-journey-latest',
  '.bq-couples-journey-item',
  '.bq-couples-journey-ladder',
  '.bq-couples-journey-level.is-current',
  '.bq-couples-journey-domains',
  '[data-journey-safety-priority]'
]) assert.ok(css.includes(selector),`Communication Journey V4 presentation missing ${selector}.`);
assert.ok(css.includes('@media(max-width:520px)'),'Communication Journey must retain narrow-phone composition.');
assert.ok(css.includes('@media(max-width:340px)'),'Communication Journey must retain 320px-class composition.');
assert.ok(css.includes('@media(prefers-contrast:more)'),'Communication Journey must retain higher-contrast support.');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'),'Communication Journey must retain reduced-motion support.');
assert.ok(!/https?:\/\//.test(css),'Communication Journey V4 CSS must not introduce remote assets.');
assert.ok(html.includes('href="src/ui/couples-journey-v4.css"'),'Communication Journey V4 stylesheet must be active.');
assert.ok(html.indexOf('src/ui/couples-journey-v4.css')>html.indexOf('src/ui/community-family-v4.css'),'Communication Journey overrides must load after the shared community/family V4 layer.');

for(const token of['five communication levels','Do **not** persist the 12 raw questionnaire answers','Couples Cloud remains separate','not a diagnosis'])
  assert.ok(spec.toLowerCase().includes(token.toLowerCase()),`Communication Journey repository specification lost: ${token}.`);

for(const test of['tests/v4-couples-journey-edge.mjs','tests/v4-couples-journey-static.mjs','tests/v4-couples-journey-smoke.mjs','tests/v3-couples-family-edge.mjs','tests/v3-couples-family-smoke.mjs','tests/v3-couples-cloud-edge.mjs','tests/v3-couples-cloud-smoke.mjs'])
  assert.ok(workflow.includes(test),`Accumulated CI must retain Couples evidence: ${test}.`);

console.log('BibleQuest v4 Couples Communication Journey static acceptance passed.');
