const PLATFORM_ROLES=new Set(['owner','admin']);
const SITE_ROLES=new Set(['member','admin','owner']);
const CONGREGATION_ROLES=new Set(['member','facilitator','leader','pastor','admin']);
const GROUP_ROLES=new Set(['member','leader']);
const clean=value=>String(value??'').trim();
const fail=(message,code)=>{const error=new Error(message);error.code=code;return error};
const freezeRows=rows=>Object.freeze(rows.map(row=>Object.freeze(row)));

function denied(error){
  const text=clean(error?.message).toLowerCase();
  return error?.code==='BQ_ADMIN_ACCESS_DENIED'||text.includes('admin access required')||text.includes('owner/admin');
}
function normalizeMembership(row){
  const congregationId=clean(row?.congregationId??row?.congregation_id);if(!congregationId)return null;
  return Object.freeze({congregationId,congregationName:clean(row?.congregationName)||'Congregation',role:clean(row?.role)||'member',active:row?.active!==false});
}
function normalizeGroupMembership(row){
  const groupId=clean(row?.groupId??row?.group_id);if(!groupId)return null;
  return Object.freeze({groupId,groupName:clean(row?.groupName)||'Small group',congregationId:clean(row?.congregationId)||'',role:clean(row?.role)||'member',active:row?.active!==false});
}
function normalizeUser(row){
  const id=clean(row?.id);if(!id)return null;
  const role=SITE_ROLES.has(clean(row?.role))?clean(row.role):'member';
  return Object.freeze({id,email:clean(row?.email),name:clean(row?.name)||clean(row?.email).split('@')[0]||'Member',role,accessActive:row?.accessActive!==false,createdAt:row?.createdAt||null,lastSignInAt:row?.lastSignInAt||null,lastActiveAt:row?.lastActiveAt||null,memberships:freezeRows((Array.isArray(row?.memberships)?row.memberships:[]).map(normalizeMembership).filter(Boolean)),groupMemberships:freezeRows((Array.isArray(row?.groupMemberships)?row.groupMemberships:[]).map(normalizeGroupMembership).filter(Boolean))});
}
function normalizeOptions(options={}){
  const congregations=freezeRows((Array.isArray(options?.congregations)?options.congregations:[]).map(row=>{const id=clean(row?.id);return id?{id,name:clean(row?.name)||'Congregation',ownerId:clean(row?.ownerId)}:null}).filter(Boolean));
  const groups=freezeRows((Array.isArray(options?.groups)?options.groups:[]).map(row=>{const id=clean(row?.id);return id?{id,name:clean(row?.name)||'Small group',congregationId:clean(row?.congregationId),ownerId:clean(row?.ownerId),maxMembers:Number(row?.maxMembers)||6,memberCount:Number(row?.memberCount)||0}:null}).filter(Boolean));
  return Object.freeze({congregations,groups});
}

