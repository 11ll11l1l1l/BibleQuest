import assert from 'node:assert/strict';
import { createBibleDataService } from '../src/core/bible.js';
import { createReaderService } from '../src/app/reader.js';

const cebuanoRows=[
  {c:1,v:16,t:'Regular verse before the bridge.'},
  {c:1,v:17,e:18,t:'Bridge Cebuano wording phrase.'},
  {c:1,v:19,t:'Regular verse after the bridge.'}
];
const bsbRows=[{c:1,v:1,t:'Regular BSB verse.'}];
const writes=[];
const packStore={
  async read(){return null},
  async write(path,payload){writes.push({path,payload:structuredClone(payload)});return true},
  async remove(){return true}
};
const fetcher=async path=>{
  if(path==='data/packs/cebuano/GEN.json')return{ok:true,json:async()=>structuredClone(cebuanoRows)};
  if(path==='data/packs/bible/GEN.json')return{ok:true,json:async()=>structuredClone(bsbRows)};
  return{ok:false,json:async()=>null};
};
const bible=createBibleDataService({fetcher,packStore});

const translation=bible.getTranslation('cebocb');
assert.equal(translation.label,'Cebuano/Bisaya · OCCB','CEBOCB Reader label must visibly include both Cebuano and Bisaya.');
assert.equal(translation.mode,'bundled','CEBOCB must use the existing offline bundled Bible owner.');
assert.equal(translation.folder,'cebuano');

const chapter=await bible.loadChapter('cebocb','GEN',1);
assert.equal(chapter.verses.length,3,'A source verse bridge must remain one displayed text record, not two duplicated rows.');
const bridge=chapter.verses.find(row=>row.verse===17);
assert.ok(bridge,'Genesis bridge start verse must load.');
assert.equal(bridge.verseEnd,18,'Bridge range end must survive pack normalization.');
assert.equal(bridge.text,'Bridge Cebuano wording phrase.');
assert.deepEqual(Object.keys(chapter.verses[0]).sort(),['chapter','text','verse'],'Ordinary verses must retain the pre-bridge object shape.');

const persisted=writes.find(row=>row.path==='data/packs/cebuano/GEN.json');
assert.ok(persisted,'Opening a bundled CEBOCB book must use the existing opened-pack offline persistence path.');
assert.deepEqual(persisted.payload[1],{c:1,v:17,e:18,t:'Bridge Cebuano wording phrase.'},'Offline serialization must preserve verse bridge range metadata exactly once.');

const bySecondAddress=await bible.search('cebocb','Genesis 1:18');
assert.equal(bySecondAddress.results.length,1,'Reference search for the second address in a bridge must resolve the bridge record.');
assert.equal(bySecondAddress.results[0].verse,17);
assert.equal(bySecondAddress.results[0].verseEnd,18);
assert.equal(bySecondAddress.results[0].reference,'Genesis 1:17–18');

const byRange=await bible.search('cebocb','Genesis 1:18-19');
assert.deepEqual(byRange.results.map(row=>row.reference),['Genesis 1:17–18','Genesis 1:19'],'Reference-range search must use range overlap rather than only the bridge start address.');

const byText=await bible.search('cebocb','Bridge Cebuano wording',{limit:1});
assert.equal(byText.results.length,1);
assert.equal(byText.results[0].reference,'Genesis 1:17–18','Text search must label bridge results as a single source range.');

const storageState={};
const storage={read:(_key,fallback)=>Object.keys(storageState).length?structuredClone(storageState):fallback,write:(_key,value)=>{Object.assign(storageState,structuredClone(value));return value}};
const progress={record:()=>({date:'2026-09-12',awardedXp:10})};
const reader=createReaderService({bible,storage,progress});
reader.setTranslation('cebocb');reader.setBook('GEN',1);
const peek=await reader.peek(18);
assert.equal(peek.verse,17);
assert.equal(peek.verseEnd,18);
assert.equal(peek.reference,'Genesis 1:17–18','Reader peek from any address inside a bridge must show the source range once.');
const opened=await reader.openSearchResult({book:'GEN',chapter:1,verse:18});
assert.equal(opened.verse,18,'Reader must accept a search/open address contained inside a bridge range.');
assert.ok(opened.chapter.verses.some(row=>row.verse===17&&row.verseEnd===18));

bible.clearCache();writes.length=0;
const normal=await bible.loadChapter('bsb','GEN',1);
assert.equal(normal.verses[0].verse,1);
assert.equal('verseEnd' in normal.verses[0],false,'Existing non-bridge bundled translations must not gain synthetic verseEnd fields.');
assert.deepEqual(writes.find(row=>row.path==='data/packs/bible/GEN.json')?.payload,[{c:1,v:1,t:'Regular BSB verse.'}],'Existing bundled-pack serialization must remain unchanged for ordinary verses.');

const overlapBible=createBibleDataService({fetcher:async()=>({ok:true,json:async()=>[{c:1,v:17,e:18,t:'Bridge'},{c:1,v:18,t:'Duplicate address'}]}),packStore:{read:async()=>null,write:async()=>false,remove:async()=>true}});
await assert.rejects(()=>overlapBible.loadBook('cebocb','GEN'),/duplicate or overlapping verse 1:18/,'Overlapping bridge addresses must fail closed.');

console.log('BibleQuest V4 CEBOCB bridge/search/offline compatibility contract passed.');
