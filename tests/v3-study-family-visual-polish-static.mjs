import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const read=name=>fs.readFileSync(path.join(root,'src','ui',name),'utf8');
const layers={
  study:read('study-visual-polish.css'),
  deep:read('deep-questions-visual-polish.css'),
  story:read('story-journey-visual-polish.css'),
  wisdom:read('wisdom-situations-visual-polish.css')
};
const bases={study:read('study.css'),deep:read('deep-questions.css'),story:read('story-journey.css'),wisdom:read('wisdom-situations.css')};
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

for(const [base,polish] of [['study.css','study-visual-polish.css'],['deep-questions.css','deep-questions-visual-polish.css'],['story-journey.css','story-journey-visual-polish.css'],['wisdom-situations.css','wisdom-situations-visual-polish.css']]){
  assert(index.includes(`<link rel="stylesheet" href="src/ui/${base}">\n  <link rel="stylesheet" href="src/ui/${polish}">`),`${polish} must load directly after ${base}.`);
}

assert(layers.study.includes('Presentation only: no layout, lesson lifecycle, answers, references, persistence, navigation or accessibility ownership.'),'Guided Study visual boundary is missing.');
assert(layers.deep.includes('Presentation only: no layout, question flow, references, saved reflection, navigation or accessibility ownership.'),'Deep Questions visual boundary is missing.');
assert(layers.story.includes('Presentation only: no layout, scene order, scoring, references, navigation or accessibility ownership.'),'Story Journey visual boundary is missing.');
assert(layers.wisdom.includes('Presentation only: no layout, scenario choices, rationale semantics, scoring, navigation or accessibility ownership.'),'Wisdom Situations visual boundary is missing.');

const expected={
  study:['.bq-study-card,','.bq-study-prompt{','.bq-study-feedback{','.bq-study-saved-response{'],
  deep:['.bq-deep-featured,','.bq-deep-featured{','.bq-deep-feedback{','[data-deep-page] .bq-game-choice.is-selected{'],
  story:['.bq-story-card,','.bq-story-icon,','.bq-story-result{','.bq-story-result.is-review{'],
  wisdom:['.bq-wisdom-tension,','.bq-wisdom-tension{','.bq-wisdom-warning,','.bq-wisdom-result,','.bq-wisdom-rationales article.is-selected{']
};
const forbidden=/\b(?:display|position|inset|grid-template(?:-columns|-rows)?|grid-column|grid-row|flex(?:-direction|-basis|-grow|-shrink|-wrap)?|width|height|min-width|min-height|max-width|max-height|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|gap|overflow(?:-[xy])?|aspect-ratio|transform|transition|cursor|pointer-events|z-index|order|resize|font(?:-size|-weight|-family)?|line-height)\s*:/i;
for(const [name,css] of Object.entries(layers)){
  for(const selector of expected[name])assert(css.includes(selector),`${name} visual layer is missing expected decorative surface ${selector}`);
  assert(!forbidden.test(css),`${name} visual polish must not introduce layout, typography geometry, motion or interaction declarations.`);
  assert(!/@media\s*\(max-width|@media\s*\(min-width/i.test(css),`${name} visual polish must not introduce responsive breakpoints.`);
  assert(!/url\s*\(/i.test(css),`${name} visual polish must not add runtime asset dependencies.`);
  assert(!/animation\s*:|@keyframes/i.test(css),`${name} visual polish must not add animation behavior.`);
  assert(css.includes('@media(prefers-contrast:more)'),`${name} visual polish must retain an explicit higher-contrast presentation path.`);
}
assert(!/^\s*\.bq-game-choice\.is-selected\s*\{/m.test(layers.deep),'Deep Questions visual state must remain scoped to the Deep Questions page.');

assert(bases.study.includes('.bq-study-library{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}'),'Guided Study library layout ownership must remain in study.css.');
assert(bases.study.includes('@media(max-width:560px){.bq-study-library{grid-template-columns:1fr}'),'Guided Study mobile layout ownership must remain in study.css.');
assert(bases.deep.includes('.bq-deep-library{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}'),'Deep Questions library layout ownership must remain in deep-questions.css.');
assert(bases.deep.includes('@media(max-width:700px){.bq-deep-library{grid-template-columns:1fr}'),'Deep Questions mobile layout ownership must remain in deep-questions.css.');
assert(bases.story.includes('.bq-story-library{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}'),'Story Journey library layout ownership must remain in story-journey.css.');
assert(bases.story.includes('@media(max-width:700px){.bq-story-library{grid-template-columns:1fr}'),'Story Journey mobile layout ownership must remain in story-journey.css.');
assert(bases.wisdom.includes('.bq-wisdom-options{display:grid;gap:10px}'),'Wisdom Situations option layout ownership must remain in wisdom-situations.css.');
assert(bases.wisdom.includes('@media(max-width:700px){.bq-wisdom-session{padding:16px}'),'Wisdom Situations mobile layout ownership must remain in wisdom-situations.css.');

console.log('BibleQuest v3 Study-family visual polish static contract passed.');
