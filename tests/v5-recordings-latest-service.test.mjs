import assert from 'node:assert/strict';
import { createRecordingsService } from '../src/app/recordings.js';

const rows=[
  {id:'old',youtube_id:'ABCDEF12345',title:'Older confirmed service',featured:true,created_at:'2026-09-01T01:00:00Z'},
  {id:'new',youtube_id:'ZYXWVU98765',title:'Latest confirmed service',featured:true,created_at:'2026-09-08T01:00:00Z'},
  {id:'ordinary',youtube_id:'NORMAL12345',title:'Bible study',featured:false,created_at:'2026-09-12T01:00:00Z'},
  {id:'duplicate',youtube_id:'ZYXWVU98765',title:'Duplicate row',featured:true,created_at:'2026-09-13T01:00:00Z'}
];
const created=[];
const media={
  async listLiveRecordings(){return rows;},
  async createVideo(input){created.push(input);return input;},
  async updateVideo(id,patch){return {id,...patch};}
};
const audio={unload(){},dispose(){},mount(){},play(){},pause(){},stop(){},seek(){},getState(){return{};},getPlayerCount(){return 0;}};
const session={isAuthenticated(){return true;},getState(){return {authenticated:true,user:{id:'leader-1'}};}};
const congregation={async load(){return [{congregationId:'church-1'}];}};
const service=createRecordingsService({media,audio,session,congregation});
const state=await service.load();
assert.equal(state.rows.length,3,'stable YouTube identity dedupes duplicate rows');
assert.equal(state.latestService?.id,'new','latest service is newest leader-confirmed featured row, not merely newest recording');
assert.equal(service.getLatestService()?.youtubeId,'ZYXWVU98765');
await assert.rejects(()=>service.addVideo({title:'Again',youtubeUrl:'https://youtube.com/watch?v=ZYXWVU98765',featured:true}),/already in Videos/,'duplicate stable identity must fail before insert');
assert.equal(created.length,0,'duplicate must not create a second authoritative row');
await service.addVideo({title:'Confirmed import',youtubeUrl:'https://youtube.com/watch?v=IMPORT12345',featured:true});
assert.equal(created.length,1);
assert.equal(created[0].youtube_id,'IMPORT12345');
assert.equal(created[0].featured,true,'existing featured flag is the bounded leader confirmation signal');

const unconfirmed=createRecordingsService({
  media:{...media,async listLiveRecordings(){return rows.map(row=>({...row,featured:false}));}},audio,session,congregation
});
const noLatest=await unconfirmed.load();
assert.equal(noLatest.latestService,null,'never infer completion/latest service from date alone');
console.log('v5-recordings-latest-service: PASS');
