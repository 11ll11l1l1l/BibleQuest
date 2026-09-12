import fs from 'node:fs';
import path from 'node:path';
import {workflowInvokesNode} from '../scripts/v3-workflow-contract.mjs';

const root=path.resolve(import.meta.dirname,'..');
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const asset='assets/more-feature-icons.svg';
const css='src/ui/more-phase-b.css';
const historicalCss='src/ui/more-visual-polish.css';
const appCss='src/ui/app.css';
const ui='src/features/more/index.js';
const contract='VISUAL_PHASE_B_MORE_V3.md';
const workflowPath='.github/workflows/v3-regression.yml';
for(const file of[asset,css,historicalCss,appCss,ui,contract,'index.html',workflowPath])assert(fs.existsSync(path.join(root,file)),`Missing More presentation-contract file: ${file}`);

const symbols=['workspace','notifications','community','ministry','review','couples','couples-cloud','journey-groups','team','accessibility','install','backup','mission','calendar','congregation'];
const sprite=read(asset),more=read(ui),phase=read(css),app=read(appCss),index=read('index.html'),scope=read(contract),workflow=read(workflowPath);
const v4=index.includes('BibleQuest v4')||more.includes('bq-more-page');

for(const id of symbols){
  assert(sprite.includes(`id="${id}"`),`More icon sprite missing symbol: ${id}`);
  if(v4) assert(more.includes(`icon: '${id}'`),`v4 More UI missing semantic icon mapping: ${id}`);
  else assert(more.includes(`featureIcon('${id}')`),`More UI missing semantic icon: ${id}`);
}
assert(sprite.startsWith('<svg'), 'More icon asset must be SVG.');
assert(!/<script\b|onload=|javascript:/i.test(sprite),'More icon asset must remain passive SVG artwork.');
assert(!/https?:\/\//i.test(sprite.replace('http://www.w3.org/2000/svg','')),'More icon asset must not load remote resources.');
assert(more.includes('aria-hidden="true"'),'More decorative icons must stay hidden from assistive technology.');
assert(more.includes('assets/more-feature-icons.svg#'),'More UI must use the committed same-origin sprite.');
assert(!more.includes('assets/icons/v3/'),'More UI must not wire nonexistent historical icon paths.');

if(v4){
  assert(!index.includes('href="src/ui/more-visual-polish.css"'),'v4 More must not reload the historical visual overlay after ownership migrated to the v4 foundation.');
  assert(!index.includes('href="src/ui/more-phase-b.css"'),'v4 More must not stack the Phase B overlay after ownership migrated to the v4 foundation.');
  for(const marker of['.bq-more-page','.bq-more-card','.bq-more-icon-wrap','@media(prefers-contrast:more)'])assert(app.includes(marker),`v4 foundation CSS missing More owner marker: ${marker}`);
  for(const hook of['data-more-workspace','data-more-notifications','data-more-community','data-more-ministry-hub','data-more-content-review','data-more-couples','data-more-couples-cloud','data-more-journey-groups','data-more-team-center','data-more-accessibility','data-more-install','data-more-backup','data-more-mission','data-more-calendar','data-more-congregation'])assert(more.includes(hook),`v4 More missing stable route hook: ${hook}`);
  assert(workflowInvokesNode(workflow,'tests/v4-foundation-static.mjs'),'v4 foundation static contract must run in the accumulated regression workflow.');
}else{
  assert(index.includes('href="src/ui/more-visual-polish.css"'),'Historical More visual layer must remain loaded before v4 migration.');
  assert(index.includes('href="src/ui/more-phase-b.css"'),'Phase B More visual layer must remain loaded before v4 migration.');
  assert(index.indexOf('src/ui/more-phase-b.css')>index.indexOf('src/ui/more-visual-polish.css'),'Phase B More layer must load after the historical visual layer.');
  for(const marker of['.bq-more-icon-wrap','.bq-more-icon','@media(prefers-contrast:more)'])assert(phase.includes(marker),`More Phase B CSS missing contract marker: ${marker}`);
  assert(!/animation\s*:|@keyframes/i.test(phase),'More Phase B must not add animation behavior.');
  assert(!/url\s*\(/i.test(phase),'More Phase B CSS must not add a second asset loading path.');
}

assert(scope.includes('every existing button, route callback'),'Historical More Phase B contract must retain interaction ownership as migration evidence.');
assert(scope.includes('No PASS transfers'),'Historical More Phase B contract must preserve exact-candidate evidence rules.');
for(const test of['tests/v3-more-phase-b-static.mjs','tests/v3-more-phase-b-smoke.mjs'])assert(workflowInvokesNode(workflow,test),`Accumulated regression must retain ${test}.`);
console.log(v4?'BibleQuest v4 More migration/static asset contract passed.':'BibleQuest v3 More Phase B static asset contract passed.');
