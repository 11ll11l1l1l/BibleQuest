import assert from 'node:assert/strict';
import {createLeaderboardsService,leaderboardContract} from '../src/app/leaderboards.js';

const memberships=[{congregationId:'c1',roleLabel:'Member',congregation:{name:'Church One',timezone:'Asia/Tokyo'}}];
let sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}},calls=[];
const session={getState:()=>sessionState};
const congregation={load:async()=>memberships,assert:(id,cap)=>{assert.equal(id,'c1');assert.equal(cap,'read')}};
const api={load:async(id,since)=>{calls.push({id,since});return{directory:[{congregation_id:'c1',user_id:'u2',display_name:'Zed',active:true},{congregation_id:'c1',user_id:'u1',display_name:'Amy',active:true},{congregation_id:'c1',user_id:'u3',display_name:'Bob',active:true}],scores:[{user_id:'u1',category:'knowledge',points:5},{user_id:'u1',category:'reading',points:4},{user_id:'u2',category:'knowledge',points:9},{user_id:'former',category:'knowledge',points:99}]}}};
const clock=()=>new Date('2026-09-09T15:30:00+09:00');
const board=createLeaderboardsService({api,session,congregation,clock});
let state=await board.load({period:'week',lane:'overall'});
assert.deepEqual(state.rows.map(row=>[row.rank,row.displayName,row.points]),[[1,'Amy',9],[2,'Zed',9],[3,'Bob',0]],'Overall board must sum trusted lanes, keep zero members and break ties alphabetically.');
assert.equal(calls[0].since,'2026-09-06T15:00:00.000Z','Recovered week must begin Monday congregation-local midnight.');
state=await board.load({period:'today',lane:'knowledge'});
assert.deepEqual(state.rows.map(row=>[row.displayName,row.points]),[['Amy',5],['Zed',9],['Bob',0]].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])),'Lane board must use only the selected trusted category.');
assert.equal(calls[1].since,'2026-09-08T15:00:00.000Z','Recovered today must begin congregation-local midnight.');
await board.load({period:'all'});assert.equal(calls[2].since,null,'All Time must not send a cutoff.');
assert.equal(leaderboardContract.sinceFor('today',new Date('2026-01-15T18:00:00Z'),'America/New_York'),'2026-01-15T05:00:00.000Z','IANA timezone conversion must not depend on the runner timezone.');

const tieRows=leaderboardContract.rank([{userId:'b',displayName:'Beta'},{userId:'a',displayName:'Alpha'}],[{userId:'a',category:'knowledge',points:3},{userId:'b',category:'knowledge',points:3}],'knowledge');
assert.deepEqual(tieRows.map(row=>row.displayName),['Alpha','Beta']);

sessionState={authenticated:false,remoteAvailable:true,user:null};await assert.rejects(()=>board.load(),error=>error.code==='BQ_LEADERBOARD_AUTH_REQUIRED');
sessionState={authenticated:true,remoteAvailable:false,user:{id:'u1'}};await assert.rejects(()=>board.load(),error=>error.code==='BQ_LEADERBOARD_REMOTE_DISABLED');
sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}};
const bad=createLeaderboardsService({api:{load:async()=>({directory:[{congregation_id:'foreign',user_id:'u1',active:true}],scores:[]})},session,congregation,clock});
await assert.rejects(()=>bad.load(),error=>error.code==='BQ_LEADERBOARD_SCOPE');
const badScore=createLeaderboardsService({api:{load:async()=>({directory:[{congregation_id:'c1',user_id:'u1',active:true}],scores:[{user_id:'u1',category:'unsupported',points:5}]})},session,congregation,clock});
await assert.rejects(()=>badScore.load(),error=>error.code==='BQ_LEADERBOARD_SCORE');
console.log('BibleQuest v3 Leaderboards edge regression passed.');
