const ROLES=Object.freeze(['member','facilitator','leader','pastor','admin']);
const ROLE_LABELS=Object.freeze({member:'Member',facilitator:'Facilitator',leader:'Leader',pastor:'Pastor',admin:'Admin'});
const MINISTRY_ROLES=new Set(['facilitator','leader','pastor','admin']);

function normalizeInvite(value){return String(value||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'')}
function normalizeMembership(row){
  const rawRole=String(row?.role||'').trim().toLowerCase();
  const roleKnown=ROLES.includes(rawRole);
  const congregation=row?.congregation||{};
  return Object.freeze({
    congregationId:String(row?.congregation_id||congregation.id||''),
    userId:String(row?.user_id||''),
    role:roleKnown?rawRole:null,
    roleKnown,
    roleLabel:roleKnown?ROLE_LABELS[rawRole]:'Unsupported role',
    displayName:String(row?.display_name||'').trim(),
    joinedAt:row?.joined_at||null,
    congregation:Object.freeze({
      id:String(congregation.id||row?.congregation_id||''),
      name:String(congregation.name||'Congregation').trim()||'Congregation',
      timezone:String(congregation.timezone||'').trim(),
      ownerId:String(congregation.owner_id||'')
    })
  });
}

export function createCongregationMembershipService({api,session}){
  if(!api?.congregation||!session)throw new Error('Congregation membership requires shared API and session boundaries.');
  let memberships=[];
  let activeCongregationId='';
  let loadedUserId='';
  let loadRequest=0;

  const currentUserId=()=>{
    const state=session.getState();
    return state.authenticated&&state.user?.id?String(state.user.id):'';
  };
  const ownsLoadedContext=()=>Boolean(loadedUserId)&&currentUserId()===loadedUserId;

  const requireUser=()=>{
    const state=session.getState();
    if(!state.authenticated||!state.user?.id){const error=new Error('Sign in to use congregation membership.');error.code='BQ_CONGREGATION_AUTH_REQUIRED';throw error}
    return state.user;
  };
  const list=()=>ownsLoadedContext()?memberships.slice():[];
  const get=congregationId=>ownsLoadedContext()?memberships.find(row=>row.congregationId===String(congregationId))||null:null;
  const getActive=()=>{
    const userId=currentUserId();
    if(!userId||userId!==loadedUserId)return null;
    return get(activeCongregationId);
  };

  async function load(){
    const user=requireUser();
    const userId=String(user.id);
    const request=++loadRequest;
    if(loadedUserId&&loadedUserId!==userId){
      memberships=[];
      activeCongregationId='';
      loadedUserId='';
    }
    let rows;
    try{rows=await api.congregation.listMemberships(user.id)}
    catch(error){if(request!==loadRequest||currentUserId()!==userId)return list();throw error}
    if(request!==loadRequest||currentUserId()!==userId)return list();
    memberships=(Array.isArray(rows)?rows:[]).map(normalizeMembership).filter(row=>row.congregationId&&row.userId===userId);
    loadedUserId=userId;
    if(!get(activeCongregationId))activeCongregationId=memberships[0]?.congregationId||'';
    return list();
  }

  async function join(inviteCode){
    requireUser();
    const code=normalizeInvite(inviteCode);
    if(code.length<5){const error=new Error('Enter a valid congregation invite code.');error.code='BQ_CONGREGATION_INVITE_INVALID';throw error}
    await api.congregation.join(code);
    return load();
  }

  function setActive(congregationId){
    const user=requireUser();
    const userId=String(user.id);
    if(!loadedUserId||loadedUserId!==userId){const error=new Error('Reload congregation memberships before switching congregation.');error.code='BQ_CONGREGATION_CONTEXT_STALE';throw error}
    const membership=get(congregationId);
    if(!membership||membership.userId!==userId){const error=new Error('You are not a member of that congregation.');error.code='BQ_CONGREGATION_NOT_MEMBER';throw error}
    activeCongregationId=membership.congregationId;
    return membership;
  }

  function can(congregationId,capability){
    const membership=get(congregationId);
    if(!membership?.roleKnown)return false;
    if(capability==='read')return true;
    if(capability==='ministry')return MINISTRY_ROLES.has(membership.role);
    if(capability==='admin')return membership.role==='admin';
    return false;
  }

  function assert(congregationId,capability){
    if(can(congregationId,capability))return true;
    const error=new Error('Your congregation role does not allow this action.');
    error.code='BQ_CONGREGATION_PERMISSION_DENIED';
    throw error;
  }

  function clear(){loadRequest++;memberships=[];activeCongregationId='';loadedUserId=''}

  return Object.freeze({load,join,list,get,getActive,setActive,can,assert,clear,roles:()=>ROLES.slice(),isAuthenticated:()=>Boolean(session.getState().authenticated)});
}
