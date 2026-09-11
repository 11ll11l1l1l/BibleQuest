import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'src','ui','games-visual-polish.css'),'utf8');
const baseCss=fs.readFileSync(path.join(root,'src','ui','games.css'),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

const baseLink='<link rel="stylesheet" href="src/ui/games.css">';
const polishLink='<link rel="stylesheet" href="src/ui/games-visual-polish.css">';
assert(index.includes(`${baseLink}\n  ${polishLink}`),'Games visual polish must load directly after the established Games stylesheet.');
assert(css.includes('Presentation only: no layout, interaction, scoring, timing, reward or persistence ownership.'),'Visual layer must declare its presentation-only boundary.');

for(const selector of ['.bq-game-card{','.bq-game-progress{','.bq-game-choice{','.bq-game-stats>div{','.bq-timeline-row{','.bq-memory-meadow{','.bq-memory-card{']){
  assert(css.includes(selector),`Games visual layer is missing expected decorative surface ${selector}`);
}

const forbidden=/\b(?:display|position|grid-template(?:-columns|-rows)?|grid-column|grid-row|flex(?:-direction|-basis|-grow|-shrink)?|width|height|min-width|min-height|max-width|max-height|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|gap|overflow(?:-[xy])?|aspect-ratio|transform|transition|cursor|pointer-events|z-index|order)\s*:/i;
assert(!forbidden.test(css),'Games visual polish must not introduce layout, geometry, motion or interaction declarations.');
assert(!/@media\s*\(max-width|@media\s*\(min-width/i.test(css),'Games visual polish must not introduce or change responsive breakpoints.');
assert(!/url\s*\(/i.test(css),'Games visual polish must not add remote or file-backed runtime dependencies.');
assert(!/animation\s*:|@keyframes/i.test(css),'Games visual polish must not add animation behavior.');
assert(css.includes('@media(prefers-contrast:more)'), 'Games visual polish must keep an explicit higher-contrast presentation path.');

assert(baseCss.includes('.bq-game-launcher{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}'),'Established Games launcher layout contract must remain in the owner stylesheet.');
assert(baseCss.includes('.bq-memory-grid{display:grid;grid-template-columns:repeat(var(--memory-columns),minmax(0,1fr));'),'Memory Meadow column ownership must remain in the established Games stylesheet.');
assert(baseCss.includes('.bq-memory-card:focus-visible{outline:3px solid rgba(47,112,77,.35);outline-offset:2px}'),'Memory Meadow keyboard focus contract must remain owned by the established Games stylesheet.');
assert(baseCss.includes('@media(prefers-reduced-motion:reduce){.bq-memory-card{transition:none}'),'Reduced-motion behavior must remain owned by the established Games stylesheet.');

console.log('BibleQuest v3 Games visual polish static contract passed.');
