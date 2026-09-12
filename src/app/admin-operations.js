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
  const required=['status','dashboard','frontendHealth','deleteUser','suspendAccount','reactivateAccount','forceSignOut','setTempPassword'];
  if(!api||required.some(name=>typeof api[name]!=='function')||!session?.getState)throw new Error('Admin Operations requires the shared API and Session owners.');
  let state={status:'idle',role:'',currentUserId:'',dashboard:emptyDashboard(),frontend:emptyFrontend(),busy:false,error:'',lastAction:null};
  const snapshot=()=>Object.freeze({...state});
  const reset=(status,error='')=>{state={status,role:'',currentUserId:'',dashboard:emptyDashboard(),frontend:emptyFrontend(),busy:false,error,lastAction:null};return snapshot()};
  const currentUser=()=>{const value=session.getState();return value?.authenticated&&value?.user?.id?value.user:null};
  const ensureAuthorized=()=>{if(state.status!=='ready'||!PLATFORM_ROLES.has(state.role))throw fail('Admin Operations requires verified Owner/Admin access.','BQ_ADMIN_OPS_NOT_READY')};

  async function authorize(){
    const user=currentUser();if(!user)return reset('signed-out');
    state={...state,status:'loading',busy:true,error:''};
    try{
      const result=await api.status(),role=clean(result?.role).toLowerCase(),userId=clean(result?.userId||user.id);
      if(!PLATFORM_ROLES.has(role))return reset('unauthorized','BibleQuest admin access required');
      state={...state,status:'ready',role,currentUserId:userId,busy:false,error:''};return snapshot();
    }catch(error){
      if(denied(error))return reset('unauthorized',error?.message||'BibleQuest admin access required');
      state={...state,status:'error',busy:false,error:error?.message||'Admin Operations could not load.'};return snapshot();
    }
  }

  async function refresh(){
    const access=await authorize();if(access.status!=='ready')return access;
    state={...state,status:'loading',busy:true,error:''};
    try{
      const [data,frontend]=await Promise.all([api.dashboard(),Promise.resolve(api.frontendHealth()).catch(()=>emptyFrontend())]);
      const confirmed=clean(data?.role||state.role).toLowerCase();
      if(!PLATFORM_ROLES.has(confirmed))return reset('unauthorized','BibleQuest admin access required');
      state={...state,status:'ready',role:confirmed,dashboard:normalizeDashboard(data),frontend:normalizeFrontend(frontend),busy:false,error:'',lastAction:'refresh'};return snapshot();
    }catch(error){
      if(denied(error))return reset('unauthorized',error?.message||'BibleQuest admin access required');
      state={...state,status:'error',busy:false,error:error?.message||'Admin Operations could not load.'};return snapshot();
    }
  }

  async function deleteUser(targetUserId){
    ensureAuthorized();if(state.role!=='owner')throw fail('Only the BibleQuest owner can delete accounts.','BQ_ADMIN_OPS_OWNER_REQUIRED');
    const target=clean(targetUserId);if(!target)throw fail('A valid account is required.','BQ_ADMIN_OPS_TARGET_INVALID');
    if(target===state.currentUserId)throw fail('The active owner account cannot delete itself.','BQ_ADMIN_OPS_SELF_DELETE');
    if(state.busy)throw fail('Another Admin Operations action is still running.','BQ_ADMIN_OPS_BUSY');
    state={...state,busy:true,error:'',lastAction:'delete_user'};
    try{const result=await api.deleteUser(target);if(result?.deleted!==true)throw fail('The server did not confirm account deletion.','BQ_ADMIN_OPS_DELETE_UNCONFIRMED');state={...state,busy:false,lastAction:'delete_user'};return Object.freeze({ok:true,result,state:snapshot()})}
    catch(error){state={...state,busy:false,error:error?.message||'Account deletion failed.',lastAction:'delete_user'};throw error}
  }

  function guardTarget(targetUserId,selfMessage,selfCode){
    ensureAuthorized();
    const target=clean(targetUserId);if(!target)throw fail('A valid account is required.','BQ_ADMIN_OPS_TARGET_INVALID');
    if(target===state.currentUserId)throw fail(selfMessage,selfCode);
    if(state.busy)throw fail('Another Admin Operations action is still running.','BQ_ADMIN_OPS_BUSY');
    return target;
  }

  async function suspendAccount(targetUserId,reason=''){
    const target=guardTarget(targetUserId,'You cannot suspend your own account.','BQ_ADMIN_OPS_SELF_SUSPEND');
    state={...state,busy:true,error:'',lastAction:'suspend_account'};
    try{const result=await api.suspendAccount(target,clean(reason).slice(0,500));if(result?.active!==false)throw fail('The server did not confirm the suspension.','BQ_ADMIN_OPS_SUSPEND_UNCONFIRMED');state={...state,busy:false,lastAction:'suspend_account'};return Object.freeze({ok:true,result,state:snapshot()})}
    catch(error){state={...state,busy:false,error:error?.message||'Account suspension failed.',lastAction:'suspend_account'};throw error}
  }

  async function reactivateAccount(targetUserId){
    const target=guardTarget(targetUserId,'This is already your active account.','BQ_ADMIN_OPS_SELF_REACTIVATE');
    state={...state,busy:true,error:'',lastAction:'reactivate_account'};
    try{const result=await api.reactivateAccount(target);if(result?.active!==true)throw fail('The server did not confirm reactivation.','BQ_ADMIN_OPS_REACTIVATE_UNCONFIRMED');state={...state,busy:false,lastAction:'reactivate_account'};return Object.freeze({ok:true,result,state:snapshot()})}
    catch(error){state={...state,busy:false,error:error?.message||'Account reactivation failed.',lastAction:'reactivate_account'};throw error}
  }

  async function forceSignOut(targetUserId){
    const target=clean(targetUserId);ensureAuthorized();if(!target)throw fail('A valid account is required.','BQ_ADMIN_OPS_TARGET_INVALID');
    if(state.busy)throw fail('Another Admin Operations action is still running.','BQ_ADMIN_OPS_BUSY');
    state={...state,busy:true,error:'',lastAction:'force_sign_out'};
    try{const result=await api.forceSignOut(target);state={...state,busy:false,lastAction:'force_sign_out'};return Object.freeze({ok:true,result,state:snapshot()})}
    catch(error){state={...state,busy:false,error:error?.message||'Force sign-out failed.',lastAction:'force_sign_out'};throw error}
  }

  async function setTempPassword(targetUserId,password){
    ensureAuthorized();
    if(state.role!=='owner')throw fail('Only the BibleQuest owner can set a temporary password.','BQ_ADMIN_OPS_OWNER_REQUIRED');
    const target=guardTarget(targetUserId,'Use your own account recovery flow, not this emergency tool.','BQ_ADMIN_OPS_SELF_TEMP_PASSWORD');
    const value=String(password||'');if(value.length<12)throw fail('Temporary password must be at least 12 characters.','BQ_ADMIN_OPS_PASSWORD_TOO_SHORT');
    state={...state,busy:true,error:'',lastAction:'set_temp_password'};
    try{const result=await api.setTempPassword(target,value);state={...state,busy:false,lastAction:'set_temp_password'};return Object.freeze({ok:true,result,state:snapshot()})}
    catch(error){state={...state,busy:false,error:error?.message||'Setting the temporary password failed.',lastAction:'set_temp_password'};throw error}
  }

  return Object.freeze({authorize,refresh,deleteUser,suspendAccount,reactivateAccount,forceSignOut,setTempPassword,getState:snapshot,clear:()=>reset('idle')});
}
