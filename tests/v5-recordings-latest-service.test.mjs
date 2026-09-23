import assert from 'node:assert/strict';
import { createRecordingsService } from '../src/app/recordings.js';

const rows=[
  {id:'old',youtube_id:'ABCDEF12345',title:'Older featured service',featured:true,created_at:'2026-09-01T01:00:00Z'},
  {id:'new-featured',youtube_id:'ZYXWVU98765',title:'Previously featured service',featured:true,created_at:'2026-09-08T01:00:00Z'},
  {id:'latest-sunday',youtube_id:'SUNDAY12345',title:'Latest Sunday service',featured:false,category:'sunday-service',created_at:'2026-09-14T01:00:00Z'},
  {id:'newer-study',youtube_id:'STUDY123456',title:'Newer Bible study',featured:false,category:'bible-study',created_at:'2026-09-15T01:00:00Z'},
  {id:'duplicate',youtube_id:'SUNDAY12345',title:'Duplicate Sunday row',featured:true,category:'sunday-service',created_at:'2026-09-13T01:00:00Z'}
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
assert.equal(state.rows.length,4,'stable YouTube identity dedupes duplicate rows');
assert.equal(state.rows[0]?.id,'newer-study','Videos are ordered newest-first instead of keeping an older featured row above newer recordings');
assert.equal(state.latestService?.id,'latest-sunday','Home latest service prefers the newest categorized Sunday service even when an older video is featured');
assert.equal(service.getLatestService()?.youtubeId,'SUNDAY12345');
await assert.rejects(()=>service.addVideo({title:'Again',youtubeUrl:'https://youtube.com/watch?v=SUNDAY12345',featured:true}),/already in Videos/,'duplicate stable identity must fail before insert');
assert.equal(created.length,0,'duplicate must not create a second authoritative row');
await service.addVideo({title:'Confirmed import',youtubeUrl:'https://youtube.com/watch?v=IMPORT12345',featured:true});
assert.equal(created.length,1);
assert.equal(created[0].youtube_id,'IMPORT12345');
assert.equal(created[0].featured,true,'featured remains an explicit curation flag');

const legacyRows=[
  {id:'legacy-featured',youtube_id:'LEGACY12345',title:'Older featured legacy recording',featured:true,created_at:'2026-09-01T01:00:00Z'},
  {id:'legacy-latest',youtube_id:'LEGACY67890',title:'Newer legacy recording',featured:false,created_at:'2026-09-12T01:00:00Z'}
];
const legacy=createRecordingsService({
  media:{...media,async listLiveRecordings(){return legacyRows;}},audio,session,congregation
});
const legacyState=await legacy.load();
assert.equal(legacyState.latestService?.id,'legacy-latest','legacy uncategorized libraries fall back to the newest recording, not the featured flag');
console.log('v5-recordings-latest-service: PASS');
