// BibleQuest V4 Daily Journey page acceptance contract.
// Daily Journey keeps the existing service/content owners while V4 presentation
// is certified and unknown runtime errors are bounded at the page boundary.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const baselineSha='42f2bfbc9dba73088a4a996edf61c0b7787578a8';
for(const relative of[
  'src/app/daily-mission.js',
  'src/features/daily-mission/content.js'
]){
  const current=fs.readFileSync(path.join(root,relative),'utf8');
  const baseline=execFileSync('git',['show',`${baselineSha}:${relative}`],{cwd:root,encoding:'utf8'});
  assert.equal(current,baseline,`${relative} must remain byte-for-byte unchanged during V4 Daily Journey page acceptance.`);
}

const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const baseCss=fs.readFileSync(path.join(root,'src/ui/daily-mission.css'),'utf8');
const polishCss=fs.readFileSync(path.join(root,'src/ui/daily-mission-visual-polish.css'),'utf8');
const feature=fs.readFileSync(path.join(root,'src/features/daily-mission/index.js'),'utf8');
const workflow=fs.readFileSync(path.join(root,'.github/workflows/v3-regression.yml'),'utf8');

assert.ok(html.includes('src/ui/daily-mission.css'),'Daily Journey base stylesheet must remain active.');
assert.ok(html.includes('src/ui/daily-mission-visual-polish.css'),'Daily Journey visual polish stylesheet must remain active.');
assert.ok(html.indexOf('src/ui/daily-mission-visual-polish.css')>html.indexOf('src/ui/daily-mission.css'),'Daily Journey visual polish must load after the base stylesheet.');

for(const selector of[
  '.bq-daily-head',
  '.bq-daily-progress',
  '.bq-daily-steps',
  '.bq-daily-card',
  '.bq-daily-choices',
  '.bq-daily-feedback',
  '.bq-daily-actions'
]) assert.ok(baseCss.includes(selector),`Daily Journey base presentation must cover ${selector}.`);
assert.ok(baseCss.includes('@media(max-width:700px)'),'Daily Journey must retain compact phone composition.');
assert.ok(baseCss.includes('@media(prefers-reduced-motion:reduce)'),'Daily Journey must retain reduced-motion behavior.');
assert.ok(baseCss.includes('min-height:44px'),'Daily Journey action controls must retain the 44px touch-target floor.');
assert.ok(polishCss.includes('@media(prefers-contrast:more)'),'Daily Journey must retain higher-contrast presentation.');
assert.ok(!/https?:\/\//.test(baseCss+polishCss),'Daily Journey presentation must not introduce remote assets.');

for(const token of[
  "retrieve:'Retrieve'",
  "context:'Context'",
  "learn:'Learn'",
  "apply:'Apply'",
  "reflect:'Reflect'",
  "['retrieve','context','learn','apply','reflect']",
  'data-daily-open-reader',
  'data-daily-reader',
  'data-daily-next',
  'data-daily-text-form',
  'data-daily-complete',
  'mission.prepareReader()',
  'mission.respond(value)',
  'mission.advance()',
  'mission.open()',
  'mission.close()'
]) assert.ok(feature.includes(token),`Daily Journey page must retain ${token}.`);

assert.ok(!feature.includes('error?.message'),'Daily Journey must not render arbitrary thrown error messages.');
assert.ok(feature.includes('Could not open today’s journey.'),'Initial Daily Journey failure must use a bounded message.');
assert.ok(feature.includes('Could not save this step. Retry the action.'),'Daily Journey save failure must use a bounded message.');
assert.ok(feature.includes('Could not continue today’s journey. Retry the action.'),'Daily Journey advance failure must use a bounded message.');
assert.ok(feature.includes('Could not open this passage in Reader. Retry the action.'),'Daily Journey Reader handoff failure must use a bounded message.');

assert.ok(workflow.includes('tests/v4-daily-journey-static.mjs'),'Accumulated edge CI must run the V4 Daily Journey static acceptance contract.');
assert.ok(workflow.includes('tests/v4-daily-journey-page-smoke.mjs'),'Accumulated browser CI must run the V4 Daily Journey page acceptance smoke.');
assert.ok(workflow.includes('tests/v3-daily-mission-edge.mjs'),'Accumulated edge CI must retain Daily Journey service/reward regression coverage.');
assert.ok(workflow.includes('tests/v3-daily-mission-smoke.mjs'),'Accumulated browser CI must retain full Daily Journey end-to-end coverage.');

console.log('BibleQuest v4 Daily Journey static acceptance contract passed.');