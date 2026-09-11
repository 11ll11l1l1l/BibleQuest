import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const progress=fs.readFileSync(path.join(root,'src','ui','progress-visual-polish.css'),'utf8');
const daily=fs.readFileSync(path.join(root,'src','ui','daily-mission-visual-polish.css'),'utf8');
const progressBase=fs.readFileSync(path.join(root,'src','ui','progress.css'),'utf8');
const dailyBase=fs.readFileSync(path.join(root,'src','ui','daily-mission.css'),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

assert(index.includes('<link rel="stylesheet" href="src/ui/progress.css">\n  <link rel="stylesheet" href="src/ui/progress-visual-polish.css">'),'Progress visual polish must load directly after progress.css.');
assert(index.includes('<link rel="stylesheet" href="src/ui/daily-mission.css">\n  <link rel="stylesheet" href="src/ui/daily-mission-visual-polish.css">'),'Daily Journey visual polish must load directly after daily-mission.css.');
assert(progress.includes('Presentation only: no layout, XP, streak, badge, reward, persistence or accessibility ownership.'),'Progress visual layer must declare its presentation-only boundary.');
assert(daily.includes('Presentation only: no layout, mission sequencing, answers, XP, persistence, navigation or accessibility ownership.'),'Daily Journey visual layer must declare its presentation-only boundary.');

for(const [css,name,selectors] of [[progress,'Progress',['.bq-progress-chip{','.bq-progress-stats>div{','.bq-badge-card{','.bq-badge-card.is-unlocked{','.bq-progress-head,']], [daily,'Daily Journey',['.bq-daily-progress{','.bq-daily-steps li{','.bq-daily-steps li.is-current{','.bq-daily-card,','.bq-daily-choices button{','.bq-daily-feedback{']]]){
  for(const selector of selectors)assert(css.includes(selector),`${name} visual layer is missing expected decorative surface ${selector}`);
  const forbidden=/\b(?:display|position|inset|grid-template(?:-columns|-rows)?|grid-column|grid-row|flex(?:-direction|-basis|-grow|-shrink|-wrap)?|width|height|min-width|min-height|max-width|max-height|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|gap|overflow(?:-[xy])?|aspect-ratio|transform|transition|cursor|pointer-events|z-index|order|resize|font(?:-size|-weight|-family)?|line-height)\s*:/i;
  assert(!forbidden.test(css),`${name} visual polish must not introduce layout, typography geometry, motion or interaction declarations.`);
  assert(!/@media\s*\(max-width|@media\s*\(min-width/i.test(css),`${name} visual polish must not introduce responsive breakpoints.`);
  assert(!/url\s*\(/i.test(css),`${name} visual polish must not add runtime asset dependencies.`);
  assert(!/animation\s*:|@keyframes/i.test(css),`${name} visual polish must not add animation behavior.`);
  assert(css.includes('@media(prefers-contrast:more)'),`${name} visual polish must retain an explicit higher-contrast presentation path.`);
}

assert(progressBase.includes('.bq-progress-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:16px}'),'Progress stats layout ownership must remain in progress.css.');
assert(progressBase.includes('@media(max-width:560px){.bq-progress-chip small{display:none}.bq-progress-stats{grid-template-columns:repeat(2,1fr)}'),'Progress mobile layout ownership must remain in progress.css.');
assert(dailyBase.includes('.bq-daily-steps{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));'),'Daily step layout ownership must remain in daily-mission.css.');
assert(dailyBase.includes('.bq-daily-progress span{display:block;height:100%;background:#2f704d;border-radius:inherit;transition:width .18s ease}'),'Daily progress motion ownership must remain in daily-mission.css.');
assert(dailyBase.includes('@media(max-width:700px){.bq-daily-steps{grid-template-columns:1fr}'),'Daily mobile breakpoint ownership must remain in daily-mission.css.');
assert(dailyBase.includes('@media(prefers-reduced-motion:reduce){.bq-daily-progress span{transition:none}}'),'Daily reduced-motion contract must remain in daily-mission.css.');

console.log('BibleQuest v3 Progress + Daily Journey visual polish static contract passed.');
