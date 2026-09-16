import assert from 'node:assert/strict';
import fs from 'node:fs';

const familyCss=fs.readFileSync('src/ui/couples-family.css','utf8');
const cloudCss=fs.readFileSync('src/ui/couples-cloud.css','utf8');
const familySource=fs.readFileSync('src/features/couples-family/index.js','utf8');
const familyContent=fs.readFileSync('src/content/couples-family.js','utf8');
const cloudSource=fs.readFileSync('src/features/couples-cloud/index.js','utf8');

for(const asset of [
  'assets/v4/decorative/mini-cross.png',
  'assets/v4/decorative/sparkle.png',
  'assets/v4/community/prayer-circle.png'
]) assert.ok(fs.existsSync(asset),`required genuine artwork must exist: ${asset}`);

assert.match(familyCss,/data-couples-mode=\"god\"/,'Us & God mode must have a stable artwork hook');
assert.match(familyCss,/data-couples-category=\"christ\"/,'Christ category must have a stable artwork hook');
assert.match(familyCss,/mini-cross\.png/,'Christ-specific Family surfaces must use mini-cross artwork');
assert.match(familyCss,/data-couples-mode=\"date\"/,'Date Night must have a stable artwork hook');
assert.match(familyCss,/sparkle\.png/,'Date Night literal sparkle must use sparkle artwork');

assert.match(cloudCss,/button:not\(\.done\)\[data-couple-cloud-step=\"0\"\]/,'Prayer artwork must not replace completed checkmarks');
assert.match(cloudCss,/prayer-circle\.png/,'Pray Honestly must use prayer-circle artwork');
assert.match(cloudCss,/button:not\(\.done\)\[data-couple-cloud-step=\"6\"\]/,'Christ artwork must not replace completed checkmarks');
assert.match(cloudCss,/mini-cross\.png/,'Us & God must use mini-cross artwork');
assert.doesNotMatch(familyCss,/couples-family\.png/,'whole-surface Couples Family art must not be forced onto sub-concepts');
assert.doesNotMatch(cloudCss,/couples-cloud\.png/,'whole-surface Couple Cloud art must not be forced onto sub-concepts');

for(const label of ['Communication Journey','One Card Tonight','Listen First','Couple Check-in','Repair Room','Us & God','Date Night Deck'])
  assert.ok(familySource.includes(label),`Family accessible text must remain independent of decorative art: ${label}`);
for(const label of ['Pray Honestly','Listen First','Notice the Good','Repair Gently','Build the Home','Serve Together','Us & God'])
  assert.ok(cloudSource.includes(label),`Cloud accessible text must remain independent of decorative art: ${label}`);

const reviewedUnmatchedFamily=['🧭','💬','👂','🌡️','🕊️'];
const reviewedUnmatchedCategories=['💛','🏠','🤍','🌱'];
const reviewedUnmatchedCloud=['👂','💛','🕊️','🏠','🤝'];
for(const glyph of reviewedUnmatchedFamily)
  assert.ok(familySource.includes(glyph),`reviewed unmatched Family glyph must remain explicit rather than receive a false asset: ${glyph}`);
for(const glyph of reviewedUnmatchedCategories)
  assert.ok(familyContent.includes(glyph),`reviewed unmatched category glyph must remain explicit in the content catalog rather than receive a false asset: ${glyph}`);
for(const glyph of reviewedUnmatchedCloud)
  assert.ok(cloudSource.includes(glyph),`reviewed unmatched Cloud glyph must remain explicit rather than receive a false asset: ${glyph}`);

assert.match(cloudSource,/done\.has\(String\(index\+1\)\)\?'✓':item\.icon/,'completed Couple Cloud journey must retain its explicit checkmark state');
console.log('v5 Couples genuine artwork mappings + reviewed exceptions: PASS');
