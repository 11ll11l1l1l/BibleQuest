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
  let pair=null,shared=[],inviteCode='',contextUserId='';
  let contextGeneration=0,operationRequest=0;
  const sessionState=()=>session.getState?.()||{};
  const currentUserId=()=>{const state=sessionState();return state.authenticated&&state.user?.id?String(state.user.id):''};
  const clearState=(userId='')=>{pair=null;shared=[];inviteCode='';contextUserId=String(userId||'');contextGeneration++;operationRequest++};
  const identity=()=>{
    const state=sessionState();
    if(!state.authenticated||!state.user?.id)throw cloudError('Sign in to link Couple Journey accounts.','BQ_COUPLES_CLOUD_AUTH_REQUIRED');
    if(state.remoteAvailable===false)throw cloudError('Couples cloud is unavailable in local preview.','BQ_COUPLES_CLOUD_REMOTE_DISABLED');
    const userId=String(state.user.id);
    if(contextUserId!==userId)clearState(userId);
    return userId;
  };
  const account=()=>{const userId=identity();if(contextUserId!==userId){pair=null;shared=[];inviteCode='';contextUserId=userId}return userId};
  const beginOperation=()=>{
    const userId=account();
    return Object.freeze({userId,generation:contextGeneration,request:++operationRequest});
  };
  const assertOperation=ctx=>{
    if(!ctx||currentUserId()!==ctx.userId||contextUserId!==ctx.userId||contextGeneration!==ctx.generation||operationRequest!==ctx.request){
      throw cloudError('The account changed. Reload Couple Journey cloud before continuing.','BQ_COUPLES_CLOUD_CONTEXT_STALE');
    }
  };
  const snapshot=()=>{
    const state=sessionState(),userId=state.authenticated&&state.user?.id?String(state.user.id):'';
    const visible=Boolean(userId&&state.remoteAvailable!==false&&contextUserId===userId);
    return Object.freeze({
      authenticated:state.authenticated===true,
      remoteAvailable:state.remoteAvailable!==false,
      pair:visible?pair:null,
      shared:visible?shared.slice():[],
      inviteCode:visible?inviteCode:''
    });
  };
  const acceptPair=(row,userId)=>{
    pair=normalizePair(row,userId);
    if(!pair||pair.status!=='pending')inviteCode='';
    if(!pair||pair.status!=='active')shared=[];
    return pair;
  };
  async function refreshSharedFor(ctx){
    assertOperation(ctx);
    if(!pair||pair.status!=='active'){shared=[];return []}
    const pairId=pair.id;
    const rows=await api.listShared(pairId);
    assertOperation(ctx);
    if(!pair||pair.id!==pairId||pair.status!=='active')throw cloudError('Couple Journey cloud context changed. Reload before continuing.','BQ_COUPLES_CLOUD_CONTEXT_STALE');
    shared=rows.map(row=>normalizeShared(row,pairId)).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)||a.id.localeCompare(b.id));
    return shared.slice();
  }
  async function load(){
    const ctx=beginOperation(),result=await api.status();
    assertOperation(ctx);
    acceptPair(result?.pair||null,ctx.userId);
    if(pair?.status==='active')await refreshSharedFor(ctx);
    return snapshot();
  }
  async function createPair(){
    const ctx=beginOperation(),result=await api.create();
    assertOperation(ctx);
    acceptPair(result?.pair||null,ctx.userId);
    inviteCode=cleanText(result?.inviteCode||'',16).toUpperCase();
    if(pair?.status==='pending'&&!PAIR_CODE.test(inviteCode))throw cloudError('Couples cloud did not return a valid 8-character pair code.','BQ_COUPLES_CLOUD_MALFORMED');
    if(pair?.status==='active')await refreshSharedFor(ctx);
    return snapshot();
  }
  async function join(rawCode){
    const code=cleanText(rawCode,32).replace(/\s+/g,'').toUpperCase();
    if(!PAIR_CODE.test(code))throw cloudError('Enter the 8-character couple pair code.','BQ_COUPLES_CLOUD_CODE');
    const ctx=beginOperation(),result=await api.join(code);
    assertOperation(ctx);
    acceptPair(result?.pair||null,ctx.userId);
    if(pair?.status!=='active')throw cloudError('Couple accounts were not activated after joining.','BQ_COUPLES_CLOUD_MALFORMED');
    await refreshSharedFor(ctx);
    return snapshot();
  }
  async function refreshShared(){
    const ctx=beginOperation();
    await refreshSharedFor(ctx);
    return shared.slice();
  }
  async function completeJourney(step,title,commitment=''){
    const ctx=beginOperation();
    if(!pair||pair.status!=='active')throw cloudError('Link both Couple Journey accounts before saving shared progress.','BQ_COUPLES_CLOUD_PAIR_REQUIRED');
    const n=Number(step),label=cleanText(title,120),note=cleanText(commitment,MAX_COMMITMENT);
    if(!Number.isInteger(n)||n<1||n>7||!label)throw new Error('Choose a valid Couple Journey step.');
    const key=`${n}|${label}`,already=shared.some(item=>item.itemType==='journey'&&item.body===key),rows=[];
    if(!already)rows.push({pair_id:pair.id,author_id:ctx.userId,item_type:'journey',body:key});
    if(note)rows.push({pair_id:pair.id,author_id:ctx.userId,item_type:'commitment',body:note});
    assertOperation(ctx);
    if(rows.length){
      await api.addShared(rows);
      assertOperation(ctx);
    }
    await refreshSharedFor(ctx);
    return snapshot();
  }
  async function leave(){
    const ctx=beginOperation();
    if(!pair?.id)throw cloudError('No Couple Journey pair is linked.','BQ_COUPLES_CLOUD_PAIR_REQUIRED');
    const pairId=pair.id;
    await api.leave(pairId);
    assertOperation(ctx);
    if(!pair||pair.id!==pairId)throw cloudError('Couple Journey cloud context changed. Reload before continuing.','BQ_COUPLES_CLOUD_CONTEXT_STALE');
    pair=null;shared=[];inviteCode='';
    return snapshot();
  }
  function clear(){pair=null;shared=[];inviteCode='';contextUserId=''}
  return Object.freeze({snapshot,load,createPair,join,refreshShared,completeJourney,leave,clear});
}
