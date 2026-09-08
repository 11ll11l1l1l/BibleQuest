const PAIR_CODE=/^[A-Z0-9]{8}$/;
const SHARED_TYPES=new Set(['journey','commitment','challenge']);
const MAX_COMMITMENT=800;

const cleanText=(value,max=MAX_COMMITMENT)=>String(value??'').replace(/\r\n?/g,'\n').trim().slice(0,max);
const iso=value=>{const date=new Date(value);if(!Number.isFinite(date.getTime()))throw new Error('Couples cloud received an invalid timestamp.');return date.toISOString()};

function cloudError(message,code){const error=new Error(message);error.code=code;return error}
function normalizePair(row,userId){
  if(!row)return null;
  const id=String(row.id||''),userA=String(row.user_a||''),userB=row.user_b?String(row.user_b):null,status=String(row.status||'');
  if(!id||!userA||!['pending','active','ended'].includes(status))throw cloudError('Couples cloud received malformed pair data.','BQ_COUPLES_CLOUD_MALFORMED');
  if(userA!==userId&&userB!==userId)throw cloudError('Couples cloud returned a pair that does not belong to this account.','BQ_COUPLES_CLOUD_PERMISSION');
  return Object.freeze({id,userA,userB,status,createdAt:row.created_at?iso(row.created_at):null,updatedAt:row.updated_at?iso(row.updated_at):null});
}
function normalizeShared(row,pairId){
  const id=String(row?.id||''),remotePair=String(row?.pair_id||''),authorId=String(row?.author_id||''),itemType=String(row?.item_type||''),body=cleanText(row?.body,2000);
  if(!id||remotePair!==pairId||!authorId||!SHARED_TYPES.has(itemType)||!body)throw cloudError('Couples cloud received malformed shared history.','BQ_COUPLES_CLOUD_MALFORMED');
  return Object.freeze({id,pairId:remotePair,authorId,itemType,body,dueOn:row.due_on?String(row.due_on):null,completedAt:row.completed_at?iso(row.completed_at):null,createdAt:iso(row.created_at),updatedAt:row.updated_at?iso(row.updated_at):iso(row.created_at)});
}

export function createCouplesCloudService({api,session}){
  if(!api||!session)throw new Error('Couples cloud requires shared API and session owners.');
  let pair=null,shared=[],inviteCode='';
  const sessionState=()=>session.getState?.()||{};
  const identity=()=>{const state=sessionState();if(!state.authenticated||!state.user?.id)throw cloudError('Sign in to link Couple Journey accounts.','BQ_COUPLES_CLOUD_AUTH_REQUIRED');if(state.remoteAvailable===false)throw cloudError('Couples cloud is unavailable in local preview.','BQ_COUPLES_CLOUD_REMOTE_DISABLED');return String(state.user.id)};
  const snapshot=()=>Object.freeze({authenticated:sessionState().authenticated===true,remoteAvailable:sessionState().remoteAvailable!==false,pair,shared:shared.slice(),inviteCode});
  const acceptPair=(row,userId)=>{pair=normalizePair(row,userId);if(!pair||pair.status!=='pending')inviteCode='';if(!pair||pair.status!=='active')shared=[];return pair};
  async function load(){const userId=identity(),result=await api.status();acceptPair(result?.pair||null,userId);if(pair?.status==='active')await refreshShared();return snapshot()}
  async function createPair(){const userId=identity(),result=await api.create();acceptPair(result?.pair||null,userId);inviteCode=cleanText(result?.inviteCode||'',16).toUpperCase();if(pair?.status==='pending'&&!PAIR_CODE.test(inviteCode))throw cloudError('Couples cloud did not return a valid 8-character pair code.','BQ_COUPLES_CLOUD_MALFORMED');if(pair?.status==='active')await refreshShared();return snapshot()}
  async function join(rawCode){const userId=identity(),code=cleanText(rawCode,32).replace(/\s+/g,'').toUpperCase();if(!PAIR_CODE.test(code))throw cloudError('Enter the 8-character couple pair code.','BQ_COUPLES_CLOUD_CODE');const result=await api.join(code);acceptPair(result?.pair||null,userId);if(pair?.status!=='active')throw cloudError('Couple accounts were not activated after joining.','BQ_COUPLES_CLOUD_MALFORMED');await refreshShared();return snapshot()}
  async function refreshShared(){identity();if(!pair||pair.status!=='active'){shared=[];return []}shared=(await api.listShared(pair.id)).map(row=>normalizeShared(row,pair.id)).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)||a.id.localeCompare(b.id));return shared.slice()}
  async function completeJourney(step,title,commitment=''){const userId=identity();if(!pair||pair.status!=='active')throw cloudError('Link both Couple Journey accounts before saving shared progress.','BQ_COUPLES_CLOUD_PAIR_REQUIRED');const n=Number(step),label=cleanText(title,120),note=cleanText(commitment,MAX_COMMITMENT);if(!Number.isInteger(n)||n<1||n>7||!label)throw new Error('Choose a valid Couple Journey step.');const key=`${n}|${label}`,already=shared.some(item=>item.itemType==='journey'&&item.body===key),rows=[];if(!already)rows.push({pair_id:pair.id,author_id:userId,item_type:'journey',body:key});if(note)rows.push({pair_id:pair.id,author_id:userId,item_type:'commitment',body:note});if(rows.length)await api.addShared(rows);await refreshShared();return snapshot()}
  async function leave(){identity();if(!pair?.id)throw cloudError('No Couple Journey pair is linked.','BQ_COUPLES_CLOUD_PAIR_REQUIRED');await api.leave(pair.id);pair=null;shared=[];inviteCode='';return snapshot()}
  function clear(){pair=null;shared=[];inviteCode=''}
  return Object.freeze({snapshot,load,createPair,join,refreshShared,completeJourney,leave,clear});
}
