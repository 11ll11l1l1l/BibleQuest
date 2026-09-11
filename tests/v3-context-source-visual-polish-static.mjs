import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'src','ui','context-source-visual-polish.css'),'utf8');
const contextCss=fs.readFileSync(path.join(root,'src','ui','context-lab.css'),'utf8');
const vocabCss=fs.readFileSync(path.join(root,'src','ui','japanese-vocabulary.css'),'utf8');
const sourceCss=fs.readFileSync(path.join(root,'src','ui','source-labels.css'),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

const contextLink='<link rel="stylesheet" href="src/ui/context-lab.css">';
const vocabLink='<link rel="stylesheet" href="src/ui/japanese-vocabulary.css">';
const sourceLink='<link rel="stylesheet" href="src/ui/source-labels.css">';
const polishLink='<link rel="stylesheet" href="src/ui/context-source-visual-polish.css">';
for(const link of [contextLink,vocabLink,sourceLink,polishLink]) assert(index.includes(link),`Missing stylesheet link ${link}`);
assert(index.indexOf(contextLink)<index.indexOf(vocabLink),'Context stylesheet order changed.');
assert(index.indexOf(vocabLink)<index.indexOf(sourceLink),'Japanese vocabulary/source stylesheet order changed.');
assert(index.indexOf(sourceLink)<index.indexOf(polishLink),'Context/source polish must load after all established source presentation stylesheets.');

assert(css.includes('Presentation only: no Scripture/source semantics, lexical data, vocabulary behavior, layout, navigation, persistence or accessibility ownership.'),'Context/source visual layer must declare its presentation-only boundary.');
for(const selector of ['.bq-context-dialog{','.bq-context-hero{','.bq-context-scripture{','.bq-context-lexeme{','.bq-jp-vocab{','.bq-jp-vocab-head>span{','.bq-source-notice,','.bq-source-badge{']){
  assert(css.includes(selector),`Context/source visual layer is missing expected decorative surface ${selector}`);
}

const forbidden=/\b(?:display|position|grid-template(?:-columns|-rows)?|grid-column|grid-row|flex(?:-direction|-basis|-grow|-shrink)?|width|height|min-width|min-height|max-width|max-height|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|gap|overflow(?:-[xy])?|aspect-ratio|transform|transition|cursor|pointer-events|z-index|order|font(?:-size|-weight|-family)?|line-height|touch-action)\s*:/i;
assert(!forbidden.test(css),'Context/source visual polish must not introduce layout, typography geometry, motion or interaction declarations.');
assert(!/@media\s*\(max-width|@media\s*\(min-width/i.test(css),'Context/source visual polish must not introduce or change responsive breakpoints.');
assert(!/url\s*\(/i.test(css),'Context/source visual polish must not add remote or file-backed runtime dependencies.');
assert(!/animation\s*:|@keyframes/i.test(css),'Context/source visual polish must not add animation behavior.');
assert(css.includes('@media(prefers-contrast:more)'), 'Context/source visual polish must keep an explicit higher-contrast presentation path.');

assert(contextCss.includes('.bq-context-picker{display:grid;grid-template-columns:2fr 1fr 1fr;gap:9px}'),'Context picker layout ownership must remain in context-lab.css.');
assert(contextCss.includes('@media(max-width:640px){.bq-context-dialog{width:100vw;max-width:100vw;max-height:100dvh;height:100dvh;border-radius:0}'),'Context mobile breakpoint ownership must remain in context-lab.css.');
assert(contextCss.includes('.bq-context-dialog button,.bq-context-dialog select{touch-action:manipulation}'),'Context touch behavior must remain in context-lab.css.');
assert(vocabCss.includes('@media(max-width:480px){.bq-jp-vocab{padding:12px}'),'Japanese vocabulary mobile breakpoint ownership must remain in japanese-vocabulary.css.');
assert(sourceCss.includes('@media(max-width:480px){.bq-source-notice,.bq-source-guide-grid article{padding:11px}'),'Source-label mobile breakpoint ownership must remain in source-labels.css.');

console.log('BibleQuest v3 Context/Japanese/source visual polish static contract passed.');
