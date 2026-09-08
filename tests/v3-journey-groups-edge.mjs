import {createJourneyGroupsService} from '../src/app/journey-groups.js';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const now='2026-09-09T00:00:00.000Z',user={id:'u1'},sessionState={authenticated:true,remoteAvailable:true,user},session={getState:()=>sessionState};
let ownRows=[{congregationId:'c1',userId:'u1',role:'leader',roleKnown:true,roleLabel:'Leader',congregation:{id:'c1',name:'Test Church'}}];
const congregation={async load(){return ownRows.slice()},can(id,cap){return id==='c1'&&cap==='ministry'},assert(id,cap){if(!this.can(id,cap)){const e=new Error('denied');e.code='BQ_CONGREGATION_PERMISSION_DENIED';throw e}}};
let groups=[{id:'g1',owner_id:'u2',congregation_id:'c1',name:'Faith Group',description:'Weekly study',schedule_text:'Wednesday',max_members:6,active:true}];
let members=[{group_id:'g1',user_id:'u1',role:'member',joined_at:now},{group_id:'g1',user_id:'u2',role:'leader',joined_at:now}],calls=[];
const api={
  async list(userId){calls.push(['list',userId]);return{groups:groups.slice(),members:members.slice()}},
  async create(payload){calls.push(['create',payload]);groups.push({id:'g2',owner_id:'u1',congregation_id:'c1',name:payload.name,description:payload.description,schedule_text:payload.schedule_text,max_members:payload.max_members,active:true});members.push({group_id:'g2',user_id:'u1',role:'leader',joined_at:now});return{group:{id:'g2'},invite_code:'ABCD2345'}},
  async join(code){calls.push(['join',code]);groups.push({id:'g3',owner_id:'u3',congregation_id:'c1',name:'Joined Group',description:'',schedule_text:'',max_members:4,active:true});members.push({group_id:'g3',user_id:'u1',role:'member',joined_at:now});return{group:{id:'g3'}}},
  async rotateCode(groupId){calls.push(['rotate',groupId]);return{invite_code:'ZXCV6789'}},
  async leave(groupId){calls.push(['leave',groupId]);groups=groups.filter(g=>g.id!==groupId);members=members.filter(m=>m.group_id!==groupId);return{ok:true}}
};
const service=createJourneyGroupsService({api,session,congregation});
let state=await service.load();assert(state.groups.length===1&&state.groups[0].memberCount===2&&state.groups[0].canLeave,'Membership view normalization failed.');
let invalid=false;try{await service.join('short')}catch(error){invalid=error.code==='BQ_JOURNEY_GROUPS_CODE'}assert(invalid,'Invalid code must fail before trusted join.');
state=await service.join('a-bcd2345');assert(state.groups.some(g=>g.id==='g3'),'Valid group join did not persist after reload.');assert(calls.some(c=>c[0]==='join'&&c[1]==='ABCD2345'),'Join code normalization failed.');
state=await service.create({congregationId:'c1',name:'Leader Group',description:'Small group',scheduleText:'Friday',maxMembers:5});assert(state.inviteCode==='ABCD2345'&&state.groups.some(g=>g.id==='g2'&&g.isLeader),'Leader group creation failed.');
state=await service.rotateCode('g2');assert(state.inviteCode==='ZXCV6789','Leader code rotation failed.');
let ownerLeave=false;try{await service.leave('g2')}catch(error){ownerLeave=error.code==='BQ_JOURNEY_GROUPS_OWNER_LEAVE'}assert(ownerLeave,'Owning leader leave must fail closed.');
await service.leave('g1');assert(!service.snapshot().groups.some(g=>g.id==='g1')&&calls.some(c=>c[0]==='leave'&&c[1]==='g1'),'Non-owner member leave failed.');
sessionState.authenticated=false;let auth=false;try{await service.load()}catch(error){auth=error.code==='BQ_JOURNEY_GROUPS_AUTH_REQUIRED'}assert(auth,'Signed-out Journey Groups must fail closed.');
sessionState.authenticated=true;sessionState.remoteAvailable=false;let preview=false;try{await service.load()}catch(error){preview=error.code==='BQ_JOURNEY_GROUPS_REMOTE_DISABLED'}assert(preview,'Local preview Journey Groups must fail closed.');
sessionState.remoteAvailable=true;groups=[{id:'foreign',owner_id:'u9',congregation_id:'c1',name:'Foreign',description:'',schedule_text:'',max_members:6,active:true}];members=[{group_id:'foreign',user_id:'u9',role:'leader',joined_at:now}];let foreign=false;try{await service.load()}catch(error){foreign=error.code==='BQ_JOURNEY_GROUPS_PERMISSION'}assert(foreign,'Foreign group row must be rejected by the owner.');
console.log('BibleQuest v3 Journey Groups edge regression passed.');
