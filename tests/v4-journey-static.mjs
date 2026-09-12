// BibleQuest V4 Gate 9 — Bible World / Progress / Personal Mission / Calendar.
// This tranche is presentation-only. Existing feature owners stay byte-for-byte
// unchanged from the Gate 8 certified checkpoint; this test protects that boundary.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const index=read('index.html');
const css=read('src/ui/journey-v4.css');

assert.ok(index.includes('href="src/ui/journey-v4.css"'),'Gate 9 V4 journey stylesheet must be linked from index.html.');

const owners=[
  ['src/features/bible-world/index.js',[
    'data-bible-world-view','data-world-region','data-world-read','data-world-review','data-world-art-image','data-world-reveal-percent'
  ]],
  ['src/features/progress/index.js',[
    'data-progress-page','data-progress-page-xp','data-progress-page-streak','data-open-transform','data-open-personality-profile','data-open-psychometrics','data-open-avatar-vault','data-progress-badge'
  ]],
  ['src/features/mission/index.js',[
    'data-mission-page','data-mission-action','data-mission-start','data-mission-back','data-mission-art'
  ]],
  ['src/features/calendar/index.js',[
    'data-calendar-page','data-calendar-add','data-calendar-event-source','data-calendar-share','data-calendar-recurrence','data-calendar-edit','data-calendar-remove','data-calendar-remove-congregation','data-calendar-back'
  ]]
];

for(const [file,hooks] of owners){
  const current=read(file);
  for(const hook of hooks) assert.ok(current.includes(hook),`${file} must preserve existing interaction hook ${hook}.`);
  try{
    const baseline=execFileSync('git',['show',`release/v4-ministry-ops:${file}`],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']});
    assert.equal(current,baseline,`${file} must remain byte-for-byte unchanged in the presentation-only Gate 9 tranche.`);
  }catch(error){
    if(error?.name==='AssertionError')throw error;
    // Some isolated CI checkouts do not fetch local release refs. Hook preservation
    // above remains mandatory; exact equality is enforced whenever the checkpoint
    // ref is available.
  }
}

for(const selector of ['.bq-bible-world','.bq-progress-head','[data-mission-page]','[data-calendar-page]']){
  assert.ok(css.includes(selector),`Gate 9 stylesheet must explicitly own ${selector}.`);
}

// Bible World must read as an intentional progression route instead of exposing
// the inherited emoji region glyphs as the primary visual marker.
assert.ok(css.includes('counter-reset:bq-world-step'),'Bible World must establish a route-step counter.');
assert.ok(css.includes('counter-increment:bq-world-step'),'Bible World region cards must advance route-step markers.');
assert.ok(css.includes('content:counter(bq-world-step,decimal-leading-zero)'),'Bible World region markers must use deliberate numbered progression.');
assert.ok(/\.bq-world-icon\{[^}]*font-size:0/s.test(css),'Inherited emoji region glyphs must not remain the primary V4 map marker.');

// Journey family must preserve minimum target sizing and the V4 accessibility baseline.
assert.ok(css.includes('min-height:var(--tap-target)'),'Gate 9 interactive controls must retain the certified touch-target token.');
assert.ok(/@media\(max-width:760px\)/.test(css),'Gate 9 must include tablet/narrow responsive treatment.');
assert.ok(/@media\(max-width:390px\)/.test(css),'Gate 9 must explicitly protect compact phone presentation.');
assert.ok(/@media\(prefers-reduced-motion:reduce\)/.test(css),'Gate 9 must honor reduced motion.');
assert.ok(/@media\(prefers-contrast:more\)/.test(css),'Gate 9 must honor increased contrast.');

// No remote visual dependency or executable behavior may be introduced by this family layer.
assert.ok(!/https?:\/\//i.test(css),'Gate 9 CSS must not introduce remote assets.');
assert.ok(!/@import/i.test(css),'Gate 9 CSS must not import external styles.');

console.log('BibleQuest v4 Bible World/Progress/Personal Mission/Calendar static contract passed.');