export function createAdminConsoleService({api,session}={}){
  const required=['status','listUsers','setRole','setCongregation','removeCongregation','setCongregationRole','createCongregation','createSmallGroup','setGroupMembership','setGroupOwner'];
  if(!api||required.some(name=>typeof api[name]!=='function')||!session?.getState)throw new Error('Admin Console requires the shared API and Session owners.');
  let state={status:'idle',role:'',users:Object.freeze([]),options:normalizeOptions(),busy:false,error:'',lastAction:null};
  const snapshot=()=>Object.freeze({...state});
  const reset=(status,error='')=>{state={status,role:'',users:Object.freeze([]),options:normalizeOptions(),busy:false,error,lastAction:null};return snapshot()};
  const currentUser=()=>session.getState()?.authenticated&&session.getState()?.user?.id?session.getState().user:null;
  const ensureReady=()=>{if(state.status!=='ready'||!PLATFORM_ROLES.has(state.role))throw fail('Admin Console requires verified Owner/Admin access.','BQ_ADMIN_NOT_READY')};

  async function refresh(){
    if(!currentUser())return reset('signed-out');
    state={...state,status:'loading',busy:true,error:''};
    try{
      const access=await api.status();
      const role=clean(access?.role).toLowerCase();
      if(!PLATFORM_ROLES.has(role))return reset('unauthorized','BibleQuest admin access required');
      const data=await api.listUsers({page:1,perPage:200});
      const confirmed=clean(data?.role||role).toLowerCase();
      if(!PLATFORM_ROLES.has(confirmed))return reset('unauthorized','BibleQuest admin access required');
      state={status:'ready',role:confirmed,users:freezeRows((Array.isArray(data?.users)?data.users:[]).map(normalizeUser).filter(Boolean)),options:normalizeOptions(data?.options),busy:false,error:'',lastAction:null};
      return snapshot();
    }catch(error){
      if(denied(error))return reset('unauthorized',error?.message||'BibleQuest admin access required');
      state={...state,status:'error',busy:false,error:error?.message||'Admin Console could not load.'};return snapshot();
    }
  }

  async function mutate(action,operation){
    ensureReady();if(state.busy)throw fail('Another Admin Console action is still running.','BQ_ADMIN_BUSY');
    state={...state,busy:true,error:'',lastAction:action};
    try{const result=await operation();await refresh();state={...state,lastAction:action};return Object.freeze({ok:true,result,state:snapshot()})}
    catch(error){state={...state,busy:false,error:error?.message||'Admin action failed.',lastAction:action};throw error}
  }

  const setRole=(targetUserId,role)=>{const id=clean(targetUserId),next=clean(role).toLowerCase();if(!id||!SITE_ROLES.has(next))throw fail('Choose a valid member, admin, or owner platform role.','BQ_ADMIN_ROLE_INVALID');return mutate('set_role',()=>api.setRole(id,next))};
  const setCongregation=(targetUserId,congregationId,{replace=true}={})=>{const userId=clean(targetUserId),id=clean(congregationId);if(!userId||!id)throw fail('Valid user and congregation are required.','BQ_ADMIN_CONGREGATION_INVALID');return mutate('set_congregation',()=>api.setCongregation(userId,id,{replace}))};
  const removeCongregation=(targetUserId,congregationId)=>{const userId=clean(targetUserId),id=clean(congregationId);if(!userId||!id)throw fail('Valid user and congregation are required.','BQ_ADMIN_CONGREGATION_INVALID');return mutate('remove_congregation',()=>api.removeCongregation(userId,id))};
  const setCongregationRole=(targetUserId,congregationId,role)=>{const userId=clean(targetUserId),id=clean(congregationId),next=clean(role).toLowerCase();if(!userId||!id||!CONGREGATION_ROLES.has(next))throw fail('Choose a valid congregation ministry role.','BQ_ADMIN_CONGREGATION_ROLE_INVALID');return mutate('set_congregation_role',()=>api.setCongregationRole(userId,id,next))};
  const createCongregation=name=>{const value=clean(name);if(value.length<2)throw fail('Congregation name must be at least 2 characters.','BQ_ADMIN_CONGREGATION_NAME_INVALID');return mutate('create_congregation',()=>api.createCongregation(value))};
  const createSmallGroup=({congregationId,name,maxMembers=6}={})=>{const id=clean(congregationId),value=clean(name),limit=Math.max(2,Math.min(6,Number(maxMembers)||6));if(!id||value.length<2)throw fail('Congregation and small-group name are required.','BQ_ADMIN_GROUP_INVALID');return mutate('create_small_group',()=>api.createSmallGroup({congregationId:id,name:value,maxMembers:limit}))};
  const setGroupMembership=({targetUserId,groupId,role='member',active=true}={})=>{const userId=clean(targetUserId),id=clean(groupId),next=clean(role).toLowerCase();if(!userId||!id||!GROUP_ROLES.has(next))throw fail('Choose a valid small-group membership.','BQ_ADMIN_GROUP_MEMBERSHIP_INVALID');return mutate('set_group_membership',()=>api.setGroupMembership({targetUserId:userId,groupId:id,role:next,active:active!==false}))};
  const setGroupOwner=(targetUserId,groupId)=>{const userId=clean(targetUserId),id=clean(groupId);if(!userId||!id)throw fail('Valid user and small group are required.','BQ_ADMIN_GROUP_OWNER_INVALID');return mutate('set_group_owner',()=>api.setGroupOwner(userId,id))};

  return Object.freeze({refresh,setRole,setCongregation,removeCongregation,setCongregationRole,createCongregation,createSmallGroup,setGroupMembership,setGroupOwner,getState:snapshot,clear:()=>reset('idle'),siteRoles:Object.freeze([...SITE_ROLES]),congregationRoles:Object.freeze([...CONGREGATION_ROLES]),groupRoles:Object.freeze([...GROUP_ROLES])});
}
