import assert from 'node:assert/strict';
import fs from 'node:fs';

const legacy=fs.readFileSync('bq2-games.js','utf8');
const ui=fs.readFileSync('src/features/games/index.js','utf8');
const service=fs.readFileSync('src/app/games.js','utf8');

assert.match(legacy,/id="kidBible"[^>]*>[\s\S]*?<strong>Bible Who Am I\?<\/strong><p>Easy character clues for family play\.<\/p>/,'Retained v2 Kids Bible launcher contract is missing.');
assert.match(legacy,/\$\('#kidBible'\)\.onclick=detective/,'Retained v2 must prove Kids Bible delegates to detective().');
assert.match(ui,/data-kids-bible-open/,'V3 Kids Bible launcher is missing.');
assert.match(ui,/Kids Bible Who Am I\?/,'V3 flattened launcher must preserve Kids context.');
assert.match(ui,/Easy character clues for family play\./,'V3 Kids Bible launcher must preserve the retained description.');
assert.match(ui,/data-kids-bible-open[\s\S]*?games\.start\('character-detective'\)/,'Kids Bible launcher must delegate to the existing Character Detective owner.');
assert.equal((service.match(/character-detective/g)||[]).length>0,true,'Character Detective owner is missing.');
assert.equal(ui.includes('kidsBibleQuestions'),false,'Kids Bible must not introduce a duplicate question owner.');
assert.equal(ui.includes('kidsBibleXp'),false,'Kids Bible must not introduce a duplicate XP path.');

console.log('BibleQuest v3 Kids Bible Who Am I architecture validator passed');
