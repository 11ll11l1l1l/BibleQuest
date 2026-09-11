import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'src','ui','community-visual-polish.css'),'utf8');
const baseCss=fs.readFileSync(path.join(root,'src','ui','community.css'),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

const baseLink='<link rel="stylesheet" href="src/ui/community.css">';
const polishLink='<link rel="stylesheet" href="src/ui/community-visual-polish.css">';
assert(index.includes(baseLink),'Missing established Community stylesheet link.');
assert(index.includes(polishLink),'Missing Community visual polish stylesheet link.');
assert(index.indexOf(baseLink)<index.indexOf(polishLink),'Community visual polish must load after the established Community stylesheet.');

assert(css.includes('Presentation only: no community membership, role, permission, privacy, persistence, backend, route, layout, responsive or accessibility ownership.'),'Community visual layer must declare its presentation-only boundary.');
for(const selector of ['.bq-community-head h1{','.bq-community-grid button{','.bq-community-summary>div{','.bq-community .bq-panel{','.bq-community-row{','.bq-community-boundary{','.bq-community .bq-form-message[role="alert"]{']){
  assert(css.includes(selector),`Community visual layer is missing expected decorative surface ${selector}`);
}

const forbidden=/\b(?:display|position|grid-template(?:-columns|-rows)?|grid-column|grid-row|flex(?:-direction|-basis|-grow|-shrink)?|width|height|min-width|min-height|max-width|max-height|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|gap|overflow(?:-[xy])?|aspect-ratio|transform|transition|cursor|pointer-events|z-index|order|font(?:-size|-weight|-family)?|line-height|resize|touch-action|text-align)\s*:/i;
assert(!forbidden.test(css),'Community visual polish must not introduce layout, typography geometry, motion or interaction declarations.');
assert(!/@media\s*\(max-width|@media\s*\(min-width/i.test(css),'Community visual polish must not introduce or change responsive breakpoints.');
assert(!/url\s*\(/i.test(css),'Community visual polish must not add remote or file-backed runtime dependencies.');
assert(!/animation\s*:|@keyframes/i.test(css),'Community visual polish must not add animation behavior.');
assert(css.includes('@media(prefers-contrast:more)'),'Community visual polish must keep an explicit higher-contrast presentation path.');

assert(baseCss.includes('.bq-community{max-width:960px;margin:0 auto}'),'Community container geometry ownership must remain in community.css.');
assert(baseCss.includes('.bq-community-grid,.bq-community-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.8rem;margin:1rem 0}'),'Community grid geometry ownership must remain in community.css.');
assert(baseCss.includes('.bq-community-grid button{min-height:128px;border:1px solid var(--bq-border,#d9dfd5);border-radius:1rem;background:var(--bq-surface,#fff);padding:1rem;text-align:left;color:inherit}'),'Community action target and card geometry ownership must remain in community.css.');
assert(baseCss.includes('@media(max-width:600px){.bq-community-head,.bq-community-row{align-items:stretch;flex-direction:column}'),'Community mobile breakpoint ownership must remain in community.css.');
assert(baseCss.includes('.bq-community-grid button,.bq-community button{min-height:44px}'),'Community minimum touch-target ownership must remain in community.css.');

console.log('BibleQuest v3 Community Bridge visual polish static contract passed.');
