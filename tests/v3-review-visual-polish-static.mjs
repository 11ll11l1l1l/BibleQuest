import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'src','ui','review-visual-polish.css'),'utf8');
const adaptiveCss=fs.readFileSync(path.join(root,'src','ui','adaptive-learning.css'),'utf8');
const reviewCss=fs.readFileSync(path.join(root,'src','ui','open-review.css'),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

const adaptiveLink='<link rel="stylesheet" href="src/ui/adaptive-learning.css">';
const reviewLink='<link rel="stylesheet" href="src/ui/open-review.css">';
const polishLink='<link rel="stylesheet" href="src/ui/review-visual-polish.css">';
assert(index.includes(adaptiveLink),'Missing established Adaptive Learning stylesheet link.');
assert(index.includes(reviewLink),'Missing established Open Review stylesheet link.');
assert(index.includes(polishLink),'Missing review visual polish stylesheet link.');
assert(index.indexOf(adaptiveLink)<index.indexOf(polishLink),'Review visual polish must load after Adaptive Learning base CSS.');
assert(index.indexOf(reviewLink)<index.indexOf(polishLink),'Review visual polish must load after Open Review base CSS.');

assert(css.includes('Presentation only: no adaptive scheduling, mastery, scoring, review queue,'),'Review visual layer must declare its presentation-only boundary.');
for(const selector of ['.bq-adaptive-head h1,','.bq-adaptive-metrics article,','.bq-adaptive-rules>span{','.bq-adaptive-feedback,','.bq-open-review-progress{','.bq-open-review-error{']){
  assert(css.includes(selector),`Review visual layer is missing expected decorative surface ${selector}`);
}

const forbidden=/\b(?:display|position|grid-template(?:-columns|-rows)?|grid-column|grid-row|flex(?:-direction|-basis|-grow|-shrink)?|width|height|min-width|min-height|max-width|max-height|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|gap|overflow(?:-[xy])?|aspect-ratio|transform|transition|cursor|pointer-events|z-index|order|font(?:-size|-weight|-family)?|line-height|resize|touch-action|text-align)\s*:/i;
assert(!forbidden.test(css),'Review visual polish must not introduce layout, typography geometry, motion or interaction declarations.');
assert(!/@media\s*\(max-width|@media\s*\(min-width/i.test(css),'Review visual polish must not introduce or change responsive breakpoints.');
assert(!/url\s*\(/i.test(css),'Review visual polish must not add remote or file-backed runtime dependencies.');
assert(!/animation\s*:|@keyframes/i.test(css),'Review visual polish must not add animation behavior.');
assert(css.includes('@media(prefers-contrast:more)'),'Review visual polish must keep an explicit higher-contrast presentation path.');

assert(adaptiveCss.includes('.bq-adaptive-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:18px}'),'Adaptive metrics geometry ownership must remain in adaptive-learning.css.');
assert(adaptiveCss.includes('[data-adaptive-page] button{min-height:44px}'),'Adaptive touch-target ownership must remain in adaptive-learning.css.');
assert(adaptiveCss.includes('@media(max-width:700px)'),'Adaptive responsive breakpoint ownership must remain in adaptive-learning.css.');
assert(reviewCss.includes('.bq-open-review{max-width:760px;margin:0 auto}'),'Open Review container geometry ownership must remain in open-review.css.');
assert(reviewCss.includes('.bq-open-review-actions button,.bq-open-review-head button,.bq-open-review button{min-height:44px}'),'Open Review touch-target ownership must remain in open-review.css.');
assert(reviewCss.includes('@media(max-width:600px)'),'Open Review responsive breakpoint ownership must remain in open-review.css.');

console.log('BibleQuest v3 Adaptive Learning and Open Review visual polish static contract passed.');
