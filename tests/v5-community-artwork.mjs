import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('src/features/community/index.js','utf8');
const css=fs.readFileSync('src/ui/community.css','utf8');

const mappings=[
  ['congregation','assets/v4/community/congregation.png'],
  ['leaderboards','assets/v4/community/leaderboards.png'],
  ['recognition','assets/v4/community/recognition.png'],
  ['assignments','assets/v4/ministry-more/assignments.png'],
  ['live-rooms','assets/v4/community/live-rooms.png'],
  ['journey-groups','assets/v4/community/journey-groups.png'],
  ['encouragements','assets/v4/community/encouragements.png'],
];

for(const [route,asset] of mappings){
  assert.ok(fs.existsSync(asset),`required Community artwork must exist: ${asset}`);
  assert.ok(source.includes(`route:'${route}',art:'${asset}'`),`Community must map ${route} to exact artwork ${asset}`);
}
for(const glyph of ['⛪','🏆','🏅','📮','📡','👥','💛'])
  assert.ok(!source.includes(glyph),`legacy Community action glyph must not remain in normal presentation: ${glyph}`);

assert.match(source,/class="bq-community-art" src="\$\{action\.art\}" alt="" aria-hidden="true"/,'Community action artwork must be decorative');
assert.match(source,/<b>\$\{esc\(tx\(action\.title\)\)\}<\/b><small>\$\{esc\(tx\(action\.description\)\)\}<\/small>/,'localized title and description must remain independent of artwork');
assert.match(css,/\.bq-community-art\{[^}]*width:48px;[^}]*height:48px;[^}]*object-fit:contain/,'Community artwork must have bounded desktop presentation');
assert.match(css,/@media\(max-width:600px\)[\s\S]*\.bq-community-art\{width:44px;height:44px\}/,'Community artwork must stay bounded on mobile');

console.log('v5 Community exact artwork mapping + independent localized text: PASS');
