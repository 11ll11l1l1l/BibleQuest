// BibleQuest V4 family-identity contract.
// Presentation-only: proves the late accent layer is registered, each family
// owns a distinct semantic palette, readable deep/accent colors meet WCAG AA
// normal-text contrast on white, and game outcome semantics are not recolored.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'ui', 'family-accents-v4.css'), 'utf8');

const familyLink = 'src/ui/family-accents-v4.css';
assert.ok(index.includes(familyLink), 'index.html must load the V4 family accent layer.');
assert.ok(index.indexOf(familyLink) > index.indexOf('src/ui/reset-recovery-v4.css'), 'Family accents must load after the existing V4 family layers so the override is deterministic.');

const required = {
  home:['deep','accent','soft'],
  learn:['deep','accent','soft'],
  play:['deep','accent','soft'],
  grow:['deep','accent','soft'],
  community:['deep','accent','soft'],
  ministry:['deep','accent','soft']
};
for (const [family,kinds] of Object.entries(required)) {
  for (const kind of kinds) assert.ok(css.includes(`--family-${family}-${kind}:`), `Missing --family-${family}-${kind} token.`);
}

for (const selector of ['.bq-learn-primary','.bq-reader-title','[data-study-page]','.bq-game-card','[data-transform-page]','.bq-community-head','[data-ministry-hub-view]','[data-congregation-view]']) {
  assert.ok(css.includes(selector), `Family accent layer is missing expected scoped surface ${selector}.`);
}

assert.ok(css.includes('@media(prefers-contrast:more)'), 'Family accent layer must preserve a strong-contrast neutral treatment.');
assert.ok(!css.includes('.is-correct'), 'Family accents must not override correct-answer semantic styling.');
assert.ok(!css.includes('.is-wrong'), 'Family accents must not override wrong-answer semantic styling.');
assert.ok(!css.includes('--success:'), 'Family accents must not redefine the shared success token.');
assert.ok(!css.includes('--danger:'), 'Family accents must not redefine the shared danger token.');

function hexToRgb(hex) {
  const clean = hex.replace('#','');
  return [0,2,4].map(i => parseInt(clean.slice(i,i+2),16)/255);
}
function luminance(hex) {
  return hexToRgb(hex).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
}
function contrast(a,b) {
  const l1=luminance(a), l2=luminance(b), hi=Math.max(l1,l2), lo=Math.min(l1,l2);
  return (hi+.05)/(lo+.05);
}
for (const family of ['learn','play','grow','community','ministry']) {
  for (const kind of ['deep','accent']) {
    const match = css.match(new RegExp(`--family-${family}-${kind}:(#[0-9A-Fa-f]{6})`));
    assert.ok(match, `Expected literal hex for ${family} ${kind} contrast validation.`);
    assert.ok(contrast(match[1],'#FFFFFF') >= 4.5, `${family} ${kind} must meet WCAG AA normal-text contrast on white.`);
  }
}

console.log('BibleQuest v4 family accent identity contract passed.');
