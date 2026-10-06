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

function normalizeLibraryDecision(row,revisionId){
  if(clean(row?.revision_id)!==String(revisionId))return null;
  const reviewerType=clean(row?.reviewer_type),decision=clean(row?.decision);
  if(!['automated_policy','human'].includes(reviewerType))return null;
  if(!['auto_approved','needs_repair','approved','request_changes','rejected'].includes(decision))return null;
  const criteria=Array.isArray(row?.criteria)?row.criteria.filter(item=>item&&typeof item==='object').map(item=>Object.freeze({
    id:clean(item.id),result:clean(item.result),hard:item.hard===true,terminal:item.terminal===true,evaluator:clean(item.evaluator),evaluatedAt:item.evaluatedAt||item.evaluated_at||null,
    evidenceRefs:Object.freeze(Array.isArray(item.evidenceRefs)?item.evidenceRefs.map(clean).filter(Boolean):Array.isArray(item.evidence_refs)?item.evidence_refs.map(clean).filter(Boolean):[]),
    note:clean(item.note)
  })):Object.freeze([]);
  const rawSecondPass=row?.second_pass&&typeof row.second_pass==='object'&&!Array.isArray(row.second_pass)?row.second_pass:null;
  const secondPass=rawSecondPass&&Object.keys(rawSecondPass).length?Object.freeze({
    result:clean(rawSecondPass.result),revision:clean(rawSecondPass.revision),evaluator:clean(rawSecondPass.evaluator),
    evaluatedAt:rawSecondPass.evaluatedAt||rawSecondPass.evaluated_at||null,
    evidenceRefs:Object.freeze(Array.isArray(rawSecondPass.evidenceRefs)?rawSecondPass.evidenceRefs.map(clean).filter(Boolean):Array.isArray(rawSecondPass.evidence_refs)?rawSecondPass.evidence_refs.map(clean).filter(Boolean):[]),
    note:clean(rawSecondPass.note)
  }):null;
  return Object.freeze({
    id:String(row?.id??''),itemId:clean(row?.item_id),revisionId:String(revisionId),contentType:clean(row?.content_type),reviewerType,decision,
    policyId:clean(row?.policy_id),policyVersion:clean(row?.policy_version),reviewerId:clean(row?.reviewer_id),
    criteria:Object.freeze(criteria),secondPass,evidenceRefs:Object.freeze(Array.isArray(row?.evidence_refs)?row.evidence_refs.map(clean).filter(Boolean):[]),
    note:clean(row?.note),decidedAt:row?.decided_at||null,createdAt:row?.created_at||null
  });
}

