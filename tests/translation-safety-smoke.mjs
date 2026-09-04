import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=fs.readFileSync('translations.js','utf8');

for(const code of ['BSB','TGL','JKO','NLT','ESV','NIV','AMP']){
  assert.match(source,new RegExp(`${code}:\\{code:'${code}'`),`missing translation ${code}`);
}
assert.match(source,/const NLT_MAX_VERSES=50;/,'NLT anonymous request limit must stay at 50 verses');
assert.match(source,/start\+=NLT_MAX_VERSES/,'long NLT chapters must be chunked');
assert.match(source,/article\.__bqBsbVerseCount/,'NLT chunking must survive version switches');
assert.match(source,/Tyndale House Foundation/,'NLT copyright credit must remain visible');
assert.match(source,/NLT in licensed reader/,'NLT must retain a licensed-reader network fallback');
assert.match(source,/api\.getbible\.net\/v2\/japkougo/,'Japanese Kougo reader must use GetBible v2');
assert.match(source,/No Tagalog verses were found for this chapter/,'empty Tagalog chapters must fail clearly');
assert.match(source,/BibleQuest keeps the Scripture text separate from optional furigana and learning annotations/,'Japanese annotation separation notice must remain explicit');
assert.doesNotMatch(source,/sb_secret_|SUPABASE_SERVICE_ROLE_KEY/i,'translation client must not contain privileged credentials');

console.log('BibleQuest translation safety smoke passed');
