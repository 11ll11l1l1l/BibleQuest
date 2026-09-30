import {createTeamCenterService} from '../src/app/team-center.js';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const now='2026-09-09T00:00:00.000Z';
let sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}};
const session={getState:()=>sessionState};
let activeCongregationId='c1';
let ownRows=[
  {congregationId:'c1',userId:'u1',role:'leader',roleKnown:true,roleLabel:'Leader',congregation:{id:'c1',name:'Test Church'}},
  {congregationId:'c2',userId:'u1',role:'leader',roleKnown:true,roleLabel:'Leader',congregation:{id:'c2',name:'Second Church'}}
];
const congregation={
  async load(){return ownRows.slice()},
  getActive(){return ownRows.find(item=>item.congregationId===activeCongregationId)||null},
  can(id,cap){const row=ownRows.find(item=>item.congregationId===String(id));return Boolean(row&&cap==='ministry'&&['facilitator','leader','pastor','admin'].includes(row.role))},
  assert(id,cap){if(!this.can(id,cap)){const error=new Error('denied');error.code='BQ_CONGREGATION_PERMISSION_DENIED';throw error}}
};
let teams=[
  {id:'t1',congregation_id:'c1',created_by:'u2',team_type:'game_team',name:'Blue Team',active:true,created_at:now},
  {id:'t9',congregation_id:'c2',created_by:'u9',team_type:'game_team',name:'Second Team',active:true,created_at:now}
];
let members=[
  {team_id:'t1',user_id:'u1',joined_at:now},{team_id:'t1',user_id:'u2',joined_at:now},
  {team_id:'t9',user_id:'u1',joined_at:now},{team_id:'t9',user_id:'u9',joined_at:now}
];
let directory=[
  {congregation_id:'c1',user_id:'u1',display_name:'Leader One',role:'leader',active:true,joined_at:now},
  {congregation_id:'c1',user_id:'u2',display_name:'Creator Two',role:'member',active:true,joined_at:now},
  {congregation_id:'c1',user_id:'u3',display_name:'Member Three',role:'member',active:true,joined_at:now},
  {congregation_id:'c2',user_id:'u1',display_name:'Leader One',role:'leader',active:true,joined_at:now},
  {congregation_id:'c2',user_id:'u9',display_name:'Creator Nine',role:'member',active:true,joined_at:now}
];
const calls=[];
const api={
  async list(ids){
    calls.push(['list',ids]);
    const allowed=new Set(ids.map(String)),visibleTeams=teams.filter(row=>allowed.has(row.congregation_id)),visibleIds=new Set(visibleTeams.map(row=>row.id));
    return{teams:visibleTeams,members:members.filter(row=>visibleIds.has(row.team_id)),directory:directory.filter(row=>allowed.has(row.congregation_id))};
  },
  async create(congregationId,name){calls.push(['create',congregationId,name]);teams.push({id:'t2',congregation_id:congregationId,created_by:'u1',team_type:'game_team',name,active:true,created_at:now});members.push({team_id:'t2',user_id:'u1',joined_at:now});return{team:{id:'t2'}}},
  async add(congregationId,teamId,targetUserId){calls.push(['add',congregationId,teamId,targetUserId]);members.push({team_id:teamId,user_id:targetUserId,joined_at:now});return{ok:true}},
  async remove(congregationId,teamId,targetUserId){calls.push(['remove',congregationId,teamId,targetUserId]);members=members.filter(row=>!(row.team_id===teamId&&row.user_id===targetUserId));return{ok:true}},
  async rename(congregationId,teamId,name){calls.push(['rename',congregationId,teamId,name]);teams=teams.map(row=>row.id===teamId?{...row,name}:row);return{team:{id:teamId,name}}},
  async archive(congregationId,teamId){calls.push(['archive',congregationId,teamId]);teams=teams.filter(row=>row.id!==teamId);members=members.filter(row=>row.team_id!==teamId);return{ok:true}}
};
const service=createTeamCenterService({api,session,congregation});
let state=await service.load();
assert(state.activeCongregationId==='c1','Team Center must bind the loaded state to the active congregation.');
assert(calls.at(-1)[0]==='list'&&JSON.stringify(calls.at(-1)[1])===JSON.stringify(['c1']),'Team Center must query only the active congregation.');
assert(state.teams.length===1&&state.teams[0].id==='t1'&&state.teams[0].memberCount===2,'Team list/member projection failed.');
assert(state.congregations.length===2&&state.congregations.find(row=>row.id==='c1')?.isActive===true&&state.congregations.find(row=>row.id==='c2')?.canManage===false,'Only the active membership may expose Team Center management.');
assert(state.teams[0].members.find(row=>row.userId==='u2')?.displayName==='Creator Two','Team member directory projection failed.');
assert(state.teams[0].members.find(row=>row.userId==='u1')?.roleLabel==='Leader','Congregation role display failed.');
assert(state.teams[0].canManage===true&&state.teams[0].canArchive===false,'Role-gated management/archive projection failed.');
assert(state.teams[0].availableMembers.some(row=>row.userId==='u3'),'Available congregation member projection failed.');
let inactiveCreate=false;try{await service.create({congregationId:'c2',name:'Wrong Tenant'})}catch(error){inactiveCreate=error.code==='BQ_TEAM_CENTER_CONTEXT_STALE'}assert(inactiveCreate,'Creating a team outside the loaded active congregation must fail closed.');
state=await service.addMember('t1','u3');assert(state.teams[0].members.some(row=>row.userId==='u3')&&calls.some(row=>row[0]==='add'),'Add-member workflow failed.');
state=await service.removeMember('t1','u3');assert(!state.teams[0].members.some(row=>row.userId==='u3')&&calls.some(row=>row[0]==='remove'),'Remove-member workflow failed.');
let creatorRemoval=false;try{await service.removeMember('t1','u2')}catch(error){creatorRemoval=error.code==='BQ_TEAM_CENTER_CREATOR_MEMBER'}assert(creatorRemoval,'Team creator removal must fail closed.');
state=await service.rename('t1','Renamed Team');assert(state.teams[0].name==='Renamed Team'&&calls.some(row=>row[0]==='rename'),'Rename workflow failed.');
state=await service.create({congregationId:'c1',name:'Leader Team'});assert(state.teams.some(row=>row.id==='t2'&&row.canArchive),'Leader team creation failed.');
state=await service.archive('t2');assert(!state.teams.some(row=>row.id==='t2')&&calls.some(row=>row[0]==='archive'),'Creator archive workflow failed.');

