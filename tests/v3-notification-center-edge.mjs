import assert from 'node:assert/strict';
import {createNotificationCenterService} from '../src/app/notification-center.js';

const future='2099-01-01T00:00:00.000Z',created='2026-09-10T08:00:00.000Z';
let sessionState={authenticated:false,remoteAvailable:true,user:null},rows=[],listCalls=0,setCalls=[],markCalls=0,failList=false;
const session={getState:()=>sessionState};
const api={
  list:async userId=>{listCalls++;if(failList)throw new Error('remote inbox failure');return rows.map(row=>({...row,user_id:row.user_id??userId}))},
  setReadState:async(userId,id,readAt)=>{setCalls.push({userId,id,readAt});const row=rows.find(item=>item.id===id);return row?{...row,user_id:userId,read_at:readAt}:null},
  markAllRead:async()=>{markCalls++;rows=rows.map(row=>({...row,read_at:row.read_at||new Date().toISOString()}));return rows.map(row=>({id:row.id}))}
};
const inbox=createNotificationCenterService({api,session});

let state=await inbox.load();
assert.equal(state.status,'signed-out');
assert.equal(listCalls,0,'Signed-out inbox must not access remote notification rows.');

sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}};
rows=[
  {id:'n1',notification_type:'assignment',title:'New assignment',body:'Read John 1',action_kind:'assignment',action_payload:{assignment_id:'a1'},read_at:null,expires_at:future,created_at:created},
  {id:'n2',notification_type:'award',title:'Recognition',body:'Good work',action_kind:'recognition',action_payload:{recognition_id:'r1'},read_at:'2026-09-10T08:05:00.000Z',expires_at:null,created_at:'2026-09-10T08:10:00.000Z'},
  {id:'n3',notification_type:'info',title:'Legacy target',body:'Still readable',action_kind:'unknown-route',action_payload:{route:'https://evil.example'},read_at:null,expires_at:future,created_at:'2026-09-10T08:20:00.000Z'}
];
state=await inbox.load();
assert.equal(state.status,'ready');assert.equal(state.items.length,3);assert.equal(state.unread,2);
assert.deepEqual(state.items.map(item=>item.id),['n3','n2','n1'],'Inbox must normalize newest-first.');
assert.equal(state.items.find(item=>item.id==='n1').route,'assignments');
assert.equal(state.items.find(item=>item.id==='n2').route,'recognition');
assert.equal(state.items.find(item=>item.id==='n3').route,'','Unknown action kinds must fail closed instead of using payload routes/URLs.');

state=await inbox.setRead('n1',true);assert.equal(state.items.find(item=>item.id==='n1').isRead,true);assert.equal(state.unread,1);assert.equal(setCalls.at(-1).userId,'u1');
state=await inbox.setRead('n1',false);assert.equal(state.items.find(item=>item.id==='n1').isRead,false);assert.equal(state.unread,2);assert.equal(setCalls.at(-1).readAt,null);
const route=await inbox.openTarget('n1');assert.equal(route,'assignments');assert.equal(setCalls.at(-1).id,'n1','Opening an unread supported target must persist read state first.');
await assert.rejects(()=>inbox.openTarget('n3'),error=>error.code==='BQ_NOTIFICATION_TARGET_UNAVAILABLE');
await inbox.markAllRead();assert.equal(markCalls,1);assert.equal(inbox.snapshot().unread,0);
const priorCalls=listCalls;await inbox.refresh();assert.equal(listCalls,priorCalls+1,'Refresh must reload authoritative remote inbox state.');

rows=[{id:'x1',user_id:'other-user',notification_type:'info',title:'Wrong owner',body:'',action_kind:null,read_at:null,expires_at:future,created_at:created}];
await assert.rejects(()=>inbox.load(),error=>error.code==='BQ_NOTIFICATION_SCOPE','Cross-user rows must be rejected even if a backend mock returns them.');
rows=[{id:'x2',notification_type:'info',title:'Expired',body:'',action_kind:null,read_at:null,expires_at:'2020-01-01T00:00:00.000Z',created_at:created}];
await assert.rejects(()=>inbox.load(),error=>error.code==='BQ_NOTIFICATION_EXPIRED','Expired rows must fail closed even if a backend mock returns them.');

failList=true;await assert.rejects(()=>inbox.load(),/remote inbox failure/);assert.equal(inbox.snapshot().status,'error');assert.match(inbox.snapshot().error,/remote inbox failure/);
failList=false;sessionState={authenticated:true,remoteAvailable:false,user:{id:'u1'}};state=await inbox.load();assert.equal(state.status,'unavailable');

console.log('BibleQuest v3 Notification Center edge/security regression passed.');
