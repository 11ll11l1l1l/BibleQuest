import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'src','ui','bible-world-visual-polish.css'),'utf8');
const baseCss=fs.readFileSync(path.join(root,'src','ui','bible-world.css'),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

const baseLink='<link rel="stylesheet" href="src/ui/bible-world.css">';
const polishLink='<link rel="stylesheet" href="src/ui/bible-world-visual-polish.css">';
assert(index.includes(`${baseLink}\n  ${polishLink}`),'Bible World visual polish must load directly after the established Bible World stylesheet.');
assert(css.includes('Presentation only: no layout, reveal mechanics, navigation, progress, reward, persistence or accessibility ownership.'),'Bible World visual layer must declare its presentation-only boundary.');

for(const selector of ['.bq-world-art{','.bq-world-art-frame{','.bq-world-region{','.bq-world-region.is-next{','.bq-world-icon{','.bq-world-progress{','.bq-world-note,','.bq-world-art-fallback{']){
  assert(css.includes(selector),`Bible World visual layer is missing expected decorative surface ${selector}`);
}

const forbidden=/\b(?:display|position|inset|clip-path|grid-template(?:-columns|-rows)?|grid-column|grid-row|flex(?:-direction|-basis|-grow|-shrink)?|width|height|min-width|min-height|max-width|max-height|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|gap|overflow(?:-[xy])?|aspect-ratio|transform|transition|cursor|pointer-events|z-index|order|font(?:-size|-weight|-family)?|line-height)\s*:/i;
assert(!forbidden.test(css),'Bible World visual polish must not introduce layout, reveal geometry, typography geometry, motion or interaction declarations.');
assert(!/@media\s*\(max-width|@media\s*\(min-width/i.test(css),'Bible World visual polish must not introduce or change responsive breakpoints.');
assert(!/url\s*\(/i.test(css),'Bible World visual polish must not add remote or file-backed runtime dependencies.');
assert(!/animation\s*:|@keyframes/i.test(css),'Bible World visual polish must not add animation behavior.');
assert(css.includes('@media(prefers-contrast:more)'), 'Bible World visual polish must keep an explicit higher-contrast presentation path.');

assert(baseCss.includes('.bq-bible-world{display:grid;gap:16px}'),'Bible World page layout ownership must remain in the established stylesheet.');
assert(baseCss.includes('.bq-world-art-frame{position:relative;width:100%;aspect-ratio:16/9;'),'Bible World artwork geometry ownership must remain in the established stylesheet.');
assert(baseCss.includes('.bq-world-art-revealed{clip-path:inset(0 calc(100% - var(--bq-world-reveal,0%)) 0 0);transition:clip-path .3s ease}'),'Bible World reveal mechanics must remain in the established stylesheet.');
assert(baseCss.includes('@media(max-width:540px){.bq-world-head{display:grid}'),'Bible World mobile breakpoint ownership must remain in the established stylesheet.');
assert(baseCss.includes('@media(prefers-reduced-motion:reduce){.bq-world-art-revealed{transition:none}}'),'Bible World reduced-motion contract must remain in the established stylesheet.');

console.log('BibleQuest v3 Bible World visual polish static contract passed.');
