import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'src','ui','couples-visual-polish.css'),'utf8');
const localCss=fs.readFileSync(path.join(root,'src','ui','couples-family.css'),'utf8');
const cloudCss=fs.readFileSync(path.join(root,'src','ui','couples-cloud.css'),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

const localLink='<link rel="stylesheet" href="src/ui/couples-family.css">';
const cloudLink='<link rel="stylesheet" href="src/ui/couples-cloud.css">';
const polishLink='<link rel="stylesheet" href="src/ui/couples-visual-polish.css">';
for(const link of [localLink,cloudLink,polishLink]) assert(index.includes(link),`Missing stylesheet link ${link}`);
assert(index.indexOf(localLink)<index.indexOf(cloudLink),'Couples local/cloud established stylesheet order changed.');
assert(index.indexOf(cloudLink)<index.indexOf(polishLink),'Couples visual polish must load after both established Couples stylesheets.');

assert(css.includes('Presentation only: no couples content, scoring/framing, safety, privacy, persistence, cloud sync, route, layout, responsive or accessibility ownership.'),'Couples visual layer must declare its presentation-only boundary.');
for(const selector of ['.bq-couples-hero{','.bq-couples-active,','.bq-couples-principles{','.bq-couples-safety{','.bq-couples-scripture{','.bq-couples-cloud-count{','.bq-couples-cloud-message,','.bq-couples-cloud-pair-grid>button,']){
  assert(css.includes(selector),`Couples visual layer is missing expected decorative surface ${selector}`);
}

const forbidden=/\b(?:display|position|grid-template(?:-columns|-rows)?|grid-column|grid-row|flex(?:-direction|-basis|-grow|-shrink)?|width|height|min-width|min-height|max-width|max-height|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|gap|overflow(?:-[xy])?|aspect-ratio|transform|transition|cursor|pointer-events|z-index|order|font(?:-size|-weight|-family)?|line-height|resize|touch-action|text-align)\s*:/i;
assert(!forbidden.test(css),'Couples visual polish must not introduce layout, typography geometry, motion or interaction declarations.');
assert(!/@media\s*\(max-width|@media\s*\(min-width/i.test(css),'Couples visual polish must not introduce or change responsive breakpoints.');
assert(!/url\s*\(/i.test(css),'Couples visual polish must not add remote or file-backed runtime dependencies.');
assert(!/animation\s*:|@keyframes/i.test(css),'Couples visual polish must not add animation behavior.');
assert(css.includes('@media(prefers-contrast:more)'), 'Couples visual polish must keep an explicit higher-contrast presentation path.');

assert(localCss.includes('.bq-couples-mode-grid,.bq-couples-categories{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:16px}'),'Couples local mode/category layout ownership must remain in couples-family.css.');
assert(localCss.includes('.bq-couples-safety{background:#fff7f5;border-color:rgba(139,62,54,.18)}'),'Couples safety base presentation must remain explicitly owned by couples-family.css.');
assert(localCss.includes('@media(max-width:600px){.bq-couples-head{display:block}'),'Couples local mobile breakpoint ownership must remain in couples-family.css.');
assert(cloudCss.includes('.bq-couples-cloud button,.bq-couples-cloud input,.bq-couples-cloud textarea{min-height:44px}'),'Couples cloud minimum target ownership must remain in couples-cloud.css.');
assert(cloudCss.includes('.bq-couples-cloud-pair-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}'),'Couples cloud pairing layout ownership must remain in couples-cloud.css.');
assert(cloudCss.includes('@media(max-width:640px){.bq-couples-cloud-head{display:grid}'),'Couples cloud mobile breakpoint ownership must remain in couples-cloud.css.');

console.log('BibleQuest v3 Couples local/cloud visual polish static contract passed.');
