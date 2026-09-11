import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'src','ui','transform-visual-polish.css'),'utf8');
const base=fs.readFileSync(path.join(root,'src','ui','transform.css'),'utf8');
const feature=fs.readFileSync(path.join(root,'src','features','transform','index.js'),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

assert(index.includes('<link rel="stylesheet" href="src/ui/transform.css">\n  <link rel="stylesheet" href="src/ui/transform-visual-polish.css">'),'Transform visual polish must load directly after transform.css.');
assert(css.includes('Presentation only: no layout, assessment inputs, scoring, state, persistence, privacy, navigation or accessibility ownership.'),'Transform visual layer must declare its presentation-only boundary.');
for(const selector of ['.bq-transform-head{','.bq-transform-item{','.bq-transform-scale button{','.bq-transform-scale button.is-selected,','.bq-transform-result,','.bq-transform-bars span{','.bq-transform-bars i{','.bq-transform-focus article{'])assert(css.includes(selector),`Transform visual layer is missing expected decorative surface ${selector}`);

const forbidden=/\b(?:display|position|inset|grid-template(?:-columns|-rows)?|grid-column|grid-row|flex(?:-direction|-basis|-grow|-shrink|-wrap)?|width|height|min-width|min-height|max-width|max-height|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|gap|overflow(?:-[xy])?|aspect-ratio|transform|transition|cursor|pointer-events|z-index|order|resize|font(?:-size|-weight|-family)?|line-height)\s*:/i;
assert(!forbidden.test(css),'Transform visual polish must not introduce layout, typography geometry, motion or interaction declarations.');
assert(!/@media\s*\(max-width|@media\s*\(min-width/i.test(css),'Transform visual polish must not introduce responsive breakpoints.');
assert(!/url\s*\(/i.test(css),'Transform visual polish must not add runtime asset dependencies.');
assert(!/animation\s*:|@keyframes/i.test(css),'Transform visual polish must not add animation behavior.');
assert(css.includes('@media(prefers-contrast:more)'),'Transform visual polish must retain an explicit higher-contrast presentation path.');

assert(base.includes('.bq-transform-item{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:18px}'),'Transform item layout ownership must remain in transform.css.');
assert(base.includes('.bq-transform-scale button{width:44px;height:44px;'),'Transform rating hit-target ownership must remain in transform.css.');
assert(base.includes('@media(max-width:700px){.bq-transform-item{grid-template-columns:1fr}'),'Transform mobile layout ownership must remain in transform.css.');
assert(base.includes('@media(max-width:390px){.bq-transform-item{padding-inline:12px}'),'Transform narrow mobile ownership must remain in transform.css.');
assert(feature.includes('this is private self-reflection, not a spiritual score, diagnosis, moral ranking, or measure of God’s approval'),'Transform spiritual-safety copy must remain in the feature owner.');
assert(feature.includes("localStorage")===false,'Transform feature presentation must not introduce direct localStorage ownership.');

console.log('BibleQuest v3 Transform visual polish static contract passed.');
