import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const read=name=>fs.readFileSync(path.join(root,'src','ui',name),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');

const forbidden=/\b(?:display|position|grid-template(?:-columns|-rows)?|grid-column|grid-row|flex(?:-direction|-basis|-grow|-shrink)?|width|height|min-width|min-height|max-width|max-height|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|gap|overflow(?:-[xy])?|aspect-ratio|transform|transition|cursor|pointer-events|z-index|order)\s*:/i;

for (const name of ['more-visual-polish.css','newer-features-visual-polish.css']) {
  assert(index.includes(`href="src/ui/${name}"`), `${name} must be linked from index.html.`);
  const css = read(name);
  assert(css.includes('Presentation only'), `${name} must declare its presentation-only boundary.`);
  assert(!forbidden.test(css), `${name} must not introduce layout, geometry, or motion declarations.`);
  assert(!/@media\s*\(max-width|@media\s*\(min-width/i.test(css), `${name} must not introduce or change responsive breakpoints.`);
  assert(!/url\s*\(/i.test(css), `${name} must not add remote or file-backed runtime dependencies.`);
  assert(!/animation\s*:|@keyframes/i.test(css), `${name} must not add animation behavior.`);
  assert(css.includes('@media(prefers-contrast:more)'), `${name} must keep an explicit higher-contrast presentation path.`);
}

for (const selector of ['[data-more-workspace]{','[data-more-mission]{','[data-more-calendar]{']) {
  assert(read('more-visual-polish.css').includes(selector), `More visual layer is missing expected decorative surface ${selector}`);
}
for (const selector of ['[data-avatar-vault-page]{','.bq-badge-card{','[data-mission-page]{','[data-calendar-page]{']) {
  assert(read('newer-features-visual-polish.css').includes(selector), `Newer-features visual layer is missing expected decorative surface ${selector}`);
}

const avatarBase=read('avatar-vault.css');
assert(avatarBase.includes('.bq-badge-grid{display:grid'), 'Avatar Vault badge-grid layout ownership must remain in the base stylesheet, not the polish layer.');
const calendarBase=read('calendar.css');
assert(calendarBase.includes("form[data-calendar-add]{display:flex"), 'Calendar form layout ownership must remain in the base stylesheet, not the polish layer.');

console.log('BibleQuest v3 game-like visual polish (tranche 18) static contract passed.');
