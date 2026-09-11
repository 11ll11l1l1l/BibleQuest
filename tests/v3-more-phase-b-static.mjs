import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const asset='assets/more-feature-icons.svg';
const css='src/ui/more-phase-b.css';
const ui='src/features/more/index.js';
const contract='VISUAL_PHASE_B_MORE_V3.md';
for(const file of[asset,css,ui,contract,'index.html'])assert(fs.existsSync(path.join(root,file)),`Missing More Phase B file: ${file}`);

const symbols=['workspace','notifications','community','ministry','review','couples','couples-cloud','journey-groups','team','accessibility','install','backup','mission','calendar','congregation'];
const sprite=read(asset),more=read(ui),phase=read(css),index=read('index.html'),scope=read(contract);
for(const id of symbols){
  assert(sprite.includes(`id="${id}"`),`More icon sprite missing symbol: ${id}`);
  assert(more.includes(`featureIcon('${id}')`),`More UI missing semantic icon: ${id}`);
}
assert(sprite.startsWith('<svg'), 'More icon asset must be SVG.');
assert(!/<script\b|onload=|javascript:/i.test(sprite),'More icon asset must remain passive SVG artwork.');
assert(!/https?:\/\//i.test(sprite.replace('http://www.w3.org/2000/svg','')),'More icon asset must not load remote resources.');
assert(more.includes('aria-hidden="true"'),'More decorative icons must stay hidden from assistive technology.');
assert(more.includes('assets/more-feature-icons.svg#'),'More UI must use the committed same-origin sprite.');
assert(!more.includes('assets/icons/v3/'),'More UI must not wire nonexistent historical icon paths.');
assert(index.includes('href="src/ui/more-visual-polish.css"'),'Historical More visual layer must remain loaded.');
assert(index.includes('href="src/ui/more-phase-b.css"'),'Phase B More visual layer must be loaded.');
assert(index.indexOf('src/ui/more-phase-b.css')>index.indexOf('src/ui/more-visual-polish.css'),'Phase B More layer must load after the historical visual layer.');
for(const marker of['.bq-more-icon-wrap','.bq-more-icon','@media(prefers-contrast:more)'])assert(phase.includes(marker),`More Phase B CSS missing contract marker: ${marker}`);
assert(!/animation\s*:|@keyframes/i.test(phase),'More Phase B must not add animation behavior.');
assert(!/url\s*\(/i.test(phase),'More Phase B CSS must not add a second asset loading path.');
assert(scope.includes('every existing button, route callback'),'More Phase B contract must retain interaction ownership.');
assert(scope.includes('No PASS transfers'),'More Phase B contract must preserve exact-candidate evidence rules.');
console.log('BibleQuest v3 More Phase B static asset contract passed.');
