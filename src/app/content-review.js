const REVIEW_ROLES=new Set(['leader','pastor','admin']);
const PLATFORM_ROLES=new Set(['owner','admin']);
const DECISIONS=new Set(['include','exempt','remove']);
const CONTENT_TYPES=new Set(['question','statement','answer','explanation','story','reader','other']);
const ORIGINS=new Set(['quarantine','user_report','review']);
const clean=value=>String(value??'').trim();
const validCode=value=>/^[0-9A-Z]{3}$/.test(String(value||''));
const reviewError=(message,code)=>{const error=new Error(message);error.code=code;return error};
const freezeArray=rows=>Object.freeze(rows.map(row=>Object.freeze(row)));

function scopeFromMembership(row){
  const role=clean(row?.role).toLowerCase();
  if(!REVIEW_ROLES.has(role))return null;
  const id=clean(row?.congregationId);
  if(!id)return null;
  return Object.freeze({id,name:clean(row?.congregation?.name)||'Congregation',role,roleLabel:clean(row?.roleLabel)||role,source:'membership'});
}

function platformRole(row){
  const role=clean(row?.role).toLowerCase();
  return row?.active===true&&PLATFORM_ROLES.has(role)?role:'';
}

function normalizeDecision(row,congregationId){
  if(clean(row?.congregation_id)!==String(congregationId))return null;
  const contentKey=clean(row?.content_key),contentType=clean(row?.content_type),origin=clean(row?.origin),decision=clean(row?.decision);
  if(contentKey.length<3||contentKey.length>180||!CONTENT_TYPES.has(contentType)||!ORIGINS.has(origin)||!DECISIONS.has(decision))return null;
  return Object.freeze({
    congregationId:String(congregationId),contentKey,contentType,origin,decision,
    contentRef:clean(row?.content_ref),contentSnapshot:row?.content_snapshot&&typeof row.content_snapshot==='object'?row.content_snapshot:{},
    rationale:clean(row?.rationale),reviewedBy:clean(row?.reviewed_by),reviewedAt:row?.reviewed_at||null,updatedAt:row?.updated_at||null
  });
}

function normalizeReport(row,congregationId){
  if(clean(row?.congregation_id)!==String(congregationId))return null;
  const id=String(row?.id??''),contentKey=clean(row?.content_key),contentType=clean(row?.content_type),status=clean(row?.status);
  if(!id||contentKey.length<3||contentKey.length>180||!CONTENT_TYPES.has(contentType)||!['open','reviewed','closed'].includes(status))return null;
  return Object.freeze({
    id,congregationId:String(congregationId),reporterId:clean(row?.reporter_id),contentKey,contentType,
    contentSource:clean(row?.content_source),contentRef:clean(row?.content_ref),contentText:clean(row?.content_text),
    contentPayload:row?.content_payload&&typeof row.content_payload==='object'?row.content_payload:{},reason:clean(row?.reason),note:clean(row?.note),status,
    reviewedBy:clean(row?.reviewed_by),reviewedAt:row?.reviewed_at||null,createdAt:row?.created_at||null,updatedAt:row?.updated_at||null
  });
}

function normalizeMember(row){
  const userId=clean(row?.user_id);if(!userId)return null;
  return Object.freeze({userId,displayName:clean(row?.display_name)||'Congregation member',role:clean(row?.role),avatar:row?.avatar||null});
}

function normalizeBook(row){
  const code=String(row?.code||'').toUpperCase(),name=clean(row?.name),count=Number(row?.quarantinedQuestions??row?.quarantined_questions??0);
  if(!validCode(code)||!name)return null;
  return Object.freeze({code,name,quarantinedQuestions:Number.isSafeInteger(count)&&count>=0?count:0});
}

