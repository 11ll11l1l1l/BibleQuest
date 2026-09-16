import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sourcePath=new URL('../src/features/leaderboards/index.js',import.meta.url);

test('leaderboard top ranks use explicit semantic text instead of medal glyphs',async()=>{
  const source=await readFile(sourcePath,'utf8');
  for(const glyph of ['🥇','🥈','🥉']){
    assert.equal(source.includes(glyph),false,`Leaderboard source still contains ${glyph}`);
  }
  assert.match(source,/const rankLabel=rank=>rank===1\?'1st':rank===2\?'2nd':rank===3\?'3rd':`#\$\{rank\}`/);
  assert.match(source,/\$\{rankLabel\(row\.rank\)\} \$\{iconFor\(row\.avatar\)\} \$\{esc\(row\.displayName\)\}/);
  assert.match(source,/aria-label="Leaderboard rankings"/);
  assert.match(source,/Rankings do not measure spiritual worth\./);
});
