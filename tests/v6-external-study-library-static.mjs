import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('src/features/study/index.js','utf8');
const css=fs.readFileSync('src/ui/study.css','utf8');

const expected=[
  ['tyndale-notes','https://www.stepbible.org/version.jsp?version=TNotes'],
  ['tyndale-dictionary','https://tyndaleopenresources.com/'],
  ['stepbible','https://www.stepbible.org/'],
  ['matthew-henry','https://www.stepbible.org/version.jsp?version=MHCC'],
  ['naves-topical','https://www.ccel.org/ccel/nave/bible']
];

for(const [id,url] of expected){
  assert.ok(source.includes("id:'"+id+"'"),'Missing external resource '+id);
  assert.ok(source.includes("url:'"+url+"'"),'Unexpected or missing URL for '+id);
}
assert.match(source,/target="_blank" rel="noopener noreferrer"/,'External resources must open safely outside BibleQuest.');
assert.match(source,/reference and commentary tools, not BibleQuest Scripture text/,'External resources must be visibly distinguished from Scripture.');
assert.match(css,/\.bq-study-external-link\{[^}]*min-height:44px/,'External resource touch targets must remain at least 44px high.');

console.log('V6 external study library static regression passed.');
