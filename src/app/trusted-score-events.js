export const SCORE_EVENT_ID_MAX=120;
export const SCORE_EVENT_BATCH_MAX=50;

const clean=value=>String(value??'').trim();
const scoreError=(code,message)=>{const error=new Error(message);error.code=code;return error};

export function canonicalScoreEventId(value){
  return clean(value).slice(0,SCORE_EVENT_ID_MAX);
}

function normalizeMeta(value){
  if(value==null)return Object.freeze({});
  if(typeof value!=='object'||Array.isArray(value))throw scoreError('BQ_SCORE_EVENT_INVALID','Score-event metadata must be an object.');
  try{return Object.freeze(JSON.parse(JSON.stringify(value)))}
  catch{throw scoreError('BQ_SCORE_EVENT_INVALID','Score-event metadata must be serializable.')}
}

function normalizeClaim(claim){
  if(!claim||typeof claim!=='object'||Array.isArray(claim))throw scoreError('BQ_SCORE_EVENT_INVALID','Score-event claims must be objects.');
  const sourceEventId=canonicalScoreEventId(claim.sourceEventId),source=clean(claim.source),category=clean(claim.category),targetUserId=clean(claim.targetUserId);
  if(!sourceEventId)throw scoreError('BQ_SCORE_EVENT_INVALID','A stable score-event ID is required.');
  if(!source)throw scoreError('BQ_SCORE_EVENT_INVALID','A score-event source is required.');
  const normalized={sourceEventId,source,meta:normalizeMeta(claim.meta)};
  if(category)normalized.category=category;
  if(targetUserId)normalized.targetUserId=targetUserId;
  if(claim.claimedPoints!=null){
    const claimedPoints=Number(claim.claimedPoints);
    if(!Number.isFinite(claimedPoints))throw scoreError('BQ_SCORE_EVENT_INVALID','Claimed points must be numeric when provided.');
    normalized.claimedPoints=claimedPoints;
  }
  return Object.freeze(normalized);
}

function normalizeProcessed(row,expectedIds){
  const sourceEventId=canonicalScoreEventId(row?.sourceEventId);
  if(!sourceEventId||!expectedIds.has(sourceEventId))throw scoreError('BQ_SCORE_EVENT_RESPONSE','Trusted scoring returned an unexpected event ID.');
  const accepted=row?.accepted===true,duplicate=row?.duplicate===true;
  if(accepted&&duplicate)throw scoreError('BQ_SCORE_EVENT_RESPONSE','Trusted scoring returned a contradictory result.');
  const result={sourceEventId,accepted,duplicate,reason:clean(row?.reason)};
  if(row?.points!=null){const points=Number(row.points);if(!Number.isFinite(points))throw scoreError('BQ_SCORE_EVENT_RESPONSE','Trusted scoring returned invalid points.');result.points=points}
  const category=clean(row?.category),targetUserId=clean(row?.targetUserId);
  if(category)result.category=category;
  if(targetUserId)result.targetUserId=targetUserId;
  return Object.freeze(result);
}

function normalizeResponse(data,claims){
  if(!data||!Array.isArray(data.processed))throw scoreError('BQ_SCORE_EVENT_RESPONSE','Trusted scoring did not return per-event results.');
  if(data.processed.length!==claims.length)throw scoreError('BQ_SCORE_EVENT_RESPONSE','Trusted scoring returned an incomplete result set.');
  const expectedIds=new Set(claims.map(claim=>claim.sourceEventId)),seen=new Set();
  const processed=data.processed.map(row=>{
    const normalized=normalizeProcessed(row,expectedIds);
    if(seen.has(normalized.sourceEventId))throw scoreError('BQ_SCORE_EVENT_RESPONSE','Trusted scoring returned a duplicate result row.');
    seen.add(normalized.sourceEventId);
    return normalized;
  });
  if(seen.size!==expectedIds.size)throw scoreError('BQ_SCORE_EVENT_RESPONSE','Trusted scoring did not account for every submitted event.');
  const accepted=processed.filter(row=>row.accepted).length,duplicates=processed.filter(row=>row.duplicate).length,rejected=processed.length-accepted-duplicates;
  return Object.freeze({processed:Object.freeze(processed),accepted,rejected,duplicates});
}

export function createTrustedScoreEventsService({api,session,congregation}={}){
  if(!api?.submit||!session?.getState||!congregation?.load||!congregation?.can)throw new Error('Trusted score events require API, session and congregation boundaries.');

  async function requireScope(congregationId){
    const state=session.getState(),id=clean(congregationId),userId=clean(state?.user?.id);
    if(!state?.authenticated||!userId)throw scoreError('BQ_SCORE_EVENT_AUTH_REQUIRED','Sign in before submitting score events.');
    if(state?.remoteAvailable===false)throw scoreError('BQ_SCORE_EVENT_REMOTE_DISABLED','Trusted scoring is unavailable in local preview.');
    if(!id)throw scoreError('BQ_SCORE_EVENT_SCOPE','A congregation is required for trusted scoring.');
    if(!congregation.can(id,'read'))await congregation.load();
    if(!congregation.can(id,'read'))throw scoreError('BQ_SCORE_EVENT_SCOPE','Trusted scoring is limited to your active congregation.');
    return Object.freeze({congregationId:id,userId});
  }

  async function submit(congregationId,claims){
    const scope=await requireScope(congregationId);
    if(!Array.isArray(claims)||claims.length<1||claims.length>SCORE_EVENT_BATCH_MAX)throw scoreError('BQ_SCORE_EVENT_INVALID',`Submit 1 to ${SCORE_EVENT_BATCH_MAX} score-event claims.`);
    const normalized=claims.map(normalizeClaim),ids=new Set();
    for(const claim of normalized){
      if(ids.has(claim.sourceEventId))throw scoreError('BQ_SCORE_EVENT_DUPLICATE','Duplicate score-event IDs are not allowed in one submission.');
      ids.add(claim.sourceEventId);
    }
    const data=await api.submit(scope.congregationId,normalized);
    return normalizeResponse(data,normalized);
  }

  return Object.freeze({submit,canonicalizeEventId:canonicalScoreEventId,limits:()=>Object.freeze({eventIdMax:SCORE_EVENT_ID_MAX,batchMax:SCORE_EVENT_BATCH_MAX})});
}
