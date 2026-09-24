const PLATFORM_ROLES=new Set(['owner','admin']);
const clean=value=>String(value??'').trim();
const fail=(message,code)=>{const error=new Error(message);error.code=code;return error};
const freezeRows=rows=>Object.freeze((Array.isArray(rows)?rows:[]).map(row=>Object.freeze(row)));
const emptyFrontend=()=>Object.freeze({pwa:'?',packPolicy:'?',runtimePolicy:'?',build:'main'});

function denied(error){
  const text=clean(error?.message).toLowerCase();
  return error?.code==='BQ_ADMIN_OPS_ACCESS_DENIED'||text.includes('admin access required')||text.includes('owner/admin')||text.includes('only the biblequest owner');
}
function rowId(row){return clean(row?.id)}
function normalizeHealth(raw={}){
  const counts={};for(const [key,value] of Object.entries(raw?.counts||{}))counts[clean(key)]=Math.max(0,Number(value)||0);
  const errors=(Array.isArray(raw?.client_errors_24h)?raw.client_errors_24h:[]).map(row=>Object.freeze({id:rowId(row),surface:clean(row?.surface)||'BibleQuest',message:clean(row?.message)||'Runtime error',appVersion:clean(row?.app_version)||'unknown version',createdAt:row?.created_at||null}));
  return Object.freeze({opsVersion:Number(raw?.ops_version??raw?.opsVersion)||0,checkedAt:raw?.checked_at??raw?.checkedAt??null,counts:Object.freeze(counts),clientErrors24h:Object.freeze(errors)});
}
function normalizeCongregation(row){const id=rowId(row);return id?Object.freeze({id,name:clean(row?.name)||'Congregation'}):null}
function normalizeOnline(row){return Object.freeze({congregationId:clean(row?.congregation_id),congregationName:clean(row?.congregation_name)||'Congregation',userId:clean(row?.user_id),displayName:clean(row?.display_name)||'Member',role:clean(row?.role)||'member',surface:clean(row?.surface)||'BibleQuest',lastSeenAt:row?.last_seen_at||null})}
function normalizeAssignment(row){return Object.freeze({id:rowId(row),congregationId:clean(row?.congregation_id),congregationName:clean(row?.congregation_name)||'Congregation',title:clean(row?.title)||'Assignment',creatorName:clean(row?.creator_name)||'Member',creatorRole:clean(row?.creator_role)||'member',assignmentType:clean(row?.assignment_type)||'assignment',active:row?.active!==false,started:Math.max(0,Number(row?.started)||0),completed:Math.max(0,Number(row?.completed)||0),createdAt:row?.created_at||null,scheduleAt:row?.schedule_at||null,recurrenceRule:clean(row?.recurrence_rule),requiredReflection:Boolean(row?.required_reflection),minQuizScore:row?.min_quiz_score===null||row?.min_quiz_score===undefined?null:Number(row.min_quiz_score),evidenceType:clean(row?.evidence_type)})}
function normalizeMessage(row){return Object.freeze({id:rowId(row),congregationId:clean(row?.congregation_id),congregationName:clean(row?.congregation_name)||'Congregation',title:clean(row?.title)||'Ministry message',creatorName:clean(row?.creator_name)||'Member',creatorRole:clean(row?.creator_role)||'member',messageType:clean(row?.message_type)||'announcement',active:row?.active!==false,publishAt:row?.publish_at||null,mediaPath:clean(row?.media_path),pinned:Boolean(row?.pinned)})}
function normalizePoll(row){const totals=freezeRows((Array.isArray(row?.totals)?row.totals:[]).map(item=>({label:clean(item?.label)||'Option',total:Math.max(0,Number(item?.total)||0)})));return Object.freeze({id:rowId(row),congregationId:clean(row?.congregation_id),congregationName:clean(row?.congregation_name)||'Congregation',prompt:clean(row?.prompt)||'Poll',creatorName:clean(row?.creator_name)||'Member',pollType:clean(row?.poll_type)||'single',resultsVisibility:clean(row?.results_visibility)||'live',active:row?.active!==false,votes:Math.max(0,Number(row?.votes)||0),totals,createdAt:row?.created_at||null})}
function normalizeMedia(row){return Object.freeze({id:rowId(row),congregationId:clean(row?.congregation_id),congregationName:clean(row?.congregation_name)||'Congregation',title:clean(row?.title)||'Media',creatorName:clean(row?.creator_name)||'Owner/Admin',creatorRole:clean(row?.creator_role)||'platform',mediaType:clean(row?.media_type)||'youtube_video',featured:Boolean(row?.featured),displayOrder:Number(row?.display_order)||0,active:row?.active!==false,publishAt:row?.publish_at||null})}
function normalizeRoom(row){return Object.freeze({id:rowId(row),congregationId:clean(row?.congregation_id),congregationName:clean(row?.congregation_name)||'Congregation',title:clean(row?.title)||'BibleQuest Live',creatorName:clean(row?.creator_name)||'Former member',creatorRole:clean(row?.creator_role)||'member',status:clean(row?.status)||'unknown',participants:Math.max(0,Number(row?.participants)||0),createdAt:row?.created_at||null})}
function normalizeFrontend(raw={}){return Object.freeze({pwa:clean(raw?.pwa)||'?',packPolicy:clean(raw?.packPolicy)||'?',runtimePolicy:clean(raw?.runtimePolicy)||'?',build:clean(raw?.build)||'main'})}
function normalizeDashboard(data={}){
  return Object.freeze({
    congregations:freezeRows((Array.isArray(data?.congregations)?data.congregations:[]).map(normalizeCongregation).filter(Boolean)),
    online:freezeRows((Array.isArray(data?.online)?data.online:[]).map(normalizeOnline)),
    assignments:freezeRows((Array.isArray(data?.assignments)?data.assignments:[]).map(normalizeAssignment)),
    messages:freezeRows((Array.isArray(data?.messages)?data.messages:[]).map(normalizeMessage)),
    polls:freezeRows((Array.isArray(data?.polls)?data.polls:[]).map(normalizePoll)),
    media:freezeRows((Array.isArray(data?.media)?data.media:[]).map(normalizeMedia)),
    rooms:freezeRows((Array.isArray(data?.rooms)?data.rooms:[]).map(normalizeRoom)),
    calendar:freezeRows(Array.isArray(data?.calendar)?data.calendar:[]),
    recognitions:freezeRows(Array.isArray(data?.recognitions)?data.recognitions:[]),
    health:normalizeHealth(data?.health)
  });
}
const emptyDashboard=()=>normalizeDashboard();

