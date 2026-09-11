import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const read=name=>fs.readFileSync(path.join(root,'src','ui',name),'utf8');
const account=read('account-visual-polish.css');
const tutorial=read('tutorial-visual-polish.css');
const appBase=read('app.css');
const tutorialBase=read('tutorial.css');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

assert(index.includes('<link rel="stylesheet" href="src/ui/app.css">\n  <link rel="stylesheet" href="src/ui/account-visual-polish.css">'),'Account visual layer must load directly after app.css.');
assert(index.includes('<link rel="stylesheet" href="src/ui/tutorial.css">\n  <link rel="stylesheet" href="src/ui/tutorial-visual-polish.css">'),'Tutorial visual layer must load directly after tutorial.css.');

assert(account.includes('Presentation only: no layout, authentication, signup/recovery/device behavior, persistence, permissions, navigation or accessibility ownership.'),'Account visual boundary is missing.');
assert(tutorial.includes('Presentation only: no layout, tutorial lifecycle, account handoff, actions, persistence, navigation, reduced-motion or accessibility ownership.'),'Tutorial visual boundary is missing.');

for(const selector of ['.bq-account-panel{','.bq-account-tabs{','.bq-account-tabs button.active{','.bq-account-form input{','.bq-device-row{','.bq-recovery-code{'])assert(account.includes(selector),`Account visual layer is missing ${selector}`);
for(const selector of ['.bq-tutorial-dialog{','.bq-tutorial-header,','.bq-tutorial-trainer{','.bq-tutorial-progress i.is-on{','.bq-home-tutorial{'])assert(tutorial.includes(selector),`Tutorial visual layer is missing ${selector}`);

const forbidden=/\b(?:display|position|inset|grid-template(?:-columns|-rows)?|grid-column|grid-row|flex(?:-direction|-basis|-grow|-shrink|-wrap)?|width|height|min-width|min-height|max-width|max-height|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|gap|overflow(?:-[xy])?|aspect-ratio|transform|transition|cursor|pointer-events|z-index|order|resize|font(?:-size|-weight|-family)?|line-height)\s*:/i;
for(const [name,css] of [['account',account],['tutorial',tutorial]]){
  assert(!forbidden.test(css),`${name} visual polish must not introduce layout, typography geometry, motion or interaction declarations.`);
  assert(!/@media\s*\(max-width|@media\s*\(min-width/i.test(css),`${name} visual polish must not introduce responsive breakpoints.`);
  assert(!/url\s*\(/i.test(css),`${name} visual polish must not add runtime asset dependencies.`);
  assert(!/animation\s*:|@keyframes/i.test(css),`${name} visual polish must not add animation behavior.`);
  assert(css.includes('@media(prefers-contrast:more)'),`${name} visual polish must retain an explicit higher-contrast presentation path.`);
}

assert(appBase.includes('.bq-account-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px'),'Account tab layout ownership must remain in app.css.');
assert(appBase.includes('.bq-account-form{display:grid;gap:12px;margin:18px 0 10px}'),'Account form layout ownership must remain in app.css.');
assert(appBase.includes('@media(max-width:480px)'),'Account mobile breakpoint ownership must remain in app.css.');
assert(tutorialBase.includes('.bq-tutorial-stage{display:grid;grid-template-columns:220px minmax(0,1fr);gap:22px;padding:24px}'),'Tutorial stage layout ownership must remain in tutorial.css.');
assert(tutorialBase.includes('@media(max-width:560px)'),'Tutorial mobile breakpoint ownership must remain in tutorial.css.');
assert(tutorialBase.includes('@media(prefers-reduced-motion:reduce)'),'Tutorial reduced-motion ownership must remain in tutorial.css.');

console.log('BibleQuest v3 Account/tutorial visual polish static contract passed.');
