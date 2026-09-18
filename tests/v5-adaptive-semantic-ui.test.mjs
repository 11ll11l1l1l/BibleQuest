import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const featurePath=new URL('../src/features/adaptive-learning/index.js',import.meta.url);
const cssPath=new URL('../src/ui/adaptive-learning.css',import.meta.url);

const targetGlyphs=['🧠','🌱','📖'];

test('Adaptive Learning uses semantic status and reference text instead of presentation glyphs',async()=>{
  const [source,css]=await Promise.all([
    readFile(featurePath,'utf8'),
    readFile(cssPath,'utf8'),
  ]);

  for(const glyph of targetGlyphs){
    assert.equal(source.includes(glyph),false,`Adaptive source still contains ${glyph}`);
  }

  assert.match(source,/state\.score\.correct\/state\.totalSteps>=\.85\?'Strong':'Growing'/);
  assert.match(source,/Strong retrieval today\. Correct items will return after a longer interval\./);
  assert.match(source,/Useful misses were captured\. Weak items will come back sooner instead of being forgotten\./);
  assert.match(source,/Reference: \$\{escapeHtml\(question\?\.ref\|\|''\)\}/);
  assert.match(source,/const ADAPTIVE_SOURCE=sourceLabel\(getContentProvenance\('bq-recall'\),\{compact:true\}\)/);
  assert.match(css,/\.bq-adaptive-orb\{[^}]*display:inline-flex[^}]*font-size:13px[^}]*font-weight:900/);
});

test('Adaptive completion threshold remains exactly 85 percent',async()=>{
  const source=await readFile(featurePath,'utf8');
  const thresholdMatches=source.match(/state\.score\.correct\/state\.totalSteps>=\.85/g)||[];
  assert.equal(thresholdMatches.length,2,'Expected the existing 85% completion threshold in status and explanatory copy');
});
