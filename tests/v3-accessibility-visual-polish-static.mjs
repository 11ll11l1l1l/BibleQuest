import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'src','ui','accessibility-visual-polish.css'),'utf8');
const baseCss=fs.readFileSync(path.join(root,'src','ui','accessibility.css'),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

const baseLink='<link rel="stylesheet" href="src/ui/accessibility.css">';
const polishLink='<link rel="stylesheet" href="src/ui/accessibility-visual-polish.css">';
assert(index.includes(baseLink),'Missing established Accessibility stylesheet link.');
assert(index.includes(polishLink),'Missing Accessibility visual polish stylesheet link.');
assert(index.indexOf(baseLink)<index.indexOf(polishLink),'Accessibility visual polish must load after Accessibility base CSS.');

assert(css.includes('Presentation only: no text sizing, focus behavior, reduced-motion logic,'),'Accessibility visual layer must declare its presentation-only boundary.');
for(const selector of ['.bq-accessibility-page,','.bq-accessibility-controls select{','html[data-bq-contrast="strong"] .bq-accessibility-page,','@media(prefers-contrast:more){']){
  assert(css.includes(selector),`Accessibility visual layer is missing expected safe presentation surface ${selector}`);
}

const forbidden=/\b(?:display|position|grid-template(?:-columns|-rows)?|grid-column|grid-row|flex(?:-direction|-basis|-grow|-shrink)?|width|height|min-width|min-height|max-width|max-height|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|gap|overflow(?:-[xy])?|aspect-ratio|transform|transition|cursor|pointer-events|z-index|order|font(?:-size|-weight|-family)?|line-height|resize|touch-action|text-align|outline(?:-[a-z]+)?)\s*:/i;
assert(!forbidden.test(css),'Accessibility visual polish must not introduce layout, typography geometry, focus geometry, motion or interaction declarations.');
assert(!/@media\s*\(max-width|@media\s*\(min-width/i.test(css),'Accessibility visual polish must not introduce or change responsive breakpoints.');
assert(!/url\s*\(/i.test(css),'Accessibility visual polish must not add remote or file-backed runtime dependencies.');
assert(!/animation\s*:|@keyframes/i.test(css),'Accessibility visual polish must not add animation behavior.');

assert(baseCss.includes('html[data-bq-text="large"]{font-size:112.5%}'),'Accessibility text-size ownership must remain in accessibility.css.');
assert(baseCss.includes('html[data-bq-effective-motion="reduce"] *'),'Accessibility reduced-motion ownership must remain in accessibility.css.');
assert(baseCss.includes(':focus-visible{outline:3px solid currentColor!important;outline-offset:3px!important}'),'Accessibility focus visibility ownership must remain in accessibility.css.');
assert(baseCss.includes('@media(max-width:430px)'),'Accessibility responsive breakpoint ownership must remain in accessibility.css.');

console.log('BibleQuest v3 Accessibility visual polish static contract passed.');
