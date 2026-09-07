import assert from 'node:assert/strict';
import { createRecallPackService } from '../src/core/recall-packs.js';

const manifest={question_books:[{code:'RUT',name:'Ruth',questions:6,path:'data/packs/questions/RUT.json'},{code:'JHN',name:'John',questions:2,path:'data/packs/questions/JHN.json'}]};
const packs={
  'data/packs/questions/RUT.json':[
    {id:'r1',r:'1:1',q:'Question one?',a:'Answer one.',safety:{action:'allow',topics:[]}},
    {id:'r2',r:'1:2',q:'Question two?',a:'Answer two.',safety:{action:'quarantine',topics:['test']}},
    {id:'r3',r:'1:3',q:'Question three?',a:'Answer three.',safety:{action:'allow',topics:[]}},
    {id:'r4',r:'1:4',q:'How is a person saved?',a:'By grace through faith.',safety:{action:'allow',topics:[]}},
    {id:'r5',r:'1:5',q:'Who was baptized in this passage?',a:'The named believer.',safety:{action:'context',topics:['baptism']}},
    {id:'r6',r:'1:6',q:'Untagged imported question?',a:'Untagged answer.'}
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
assert.deepEqual(ruth.items.map(row=>row.id),['r1','r3','r5'],'Quarantined, high-risk and untagged recall rows must fail closed while contextual rows remain available.');
assert.equal(ruth.items[0].question,'Question one?');
assert.equal(ruth.items[0].safety.action,'allow');
assert.equal(ruth.items[0].safety.classification,'TEXTUAL_FACT');
assert.equal(ruth.items[0].safety.reviewed,true);
assert.equal(Object.isFrozen(ruth.items[0]),true);
assert.equal(Object.isFrozen(ruth.items[0].safety),true);
const contextual=ruth.items.find(row=>row.id==='r5');
assert.equal(contextual.safety.action,'context');
assert.equal(contextual.safety.classification,'PASSAGE_CONTEXT');
assert.match(contextual.safety.contextNote,/passage|context|baptism/i);
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