export function createAdminOperationsService({api,session}={}){
  const required=['status','dashboard','frontendHealth','deleteUser','suspendAccount','reactivateAccount','forceSignOut','setTempPassword','changeEmail'];
  if(!api||required.some(name=>typeof api[name]!=='function')||!session?.getState)throw new Error('Admin Operations requires the shared API and Session owners.');
  const emptyState=(status='idle',error='')=>Object.freeze({status,role:'',currentUserId:'',dashboard:emptyDashboard(),frontend:emptyFrontend(),busy:false,error,lastAction:null});
  let state=emptyState(),contextUserId='',refreshRequest=0,mutationRequest=0;
  const currentUserId=()=>{const value=session.getState();return value?.authenticated&&value?.user?.id?String(value.user.id):''};
  const contextCurrent=userId=>Boolean(userId)&&contextUserId===String(userId)&&currentUserId()===String(userId);
  const snapshot=()=>contextUserId&&currentUserId()!==contextUserId?emptyState(currentUserId()?'idle':'signed-out'):Object.freeze({...state});
  const reset=(status,error='',userId='')=>{state=emptyState(status,error);contextUserId=String(userId||'');return snapshot()};
  const staleError=()=>fail('The account changed. Reload Admin Operations before continuing.','BQ_ADMIN_OPS_CONTEXT_STALE');
  const ensureAuthorized=()=>{const userId=currentUserId();if(!contextCurrent(userId))throw staleError();if(state.status!=='ready'||!PLATFORM_ROLES.has(state.role))throw fail('Admin Operations requires verified Owner/Admin access.','BQ_ADMIN_OPS_NOT_READY');return userId};

  async function authorize(){
    const user=currentUserId(),userId=user,request=++refreshRequest;
    if(!user)return reset('signed-out');
    if(contextUserId!==userId){mutationRequest++;reset('idle','',userId)}
    contextUserId=userId;
    state=Object.freeze({...state,status:'loading',busy:true,error:''});
    try{
      const result=await api.status();
      if(request!==refreshRequest)return snapshot();
      if(!contextCurrent(userId))return reset(currentUserId()?'idle':'signed-out','',currentUserId());
      const role=clean(result?.role).toLowerCase(),confirmedUserId=clean(result?.userId||userId);
      if(confirmedUserId!==userId)return reset('unauthorized','BibleQuest admin access required',userId);
      if(!PLATFORM_ROLES.has(role))return reset('unauthorized','BibleQuest admin access required',userId);
      state=Object.freeze({...state,status:'ready',role,currentUserId:userId,busy:false,error:''});return snapshot();
    }catch(error){
      if(request!==refreshRequest)return snapshot();
      if(!contextCurrent(userId))return reset(currentUserId()?'idle':'signed-out','',currentUserId());
      if(denied(error))return reset('unauthorized',error?.message||'BibleQuest admin access required',userId);
      state=Object.freeze({...state,status:'error',busy:false,error:error?.message||'Admin Operations could not load.'});return snapshot();
    }
  }

  async function refresh(){
    const access=await authorize();if(access.status!=='ready')return access;
    const userId=contextUserId,request=refreshRequest;
    state=Object.freeze({...state,status:'loading',busy:true,error:''});
    try{
      const [data,frontend]=await Promise.all([api.dashboard(),Promise.resolve(api.frontendHealth()).catch(()=>emptyFrontend())]);
      if(request!==refreshRequest||!contextCurrent(userId))return snapshot();
      const confirmed=clean(data?.role||state.role).toLowerCase();
      if(!PLATFORM_ROLES.has(confirmed))return reset('unauthorized','BibleQuest admin access required',userId);
      state=Object.freeze({...state,status:'ready',role:confirmed,currentUserId:userId,dashboard:normalizeDashboard(data),frontend:normalizeFrontend(frontend),busy:false,error:'',lastAction:'refresh'});return snapshot();
    }catch(error){
      if(request!==refreshRequest||!contextCurrent(userId))return snapshot();
      if(denied(error))return reset('unauthorized',error?.message||'BibleQuest admin access required',userId);
      state=Object.freeze({...state,status:'error',busy:false,error:error?.message||'Admin Operations could not load.'});return snapshot();
    }
  }

  const beginMutation=(action)=>{
    const userId=ensureAuthorized();
    if(state.busy)throw fail('Another Admin Operations action is still running.','BQ_ADMIN_OPS_BUSY');
    const request=++mutationRequest;
    state=Object.freeze({...state,busy:true,error:'',lastAction:action});
    return {userId,request};
  };
  const mutationStillCurrent=({userId,request})=>request===mutationRequest&&contextCurrent(userId);
  const mutationFailure=(ctx,error,message,action)=>{
    if(!mutationStillCurrent(ctx)){if(contextUserId===ctx.userId)reset(currentUserId()?'idle':'signed-out','',currentUserId());throw staleError()}
    state=Object.freeze({...state,busy:false,error:error?.message||message,lastAction:action});throw error;
  };
  const mutationSuccess=(ctx,result,action)=>{
    if(!mutationStillCurrent(ctx))throw staleError();
    state=Object.freeze({...state,busy:false,lastAction:action});
    return Object.freeze({ok:true,result,state:snapshot()});
  };

  async function deleteUser(targetUserId){
    ensureAuthorized();if(state.role!=='owner')throw fail('Only the BibleQuest owner can delete accounts.','BQ_ADMIN_OPS_OWNER_REQUIRED');
    const target=clean(targetUserId);if(!target)throw fail('A valid account is required.','BQ_ADMIN_OPS_TARGET_INVALID');
    if(target===state.currentUserId)throw fail('The active owner account cannot delete itself.','BQ_ADMIN_OPS_SELF_DELETE');
    const ctx=beginMutation('delete_user');
    try{const result=await api.deleteUser(target);if(result?.deleted!==true)throw fail('The server did not confirm account deletion.','BQ_ADMIN_OPS_DELETE_UNCONFIRMED');return mutationSuccess(ctx,result,'delete_user')}
    catch(error){return mutationFailure(ctx,error,'Account deletion failed.','delete_user')}
  }

  function guardTarget(targetUserId,selfMessage,selfCode){
    ensureAuthorized();
    const target=clean(targetUserId);if(!target)throw fail('A valid account is required.','BQ_ADMIN_OPS_TARGET_INVALID');
    if(target===state.currentUserId)throw fail(selfMessage,selfCode);
    if(state.busy)throw fail('Another Admin Operations action is still running.','BQ_ADMIN_OPS_BUSY');
    return target;
  }

  async function suspendAccount(targetUserId,reason=''){
    const target=guardTarget(targetUserId,'You cannot suspend your own account.','BQ_ADMIN_OPS_SELF_SUSPEND'),ctx=beginMutation('suspend_account');
    try{const result=await api.suspendAccount(target,clean(reason).slice(0,500));if(result?.active!==false)throw fail('The server did not confirm the suspension.','BQ_ADMIN_OPS_SUSPEND_UNCONFIRMED');return mutationSuccess(ctx,result,'suspend_account')}
    catch(error){return mutationFailure(ctx,error,'Account suspension failed.','suspend_account')}
  }

  async function reactivateAccount(targetUserId){
    const target=guardTarget(targetUserId,'This is already your active account.','BQ_ADMIN_OPS_SELF_REACTIVATE'),ctx=beginMutation('reactivate_account');
    try{const result=await api.reactivateAccount(target);if(result?.active!==true)throw fail('The server did not confirm reactivation.','BQ_ADMIN_OPS_REACTIVATE_UNCONFIRMED');return mutationSuccess(ctx,result,'reactivate_account')}
    catch(error){return mutationFailure(ctx,error,'Account reactivation failed.','reactivate_account')}
  }

  async function forceSignOut(targetUserId){
    const target=clean(targetUserId);ensureAuthorized();if(!target)throw fail('A valid account is required.','BQ_ADMIN_OPS_TARGET_INVALID');
    const ctx=beginMutation('force_sign_out');
    try{const result=await api.forceSignOut(target);return mutationSuccess(ctx,result,'force_sign_out')}
    catch(error){return mutationFailure(ctx,error,'Force sign-out failed.','force_sign_out')}
  }

  async function setTempPassword(targetUserId,password){
    ensureAuthorized();
    if(state.role!=='owner')throw fail('Only the BibleQuest owner can set a temporary password.','BQ_ADMIN_OPS_OWNER_REQUIRED');
    const target=guardTarget(targetUserId,'Use your own account recovery flow, not this emergency tool.','BQ_ADMIN_OPS_SELF_TEMP_PASSWORD');
    const value=String(password||'');if(value.length<12)throw fail('Temporary password must be at least 12 characters.','BQ_ADMIN_OPS_PASSWORD_TOO_SHORT');
    const ctx=beginMutation('set_temp_password');
    try{const result=await api.setTempPassword(target,value);return mutationSuccess(ctx,result,'set_temp_password')}
    catch(error){return mutationFailure(ctx,error,'Setting the temporary password failed.','set_temp_password')}
  }

  async function changeEmail(targetUserId,email){
    ensureAuthorized();
    if(state.role!=='owner')throw fail('Only the BibleQuest owner can change an account email.','BQ_ADMIN_OPS_OWNER_REQUIRED');
    const target=guardTarget(targetUserId,'Use your own Account page for this active owner account.','BQ_ADMIN_OPS_SELF_EMAIL_CHANGE');
    const value=clean(email).toLowerCase();
    if(value.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))throw fail('A valid recovery email is required.','BQ_ADMIN_OPS_EMAIL_INVALID');
    const ctx=beginMutation('change_email');
    try{const result=await api.changeEmail(target,value);if(result?.changed!==true)throw fail('The server did not confirm the email change.','BQ_ADMIN_OPS_EMAIL_UNCONFIRMED');return mutationSuccess(ctx,result,'change_email')}
    catch(error){return mutationFailure(ctx,error,'Changing the account email failed.','change_email')}
  }

  return Object.freeze({authorize,refresh,deleteUser,suspendAccount,reactivateAccount,forceSignOut,setTempPassword,changeEmail,getState:snapshot,clear:()=>{refreshRequest++;mutationRequest++;return reset('idle')}});
}
