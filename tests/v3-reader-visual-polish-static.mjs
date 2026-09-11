import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'src','ui','reader-visual-polish.css'),'utf8');
const baseCss=fs.readFileSync(path.join(root,'src','ui','reader.css'),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

const baseLink='<link rel="stylesheet" href="src/ui/reader.css">';
const polishLink='<link rel="stylesheet" href="src/ui/reader-visual-polish.css">';
assert(index.includes(`${baseLink}\n  ${polishLink}`),'Reader visual polish must load directly after the established Reader stylesheet.');
assert(css.includes('Presentation only: no layout, Scripture, navigation, search, persistence or accessibility ownership.'),'Reader visual layer must declare its presentation-only boundary.');

for(const selector of ['.bq-reader-controls{','.bq-reader-source{','.bq-external-links a{','.bq-scripture-panel{','.bq-verse.is-highlighted{','.bq-search-list button{','.bq-licensed-reader-panel{','.bq-verse-dialog{']){
  assert(css.includes(selector),`Reader visual layer is missing expected decorative surface ${selector}`);
}

const forbidden=/\b(?:display|position|grid-template(?:-columns|-rows)?|grid-column|grid-row|flex(?:-direction|-basis|-grow|-shrink)?|width|height|min-width|min-height|max-width|max-height|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|gap|overflow(?:-[xy])?|aspect-ratio|transform|transition|cursor|pointer-events|z-index|order|font(?:-size|-weight|-family)?|line-height)\s*:/i;
assert(!forbidden.test(css),'Reader visual polish must not introduce layout, typography geometry, motion or interaction declarations.');
assert(!/@media\s*\(max-width|@media\s*\(min-width/i.test(css),'Reader visual polish must not introduce or change responsive breakpoints.');
assert(!/url\s*\(/i.test(css),'Reader visual polish must not add remote or file-backed runtime dependencies.');
assert(!/animation\s*:|@keyframes/i.test(css),'Reader visual polish must not add animation behavior.');
assert(css.includes('@media(prefers-contrast:more)'), 'Reader visual polish must keep an explicit higher-contrast presentation path.');

assert(baseCss.includes('.bq-reader-layout{display:grid;grid-template-columns:minmax(220px,260px) minmax(0,1fr);'),'Reader desktop layout ownership must remain in the established Reader stylesheet.');
assert(baseCss.includes('.bq-verse{display:grid;grid-template-columns:28px minmax(0,1fr);'),'Verse layout ownership must remain in the established Reader stylesheet.');
assert(baseCss.includes('@media(max-width:720px){.bq-reader-layout{grid-template-columns:1fr}'),'Reader mobile breakpoint ownership must remain in the established Reader stylesheet.');
assert(baseCss.includes('.bq-reader-controls select:focus,.bq-reader-search input:focus{outline:3px solid rgba(47,112,77,.13);border-color:#4f8161}'),'Reader control focus contract must remain in the established Reader stylesheet.');

console.log('BibleQuest v3 Reader visual polish static contract passed.');
