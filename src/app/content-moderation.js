const DECISIONS=new Set(['include','exempt','remove']);
const ORIGINS=new Set(['quarantine','user_report','review']);
const CONTENT_TYPES=new Set(['question','statement','answer','explanation','story','reader','other']);
const validCode=value=>/^[0-9A-Z]{3}$/.test(String(value||''));
const clean=value=>String(value??'').trim();
const policyError=(message,code)=>{const error=new Error(message);error.code=code;return error};

export const coreContentKey=id=>`question:core:${clean(id)}`;
export const recallContentKey=(code,id)=>`question:${String(code||'').toUpperCase()}:${clean(id)}`;

function normalizeDecision(row,congregationId){
  if(String(row?.congregation_id||'')!==String(congregationId))return null;
  const contentKey=clean(row?.content_key),contentType=clean(row?.content_type),origin=clean(row?.origin),decision=clean(row?.decision);
  if(!contentKey||contentKey.length>180||!CONTENT_TYPES.has(contentType)||!ORIGINS.has(origin)||!DECISIONS.has(decision))return null;
  return Object.freeze({
    congregationId:String(congregationId),
    contentKey,
    contentType,
    origin,
    decision,
    updatedAt:row?.updated_at||null
  });
}

function freezeScopes(rows){
  return Object.freeze(rows.map(row=>Object.freeze({
    id:String(row?.congregationId||''),
    name:clean(row?.congregation?.name)||'Congregation',
    role:row?.role||null,
    roleLabel:clean(row?.roleLabel)||'Member'
  })).filter(row=>row.id));
}

function restoredRecallItem(item){
  const safety=item?.safety&&typeof item.safety==='object'?item.safety:{};
  return Object.freeze({
    ...item,
    safety:Object.freeze({...safety,originalAction:safety.action||'quarantine',action:'allow',moderationOverride:'include'})
  });
}

export function createContentModerationService({api,session,congregation}={}){
  if(!api?.list||!session?.getState||!congregation?.load)throw new Error('Content Moderation requires shared API, Session, and Congregation Membership owners.');
  let state={status:'idle',congregationId:'',congregationName:'',scopes:Object.freeze([]),decisions:new Map(),loadedAt:null,error:''};

  const snapshot=()=>Object.freeze({
    status:state.status,
    congregationId:state.congregationId,
    congregationName:state.congregationName,
    scopes:state.scopes,
    decisionCount:state.decisions.size,
    loadedAt:state.loadedAt,
    stale:state.status==='stale',
    error:state.error
  });
  const sessionState=()=>session.getState()||{};
  const clear=(status='inactive')=>{
    state={status,congregationId:'',congregationName:'',scopes:Object.freeze([]),decisions:new Map(),loadedAt:null,error:''};
    return snapshot();
  };

  async function refresh(preferredCongregationId=null){
    const account=sessionState();
    if(!account.authenticated||!account.user?.id)return clear('inactive');
    if(account.remoteAvailable===false)return clear('local-preview');

    const memberships=await congregation.load();
    const scopes=freezeScopes(Array.isArray(memberships)?memberships:[]);
    if(!scopes.length)return clear('no-membership');

    const requested=clean(preferredCongregationId);
    if(requested&&!scopes.some(row=>row.id===requested))throw policyError('Choose one of your current congregations for content policy.','BQ_CONTENT_MODERATION_SCOPE_DENIED');
    const currentStillValid=state.congregationId&&scopes.some(row=>row.id===state.congregationId);
    const selected=scopes.find(row=>row.id===(requested||(currentStillValid?state.congregationId:scopes[0].id)))||scopes[0];
    const previous=selected.id===state.congregationId?new Map(state.decisions):new Map();

    try{
      const rows=await api.list(selected.id);
      const decisions=new Map();
      for(const raw of Array.isArray(rows)?rows:[]){
        const row=normalizeDecision(raw,selected.id);
        if(row)decisions.set(row.contentKey,row);
      }
      state={status:'ready',congregationId:selected.id,congregationName:selected.name,scopes,decisions,loadedAt:new Date().toISOString(),error:''};
      return snapshot();
    }catch(error){
      state={status:previous.size?'stale':'unavailable',congregationId:selected.id,congregationName:selected.name,scopes,decisions:previous,loadedAt:state.loadedAt,error:error?.message||'Content policy could not be refreshed.'};
      return snapshot();
    }
  }

  const select=congregationId=>refresh(congregationId);
  const decisionFor=contentKey=>state.decisions.get(clean(contentKey))||null;
  const decisionValue=contentKey=>decisionFor(contentKey)?.decision||'';

  function applyCore(rows){
    const source=Array.isArray(rows)?rows:[];
    return Object.freeze(source.filter(item=>{
      const id=clean(item?.id);
      if(!id)return false;
      const decision=decisionValue(coreContentKey(id));
      return decision!=='exempt'&&decision!=='remove';
    }));
  }

  function applyRecall(code,approvedRows,quarantinedRows=[]){
    const normalized=String(code||'').toUpperCase();
    if(!validCode(normalized))throw policyError('Choose a valid Recall book for content policy.','BQ_CONTENT_MODERATION_CODE_INVALID');
    const approved=Array.isArray(approvedRows)?approvedRows:[],quarantined=Array.isArray(quarantinedRows)?quarantinedRows:[];
    const next=[],seen=new Set();
    for(const item of approved){
      const id=clean(item?.id);if(!id||seen.has(id))continue;
      const decision=decisionValue(recallContentKey(normalized,id));
      if(decision==='exempt'||decision==='remove')continue;
      seen.add(id);next.push(item);
    }
    for(const item of quarantined){
      const id=clean(item?.id);if(!id||seen.has(id))continue;
      if(decisionValue(recallContentKey(normalized,id))!=='include')continue;
      seen.add(id);next.push(restoredRecallItem(item));
    }
    return Object.freeze(next);
  }

  function clear(){return clearState()}
  function clearState(){
    state={status:'idle',congregationId:'',congregationName:'',scopes:Object.freeze([]),decisions:new Map(),loadedAt:null,error:''};
    return snapshot();
  }

  return Object.freeze({refresh,select,snapshot,decisionFor,applyCore,applyRecall,clear:clearState});
}
