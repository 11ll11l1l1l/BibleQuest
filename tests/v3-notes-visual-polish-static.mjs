import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'src','ui','notes-visual-polish.css'),'utf8');
const privateCss=fs.readFileSync(path.join(root,'src','ui','private-notes.css'),'utf8');
const cloudCss=fs.readFileSync(path.join(root,'src','ui','cloud-notes.css'),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

const privateLink='<link rel="stylesheet" href="src/ui/private-notes.css">';
const cloudLink='<link rel="stylesheet" href="src/ui/cloud-notes.css">';
const polishLink='<link rel="stylesheet" href="src/ui/notes-visual-polish.css">';
for(const link of [privateLink,cloudLink,polishLink]) assert(index.includes(link),`Missing stylesheet link ${link}`);
assert(index.indexOf(privateLink)<index.indexOf(cloudLink),'Private/Cloud Notes established stylesheet order changed.');
assert(index.indexOf(cloudLink)<index.indexOf(polishLink),'Notes polish must load after both established Notes stylesheets.');

assert(css.includes('Presentation only: no note privacy, persistence, sync, account, form behavior, layout, responsive or accessibility ownership.'),'Notes visual layer must declare its presentation-only boundary.');
for(const selector of ['.bq-private-notes-count{','.bq-private-note-card{','.bq-private-notes-empty{','.bq-private-note-form input,','.bq-cloud-notes-count{','.bq-cloud-note-card{','.bq-cloud-notes-empty{','.bq-cloud-note-form input,']){
  assert(css.includes(selector),`Notes visual layer is missing expected decorative surface ${selector}`);
}

const forbidden=/\b(?:display|position|grid-template(?:-columns|-rows)?|grid-column|grid-row|flex(?:-direction|-basis|-grow|-shrink)?|width|height|min-width|min-height|max-width|max-height|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|gap|overflow(?:-[xy])?|aspect-ratio|transform|transition|cursor|pointer-events|z-index|order|font(?:-size|-weight|-family)?|line-height|resize|touch-action)\s*:/i;
assert(!forbidden.test(css),'Notes visual polish must not introduce layout, typography geometry, motion or interaction declarations.');
assert(!/@media\s*\(max-width|@media\s*\(min-width/i.test(css),'Notes visual polish must not introduce or change responsive breakpoints.');
assert(!/url\s*\(/i.test(css),'Notes visual polish must not add remote or file-backed runtime dependencies.');
assert(!/animation\s*:|@keyframes/i.test(css),'Notes visual polish must not add animation behavior.');
assert(css.includes('@media(prefers-contrast:more)'), 'Notes visual polish must keep an explicit higher-contrast presentation path.');

assert(privateCss.includes('.bq-private-note-card{width:100%;min-height:62px;display:flex;'),'Private Notes card geometry must remain owned by private-notes.css.');
assert(privateCss.includes('.bq-private-note-form textarea{min-height:220px;resize:vertical}'),'Private Notes editor behavior must remain owned by private-notes.css.');
assert(privateCss.includes('@media(max-width:480px){.bq-private-notes-head{display:block}'),'Private Notes mobile breakpoint ownership must remain in private-notes.css.');
assert(cloudCss.includes('.bq-cloud-note-card{width:100%;min-height:62px;display:flex;'),'Cloud Notes card geometry must remain owned by cloud-notes.css.');
assert(cloudCss.includes('.bq-cloud-reference-grid{display:grid;grid-template-columns:2fr repeat(3,minmax(90px,1fr));gap:10px}'),'Cloud Notes reference layout ownership must remain in cloud-notes.css.');
assert(cloudCss.includes('@media(max-width:640px){.bq-cloud-reference-grid{grid-template-columns:1fr 1fr}'),'Cloud Notes mobile breakpoint ownership must remain in cloud-notes.css.');

console.log('BibleQuest v3 Private/Cloud Notes visual polish static contract passed.');
