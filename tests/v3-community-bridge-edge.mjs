import {createCommunityBridgeService} from '../src/app/community-bridge.js';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
let sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}},loads=0;
let memberships=[{congregationId:'c1',userId:'u1',role:'leader',roleKnown:true,roleLabel:'Leader',congregation:{id:'c1',name:'Grace Church',ownerId:'u9'}}];
let groups=[{id:'g1',congregationId:'c1',ownerId:'u1',name:'Faith Group',role:'leader',memberCount:2,maxMembers:6,members:[{userId:'u1'},{userId:'u2'}]}];
let items=[{id:'e1',groupId:'g1',senderId:'u2',kind:'pray',label:'Praying for you'}];
const session={getState:()=>sessionState},congregation={list:()=>memberships.slice()},journeyGroups={snapshot:()=>({groups:groups.slice()})},encouragements={async load(){loads+=1;return this.snapshot()},snapshot:()=>({items:items.slice()})};
const service=createCommunityBridgeService({session,congregation,journeyGroups,encouragements});
let state=await service.load();
assert(loads===1&&state.status==='ready','Bridge did not load through the verified Encouragements composition path.');
assert(state.congregations[0].name==='Grace Church'&&state.congregations[0].canMinistry,'Congregation projection failed.');
assert(state.groups[0].name==='Faith Group'&&state.groups[0].memberCount===2&&state.encouragementCount===1,'Group/encouragement projection failed.');
const serialized=JSON.stringify(state);
for(const forbidden of ['userId','ownerId','senderId','members','Praying for you'])assert(!serialized.includes(forbidden),`Private or identity-bearing field crossed the bridge: ${forbidden}`);
assert(service.destinations().map(row=>row.id).join(',')==='congregation,journey-groups,encouragements','Community destinations drifted.');

groups=[{...groups[0],congregationId:'foreign'}];let foreignGroup=false;try{service.snapshot()}catch(error){foreignGroup=error.code==='BQ_COMMUNITY_BRIDGE_SCOPE'}assert(foreignGroup,'Foreign-congregation group must fail closed.');
groups=[{...groups[0],congregationId:'c1'}];items=[{...items[0],groupId:'foreign'}];let foreignEncouragement=false;try{service.snapshot()}catch(error){foreignEncouragement=error.code==='BQ_COMMUNITY_BRIDGE_SCOPE'}assert(foreignEncouragement,'Foreign-group encouragement must fail closed.');
items=[];memberships=[{...memberships[0],role:'superadmin',roleLabel:'Superadmin'}];let malformed=false;try{service.snapshot()}catch(error){malformed=error.code==='BQ_COMMUNITY_BRIDGE_MALFORMED'}assert(malformed,'Unknown congregation role must fail closed.');

memberships=[];groups=[];sessionState={authenticated:false,remoteAvailable:true,user:null};const beforeSignedOut=loads;state=await service.load();assert(state.status==='signed-out'&&state.groups.length===0&&loads===beforeSignedOut,'Signed-out bridge must not load or expose stale cloud data.');
sessionState={authenticated:true,remoteAvailable:false,user:{id:'u1'}};state=await service.load();assert(state.status==='local-preview'&&state.congregations.length===0&&loads===beforeSignedOut,'Local preview must not load or expose stale cloud data.');
console.log('BibleQuest v3 Community Bridge edge regression passed.');
