// BibleQuest V4 primary app-family acceptance contract.
// Home / Learn / Play / Grow / More must remain one coherent modern shell with
// real route wiring. This tranche may polish user-facing copy, but it must not
// replace the shell or feature/service boundaries. bootstrap.js is
// intentionally NOT byte-locked here: it is the single shared composition
// root, and legitimately grows every time a new cross-cutting service (Home
// shortcut rail's onReader/onCalendar/onGrow, Phase 3's presence.activeCount,
// etc.) is wired into an existing route. shell.js remains byte-locked since
// it should not need to change for routine feature wiring.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const baselineSha='6c55de27154b9f856faaf80d7cd17b18124c54f3';
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');

for(const relative of['src/ui/shell.js']){
  const current=read(relative);
  const baseline=execFileSync('git',['show',`${baselineSha}:${relative}`],{cwd:root,encoding:'utf8'});
  assert.equal(current,baseline,`${relative} must remain byte-for-byte unchanged in the primary-family coherence tranche.`);
}
const bootstrapSrc=read('src/app/bootstrap.js');
assert.ok(bootstrapSrc.includes("home:()=>homePage(") && bootstrapSrc.includes("learn:()=>learnPage(") && bootstrapSrc.includes("play:()=>gamesPage(") && bootstrapSrc.includes("grow:()=>progressPage(") && bootstrapSrc.includes("more:()=>morePage("),'bootstrap.js must keep the primary-family route map (home/learn/play/grow/more) intact, even as service wiring evolves.');

const shell=read('src/ui/shell.js');
const bootstrap=read('src/app/bootstrap.js');
const home=read('src/features/home/index.js');
const learn=read('src/features/learn/index.js');
const games=read('src/features/games/index.js');
const progress=read('src/features/progress/index.js');
const more=read('src/features/more/index.js');
const index=read('index.html');
const workflow=read('.github/workflows/v3-regression.yml');

const navEntries=[
  "['home','Home','home']",
  "['learn','Learn','learn']",
  "['play','Play','play']",
  "['grow','Grow','grow']",
  "['more','More','more']"
];
for(const entry of navEntries) assert.ok(shell.includes(entry),`Primary shell navigation changed or lost ${entry}.`);
assert.equal((shell.match(/data-route-link=/g)||[]).length,1,'Primary navigation must continue to render from the single NAV owner, not a duplicated hard-coded route set.');
assert.ok(shell.includes('aria-current'),'Primary shell must preserve active-route semantics.');

for(const route of['home','learn','play','grow','more']) assert.ok(bootstrap.includes(`${route}:()=>`)||bootstrap.includes(`${route}: () =>`),`Bootstrap lost the ${route} route owner.`);
for(const token of[
  "onAssignments:()=>router.navigate('assignments')",
  "onReader:()=>router.navigate('reader')",
  "onCalendar:()=>router.navigate('calendar')",
  "onGrow:()=>router.navigate('grow')",
  "onCommunity:()=>router.navigate('community')",
  "onMinistryHub:()=>router.navigate('ministry-hub')"
]) assert.ok(bootstrap.includes(token),`Primary family wiring disappeared: ${token}.`);

for(const sheet of['src/ui/home-v4.css','src/ui/learn-v4.css','src/ui/games-v4.css','src/ui/journey-v4.css','src/ui/more-v4.css','src/ui/family-accents-v4.css'])
  assert.ok(index.includes(`href="${sheet}"`),`Primary V4 family stylesheet is not active: ${sheet}.`);

const shortcutLabels=['Daily Journey','Reader','Assignments','Calendar','Progress'];
let previous=-1;
for(const label of shortcutLabels){
  const at=home.indexOf(`label: '${label}'`);
  assert.ok(at>previous,`Home shortcut rail must retain requested order; missing/out-of-order ${label}.`);
  previous=at;
}
for(const hook of['data-home-rail','data-home-daily','data-home-assignments','data-home-rail-action']) assert.ok(home.includes(hook),`Home family contract lost ${hook}.`);

for(const hook of['data-open-reader','data-open-study','data-open-deep-questions','data-open-bible-world','data-open-open-review','data-open-private-notes','data-open-cloud-notes'])
  assert.ok(learn.includes(hook),`Learn hub lost required entry point ${hook}.`);

for(const hook of['data-games-page','data-game-launch','data-memory-open','data-same-room-open'])
  assert.ok(games.includes(hook),`Play hub lost required entry point ${hook}.`);
assert.ok(games.includes('Bible games for every kind of practice'),'Play launcher must use user-facing V4 copy.');

for(const hook of['data-progress-page','data-open-transform','data-open-personality-profile','data-open-psychometrics','data-open-avatar-vault'])
  assert.ok(progress.includes(hook),`Grow hub lost required entry point ${hook}.`);

assert.equal((more.match(/data-more-group=/g)||[]).length,5,'More must retain exactly five V4 groups.');
for(const hook of[
  'data-open-community','data-open-ministry-hub','data-open-notification-center','data-open-workspace','data-open-content-review',
  'data-open-couples-family','data-open-couples-cloud','data-open-congregation','data-open-journey-groups','data-open-team-center',
  'data-open-backup','data-open-mission','data-open-accessibility','data-open-calendar','data-install-app'
]) assert.ok(more.includes(hook),`More hub lost required destination ${hook}.`);

const primaryCopy=[games,progress,more].join('\n').toLowerCase();
for(const banned of[
  'active rebuild path',
  'still being rebuilt',
  'rebuilt cleanly',
  'verified progress service',
  'account/cloud progress is rebuilt',
  'controlled launcher, progress, and cleanup boundaries',
  'later admin surfaces remain intentionally unavailable'
]) assert.ok(!primaryCopy.includes(banned),`Primary V4 surfaces must not expose internal development wording: ${banned}.`);

for(const test of[
  'tests/v4-primary-family-static.mjs',
  'tests/v4-primary-family-smoke.mjs',
  'tests/v3-shell-smoke.mjs',
  'tests/v3-final-mobile-widths-smoke.mjs',
  'tests/v4-more-grouping-static.mjs',
  'tests/v4-home-rail-smoke.mjs'
]) assert.ok(workflow.includes(test),`Accumulated CI must retain primary-family evidence: ${test}.`);

console.log('BibleQuest v4 primary app-family static acceptance passed.');