activeCongregationId='c2';
assert(service.snapshot().teams.length===0&&service.snapshot().activeCongregationId==='','Cached Team Center data must disappear immediately after active tenant changes.');
let staleMutation=false;try{await service.rename('t1','Blocked After Switch')}catch(error){staleMutation=error.code==='BQ_TEAM_CENTER_CONTEXT_STALE'}assert(staleMutation,'A tenant change must invalidate loaded Team Center mutations.');
state=await service.load();
assert(state.activeCongregationId==='c2'&&state.teams.length===1&&state.teams[0].id==='t9','Reload must move Team Center to the newly active congregation.');
assert(calls.at(-1)[0]==='list'&&JSON.stringify(calls.at(-1)[1])===JSON.stringify(['c2']),'Reload after tenant switch must query only the new active congregation.');

activeCongregationId='';
const listCallsBeforeNoActive=calls.filter(row=>row[0]==='list').length;
state=await service.load();
assert(state.teams.length===0&&state.directory.length===0&&state.activeCongregationId==='','No active congregation must expose no Team Center tenant data.');
assert(calls.filter(row=>row[0]==='list').length===listCallsBeforeNoActive,'No active congregation must issue no Team Center tenant read.');

activeCongregationId='c1';
ownRows=[{congregationId:'c1',userId:'u1',role:'member',roleKnown:true,roleLabel:'Member',congregation:{id:'c1',name:'Test Church'}}];
await service.load();let denied=false;try{await service.rename('t1','Blocked')}catch(error){denied=error.code==='BQ_TEAM_CENTER_PERMISSION'}assert(denied,'Ordinary member management must fail closed.');
ownRows=[{...ownRows[0],role:'admin',roleLabel:'Admin'}];state=await service.load();assert(state.teams[0].canArchive===true,'Congregation admin archive authority was not projected.');

sessionState={authenticated:false,remoteAvailable:true,user:null};let auth=false;try{await service.load()}catch(error){auth=error.code==='BQ_TEAM_CENTER_AUTH_REQUIRED'}assert(auth,'Signed-out Team Center must fail closed.');
sessionState={authenticated:true,remoteAvailable:false,user:{id:'u1'}};let preview=false;try{await service.load()}catch(error){preview=error.code==='BQ_TEAM_CENTER_REMOTE_DISABLED'}assert(preview,'Local-preview Team Center must fail closed.');

sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}};
ownRows=[{congregationId:'c1',userId:'u1',role:'admin',roleKnown:true,roleLabel:'Admin',congregation:{id:'c1',name:'Test Church'}}];
activeCongregationId='c1';
const originalList=api.list;
api.list=async ids=>{calls.push(['list',ids]);return{teams:[{id:'foreign',congregation_id:'c9',created_by:'u9',team_type:'game_team',name:'Foreign Team',active:true,created_at:now}],members:[],directory:[]}};
let foreign=false;try{await service.load()}catch(error){foreign=error.code==='BQ_TEAM_CENTER_SCOPE'}assert(foreign,'Foreign congregation team must be rejected even if the API returns it.');
api.list=originalList;
teams=[{id:'wrong-type',congregation_id:'c1',created_by:'u1',team_type:'family',name:'Family Team',active:true,created_at:now}];members=[];directory=[];let wrongType=false;try{await service.load()}catch(error){wrongType=error.code==='BQ_TEAM_CENTER_SCOPE'}assert(wrongType,'Non-game Team Center row must be rejected.');
console.log('BibleQuest v3 Team Center active-tenant edge regression passed.');
