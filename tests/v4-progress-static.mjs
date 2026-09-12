// BibleQuest V4 Progress/Grow acceptance contract.
// This tranche certifies the existing Progress/Grow runtime without creating a
// second progress/reward owner. Runtime owners are byte-locked to the last
// fully verified V4 product checkpoint while V4 presentation and retained
// functional/mobile tests remain mandatory.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const baselineSha='fbd8b474a3f8f71044b9cae48b47528f2075436a';
const preserved=[
  'src/core/progress.js',
  'src/features/progress/index.js'
];

for(const relative of preserved){
  const current=fs.readFileSync(path.join(root,relative),'utf8');
  const baseline=execFileSync('git',['show',`${baselineSha}:${relative}`],{cwd:root,encoding:'utf8'});
  assert.equal(current,baseline,`${relative} must remain byte-for-byte unchanged in the V4 Progress/Grow certification tranche.`);
}

const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const baseCss=fs.readFileSync(path.join(root,'src/ui/progress.css'),'utf8');
const phaseCss=fs.readFileSync(path.join(root,'src/ui/progress-phase-b.css'),'utf8');
const v4Css=fs.readFileSync(path.join(root,'src/ui/journey-v4.css'),'utf8');
const feature=fs.readFileSync(path.join(root,'src/features/progress/index.js'),'utf8');
const owner=fs.readFileSync(path.join(root,'src/core/progress.js'),'utf8');
const edge=fs.readFileSync(path.join(root,'tests/v3-progress-edge.mjs'),'utf8');
const smoke=fs.readFileSync(path.join(root,'tests/v3-progress-smoke.mjs'),'utf8');
const phaseSmoke=fs.readFileSync(path.join(root,'tests/v3-progress-phase-b-smoke.mjs'),'utf8');
const workflow=fs.readFileSync(path.join(root,'.github/workflows/v3-regression.yml'),'utf8');

for(const sheet of['src/ui/progress.css','src/ui/progress-visual-polish.css','src/ui/progress-phase-b.css','src/ui/journey-v4.css'])
  assert.ok(html.includes(`href="${sheet}"`),`Progress/Grow must keep ${sheet} active.`);
assert.ok(html.indexOf('src/ui/journey-v4.css')>html.indexOf('src/ui/progress-phase-b.css'),'V4 Journey/Grow overrides must load after certified Progress layers.');

for(const selector of[
  '.bq-progress-head',
  '.bq-progress-actions',
  '.bq-progress-stats',
  '.bq-badge-grid',
  '.bq-badge-card',
  '.bq-progress-note'
]) assert.ok(v4Css.includes(selector),`V4 Progress/Grow presentation must cover ${selector}.`);
assert.ok(v4Css.includes('@media(max-width:520px)'),'V4 Progress/Grow must retain narrow-phone composition.');
assert.ok(v4Css.includes('@media(max-width:390px)'),'V4 Progress/Grow must explicitly cover the 390px phone target.');
assert.ok(v4Css.includes('@media(prefers-reduced-motion:reduce)'),'V4 Progress/Grow must preserve reduced-motion presentation.');
assert.ok(v4Css.includes('@media(prefers-contrast:more)'),'V4 Progress/Grow must preserve higher-contrast presentation.');
assert.ok(!/https?:\/\//.test(v4Css),'V4 Journey/Progress presentation must not introduce remote assets.');
assert.ok(baseCss.includes('@media(max-width:560px)'),'Base Progress layout must retain its mobile grid adaptation.');
assert.ok(phaseCss.includes('@media(max-width:340px)'),'Progress artwork layer must retain very-narrow-phone handling.');

for(const hook of[
  'data-progress-page',
  'data-progress-page-xp',
  'data-progress-page-streak',
  'data-progress-page-activities',
  'data-progress-page-chapters',
  'data-open-transform',
  'data-open-personality-profile',
  'data-open-psychometrics',
  'data-open-avatar-vault',
  'data-progress-badge'
]) assert.ok(feature.includes(hook),`Progress/Grow feature must preserve ${hook}.`);
assert.ok(feature.includes("const PROGRESS_ART='assets/progress-feature-icons.svg';"),'Progress/Grow must retain its committed same-origin semantic artwork sprite.');
assert.ok(!/\bfetch\s*\(/.test(feature),'Progress/Grow presentation must not create a data/API owner with direct fetch calls.');

for(const token of[
  "const STORAGE_KEY = 'progress-state'",
  "const REWARD_KEYS = Object.freeze(['stars', 'coins'])",
  'export function createProgressService',
  'newlyUnlocked',
  'duplicate'
]) assert.ok(owner.includes(token),`Canonical progress owner contract disappeared: ${token}.`);
assert.ok(!/\bfetch\s*\(/.test(owner),'Canonical progress owner must remain local/service-owned rather than bypassing architecture with direct fetch calls.');

for(const token of[
  'Duplicate progress event awarded twice',
  'Kids reward event must change only progress-owned reward balances, not XP',
  'Next local day must continue streak',
  'Malformed persisted progress and reward balances must normalize safely'
]) assert.ok(edge.includes(token),`Progress edge regression must preserve ${token}.`);
for(const token of[
  "viewport: { width: 390, height: 844 }",
  'Grow page XP is not sourced from progress service',
  'Progress mobile horizontal overflow',
  'Progress status chip lost its XP label on mobile'
]) assert.ok(smoke.includes(token),`Progress browser regression must preserve ${token}.`);
for(const token of[
  'progress-feature-icons.svg',
  'Progress action target below 44px',
  'Progress Phase B introduced horizontal overflow',
  'Progress navigation callbacks changed'
]) assert.ok(phaseSmoke.includes(token),`Progress artwork/mobile acceptance must preserve ${token}.`);

assert.ok(workflow.includes('tests/v4-progress-static.mjs'),'Accumulated edge CI must run the V4 Progress/Grow acceptance contract.');
assert.ok(workflow.includes('tests/v4-progress-page-smoke.mjs'),'Accumulated browser CI must run the 320px V4 Progress/Grow page check.');
assert.ok(workflow.includes('tests/v3-progress-edge.mjs')&&workflow.includes('tests/v3-progress-smoke.mjs'),'Accumulated CI must retain canonical Progress functional regressions.');
assert.ok(workflow.includes('tests/v3-progress-phase-b-static.mjs')&&workflow.includes('tests/v3-progress-phase-b-smoke.mjs'),'Accumulated CI must retain Progress artwork acceptance.');

console.log('BibleQuest v4 Progress/Grow static acceptance contract passed.');