export function createContentReviewService({api,session,congregation,recall,clock=()=>new Date()}={}){
  if(!api?.platformAccess||!api?.listPlatformCongregations||!api?.loadQueue||!api?.saveDecision||!api?.markReportsReviewed||!session?.getState||!congregation?.load||!recall?.loadManifest||!recall?.loadQuarantine)throw new Error('Content Review requires shared API, Session, Congregation Membership and Recall owners.');

  const emptyState=(status='idle',error='')=>({status,scopes:Object.freeze([]),congregationId:'',congregationName:'',platformRole:'',books:Object.freeze([]),selectedBook:'',quarantine:Object.freeze([]),reports:Object.freeze([]),members:new Map(),decisions:new Map(),busy:false,error,warning:''});
  let state=emptyState(),contextUserId='',refreshRequest=0,operationRequest=0,stateGeneration=0;

  const sessionState=()=>session.getState()||{};
  const currentUserId=()=>{
    const value=sessionState();
    return value.authenticated&&value.user?.id?String(value.user.id):'';
  };
  const contextCurrent=userId=>Boolean(userId)&&contextUserId===String(userId)&&currentUserId()===String(userId);
  const staleError=()=>reviewError('The account or review context changed. Reopen Content Review before continuing.','BQ_CONTENT_REVIEW_CONTEXT_STALE');
  const syncContext=()=>{
    const userId=currentUserId();
    if(contextUserId&&contextUserId!==userId){
      refreshRequest++;
      operationRequest++;
      stateGeneration++;
      state=emptyState(userId?'idle':'signed-out');
      contextUserId=userId;
    }
    return userId;
  };
  const snapshot=()=>{
    syncContext();
    return Object.freeze({
      status:state.status,scopes:state.scopes,congregationId:state.congregationId,congregationName:state.congregationName,platformRole:state.platformRole,
      books:state.books,selectedBook:state.selectedBook,quarantine:state.quarantine,reports:state.reports,decisionCount:state.decisions.size,busy:state.busy,error:state.error,warning:state.warning
    });
  };
  const reset=(status,error='',userId=currentUserId())=>{
    state=emptyState(status,error);
    contextUserId=String(userId||'');
    return snapshot();
  };
  const operationCurrent=(userId,generation,request)=>contextCurrent(userId)&&stateGeneration===generation&&operationRequest===request;
  const requireReadyContext=()=>{
    const userId=currentUserId();
    if(contextUserId&&contextUserId!==userId)throw staleError();
    if(!userId)throw reviewError('Sign in before reviewing content.','BQ_CONTENT_REVIEW_AUTH_REQUIRED');
    if(state.status!=='ready'||!state.congregationId||contextUserId!==userId)throw reviewError('Open an authorized Content Review congregation first.','BQ_CONTENT_REVIEW_NOT_READY');
    return userId;
  };

  async function refresh(preferredCongregationId=null){
    const userId=currentUserId(),user=userId?{id:userId}:null,request=++refreshRequest;
    operationRequest++;
    stateGeneration++;
    if(!userId)return reset('signed-out','', '');
    if(contextUserId!==userId){
      state=emptyState('idle');
      contextUserId=userId;
    }
    state={...state,status:'loading',busy:true,error:''};
    try{
      const memberships=await congregation.load();
      if(request!==refreshRequest||!contextCurrent(userId))return snapshot();
      const membershipScopes=(Array.isArray(memberships)?memberships:[]).map(scopeFromMembership).filter(Boolean);
      let access=null,accessError='';
      try{
        access=await api.platformAccess(user.id);
        if(request!==refreshRequest||!contextCurrent(userId))return snapshot();
      }catch(error){
        if(request!==refreshRequest||!contextCurrent(userId))return snapshot();
        accessError=error?.message||'Platform review access could not be checked.';
      }
      const siteRole=platformRole(access);
      let platformScopes=[];
      if(siteRole){
        const rows=await api.listPlatformCongregations();
        if(request!==refreshRequest||!contextCurrent(userId))return snapshot();
        platformScopes=(Array.isArray(rows)?rows:[]).map(row=>{
          const id=clean(row?.id);if(!id)return null;
          return Object.freeze({id,name:clean(row?.name)||'Congregation',role:siteRole,roleLabel:siteRole==='owner'?'Owner':'Admin',source:'platform'});
        }).filter(Boolean);
      }else if(accessError&&!membershipScopes.length){throw reviewError(accessError,'BQ_CONTENT_REVIEW_ACCESS_UNAVAILABLE')}
      const byId=new Map();for(const row of [...membershipScopes,...platformScopes])if(!byId.has(row.id)||row.source==='platform')byId.set(row.id,row);
      const scopes=freezeArray([...byId.values()]);
      if(!scopes.length)return reset('unauthorized','',userId);
      const requested=clean(preferredCongregationId);
      if(requested&&!byId.has(requested))throw reviewError('Your account cannot review that congregation.','BQ_CONTENT_REVIEW_SCOPE_DENIED');
      const keep=state.congregationId&&byId.has(state.congregationId)?state.congregationId:'';
      const selected=byId.get(requested||keep||scopes[0].id)||scopes[0];
      const [queue,manifest]=await Promise.all([api.loadQueue(selected.id),recall.loadManifest()]);
      if(request!==refreshRequest||!contextCurrent(userId))return snapshot();
      const decisions=new Map();for(const raw of Array.isArray(queue?.decisions)?queue.decisions:[]){const row=normalizeDecision(raw,selected.id);if(row)decisions.set(row.contentKey,row)}
      const reports=[];for(const raw of Array.isArray(queue?.reports)?queue.reports:[]){const row=normalizeReport(raw,selected.id);if(row)reports.push(row)}
      const members=new Map();for(const raw of Array.isArray(queue?.members)?queue.members:[]){const row=normalizeMember(raw);if(row)members.set(row.userId,row)}
      const books=(Array.isArray(manifest?.books)?manifest.books:[]).map(normalizeBook).filter(Boolean).filter(row=>row.quarantinedQuestions!==0);
      state={status:'ready',scopes,congregationId:selected.id,congregationName:selected.name,platformRole:siteRole,books:freezeArray(books),selectedBook:'',quarantine:Object.freeze([]),reports:Object.freeze(reports),members,decisions,busy:false,error:'',warning:accessError&&membershipScopes.length?accessError:''};
      return snapshot();
    }catch(error){
      if(request!==refreshRequest||!contextCurrent(userId))return snapshot();
      state={...state,status:'error',busy:false,error:error?.message||'Content Review could not load.'};
      return snapshot();
    }
  }

  async function selectCongregation(congregationId){return refresh(congregationId)}

  async function openQuarantine(code){
    const userId=requireReadyContext();
    const normalized=String(code||'').toUpperCase();
    const book=state.books.find(row=>row.code===normalized);if(!book)throw reviewError('Choose a reviewable Recall book.','BQ_CONTENT_REVIEW_BOOK_INVALID');
    const generation=stateGeneration,request=++operationRequest,congregationId=state.congregationId;
    state={...state,busy:true,error:''};
    try{
      const rows=await recall.loadQuarantine(normalized);
      if(!operationCurrent(userId,generation,request)||state.congregationId!==congregationId)throw staleError();
      const items=[];
      for(const item of Array.isArray(rows)?rows:[]){
        const id=clean(item?.id);if(!id)continue;const contentKey=`question:${normalized}:${id}`;
        items.push(Object.freeze({id,contentKey,contentType:'question',origin:'quarantine',reference:clean(item?.reference),question:clean(item?.question),answer:clean(item?.answer),safety:item?.safety||{},decision:state.decisions.get(contentKey)||null}));
      }
      state={...state,busy:false,selectedBook:normalized,quarantine:Object.freeze(items)};return snapshot();
    }catch(error){
      if(!operationCurrent(userId,generation,request))throw staleError();
      state={...state,busy:false,error:error?.message||'Quarantine review items could not load.'};
      if(error?.code==='BQ_CONTENT_REVIEW_CONTEXT_STALE')throw error;
      return snapshot();
    }
  }

  function reportItems(){
    syncContext();
    return Object.freeze(state.reports.map(row=>Object.freeze({...row,reporter:state.members.get(row.reporterId)||null,decision:state.decisions.get(row.contentKey)||null})));
  }

  function decisionFor(contentKey){syncContext();return state.decisions.get(clean(contentKey))||null}

  function findReviewTarget(contentKey){
    const key=clean(contentKey);if(!key)return null;
    const quarantine=state.quarantine.find(row=>row.contentKey===key);if(quarantine)return quarantine;
    const report=state.reports.find(row=>row.contentKey===key);if(report)return report;
    return null;
  }

  async function decide({contentKey,decision,rationale=''}={}){
    const userId=requireReadyContext();
    const choice=clean(decision);if(!DECISIONS.has(choice))throw reviewError('Choose Include, Keep quarantined, or Remove.','BQ_CONTENT_REVIEW_DECISION_INVALID');
    const note=clean(rationale);if(note.length>1200)throw reviewError('Reviewer note must be 1,200 characters or fewer.','BQ_CONTENT_REVIEW_RATIONALE_INVALID');
    const target=findReviewTarget(contentKey);if(!target)throw reviewError('That review item is not in the current congregation queue.','BQ_CONTENT_REVIEW_ITEM_INVALID');
    const stampRaw=clock(),stamp=stampRaw instanceof Date?stampRaw:new Date(stampRaw);if(!Number.isFinite(stamp.getTime()))throw new Error('Content Review timestamp is invalid.');
    const reviewedAt=stamp.toISOString(),generation=stateGeneration,request=++operationRequest,congregationId=state.congregationId,selectedBook=state.selectedBook;
    const isQuarantine=target.origin==='quarantine';
    const contentType=isQuarantine?'question':target.contentType;
    const origin=isQuarantine?'quarantine':'user_report';
    const contentRef=isQuarantine?`${state.books.find(row=>row.code===selectedBook)?.name||selectedBook} ${target.reference}`.trim():target.contentRef;
    const contentSnapshot=isQuarantine
      ?{book_code:selectedBook,id:target.id,question:target.question,answer:target.answer,ref:target.reference,safety:target.safety||{}}
      :{text:target.contentText,ref:target.contentRef,payload:target.contentPayload||{},reason:target.reason};
    const row={congregation_id:congregationId,content_key:target.contentKey,content_type:contentType,origin,decision:choice,content_ref:contentRef||null,content_snapshot:contentSnapshot,rationale:note||null,reviewed_by:userId,reviewed_at:reviewedAt,updated_at:reviewedAt};
    state={...state,busy:true,error:''};
    let saved;
    try{
      saved=await api.saveDecision(row);
      if(!operationCurrent(userId,generation,request)||state.congregationId!==congregationId)throw staleError();
    }catch(error){
      if(!operationCurrent(userId,generation,request))throw staleError();
      state={...state,busy:false,error:error?.message||'Content decision could not be saved.'};
      throw error;
    }
    const normalized=normalizeDecision(saved||row,congregationId)||normalizeDecision(row,congregationId);
    if(normalized)state.decisions.set(normalized.contentKey,normalized);
    try{
      await api.markReportsReviewed(congregationId,target.contentKey,userId,reviewedAt);
      if(!operationCurrent(userId,generation,request)||state.congregationId!==congregationId)throw staleError();
      state={...state,busy:false,reports:Object.freeze(state.reports.map(report=>report.contentKey===target.contentKey&&report.status==='open'?Object.freeze({...report,status:'reviewed',reviewedBy:userId,reviewedAt,updatedAt:reviewedAt}):report))};
      if(isQuarantine)state={...state,quarantine:Object.freeze(state.quarantine.map(item=>item.contentKey===target.contentKey?Object.freeze({...item,decision:normalized}):item))};
      return Object.freeze({saved:true,partial:false,decision:normalized,state:snapshot()});
    }catch(error){
      if(!operationCurrent(userId,generation,request))throw staleError();
      if(error?.code==='BQ_CONTENT_REVIEW_CONTEXT_STALE')throw error;
      const partial=reviewError('The content decision was saved, but matching report status could not be updated. Refresh Content Review before retrying.','BQ_CONTENT_REVIEW_PARTIAL_SAVE');partial.cause=error;
      state={...state,busy:false,error:partial.message};throw partial;
    }
  }

  function clear(){
    refreshRequest++;
    operationRequest++;
    stateGeneration++;
    return reset('idle','',currentUserId());
  }
  return Object.freeze({refresh,selectCongregation,openQuarantine,reportItems,decisionFor,decide,getState:snapshot,clear,decisions:Object.freeze([...DECISIONS])});
}
