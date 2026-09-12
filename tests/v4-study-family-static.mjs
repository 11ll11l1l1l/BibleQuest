// BibleQuest V4 Gate 10 — Study family presentation contract.
// Six existing feature owners remain authoritative; this tranche must not alter
// lesson/session/content/provenance/reward/adaptive/open-review behavior.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const index=read('index.html');
const css=read('src/ui/study-family-v4.css');

assert.ok(index.includes('href="src/ui/study-family-v4.css"'),'Gate 10 Study-family stylesheet must be linked from index.html.');

const owners=[
  ['src/features/study/index.js',[
    'data-study-page','data-study-open','data-study-reader','data-study-choice','data-study-response-form','data-study-confirm','data-study-advance','data-study-complete'
  ]],
  ['src/features/deep-questions/index.js',[
    'data-deep-page','data-deep-open','data-deep-reader','data-deep-choice','data-deep-note-form','data-deep-advance','data-deep-complete'
  ]],
  ['src/features/story-journey/index.js',[
    'data-story-page','data-story-open','data-story-random','data-story-reader','data-story-choice','data-story-advance','data-story-complete'
  ]],
  ['src/features/wisdom-situations/index.js',[
    'data-wisdom-page','data-wisdom-session','data-wisdom-choice','data-wisdom-another','data-wisdom-restart','data-wisdom-complete'
  ]],
  ['src/features/adaptive-learning/index.js',[
    'data-adaptive-page','data-adaptive-start','data-adaptive-resume','data-adaptive-choice','data-adaptive-next','data-adaptive-session','data-adaptive-complete'
  ]],
  ['src/features/open-review/index.js',[
    'data-open-review-view','data-open-review-start','data-open-review-resume','data-open-review-reveal','data-open-review-again','data-open-review-got','data-open-review-learn'
  ]]
];

for(const [file,hooks] of owners){
  const current=read(file);
  for(const hook of hooks) assert.ok(current.includes(hook),`${file} must preserve existing interaction hook ${hook}.`);
  try{
    const baseline=execFileSync('git',['show',`release/v4-journey:${file}`],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']});
    assert.equal(current,baseline,`${file} must remain byte-for-byte unchanged in the presentation-only Gate 10 tranche.`);
  }catch(error){
    if(error?.name==='AssertionError')throw error;
    // Release refs are not guaranteed in shallow CI checkouts. Hook preservation
    // remains mandatory; exact equality is enforced whenever the checkpoint ref exists.
  }
}

// Content provenance / doctrinal safety must remain represented by the existing owners.
for(const file of ['src/features/study/index.js','src/features/deep-questions/index.js','src/features/story-journey/index.js','src/features/wisdom-situations/index.js','src/features/adaptive-learning/index.js']){
  assert.ok(read(file).includes('sourceLabel'),`${file} must preserve source provenance presentation.`);
}
for(const file of ['src/features/deep-questions/index.js','src/features/story-journey/index.js','src/features/wisdom-situations/index.js']){
  assert.ok(read(file).includes('doctrinalNotice'),`${file} must preserve doctrinal-safety notice ownership.`);
}

for(const selector of ['[data-study-page]','[data-deep-page]','[data-story-page]','[data-wisdom-page]','[data-adaptive-page]','[data-open-review-view]']){
  assert.ok(css.includes(selector),`Gate 10 stylesheet must explicitly scope ${selector}.`);
}

// Story/adaptive completion visuals should not rely on inherited emoji as primary V4 artwork.
assert.ok(css.includes('counter-reset:bq-story-card'),'Story library must establish deliberate editorial sequence markers.');
assert.ok(css.includes('counter-increment:bq-story-card'),'Story cards must advance deliberate sequence markers.');
assert.ok(css.includes('content:counter(bq-story-card,decimal-leading-zero)'),'Story-card V4 marker must use numbered progression.');
assert.ok(/\.bq-story-icon\{[^}]*font-size:0/s.test(css),'Story card emoji must not remain the primary V4 marker.');
assert.ok(/\.bq-adaptive-orb\{[^}]*font-size:0/s.test(css),'Adaptive completion emoji must not remain the primary V4 status artwork.');

// Existing semantic correct/review/wrong text remains in JS; presentation must keep
// those states distinct without depending on color alone in high-contrast mode.
assert.ok(css.includes('.is-correct'),'Study family must style correct-state surfaces.');
assert.ok(css.includes('.is-wrong'),'Study family must style wrong-state surfaces.');
assert.ok(css.includes('.is-review'),'Study family must style review-state surfaces.');
assert.ok(css.includes('outline:2px solid var(--warning)'),'High-contrast review state must add a non-fill visual boundary.');

// Certified V4 responsive/accessibility baseline.
assert.ok(css.includes('min-height:var(--tap-target)'),'Study-family controls must retain the certified touch-target token.');
assert.ok(/@media\(max-width:820px\)/.test(css),'Study family must include tablet layout treatment.');
assert.ok(/@media\(max-width:520px\)/.test(css),'Study family must include phone layout treatment.');
assert.ok(/@media\(max-width:390px\)/.test(css),'Study family must explicitly protect compact phone layout.');
assert.ok(/@media\(prefers-reduced-motion:reduce\)/.test(css),'Study family must honor reduced motion.');
assert.ok(/@media\(prefers-contrast:more\)/.test(css),'Study family must honor increased contrast.');

assert.ok(!/https?:\/\//i.test(css),'Gate 10 CSS must not introduce remote assets.');
assert.ok(!/@import/i.test(css),'Gate 10 CSS must not import external styles.');

console.log('BibleQuest v4 Study-family static contract passed.');
