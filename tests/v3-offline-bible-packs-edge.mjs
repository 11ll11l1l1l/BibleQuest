import { createBibleDataService } from '../src/core/bible.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const clone=value=>value===undefined?undefined:structuredClone(value);
const GEN=[{c:1,v:1,t:'In the beginning God created the heavens and the earth.'},{c:1,v:2,t:'Now the earth was formless and void.'}];
const TL_GEN=[{c:1,v:1,t:'Noong simula nilikha ng Diyos ang langit at ang lupa.'}];

function createPackStore(seed=[]){
  const memory=new Map(seed.map(([key,value])=>[key,clone(value)])),writes=[],reads=[],removes=[];
  return {
    memory,writes,reads,removes,
    async read(path){reads.push(path);return memory.has(path)?clone(memory.get(path)):null},
    async write(path,payload){writes.push(path);memory.set(path,clone(payload));return true},
    async remove(path){removes.push(path);return memory.delete(path)}
  };
}
const response=payload=>({ok:true,async json(){return clone(payload)}});

const store=createPackStore();
let network='online';
const fetcher=async path=>{
  if(network==='offline')throw new Error('network offline');
  if(path==='data/packs/bible/GEN.json')return response(GEN);
  if(path==='data/packs/tagalog/GEN.json')return response(TL_GEN);
  return {ok:false,async json(){return null}};
};
const bible=createBibleDataService({fetcher,packStore:store});
const online=await bible.loadChapter('bsb','GEN',1);
assert(online.verses[0].text===GEN[0].t,'Online BSB open failed.');
assert(online.translation.source==='Berean Standard Bible','Online source metadata changed.');
assert(store.writes.length===1&&store.writes[0]==='data/packs/bible/GEN.json','Opened BSB pack was not persisted exactly once.');
assert(store.memory.get('data/packs/bible/GEN.json')?.[0]?.t===GEN[0].t,'Persisted BSB pack must use normalized Scripture rows.');

bible.clearCache();network='offline';
const offline=await bible.loadChapter('bsb','GEN',1);
assert(offline.verses[0].text===GEN[0].t,'Offline service recreation/load did not recover opened BSB content.');
assert(offline.translation.source==='Berean Standard Bible'&&offline.translation.attribution.includes('ATTRIBUTION'),'Offline fallback lost BSB source metadata.');
assert(store.reads.includes('data/packs/bible/GEN.json'),'Offline fallback did not consult the opened-pack store.');

network='online';bible.clearCache();
const tagalog=await bible.loadChapter('tl','GEN',1);
assert(tagalog.verses[0].text===TL_GEN[0].t,'Tagalog online open failed.');
assert(store.writes.includes('data/packs/tagalog/GEN.json'),'Tagalog opened pack did not use its own persistent key.');

const searchStore=createPackStore();
const searchBible=createBibleDataService({fetcher:async path=>path==='data/packs/bible/GEN.json'?response(GEN):({ok:false,async json(){return null}}),packStore:searchStore});
const found=await searchBible.search('bsb','beginning',{limit:1});
assert(found.results[0]?.reference==='Genesis 1:1','Bounded search setup failed.');
assert(searchStore.writes.length===0,'Whole-translation search must not persist scanned packs automatically.');
await searchBible.loadChapter('bsb','GEN',1);
assert(searchStore.writes.length===1&&searchStore.writes[0]==='data/packs/bible/GEN.json','Explicit open after search must persist the already-normalized in-memory pack.');

const corruptPath='data/packs/bible/GEN.json';
const corruptStore=createPackStore([[corruptPath,[{c:1,v:1,t:'First'},{c:1,v:1,t:'Duplicate'}]]]);
const corruptBible=createBibleDataService({fetcher:async()=>{throw new Error('offline')},packStore:corruptStore});
let corruptError='';
try{await corruptBible.loadChapter('bsb','GEN',1)}catch(error){corruptError=error.message}
assert(/offline.+malformed.+removed/i.test(corruptError),'Corrupt persisted Scripture must fail with controlled recovery guidance.');
assert(corruptStore.removes.includes(corruptPath)&&!corruptStore.memory.has(corruptPath),'Corrupt persisted Scripture must be evicted.');

let writeAttempts=0;
const quotaStore={async read(){return null},async write(){writeAttempts++;throw new Error('quota')},async remove(){return false}};
const quotaBible=createBibleDataService({fetcher:async path=>path===corruptPath?response(GEN):({ok:false}),packStore:quotaStore});
const quotaOnline=await quotaBible.loadChapter('bsb','GEN',1);
assert(quotaOnline.verses[0].text===GEN[0].t&&writeAttempts===1,'Cache write failure must not break valid online Scripture.');

const oldValidStore=createPackStore([[corruptPath,GEN]]);
const malformedNetwork=createBibleDataService({fetcher:async()=>response({bad:true}),packStore:oldValidStore});
let malformedError='';
try{await malformedNetwork.loadChapter('bsb','GEN',1)}catch(error){malformedError=error.message}
assert(/malformed/i.test(malformedError),'A successful but malformed network response must not be hidden by an older offline cache.');

const liveStore=createPackStore();
const liveBible=createBibleDataService({fetcher:async path=>path.includes('api.getbible.net')?response({verses:[{verse:1,text:'はじめに'}]}):({ok:false}),packStore:liveStore});
const live=await liveBible.loadChapter('jko','GEN',1);
assert(live.verses[0].text==='はじめに'&&liveStore.writes.length===0,'Live Japanese must remain outside #99 persistent bundled-pack caching.');
const licensed=await liveBible.loadChapter('nlt','GEN',1);
assert(licensed.external?.href?.includes('version=NLT')&&liveStore.writes.length===0,'Licensed NLT must remain external and uncached.');

console.log('BibleQuest v3 Offline opened Bible packs edge regression passed.');
