import {createJourneyGroupsService} from '../src/app/journey-groups.js';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const now='2026-09-09T00:00:00.000Z',user={id:'u1'},sessionState={authenticated:true,remoteAvailable:true,user},session={getState:()=>sessionState};
let activeCongregationId='c1';
let ownRows=[
  {congregationId:'c1',userId:'u1',role:'leader',roleKnown:true,roleLabel:'Leader',congregation:{id:'c1',name:'Test Church'}},
  {congregationId:'c2',userId:'u1',role:'member',roleKnown:true,roleLabel:'Member',congregation:{id:'c2',name:'Second Church'}}
];
const congregation={
  async load(){return ownRows.slice()},
  getActive(){return ownRows.find(row=>row.congregationId===activeCongregationId)||null},
  can(id,cap){const row=ownRows.find(item=>item.congregationId===String(id));return Boolean(row&&cap==='ministry'&&['facilitator','leader','pastor','admin'].includes(row.role))},
  assert(id,cap){if(!this.can(id,cap)){const e=new Error('denied');e.code='BQ_CONGREGATION_PERMISSION_DENIED';throw e}}
};
let groups=[
  {id:'g1',owner_id:'u2',congregation_id:'c1',name:'Faith Group',description:'Weekly study',schedule_text:'Wednesday',max_members:6,active:true},
  {id:'g9',owner_id:'u9',congregation_id:'c2',name:'Second Group',description:'Other tenant',schedule_text:'Thursday',max_members:6,active:true}
];
let members=[
  {group_id:'g1',user_id:'u1',role:'member',joined_at:now},{group_id:'g1',user_id:'u2',role:'leader',joined_at:now},
  {group_id:'g9',user_id:'u1',role:'member',joined_at:now},{group_id:'g9',user_id:'u9',role:'leader',joined_at:now}
],calls=[];
const api={
  async list(userId,tenantId){calls.push(['list',userId,tenantId]);const visible=groups.filter(group=>group.congregation_id===tenantId),ids=new Set(visible.map(group=>group.id));return{groups:visible.slice(),members:members.filter(member=>ids.has(member.group_id))}},
  async create(tenantId,payload){calls.push(['create',tenantId]);if(payload.congregation_id!==undefined)throw new Error('Journey Group tenant must not come from payload.');const row={id:'g2',owner_id:'u1',congregation_id:tenantId,name:payload.name,description:payload.description,schedule_text:payload.schedule_text,max_members:payload.max_members,active:true};groups.push(row);members.push({group_id:'g2',user_id:'u1',role:'leader',joined_at:now});return{group:{id:'g2',congregation_id:tenantId},invite_code:'ABCD2345'}},
  async join(code,tenantId){calls.push(['join',code,tenantId]);groups.push({id:'g3',owner_id:'u3',congregation_id:tenantId,name:'Joined Group',description:'',schedule_text:'',max_members:4,active:true});members.push({group_id:'g3',user_id:'u1',role:'member',joined_at:now});return{group:{id:'g3',congregation_id:tenantId}}},
  async rotateCode(groupId,tenantId){calls.push(['rotate',groupId,tenantId]);return{invite_code:'ZXCV6789'}},
  async leave(groupId,tenantId){calls.push(['leave',groupId,tenantId]);groups=groups.filter(g=>g.id!==groupId);members=members.filter(m=>m.group_id!==groupId);return{ok:true}}
};
const service=createJourneyGroupsService({api,session,congregation});
let state=await service.load();
assert(state.activeCongregationId==='c1'&&state.loadedCongregationId==='c1','Journey Groups must bind loaded state to the active congregation.');
assert(calls.at(-1).join(':')==='list:u1:c1','Journey Groups must query only the active congregation.');
assert(state.groups.length===1&&state.groups[0].id==='g1'&&state.groups[0].memberCount===2&&state.groups[0].canLeave,'Membership view normalization failed.');
assert(state.congregations.find(row=>row.id==='c1')?.canCreate===true&&state.congregations.find(row=>row.id==='c2')?.canCreate===false,'Only the active congregation may expose Journey Group creation.');
let inactiveCreate=false;try{await service.create({congregationId:'c2',name:'Wrong Tenant'})}catch(error){inactiveCreate=error.code==='BQ_JOURNEY_GROUPS_CONTEXT_STALE'}assert(inactiveCreate,'Non-active congregation creation must fail closed.');
let invalid=false;try{await service.join('short')}catch(error){invalid=error.code==='BQ_JOURNEY_GROUPS_CODE'}assert(invalid,'Invalid code must fail before trusted join.');
state=await service.join('a-bcd2345');assert(state.groups.some(g=>g.id==='g3'),'Valid group join did not persist after reload.');assert(calls.some(c=>c.join(':')==='join:ABCD2345:c1'),'Join must carry normalized code and active congregation.');
state=await service.create({congregationId:'c1',name:'Leader Group',description:'Small group',scheduleText:'Friday',maxMembers:5});assert(state.inviteCode==='ABCD2345'&&state.groups.some(g=>g.id==='g2'&&g.isLeader),'Leader group creation failed.');assert(calls.some(c=>c.join(':')==='create:c1'),'Journey Group creation must carry tenant scope outside the payload.');
state=await service.rotateCode('g2');assert(state.inviteCode==='ZXCV6789'&&calls.some(c=>c.join(':')==='rotate:g2:c1'),'Leader code rotation must carry active congregation.');
let ownerLeave=false;try{await service.leave('g2')}catch(error){ownerLeave=error.code==='BQ_JOURNEY_GROUPS_OWNER_LEAVE'}assert(ownerLeave,'Owning leader leave must fail closed.');
await service.leave('g1');assert(!service.snapshot().groups.some(g=>g.id==='g1')&&calls.some(c=>c.join(':')==='leave:g1:c1'),'Non-owner member leave failed or lost tenant scope.');

