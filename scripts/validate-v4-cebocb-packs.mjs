import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { BIBLE_BOOKS } from '../src/core/bible.js';

const root=path.resolve(import.meta.dirname,'..');
const packDir=path.join(root,'data','packs','cebuano');
const packsOnly=process.argv.includes('--packs-only');

assert.ok(fs.existsSync(packDir),'CEBOCB pack directory data/packs/cebuano is missing.');
const expectedNames=new Set(BIBLE_BOOKS.map(book=>`${book.code}.json`));
const actualBookFiles=fs.readdirSync(packDir).filter(name=>name.endsWith('.json')&&name!=='SOURCE.json');
assert.equal(actualBookFiles.length,66,`CEBOCB must contain exactly 66 canonical book packs; found ${actualBookFiles.length}.`);
for(const name of expectedNames)assert.ok(actualBookFiles.includes(name),`CEBOCB is missing canonical pack ${name}.`);
for(const name of actualBookFiles)assert.ok(expectedNames.has(name),`CEBOCB contains unexpected canonical pack ${name}.`);

let records=0,addressedVerses=0,bridges=0;
const verseIndex=new Map();
for(const book of BIBLE_BOOKS){
  const file=path.join(packDir,`${book.code}.json`);
  const rows=JSON.parse(fs.readFileSync(file,'utf8'));
  assert.ok(Array.isArray(rows)&&rows.length>0,`${book.code} CEBOCB pack must be a non-empty array.`);
  const seen=new Set();let priorC=0,priorEnd=0,maxChapter=0;
  for(const row of rows){
    const keys=Object.keys(row).sort();
    assert.ok(JSON.stringify(keys)===JSON.stringify(['c','t','v'])||JSON.stringify(keys)===JSON.stringify(['c','e','t','v']),`${book.code} pack row contains unexpected fields: ${keys.join(',')}.`);
    assert.ok(Number.isInteger(row.c)&&row.c>=1&&row.c<=book.chapters,`${book.code} contains invalid chapter ${row.c}.`);
    assert.ok(Number.isInteger(row.v)&&row.v>=1,`${book.code} ${row.c} contains invalid verse ${row.v}.`);
    const end=row.e??row.v;
    assert.ok(Number.isInteger(end)&&end>=row.v,`${book.code} ${row.c}:${row.v} contains invalid bridge end ${row.e}.`);
    if(row.e!==undefined){assert.ok(row.e>row.v,`${book.code} ${row.c}:${row.v} must omit e unless it is a real verse bridge.`);bridges++}
    assert.ok(typeof row.t==='string'&&row.t.trim().length>0,`${book.code} ${row.c}:${row.v}-${end} has empty verse text.`);
    assert.equal(row.t,row.t.trim(),`${book.code} ${row.c}:${row.v}-${end} has unintended leading/trailing whitespace.`);
    assert.ok(!row.t.includes('\\'),`${book.code} ${row.c}:${row.v}-${end} still contains a USFM marker.`);
    assert.ok(!/<(?:script|iframe|object|embed|foreignObject)\b/i.test(row.t),`${book.code} ${row.c}:${row.v}-${end} contains active/foreign markup.`);
    assert.ok(row.c>priorC||(row.c===priorC&&row.v>priorEnd),`${book.code} verse ranges overlap or are not strictly ordered at ${row.c}:${row.v}-${end}.`);
    for(let number=row.v;number<=end;number++){
      const key=`${row.c}:${number}`;
      assert.ok(!seen.has(key),`${book.code} contains duplicate/overlapping verse address ${key}.`);seen.add(key);
      verseIndex.set(`${book.code}.${key}`,row.t);addressedVerses++;
    }
    priorC=row.c;priorEnd=end;maxChapter=Math.max(maxChapter,row.c);records++;
  }
  assert.equal(maxChapter,book.chapters,`${book.code} pack must reach canonical chapter ${book.chapters}; got ${maxChapter}.`);
}
assert.ok(addressedVerses>30000,`CEBOCB pack set looks incomplete: only ${addressedVerses} verse addresses.`);
assert.ok(bridges>0,'CEBOCB source is known to contain verse bridges; validator expected at least one preserved bridge record.');

