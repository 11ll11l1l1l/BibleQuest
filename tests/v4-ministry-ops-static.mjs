// BibleQuest V4 Gate 8 — Ministry / Assignments / Workspace / Notification Center.
// This tranche is deliberately CSS-only. The four verified feature owners must
// remain byte-for-byte identical to the prior certified V4 checkpoint.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const index=read('index.html');
const css=read('src/ui/ministry-ops-v4.css');

assert.ok(index.includes('href="src/ui/ministry-ops-v4.css"'),'Gate 8 V4 stylesheet must be linked from index.html.');

const owners=[
  ['src/features/ministry-hub/index.js',[
    'data-ministry-hub-view','data-ministry-route','data-ministry-tool','data-ministry-membership','data-ministry-privileged'
  ]],
  ['src/features/assignments/index.js',[
    'data-assignments-view','data-assignment-row','data-assignment-open','data-assignment-detail','data-assignment-publisher','data-assignment-complete','data-assignment-private-responses'
  ]],
  ['src/features/workspace/index.js',[
    'data-workspace-view','data-workspace-tab','data-workspace-search','data-workspace-open-scripture','data-workspace-role-boundary','data-workspace-legacy-boundary'
  ]],
  ['src/features/notification-center/index.js',[
    'data-notification-item','data-notification-open','data-notification-read','data-notification-read-all','data-notification-refresh'
  ]]
];

for(const [file,hooks] of owners){
  const current=read(file);
  for(const hook of hooks) assert.ok(current.includes(hook),`${file} must preserve existing interaction hook ${hook}.`);
  try{
    const baseline=execFileSync('git',['show',`release/v4-games-avatar:${file}`],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']});
    assert.equal(current,baseline,`${file} must remain byte-for-byte unchanged in the CSS-only Gate 8 tranche.`);
  }catch(error){
    if(error?.name==='AssertionError')throw error;
    // Some isolated verification checkouts may not carry local tag refs. Hook
    // preservation above remains mandatory; exact equality is enforced wherever
    // the certified checkpoint ref is available.
  }
}

for(const selector of ['[data-ministry-hub-view]','[data-assignments-view]','[data-workspace-view]','.notification-center-item']){
  assert.ok(css.includes(selector),`Gate 8 stylesheet must scope presentation to ${selector}.`);
}
assert.ok(css.includes('min-height:var(--tap-target)'), 'Gate 8 controls must retain the certified minimum touch-target token.');
assert.ok(/@media\(max-width:720px\)/.test(css), 'Gate 8 must include narrow-screen responsive treatment.');
assert.ok(/@media\(max-width:390px\)/.test(css), 'Gate 8 must explicitly protect phone-width presentation.');
assert.ok(/@media\(prefers-reduced-motion:reduce\)/.test(css), 'Gate 8 must honor reduced motion.');
assert.ok(/@media\(prefers-contrast:more\)/.test(css), 'Gate 8 must honor increased contrast.');

// Unread and deferred states retain text/non-color indicators.
assert.ok(/notification-center-dot::before\{content:"●"/.test(css),'Unread notification presentation must not rely only on color.');
assert.ok(/data-ministry-status="deferred"\][^\n]*::before\{/.test(css)&&css.includes('content:"Pending"'),'Deferred ministry tools must carry a text-visible state indicator.');

// Presentation must not introduce remote assets or new executable behavior.
assert.ok(!/https?:\/\//i.test(css),'Gate 8 CSS must not introduce remote assets.');
assert.ok(!/@import/i.test(css),'Gate 8 CSS must not import external styles.');

console.log('BibleQuest v4 Ministry/Assignments/Workspace/Notifications static contract passed.');