activeCongregationId='c2';
assert(service.snapshot().groups.length===0&&service.snapshot().loadedCongregationId==='','Cached Journey Group data must disappear immediately after a tenant switch.');
let stale=false;try{await service.rotateCode('g2')}catch(error){stale=error.code==='BQ_JOURNEY_GROUPS_CONTEXT_STALE'}assert(stale,'Tenant switch must invalidate Journey Group mutations.');
state=await service.load();assert(state.loadedCongregationId==='c2'&&state.groups.length===1&&state.groups[0].id==='g9','Reload must move Journey Groups to the new active congregation.');assert(calls.at(-1).join(':')==='list:u1:c2','Reload after tenant switch must query only the new active congregation.');

activeCongregationId='';
const listCount=calls.filter(c=>c[0]==='list').length;state=await service.load();assert(state.groups.length===0&&state.loadedCongregationId==='','No active congregation must expose no Journey Group data.');assert(calls.filter(c=>c[0]==='list').length===listCount,'No active congregation must issue no Journey Group tenant read.');

sessionState.authenticated=false;let auth=false;try{await service.load()}catch(error){auth=error.code==='BQ_JOURNEY_GROUPS_AUTH_REQUIRED'}assert(auth,'Signed-out Journey Groups must fail closed.');
sessionState.authenticated=true;sessionState.remoteAvailable=false;let preview=false;try{await service.load()}catch(error){preview=error.code==='BQ_JOURNEY_GROUPS_REMOTE_DISABLED'}assert(preview,'Local preview Journey Groups must fail closed.');

sessionState.remoteAvailable=true;activeCongregationId='c1';ownRows=[{congregationId:'c1',userId:'u1',role:'leader',roleKnown:true,roleLabel:'Leader',congregation:{id:'c1',name:'Test Church'}}];
const originalList=api.list;
api.list=async(userId,tenantId)=>{calls.push(['list',userId,tenantId]);return{groups:[{id:'foreign',owner_id:'u9',congregation_id:'c9',name:'Foreign',description:'',schedule_text:'',max_members:6,active:true}],members:[{group_id:'foreign',user_id:'u1',role:'member',joined_at:now}]}};
let foreign=false;try{await service.load()}catch(error){foreign=error.code==='BQ_JOURNEY_GROUPS_SCOPE'}assert(foreign,'Foreign congregation group row must be rejected by the owner.');
api.list=originalList;
console.log('BibleQuest v3 Journey Groups active-tenant edge regression passed.');
