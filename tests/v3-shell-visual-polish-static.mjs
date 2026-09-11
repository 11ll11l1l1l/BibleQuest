import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'src','ui','shell-visual-polish.css'),'utf8');
const baseCss=fs.readFileSync(path.join(root,'src','ui','app.css'),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

const baseLink='<link rel="stylesheet" href="src/ui/app.css">';
const accountPolish='<link rel="stylesheet" href="src/ui/account-visual-polish.css">';
const polishLink='<link rel="stylesheet" href="src/ui/shell-visual-polish.css">';
const readerLink='<link rel="stylesheet" href="src/ui/reader.css">';
assert(index.includes(baseLink),'Missing established app stylesheet link.');
assert(index.includes(accountPolish),'Missing established Account visual stylesheet link.');
assert(index.includes(polishLink),'Missing shell visual polish stylesheet link.');
assert(index.indexOf(baseLink)<index.indexOf(accountPolish),'Account visual layer must remain after app.css.');
assert(index.indexOf(accountPolish)<index.indexOf(polishLink),'Shell visual polish must preserve the established Account direct-after-app.css contract.');
assert(index.indexOf(polishLink)<index.indexOf(readerLink),'Shell visual polish must load before the remaining feature styles.');
assert(index.includes('<link rel="stylesheet" href="src/ui/story-journey.css">'),'Story Journey base stylesheet reference must remain intact.');

assert(css.includes('Presentation only: no shell sizing, positioning, navigation, responsive geometry,'),'Shell visual layer must declare its presentation-only boundary.');
for(const selector of ['html,body{','.bq-topbar{','.bq-brand-mark{','.bq-build-chip,','.bq-nav{','html[data-bq-contrast="strong"] .bq-topbar,','@media(prefers-contrast:more){']){
  assert(css.includes(selector),`Shell visual layer is missing expected presentation surface ${selector}`);
}
assert(!css.includes('.bq-panel'),'Shell visual polish must not override generic feature panel presentation.');
assert(!css.includes(':root'),'Shell visual polish must not mutate global token ownership.');

const forbidden=/\b(?:display|position|top|right|bottom|left|grid-template(?:-columns|-rows)?|grid-column|grid-row|flex(?:-direction|-basis|-grow|-shrink)?|align-items|justify-content|width|height|min-width|min-height|max-width|max-height|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|gap|overflow(?:-[xy])?|aspect-ratio|transform|transition|cursor|pointer-events|z-index|order|font(?:-size|-weight|-family)?|line-height|resize|touch-action|text-align|outline(?:-[a-z]+)?)\s*:/i;
assert(!forbidden.test(css),'Shell visual polish must not introduce layout, typography geometry, focus geometry, motion or interaction declarations.');
assert(!/@media\s*\(max-width|@media\s*\(min-width/i.test(css),'Shell visual polish must not introduce or change responsive breakpoints.');
assert(!/url\s*\(/i.test(css),'Shell visual polish must not add remote or file-backed runtime dependencies.');
assert(!/animation\s*:|@keyframes/i.test(css),'Shell visual polish must not add animation behavior.');

assert(baseCss.includes('.bq-shell{min-height:100dvh;padding-bottom:84px}'),'Shell sizing ownership must remain in app.css.');
assert(baseCss.includes('.bq-topbar{position:sticky;top:0;z-index:10;display:flex;'),'Topbar positioning/layout ownership must remain in app.css.');
assert(baseCss.includes('.bq-nav{position:fixed;left:0;right:0;bottom:0;z-index:20;height:72px;'),'Bottom navigation positioning/sizing ownership must remain in app.css.');
assert(baseCss.includes('@media(max-width:480px)'),'Shell responsive breakpoint ownership must remain in app.css.');

console.log('BibleQuest v3 global shell visual polish static contract passed.');