function normalizeLibraryQueue(payload){
  const rows=payload&&typeof payload==='object'?payload:{};
  const revisions=new Map((Array.isArray(rows.revisions)?rows.revisions:[]).map(row=>[String(row?.id||''),row]));
  const translationsByRevision=new Map();
  for(const row of Array.isArray(rows.translations)?rows.translations:[]){
    const revisionId=String(row?.revision_id||'');if(!revisionId)continue;
    const bucket=translationsByRevision.get(revisionId)||[];
    bucket.push(Object.freeze({
      locale:clean(row?.locale),title:clean(row?.title),summary:clean(row?.summary),body:row?.body??{},translator:clean(row?.translator),
      reviewStatus:clean(row?.review_status),reviewerId:clean(row?.reviewer_id),reviewedAt:row?.reviewed_at||null
    }));
    translationsByRevision.set(revisionId,bucket);
  }
  const taxonomyById=new Map((Array.isArray(rows.taxonomy)?rows.taxonomy:[]).map(row=>[clean(row?.id),row]));
  const taxonomyByRevision=new Map();
  for(const row of Array.isArray(rows.taxonomyLinks)?rows.taxonomyLinks:[]){
    const revisionId=String(row?.revision_id||''),taxonomy=taxonomyById.get(clean(row?.taxonomy_id));if(!revisionId||!taxonomy)continue;
    const bucket=taxonomyByRevision.get(revisionId)||[];
    bucket.push(Object.freeze({id:clean(taxonomy.id),kind:clean(taxonomy.kind),labels:taxonomy.labels&&typeof taxonomy.labels==='object'?taxonomy.labels:{},order:Number(row?.display_order)||0}));
    taxonomyByRevision.set(revisionId,bucket);
  }
  const decisionsByRevision=new Map();
  for(const raw of Array.isArray(rows.decisions)?rows.decisions:[]){
    const revisionId=String(raw?.revision_id||'');if(!revisionId)continue;
    const decision=normalizeLibraryDecision(raw,revisionId);if(!decision)continue;
    const bucket=decisionsByRevision.get(revisionId)||[];bucket.push(decision);decisionsByRevision.set(revisionId,bucket);
  }
  const items=[];
  for(const row of Array.isArray(rows.items)?rows.items:[]){
    const revisionId=String(row?.current_revision_id||''),revision=revisions.get(revisionId);if(!revision)continue;
    const contentType=clean(row?.content_type);if(!['book','devotional','past_teaching'].includes(contentType))continue;
    const history=(decisionsByRevision.get(revisionId)||[]).sort((a,b)=>String(b.decidedAt||'').localeCompare(String(a.decidedAt||'')));
    items.push(Object.freeze({
      itemId:String(row.id),revisionId,contentType,congregationId:clean(row?.congregation_id),publicationState:clean(row?.publication_state),
      revisionNumber:Number(revision?.revision_number)||0,sourceLocale:clean(revision?.source_locale),title:clean(revision?.title),summary:clean(revision?.summary),body:revision?.body??{},
      revisionPublicationState:clean(revision?.publication_state),reviewStatus:clean(revision?.review_status),reviewerType:clean(revision?.reviewer_type),
      reviewedAt:revision?.reviewed_at||null,policyId:clean(revision?.review_policy_id),policyVersion:clean(revision?.review_policy_version),reviewEvidence:revision?.review_evidence&&typeof revision.review_evidence==='object'?revision.review_evidence:{},
      source:Object.freeze({kind:clean(revision?.source_kind),title:clean(revision?.source_title),uri:clean(revision?.source_uri),catalogId:clean(revision?.source_catalog_id),revision:clean(revision?.source_revision),date:revision?.source_date||null,checksum:clean(revision?.source_checksum),creator:clean(revision?.creator),organization:clean(revision?.originating_organization)}),
      rights:Object.freeze({status:clean(revision?.rights_status),holder:clean(revision?.rights_holder),basis:clean(revision?.rights_basis),attribution:clean(revision?.attribution),allowedUses:Object.freeze(Array.isArray(revision?.allowed_uses)?revision.allowed_uses.map(clean).filter(Boolean):[])}),
      translations:Object.freeze(translationsByRevision.get(revisionId)||[]),taxonomy:Object.freeze((taxonomyByRevision.get(revisionId)||[]).sort((a,b)=>a.order-b.order)),history:Object.freeze(history),latestDecision:history[0]||null
    }));
  }
  return Object.freeze(items);
}