const manifest=JSON.parse(fs.readFileSync(path.join(packDir,'SOURCE.json'),'utf8'));
assert.equal(manifest.translationId,'cebocb');
assert.equal(manifest.abbreviation,'OCCB');
assert.equal(manifest.sourceFormat,'USFM');
assert.equal(manifest.canonicalBooks,66);
assert.equal(manifest.verseRecords,records);
assert.equal(manifest.addressedVerses,addressedVerses);
assert.equal(manifest.bridgeRecords,bridges);
assert.match(manifest.sourceUrl,/^https:\/\/ebible\.org\/Scriptures\/cebocb_usfm\.zip$/);
assert.match(manifest.sourcePackageSha256,/^[a-f0-9]{64}$/,'CEBOCB source manifest must record the downloaded package SHA-256.');
assert.match(manifest.conversion,/omitting non-verse USFM/i,'CEBOCB source manifest must disclose the reduced-pack conversion.');
assert.match(manifest.conversion,/verse bridges are preserved/i,'CEBOCB source manifest must disclose bridge preservation instead of duplication/splitting.');

const anchors=[
  ['GEN.1:1','Sa sinugdan gimugna sa Dios ang kalangitan ug ang kalibotan'],
  ['JHN.3:16','Kay gihigugma gayod sa Dios ang kalibotan'],
  ['ROM.8:28','Nasayod kita nga ang tanang panghitabo']
];
for(const [key,snippet] of anchors)assert.ok(verseIndex.get(key)?.includes(snippet),`CEBOCB source anchor ${key} did not match the published source wording.`);
assert.equal(verseIndex.get('GEN.1:17'),verseIndex.get('GEN.1:18'),'Genesis 1:17-18 must remain one source bridge text addressable from both verse numbers.');

if(!packsOnly){
  const bible=fs.readFileSync(path.join(root,'src','core','bible.js'),'utf8');
  const readerService=fs.readFileSync(path.join(root,'src','app','reader.js'),'utf8');
  const readerPage=fs.readFileSync(path.join(root,'src','features','reader','index.js'),'utf8');
  const attribution=fs.readFileSync(path.join(root,'data','packs','ATTRIBUTION.md'),'utf8');
  assert.ok(bible.includes("cebocb: Object.freeze({ id: 'cebocb'"),'Central Bible registry must contain the CEBOCB translation id.');
  assert.ok(bible.includes("folder: 'cebuano'"),'CEBOCB registry must use bundled Cebuano packs.');
  assert.ok(bible.includes("mode: 'bundled'"),'CEBOCB must remain an offline bundled translation, not a runtime API source.');
  assert.ok(/label: 'Cebuano\/Bisaya ·/.test(bible),'Reader translation label must visibly include both Cebuano and Bisaya.');
  assert.ok(bible.includes('verseEnd'),'Bible data owner must explicitly preserve optional verse-bridge range ends.');
  assert.ok(readerService.includes('verseEnd'),'Reader service must resolve verse peeks/search results through bridge ranges.');
  assert.ok(readerPage.includes('verseEnd'),'Reader UI must render a bridge as one labeled range instead of duplicated text rows.');
  assert.match(attribution,/Biblica® Open Ang Pulong sa Dios™/,'CEBOCB attribution must retain the Cebuano title/trademark notice.');
  assert.match(attribution,/Biblica® Open Cebuano Contemporary Bible™/,'CEBOCB attribution must retain the English title/trademark notice.');
  assert.match(attribution,/2009, 2010, 2014, 2024/,'CEBOCB attribution must retain the copyright years.');
  assert.match(attribution,/CC BY-SA 4\.0|Attribution-ShareAlike 4\.0/i,'CEBOCB attribution must state the CC BY-SA 4.0 license.');
  assert.match(attribution,/Used with permission/i,'CEBOCB attribution must retain Biblica trademark permission language.');
  assert.match(attribution,/non-verse USFM|headings.*footnotes|footnotes.*cross-references/i,'CEBOCB attribution must disclose reduced-pack formatting omissions.');
  assert.match(attribution,/verse bridge/i,'CEBOCB attribution must disclose how numeric verse bridges are preserved in BibleQuest packs.');
}

console.log(`BibleQuest V4 CEBOCB pack validation passed: 66 books / ${records} text records / ${addressedVerses} verse addresses / ${bridges} bridges${packsOnly?' (packs-only)':''}.`);
