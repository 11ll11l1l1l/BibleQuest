import {createEncouragementsService} from '../src/app/encouragements.js';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const today='2026-09-09T12:00:00.000Z',user={id:'u1'},sessionState={authenticated:true,remoteAvailable:true,user},session={getState:()=>sessionState};
let activeCongregationId='c1';
let groupsByTenant={
  c1:[{id:'g1',congregationId:'c1',name:'Faith Group',members:[{userId:'u1',role:'member'},{userId:'u2',role:'leader'}]}],
  c2:[{id:'g2',congregationId:'c2',name:'Second Group',members:[{userId:'u1',role:'member'},{userId:'u3',role:'leader'}]}]
};
const journeyGroups={
  async load(){const groups=(groupsByTenant[activeCongregationId]||[]).slice();return{activeCongregationId,loadedCongregationId:activeCongregationId,groups}},
  snapshot(){return{activeCongregationId,loadedCongregationId:activeCongregationId,groups:(groupsByTenant[activeCongregationId]||[]).slice()}}
};
let rowsByTenant={
  c1:[{id:1,group_id:'g1',sender_id:'u2',recipient_id:null,kind:'pray',created_at:'2026-09-09T08:00:00.000Z'}],
  c2:[{id:20,group_id:'g2',sender_id:'u3',recipient_id:null,kind:'heart',created_at:'2026-09-09T07:00:00.000Z'}]
},calls=[];
const api={
  async list(ids,tenantId){calls.push(['list',ids,tenantId]);return(rowsByTenant[tenantId]||[]).filter(row=>ids.includes(row.group_id))},
  async send(groupId,kind,tenantId){calls.push(['send',groupId,kind,tenantId]);const rows=rowsByTenant[tenantId]||(rowsByTenant[tenantId]=[]);rows.unshift({id:rows.length+100,group_id:groupId,sender_id:'u1',recipient_id:null,kind,created_at:today});return{ok:true}}
};
const service=createEncouragementsService({api,session,journeyGroups,now:()=>new Date(today)});
let state=await service.load();
assert(state.activeCongregationId==='c1'&&state.loadedCongregationId==='c1','Encouragements must bind loaded data to the active congregation.');
assert(state.items.length===1&&state.items[0].label==='Praying for you','Received encouragement normalization failed.');
assert(calls.at(-1)[0]==='list'&&calls.at(-1)[2]==='c1'&&calls.at(-1)[1].join(',')==='g1','Encouragement reads must carry active congregation scope.');
rowsByTenant.c1.unshift({id:8,group_id:'g1',sender_id:'former-member',recipient_id:null,kind:'heart',created_at:'2026-09-08T08:00:00.000Z'});state=await service.load();assert(state.items.some(item=>item.senderId==='former-member'&&item.kind==='heart'),'Historical encouragement from a former member must remain readable.');
state=await service.send('g1','cheer');assert(state.items.some(item=>item.senderId==='u1'&&item.kind==='cheer'),'Valid encouragement did not reload.');assert(calls.some(call=>call.join(':')==='send:g1:cheer:c1'),'Trusted send must carry active congregation scope.');
let duplicate=false;try{await service.send('g1','cheer')}catch(error){duplicate=error.code==='BQ_ENCOURAGEMENTS_DUPLICATE'}assert(duplicate,'Same-day duplicate must fail before another trusted send.');assert(calls.filter(call=>call[0]==='send').length===1,'Duplicate send reached the API.');
let kind=false;try{await service.send('g1','custom')}catch(error){kind=error.code==='BQ_ENCOURAGEMENTS_KIND'}assert(kind,'Unknown encouragement kind must fail closed.');
let permission=false;try{await service.send('foreign','pray')}catch(error){permission=error.code==='BQ_ENCOURAGEMENTS_PERMISSION'}assert(permission,'Foreign-group send must fail closed.');

activeCongregationId='c2';
assert(service.snapshot().items.length===0&&service.snapshot().loadedCongregationId==='','Cached encouragement data must disappear immediately after active tenant changes.');
let stale=false;try{await service.send('g1','pray')}catch(error){stale=error.code==='BQ_ENCOURAGEMENTS_CONTEXT_STALE'}assert(stale,'Tenant switch must invalidate encouragement mutations.');
state=await service.load();assert(state.loadedCongregationId==='c2'&&state.groups.length===1&&state.groups[0].id==='g2'&&state.items[0].groupId==='g2','Reload must move Encouragements to the new active congregation.');assert(calls.at(-1)[0]==='list'&&calls.at(-1)[2]==='c2','Reload after tenant switch must query the new active congregation.');

sessionState.authenticated=false;let auth=false;try{await service.load()}catch(error){auth=error.code==='BQ_ENCOURAGEMENTS_AUTH_REQUIRED'}assert(auth,'Signed-out load must fail closed.');
sessionState.authenticated=true;sessionState.remoteAvailable=false;let preview=false;try{await service.load()}catch(error){preview=error.code==='BQ_ENCOURAGEMENTS_REMOTE_DISABLED'}assert(preview,'Local-preview load must fail closed.');

sessionState.remoteAvailable=true;activeCongregationId='c1';
const originalList=api.list;
api.list=async(ids,tenantId)=>{calls.push(['list',ids,tenantId]);return[{id:9,group_id:'foreign',sender_id:'u9',recipient_id:null,kind:'pray',created_at:today}]};let foreign=false;try{await service.load()}catch(error){foreign=error.code==='BQ_ENCOURAGEMENTS_MALFORMED'}assert(foreign,'Foreign received row must fail closed.');
api.list=async(ids,tenantId)=>{calls.push(['list',ids,tenantId]);return[{id:10,group_id:'g1',sender_id:'u2',recipient_id:'u1',kind:'heart',created_at:today}]};let targeted=false;try{await service.load()}catch(error){targeted=error.code==='BQ_ENCOURAGEMENTS_SCOPE'}assert(targeted,'Targeted rows must stay outside #65.');
api.list=originalList;
console.log('BibleQuest v3 Encouragements active-tenant edge regression passed.');