export function createContentReviewService({api,session,congregation,recall,clock=()=>new Date()}={}){
  if(!api?.platformAccess||!api?.listPlatformCongregations||!api?.loadQueue||!api?.saveDecision||!api?.markReportsReviewed||!session?.getState||!congregation?.load||!recall?.loadManifest||!recall?.loadQuarantine)throw new Error('Content Review requires shared API, Session, Congregation Membership and Recall owners.');
  const loadLibraryQueue=typeof api.loadLibraryQueue==='function'?()=>api.loadLibraryQueue():async()=>({items:[],revisions:[],translations:[],taxonomyLinks:[],taxonomy:[],decisions:[]});
  const saveLibraryHumanDecision=typeof api.saveLibraryHumanDecision==='function'?row=>api.saveLibraryHumanDecision(row):null;

  const emptyState=(status='idle',error='')=>({status,scopes:Object.freeze([]),congregationId:'',congregationName:'',platformRole:'',books:Object.freeze([]),selectedBook:'',quarantine:Object.freeze([]),reports:Object.freeze([]),members:new Map(),decisions:new Map(),libraryItems:Object.freeze([]),busy:false,error,warning:''});
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
      books:state.books,selectedBook:state.selectedBook,quarantine:state.quarantine,reports:state.reports,decisionCount:state.decisions.size,libraryItems:state.libraryItems,busy:state.busy,error:state.error,warning:state.warning
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
      if(!scopes.length&&!siteRole)return reset('unauthorized','',userId);
      const libraryItems=normalizeLibraryQueue(await loadLibraryQueue());
      if(request!==refreshRequest||!contextCurrent(userId))return snapshot();
      const requested=clean(preferredCongregationId);
      if(requested&&!byId.has(requested))throw reviewError('Your account cannot review that congregation.','BQ_CONTENT_REVIEW_SCOPE_DENIED');
      const keep=state.congregationId&&byId.has(state.congregationId)?state.congregationId:'';
      const selected=byId.get(requested||keep||clean(congregation.getActive?.()?.congregationId));
      if(!selected){
        state={...emptyState('ready'),scopes,platformRole:siteRole,libraryItems,warning:accessError&&membershipScopes.length?accessError:''};
        return snapshot();
      }
      const [queue,manifest]=await Promise.all([api.loadQueue(selected.id),recall.loadManifest()]);
      if(request!==refreshRequest||!contextCurrent(userId))return snapshot();
      const decisions=new Map();for(const raw of Array.isArray(queue?.decisions)?queue.decisions:[]){const row=normalizeDecision(raw,selected.id);if(row)decisions.set(row.contentKey,row)}
      const reports=[];for(const raw of Array.isArray(queue?.reports)?queue.reports:[]){const row=normalizeReport(raw,selected.id);if(row)reports.push(row)}
      const members=new Map();for(const raw of Array.isArray(queue?.members)?queue.members:[]){const row=normalizeMember(raw);if(row)members.set(row.userId,row)}
      const books=(Array.isArray(manifest?.books)?manifest.books:[]).map(normalizeBook).filter(Boolean).filter(row=>row.quarantinedQuestions!==0);
      state={status:'ready',scopes,congregationId:selected.id,congregationName:selected.name,platformRole:siteRole,books:freezeArray(books),selectedBook:'',quarantine:Object.freeze([]),reports:Object.freeze(reports),members,decisions,libraryItems,busy:false,error:'',warning:accessError&&membershipScopes.length?accessError:''};
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
  function libraryReviewItems(contentType=''){
    syncContext();
    const type=clean(contentType);
    return Object.freeze(state.libraryItems.filter(item=>!type||item.contentType===type));
  }

  function findLibraryTarget(revisionId){
    const id=String(revisionId||'');
    return state.libraryItems.find(item=>item.revisionId===id)||null;
  }

  async function decideLibrary({revisionId,decision,rationale=''}={}){
    const userId=currentUserId();
    if(!saveLibraryHumanDecision)throw reviewError('Library audit writes are unavailable in this runtime.','BQ_LIBRARY_REVIEW_UNAVAILABLE');
    if(!userId)throw reviewError('Sign in before reviewing Library content.','BQ_LIBRARY_REVIEW_AUTH_REQUIRED');
    if(state.status!=='ready'||contextUserId!==userId)throw reviewError('Open Content Review before reviewing Library content.','BQ_LIBRARY_REVIEW_NOT_READY');
    const choice=clean(decision);
    if(!['approved','request_changes','rejected'].includes(choice))throw reviewError('Choose Approve, Request Changes, or Reject.','BQ_LIBRARY_REVIEW_DECISION_INVALID');
    const note=clean(rationale);
    if(note.length>4000)throw reviewError('Reviewer note must be 4,000 characters or fewer.','BQ_LIBRARY_REVIEW_RATIONALE_INVALID');
    const target=findLibraryTarget(revisionId);
    if(!target)throw reviewError('That Library revision is not in your authorized review queue.','BQ_LIBRARY_REVIEW_ITEM_INVALID');
    const stampRaw=clock(),stamp=stampRaw instanceof Date?stampRaw:new Date(stampRaw);if(!Number.isFinite(stamp.getTime()))throw new Error('Library review timestamp is invalid.');
    const decidedAt=stamp.toISOString(),generation=stateGeneration,request=++operationRequest;
    state={...state,busy:true,error:''};
    try{
      const saved=await saveLibraryHumanDecision({
        item_id:target.itemId,revision_id:target.revisionId,content_type:target.contentType,reviewer_type:'human',decision:choice,
        policy_id:null,policy_version:null,reviewer_id:userId,criteria:[],evidence_refs:[],note:note||null,decided_at:decidedAt
      });
      if(!operationCurrent(userId,generation,request))throw staleError();
      const normalized=normalizeLibraryDecision(saved||{},target.revisionId);
      if(!normalized)throw reviewError('Saved Library review decision could not be verified.','BQ_LIBRARY_REVIEW_RESPONSE_INVALID');
      state={...state,busy:false,libraryItems:Object.freeze(state.libraryItems.map(item=>{
        if(item.revisionId!==target.revisionId)return item;
        const history=Object.freeze([normalized,...item.history.filter(row=>row.id!==normalized.id)]);
        return Object.freeze({...item,history,latestDecision:history[0]});
      }))};
      return Object.freeze({saved:true,decision:normalized,state:snapshot()});
    }catch(error){
      if(!operationCurrent(userId,generation,request))throw staleError();
      state={...state,busy:false,error:error?.message||'Library review decision could not be saved.'};
      throw error;
    }
  }

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
    const row={content_key:target.contentKey,content_type:contentType,origin,decision:choice,content_ref:contentRef||null,content_snapshot:contentSnapshot,rationale:note||null,reviewed_by:userId,reviewed_at:reviewedAt,updated_at:reviewedAt};
    state={...state,busy:true,error:''};
    let saved;
    try{
      saved=await api.saveDecision(congregationId,row);
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
  return Object.freeze({refresh,selectCongregation,openQuarantine,reportItems,decisionFor,libraryReviewItems,decideLibrary,decide,getState:snapshot,clear,decisions:Object.freeze([...DECISIONS])});
}
