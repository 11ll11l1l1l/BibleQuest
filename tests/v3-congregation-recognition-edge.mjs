import assert from 'node:assert/strict';
import {createCongregationRecognitionService,congregationRecognitionContract} from '../src/app/congregation-recognition.js';

let sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}},memberships=[],loadCalls=[],awardCalls=[];
const session={getState:()=>sessionState};
const baseMembership=role=>({congregationId:'c1',role,roleLabel:role[0].toUpperCase()+role.slice(1),congregation:{name:'Church One'}});
const directory=[
  {congregation_id:'c1',user_id:'u1',display_name:'Leader Amy',role:'leader',active:true,joined_at:'2026-01-01T00:00:00Z'},
  {congregation_id:'c1',user_id:'u2',display_name:'Member Ben',role:'member',active:true,joined_at:'2026-02-01T00:00:00Z'}
];
const dataset=()=>({
  directory,
  catalog:[{id:'first-study',name:'First Study',icon:'📘',category:'Learning',description:'Completed a study',active:true}],
  badges:[{congregation_id:'c1',user_id:'u2',badge_id:'first-study',earned_at:'2026-09-09T00:00:00Z'}],
  recognitions:[{id:'r1',congregation_id:'c1',user_id:'u2',awarded_by:'u1',award_code:'encourager',title:'Encourager',note:'Thank you',icon:'💛',visible:true,created_at:'2026-09-09T01:00:00Z'}]
});
const congregation={load:async()=>memberships,assert:(id,cap)=>{assert.equal(id,'c1');assert.equal(cap,'read')}};
const api={
  load:async id=>{loadCalls.push(id);return dataset()},
  award:async row=>{awardCalls.push(row);return{...row,id:'r2',visible:true,created_at:'2026-09-09T02:00:00Z'}}
};

assert.deepEqual([...congregationRecognitionContract.awardRoles].sort(),['admin','leader','pastor'],'Persisted recognition authority changed.');
assert.equal(congregationRecognitionContract.presets.length,9,'Recovered recognition preset count changed.');

memberships=[baseMembership('leader')];
const recognition=createCongregationRecognitionService({api,session,congregation});
let state=await recognition.load();
assert.equal(state.status,'ready');
assert.equal(state.canAward,true,'Leader must be allowed to create persisted recognition.');
assert.equal(state.members.length,2);
assert.equal(state.members.find(row=>row.userId==='u2').badges[0].name,'First Study','Earned badge catalog projection failed.');
assert.equal(state.recognitions[0].displayName,'Member Ben','Visible recognition recipient projection failed.');
assert.equal(loadCalls[0],'c1');

await recognition.award({targetUserId:'u2',awardCode:'consistency',title:'',note:'  Kept showing up.  '});
assert.equal(awardCalls.length,1);
assert.deepEqual(awardCalls[0],{
  congregation_id:'c1',user_id:'u2',awarded_by:'u1',award_code:'consistency',title:'Consistency Award',note:'Kept showing up.',icon:'🔥'
},'Award payload must be canonical, scoped and preset-derived.');

memberships=[baseMembership('facilitator')];recognition.clear();state=await recognition.load();assert.equal(state.canAward,false,'Facilitator must remain view-only for persisted recognition.');
await assert.rejects(()=>recognition.award({targetUserId:'u2',awardCode:'consistency'}),error=>error.code==='BQ_RECOGNITION_PERMISSION');
memberships=[baseMembership('member')];recognition.clear();await recognition.load();await assert.rejects(()=>recognition.award({targetUserId:'u2',awardCode:'consistency'}),error=>error.code==='BQ_RECOGNITION_PERMISSION');

memberships=[baseMembership('leader')];recognition.clear();await recognition.load();
await assert.rejects(()=>recognition.award({targetUserId:'former',awardCode:'consistency'}),error=>error.code==='BQ_RECOGNITION_TARGET');
await assert.rejects(()=>recognition.award({targetUserId:'u2',awardCode:'invented'}),error=>error.code==='BQ_RECOGNITION_AWARD');

sessionState={authenticated:false,remoteAvailable:true,user:null};await assert.rejects(()=>recognition.load(),error=>error.code==='BQ_RECOGNITION_AUTH_REQUIRED');
sessionState={authenticated:true,remoteAvailable:false,user:{id:'u1'}};await assert.rejects(()=>recognition.load(),error=>error.code==='BQ_RECOGNITION_REMOTE_DISABLED');
sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}};

const makeBad=load=>createCongregationRecognitionService({api:{load,award:api.award},session,congregation});
await assert.rejects(()=>makeBad(async()=>({...dataset(),directory:[{...directory[0],congregation_id:'foreign'}]})).load(),error=>error.code==='BQ_RECOGNITION_SCOPE');
await assert.rejects(()=>makeBad(async()=>({...dataset(),badges:[{congregation_id:'foreign',user_id:'u2',badge_id:'first-study'}]})).load(),error=>error.code==='BQ_RECOGNITION_SCOPE');
await assert.rejects(()=>makeBad(async()=>({...dataset(),recognitions:[{...dataset().recognitions[0],visible:false}]})).load(),error=>error.code==='BQ_RECOGNITION_SCOPE');

const mismatch=createCongregationRecognitionService({api:{load:api.load,award:async row=>({...row,id:'wrong',congregation_id:'foreign'})},session,congregation});
await mismatch.load();await assert.rejects(()=>mismatch.award({targetUserId:'u2',awardCode:'consistency'}),error=>error.code==='BQ_RECOGNITION_RESPONSE');
console.log('BibleQuest v3 Congregation Recognition edge regression passed.');
