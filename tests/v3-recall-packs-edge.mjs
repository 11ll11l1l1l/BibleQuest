import assert from 'node:assert/strict';
import { createRecallPackService } from '../src/core/recall-packs.js';

const manifest={question_books:[{code:'RUT',name:'Ruth',questions:3,path:'data/packs/questions/RUT.json'},{code:'JHN',name:'John',questions:2,path:'data/packs/questions/JHN.json'}]};
const packs={
  'data/packs/questions/RUT.json':[
    {id:'r1',r:'1:1',q:'Question one?',a:'Answer one.',safety:{action:'allow',topics:[]}},
    {id:'r2',r:'1:2',q:'Question two?',a:'Answer two.',safety:{action:'quarantine',topics:['test']}},
    {id:'r3',r:'1:3',q:'Question three?',a:'Answer three.',safety:{action:'allow',topics:[]}}
  ],
  'data/packs/questions/JHN.json':[{id:'j1',r:'1:1',q:'John question?',a:'John answer.',safety:{action:'allow',topics:[]}}]
};
const calls=[];
const fetcher=async path=>{calls.push(path);if(path==='data/packs/manifest.json')return{ok:true,async json(){return structuredClone(manifest)}};if(path in packs)return{ok:true,async json(){return structuredClone(packs[path])}};return{ok:false,async json(){return null}}};
const service=createRecallPackService({fetcher});
const firstManifest=await service.loadManifest();
assert.equal(firstManifest.books.length,2);
assert.equal(firstManifest.books[0].name,'Ruth');
assert.equal(firstManifest.source,'unfoldingWord Translation Questions v90');
assert.equal(firstManifest.license,'CC BY-SA 4.0');
assert.equal(Object.isFrozen(firstManifest),true);
assert.equal(Object.isFrozen(firstManifest.books),true);
const secondManifest=await service.loadManifest();
assert.equal(secondManifest,firstManifest,'Recall manifest should be cached.');
assert.equal(calls.filter(path=>path==='data/packs/manifest.json').length,1);

const ruth=await service.loadBook('rut');
assert.equal(ruth.book.code,'RUT');
assert.deepEqual(ruth.items.map(row=>row.id),['r1','r3'],'Quarantined recall rows must not enter v3 play.');
assert.deepEqual(ruth.items[0],{id:'r1',reference:'1:1',question:'Question one?',answer:'Answer one.'});
assert.equal(Object.isFrozen(ruth.items[0]),true);
const ruthAgain=await service.loadBook('RUT');
assert.equal(ruthAgain,ruth,'Recall book should be cached.');
assert.equal(calls.filter(path=>path==='data/packs/questions/RUT.json').length,1);
assert.equal(service.cacheSize(),1);
assert.rejects(()=>service.loadBook('NUM'),/no Per-book Recall pack/i);
assert.rejects(()=>service.loadBook('../bad'),/valid Per-book Recall book/i);

service.clearCache();
assert.equal(service.cacheSize(),0);
await service.loadBook('JHN');
assert.equal(calls.filter(path=>path==='data/packs/manifest.json').length,2,'Clear cache must reset manifest cache.');

const badManifest=createRecallPackService({fetcher:async()=>({ok:true,async json(){return{question_books:[{code:'RUT',name:'Ruth',questions:1,path:'../escape.json'}]}}})});
await assert.rejects(()=>badManifest.loadManifest(),/contains no usable books/i);
const unavailable=createRecallPackService({fetcher:async()=>({ok:false})});
await assert.rejects(()=>unavailable.loadManifest(),/unavailable/i);
const emptyPack=createRecallPackService({fetcher:async path=>path==='data/packs/manifest.json'?{ok:true,async json(){return structuredClone(manifest)}}:{ok:true,async json(){return[{id:'blocked',q:'Blocked?',a:'Blocked.',safety:{action:'quarantine'}}]}}});
await assert.rejects(()=>emptyPack.loadBook('RUT'),/no approved questions/i);

console.log('BibleQuest v3 Recall Pack edge regression passed.');
