import fs from 'node:fs';
import path from 'node:path';
import {claimForProgressEvent,createProgressLeaderboardBridgeService} from '../src/app/progress-leaderboard-bridge.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const root=path.resolve(import.meta.dirname,'..');

function makeProgress(){
  let state={events:{}};
  const listeners=new Set();
  return {
    getState(){return structuredClone(state)},
    subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener)},
    add(id,row,source='local'){
      state={...state,events:{...state.events,[id]:structuredClone(row)}};
      for(const listener of listeners)listener({source,state:structuredClone(state)});
    }
  };
}
function memoryStorage(){
  const map=new Map();
  return {
    read(key,fallback=null){return map.has(key)?structuredClone(map.get(key)):structuredClone(fallback)},
    write(key,value){map.set(key,structuredClone(value));return value},
    inspect(key){return map.has(key)?structuredClone(map.get(key)):null}
  };
}
const row=(type,{xp=0,metrics={}}={})=>({type,date:'2026-09-23',at:'2026-09-23T00:00:00.000Z',xp,meaningful:true,metrics,rewards:{}});

const canonical=claimForProgressEvent('reader.read:GEN:1',row('reader.chapter.read'),{events:{}});
const legacy=claimForProgressEvent('reader.read:tl:GEN:1',row('reader.chapter.read'),{events:{}});
const quest=claimForProgressEvent('bible-quest:GEN:1',row('bible.quest.chapter.complete'),{events:{}});
assert(canonical?.sourceEventId==='reading.chapter:GEN:1','Canonical Reader score identity is wrong.');
assert(legacy?.sourceEventId===canonical.sourceEventId,'Legacy translation-specific Reader events must collapse to the canonical chapter score identity.');
assert(quest?.sourceEventId===canonical.sourceEventId,'Main Quest and free Reader must not double-score the same chapter.');
assert(canonical?.source==='Bible Chapter Read'&&canonical?.category==='reading','Reader chapter must map to the trusted Reading lane.');

const progress=makeProgress(),storage=memoryStorage();
let sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}};
const session={getState:()=>sessionState};
let active={congregationId:'c1'};
const congregation={
  async load(){return [{congregationId:'c1',userId:'u1'}]},
  getActive(){return active},
  can(id,capability){return capability==='read'&&id==='c1'}
};
const calls=[];
let failOnce=false;
const scoreEvents={
  async submit(congregationId,claims){
    calls.push({congregationId,claims:structuredClone(claims)});
    if(failOnce){failOnce=false;throw new Error('simulated network failure')}
    return {
      processed:claims.map(claim=>({sourceEventId:claim.sourceEventId,accepted:true,duplicate:false,points:claim.source==='Bible Chapter Read'?10:5,category:claim.category}))
    };
  }
};
const bridge=createProgressLeaderboardBridgeService({progress,scoreEvents,session,congregation,storage});

progress.add('reader.read:GEN:1',row('reader.chapter.read',{xp:10,metrics:{chaptersRead:1}}));
await bridge.syncNow();
assert(calls.length===1,'A new Reader chapter must submit exactly one trusted leaderboard claim.');
assert(calls[0].congregationId==='c1','Reader leaderboard claim must stay in the active congregation.');
assert(calls[0].claims[0].sourceEventId==='reading.chapter:GEN:1'&&calls[0].claims[0].source==='Bible Chapter Read','Reader leaderboard claim payload is wrong.');

progress.add('bible-quest:GEN:1',row('bible.quest.chapter.complete'));
await bridge.syncNow();
assert(calls.length===1,'Completing Main Quest after marking the same chapter read must not submit a second leaderboard score.');

progress.add('study:grace:v1:complete',row('study.complete'));
await bridge.syncNow();
assert(calls.length===2&&calls[1].claims[0].source==='Guided Study','Guided Study completion must bridge into the trusted leaderboard scorer.');

progress.add('game:r1:recall:q1',row('game.recall',{xp:5,metrics:{quizCorrect:1}}));
progress.add('game:r1:recall:q2',row('game.recall',{xp:1,metrics:{}}));
progress.add('game:r1:complete',row('game.recall.complete'));
await bridge.syncNow();
const recallCall=calls.find(call=>call.claims.some(claim=>claim.source==='Recall Deck'));
assert(recallCall,'Recall completion must bridge to the Reading leaderboard.');
const recallClaim=recallCall.claims.find(claim=>claim.source==='Recall Deck');
assert(recallClaim.meta.cards===2&&recallClaim.meta.remembered===1,'Recall leaderboard evidence must be derived from canonical progress events.');

failOnce=true;
progress.add('wisdom:scenario-1:complete',row('wisdom-situation.complete',{xp:8,metrics:{situations:1}}));
await bridge.syncNow();
assert(bridge.getState().pending===0,'A transient trusted-score failure must remain queued and flush on the next explicit sync.');
assert(calls.filter(call=>call.claims.some(claim=>claim.source==='Situations & Wisdom')).length===2,'Transient failure should retry the same trusted score claim once.');

const beforeGuest=calls.length;
sessionState={authenticated:false,remoteAvailable:true,user:null};
progress.add('daily:2026-09-23:complete',row('daily.complete',{xp:25}));
await bridge.syncNow();
assert(calls.length===beforeGuest,'Guest progress must never be promoted into congregation leaderboards.');

sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}};
const beforeHydration=calls.length;
progress.add('reader.read:EXO:1',row('reader.chapter.read',{xp:10,metrics:{chaptersRead:1}}),'account');
await bridge.syncNow();
assert(calls.length===beforeHydration,'Account hydration must not retroactively assign historical progress to the currently active congregation.');

const ledger=storage.inspect('progress-leaderboard-delivery-v1');
assert(ledger&&Object.keys(ledger.pending).length===0&&Object.keys(ledger.settled).length>=4,'Leaderboard bridge delivery ledger did not settle expected claims.');

const scoreSource=fs.readFileSync(path.join(root,'supabase/functions/bq-score/index.ts'),'utf8');
assert(scoreSource.includes("case 'Bible Chapter Read':if(!validChapterClaim(claim,m))return null;category='reading';points=10;break;"),'Trusted scorer is missing the validated Bible Chapter Read rule.');
assert(scoreSource.includes("String(claim.sourceEventId||'').trim()===\`reading.chapter:\${code}:\${chapter}\`"),'Trusted scorer must bind a chapter score to its canonical event identity.');
assert(scoreSource.includes("case 'Transformation Complete':if(!['spiritual','full'].includes(String(m.depth||'')))return null;category='mastery';"),'Trusted scorer is missing the validated Transformation completion rule.');

bridge.dispose();
console.log('BibleQuest V5 progress-to-leaderboard bridge regression passed.');
