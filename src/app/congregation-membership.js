const ROLES=Object.freeze(['member','facilitator','leader','pastor','admin']);
const ROLE_LABELS=Object.freeze({member:'Member',facilitator:'Facilitator',leader:'Leader',pastor:'Pastor',admin:'Admin'});
const MINISTRY_ROLES=new Set(['facilitator','leader','pastor','admin']);

function normalizeInvite(value){return String(value||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'')}
function invalidMemberResponse(message){const error=new Error(message);error.code='BQ_CONGREGATION_MEMBER_RESPONSE';throw error}
function normalizeMembership(row){
  const rawRole=String(row?.role||'').trim().toLowerCase();
  const roleKnown=ROLES.includes(rawRole);
  const congregation=row?.congregation||{};
  const congregationId=row?.congregation_id;
  if(!congregationId||congregation.id!==congregationId||row.active===false||congregation.active===false)return null;
  return Object.freeze({
    congregationId,
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

export function createCongregationMembershipService({api,session,onContextChange=()=>{},selectionStorage=null}){
  if(!api?.congregation||!session)throw new Error('Congregation membership requires shared API and session boundaries.');
  const selectionKey=userId=>`active-congregation.${String(userId||'').trim()}`;
  const readRemembered=userId=>{try{return String(selectionStorage?.read?.(selectionKey(userId),'')||'').trim()}catch{return ''}};
  const remember=(userId,congregationId)=>{try{selectionStorage?.write?.(selectionKey(userId),String(congregationId||''))}catch{}};
  const forgetRemembered=userId=>{try{selectionStorage?.remove?.(selectionKey(userId))}catch{}};
  let memberships=[];
  let activeCongregationId='';
  let loadedUserId='';
  let loadRequest=0;
  let pendingLoad=null; // Same-account concurrent consumers share one validated snapshot.
  // Context listeners drive tenant-scoped route invalidation. Repeated identical
  // fetches must not restart a mounted page (and another membership fetch).
  const membershipFingerprint=()=>JSON.stringify({
    userId:loadedUserId,activeCongregationId,
    memberships:memberships.map(row=>[
      row.congregationId,row.userId,row.role,row.roleKnown,row.displayName,row.joinedAt,
      row.congregation.id,row.congregation.name,row.congregation.timezone,row.congregation.ownerId
    ]).sort((a,b)=>a[0].localeCompare(b[0]))
  });

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

  function load(){
    const user=requireUser();
    const userId=String(user.id);
    // Multiple pages and restored-session consumers can ask for membership in
    // the same event tick. Last-request-wins made earlier page requests resolve
    // to the *old* empty snapshot, even when another read correctly hydrated
    // membership. Share one authoritative read among same-user consumers.
    if(pendingLoad?.userId===userId)return pendingLoad.promise;
    const before=membershipFingerprint();
    const request=++loadRequest;
    if(loadedUserId&&loadedUserId!==userId){
      memberships=[];
      activeCongregationId='';
      loadedUserId='';
    }
    const promise=(async()=>{
      let rows;
      try{rows=await api.congregation.listMemberships(user.id)}
      catch(error){if(request!==loadRequest||currentUserId()!==userId)return list();throw error}
      if(request!==loadRequest||currentUserId()!==userId)return list();
      memberships=(Array.isArray(rows)?rows:[]).map(normalizeMembership).filter(row=>row&&row.userId===userId);
      loadedUserId=userId;
      if(!get(activeCongregationId)){
        activeCongregationId='';
        const remembered=readRemembered(userId);
        if(remembered&&get(remembered))activeCongregationId=remembered;
        else if(remembered)forgetRemembered(userId);
      }
      if(membershipFingerprint()!==before)onContextChange();
      return list();
    })();
    pendingLoad={userId,promise};
    const release=()=>{if(pendingLoad?.promise===promise)pendingLoad=null};
    // Attach both handlers: a rejected request must not produce an unhandled
    // rejection while its original caller still receives the error.
    void promise.then(release,release);
    return promise;
  }

  async function join(inviteCode){
    requireUser();
    const code=normalizeInvite(inviteCode);
    if(code.length<5){const error=new Error('Enter a valid congregation invite code.');error.code='BQ_CONGREGATION_INVITE_INVALID';throw error}
    await api.congregation.join(code);
    return load();
  }

  async function updateSettings({name,timezone}={}){
    const user=requireUser(),userId=String(user.id),active=getActive();
    if(!active||!ownsLoadedContext()){const error=new Error('Choose an active congregation before editing settings.');error.code='BQ_CONGREGATION_CONTEXT_STALE';throw error}
    if(active.role!=='admin'){const error=new Error('Congregation admin permission is required to edit these settings.');error.code='BQ_CONGREGATION_PERMISSION_DENIED';throw error}
    const nextName=String(name??'').trim(),nextTimezone=String(timezone??'').trim();
    if(nextName.length<2||nextName.length>100){const error=new Error('Congregation name must be between 2 and 100 characters.');error.code='BQ_CONGREGATION_SETTINGS_NAME_INVALID';throw error}
    try{new Intl.DateTimeFormat('en-US',{timeZone:nextTimezone}).format(new Date(0))}catch{const error=new Error('Choose a valid time zone.');error.code='BQ_CONGREGATION_SETTINGS_TIMEZONE_INVALID';throw error}
    await api.congregation.updateSettings(active.congregationId,{name:nextName,timezone:nextTimezone});
    const currentUser=currentUserId(),current=getActive();
    if(currentUser!==userId||current?.congregationId!==active.congregationId){const error=new Error('Account or active congregation changed while saving. Reload settings before continuing.');error.code='BQ_CONGREGATION_CONTEXT_STALE';throw error}
    return load();
  }

  function adminScope(){
    const user=requireUser(),active=getActive();
    if(!active||!ownsLoadedContext()){const error=new Error('Choose an active congregation before managing members.');error.code='BQ_CONGREGATION_CONTEXT_STALE';throw error}
    if(active.role!=='admin'){const error=new Error('Congregation admin permission is required to manage members.');error.code='BQ_CONGREGATION_PERMISSION_DENIED';throw error}
    return {userId:String(user.id),congregationId:active.congregationId};
  }

  async function loadManagedMembers(){
    const scope=adminScope(),result=await api.congregation.listManagedMembers(scope.congregationId);
    const current=adminScope();
    if(current.userId!==scope.userId||current.congregationId!==scope.congregationId){const error=new Error('Account or active congregation changed while members were loading.');error.code='BQ_CONGREGATION_CONTEXT_STALE';throw error}
    if(result?.congregationId!==scope.congregationId)invalidMemberResponse('Invalid member list scope.');
    const seen=new Set(),members=(Array.isArray(result?.members)?result.members:[]).map(row=>{
      const userId=String(row?.userId||''),role=String(row?.role||'').trim().toLowerCase();
      if(!userId||seen.has(userId)||!ROLES.includes(role))invalidMemberResponse('Invalid member identity.');
      seen.add(userId);
      return Object.freeze({userId,displayName:String(row?.displayName||'Member').trim()||'Member',role,active:row?.active!==false,joinedAt:row?.joinedAt||null});
    });
    return Object.freeze(members);
  }

  async function manageMember({userId,role,active}={}){
    const scope=adminScope(),targetUserId=String(userId||'').trim(),nextRole=String(role||'').trim().toLowerCase();
    if(!targetUserId||!ROLES.includes(nextRole)||typeof active!=='boolean'){const error=new Error('Choose a member, valid congregation role, and active state.');error.code='BQ_CONGREGATION_MEMBER_INPUT';throw error}
    const result=await api.congregation.manageMember(scope.congregationId,targetUserId,nextRole,active);
    const current=adminScope();
    if(current.userId!==scope.userId||current.congregationId!==scope.congregationId){const error=new Error('Account or active congregation changed while saving member access.');error.code='BQ_CONGREGATION_CONTEXT_STALE';throw error}
    const saved=result?.membership;
    if(saved?.congregationId!==scope.congregationId||saved?.userId!==targetUserId||saved?.role!==nextRole||saved?.active!==active)invalidMemberResponse('Invalid member update scope.');
    return loadManagedMembers();
  }

  function setActive(congregationId){
    const user=requireUser();
    const userId=String(user.id);
    if(!loadedUserId||loadedUserId!==userId){const error=new Error('Reload congregation memberships before switching congregation.');error.code='BQ_CONGREGATION_CONTEXT_STALE';throw error}
    const membership=get(congregationId);
    if(!membership||membership.userId!==userId){const error=new Error('You are not a member of that congregation.');error.code='BQ_CONGREGATION_NOT_MEMBER';throw error}
    const changed=activeCongregationId!==membership.congregationId;
    activeCongregationId=membership.congregationId;
    remember(userId,activeCongregationId);
    if(changed)onContextChange();
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

  function clear(){loadRequest++;pendingLoad=null;memberships=[];activeCongregationId='';loadedUserId='';onContextChange()}

  return Object.freeze({load,join,updateSettings,loadManagedMembers,manageMember,list,get,getActive,setActive,can,assert,clear,roles:()=>ROLES.slice(),isAuthenticated:()=>Boolean(session.getState().authenticated)});
}
