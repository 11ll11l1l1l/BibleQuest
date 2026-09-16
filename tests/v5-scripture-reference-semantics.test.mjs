import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const files={
  deep:new URL('../src/features/deep-questions/index.js',import.meta.url),
  review:new URL('../src/features/open-review/index.js',import.meta.url),
  story:new URL('../src/features/story-journey/index.js',import.meta.url),
  study:new URL('../src/features/study/index.js',import.meta.url),
  wisdom:new URL('../src/features/wisdom-situations/index.js',import.meta.url),
};

async function sources(){
  return Object.fromEntries(await Promise.all(Object.entries(files).map(async([key,url])=>[key,await readFile(url,'utf8')])));
}

test('reviewed Scripture-reference surfaces use explicit text instead of book glyph chrome',async()=>{
  const source=await sources();
  for(const [key,text] of Object.entries(source)){
    assert.equal(text.includes('📖'),false,`${key} still contains a Scripture-reference book glyph`);
  }

  assert.match(source.deep,/aria-label="Scripture references"/);
  assert.match(source.deep,/data-deep-reader="\$\{index\}">Open \$\{escapeHtml\(reference\.label\)\}/);

  assert.match(source.review,/REFERENCE ANSWER/);
  assert.match(source.review,/Reference: \$\{esc\(item\.reference\)\}/);

  assert.match(source.story,/Reference: \$\{escapeHtml\(story\.checkpoint\.reference\)\}/);
  assert.match(source.story,/escapeHtml\(story\.emoji\)/,'Story identity remains independent from reference cleanup');
  assert.match(source.story,/data-story-reader>Open Scripture/);

  assert.match(source.study,/Passage: \$\{escapeHtml\(item\.passage\.label\)\}/);
  assert.match(source.study,/Reference: \$\{escapeHtml\(feedback\.reference\)\}/);
  assert.match(source.study,/Reference: \$\{escapeHtml\(step\.reference\)\}/);
  assert.doesNotMatch(source.study,/bq-study-complete-mark/,'decorative completion glyph container should be removed');
  assert.match(source.study,/STUDY COMPLETE/);
  assert.match(source.study,/data-study-complete/);

  assert.match(source.wisdom,/References: \$\{situation\.refs\.map\(escapeHtml\)\.join\(' · '\)\}/);
});
