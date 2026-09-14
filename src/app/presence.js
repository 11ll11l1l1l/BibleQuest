export const PRESENCE_HEARTBEAT_MS=60000;
export const PRESENCE_STALE_MS=150000;
export const PRESENCE_CLOCK_SKEW_MS=30000;
const SURFACE='BibleQuest';

const clean=value=>String(value??'').trim();
const freezeList=rows=>Object.freeze(rows.map(row=>Object.freeze(row)));

export function isPresenceOnline(row,now=Date.now(),staleMs=PRESENCE_STALE_MS){
  const seenAt=Date.parse(row?.lastSeenAt??row?.last_seen_at??'');
  const current=Number(now),limit=Number(staleMs);
  if(!Number.isFinite(seenAt)||!Number.isFinite(current)||!Number.isFinite(limit)||limit<=0)return false;
  const age=current-seenAt;
  return age>=-PRESENCE_CLOCK_SKEW_MS&&age<=limit;
}

function normalizeRow(row,congregationId,now,staleMs){
  const expected=clean(congregationId),actual=clean(row?.congregation_id),userId=clean(row?.user_id),lastSeenAt=clean(row?.last_seen_at),surface=clean(row?.surface)||SURFACE;
  if(!expected||actual!==expected||!userId||!Number.isFinite(Date.parse(lastSeenAt))){
    const error=new Error('Presence received malformed or out-of-scope data.');
    error.code='BQ_PRESENCE_SCOPE';
    throw error;
  }
  return Object.freeze({congregationId:actual,userId,lastSeenAt,surface,online:isPresenceOnline({lastSeenAt},now,staleMs)});
}

function baseState(sessionState,status,error=''){
  return Object.freeze({
    status,
    authenticated:sessionState?.authenticated===true,
    remoteAvailable:sessionState?.remoteAvailable!==false,
    userId:clean(sessionState?.user?.id),
    congregationIds:Object.freeze([]),
    lastHeartbeatAt:null,
    error:clean(error)
  });
}

export function createPresenceService({
  api,
  session,
  congregation,
  store,
  clock=()=>Date.now(),
  heartbeatMs=PRESENCE_HEARTBEAT_MS,
  staleMs=PRESENCE_STALE_MS,
  setIntervalFn=(fn,ms)=>setInterval(fn,ms),
  clearIntervalFn=id=>clearInterval(id)
}={}){
  if(!api?.touch||!api?.list||!api?.leave||!api?.activeCount||!session||!congregation||!store)throw new Error('Presence requires API, session, congregation and store boundaries.');
  if(typeof congregation.getActive!=='function')throw new Error('Presence requires the active congregation boundary.');
  if(!Number.isFinite(heartbeatMs)||heartbeatMs<=0||!Number.isFinite(staleMs)||staleMs<=heartbeatMs)throw new Error('Presence timing requires a positive heartbeat and a longer stale timeout.');

  let state=baseState(session.getState?.()||{},'idle');
  let timer=null,unsubscribeStore=null,unsubscribeBeforeSignOut=null,started=false,generation=0,sessionSignature='';
  let activeCongregationIds=[];
  const cache=new Map();

  const publish=patch=>{
    state=Object.freeze({...state,...patch,congregationIds:Object.freeze([...(patch.congregationIds??state.congregationIds??[])])});
    store.setState(current=>({...current,presence:state}));
    return state;
  };
  const stopTimer=()=>{if(timer!==null){clearIntervalFn(timer);timer=null}};
  const clearRuntime=()=>{stopTimer();activeCongregationIds=[];cache.clear()};
  const signature=value=>`${value?.authenticated===true?'1':'0'}:${value?.remoteAvailable===false?'0':'1'}:${clean(value?.user?.id)}`;

  function unavailable(sessionState){
    clearRuntime();
    const status=sessionState?.authenticated===true?(sessionState?.remoteAvailable===false?'local-preview':'unavailable'):'signed-out';
    state=baseState(sessionState,status);
    publish(state);
    return state;
  }

  async function activeCongregationFor(userId){
    let membership=congregation.getActive();
    if(!membership){
      await congregation.load();
      membership=congregation.getActive();
    }
    const id=clean(membership?.congregationId);
    if(!id||clean(membership?.userId)!==userId||!congregation.can(id,'read'))return '';
    return id;
  }

  async function removePriorPresence(nextId,userId){
    const staleIds=[...new Set(activeCongregationIds)].filter(id=>id&&id!==nextId);
    if(!staleIds.length)return [];
    const results=await Promise.allSettled(staleIds.map(id=>api.leave(id,userId)));
    const failed=results.find(result=>result.status==='rejected');
    if(failed)throw failed.reason;
    staleIds.forEach(id=>cache.delete(id));
    return results;
  }

  async function heartbeat(expectedGeneration=generation){
    const sessionState=session.getState();
    const userId=clean(sessionState?.user?.id);
    if(!started||!sessionState?.authenticated||sessionState?.remoteAvailable===false||!userId)return unavailable(sessionState);
    const id=await activeCongregationFor(userId);
    if(expectedGeneration!==generation)return state;
    await removePriorPresence(id,userId);
    if(expectedGeneration!==generation)return state;
    if(!id){
      stopTimer();activeCongregationIds=[];cache.clear();
      return publish({status:'no-congregation',authenticated:true,remoteAvailable:true,userId,congregationIds:[],lastHeartbeatAt:null,error:''});
    }
    await api.touch(id,userId,SURFACE);
    if(expectedGeneration!==generation)return state;
    activeCongregationIds=[id];
    const heartbeatAt=new Date(clock()).toISOString();
    publish({status:'online',authenticated:true,remoteAvailable:true,userId,congregationIds:[id],lastHeartbeatAt:heartbeatAt,error:''});
    if(timer===null)timer=setIntervalFn(()=>{heartbeat(generation).catch(error=>publish({status:'degraded',error:error?.message||'Presence heartbeat failed.'}))},heartbeatMs);
    return state;
  }

  async function reconcile(){
    const token=++generation;
    stopTimer();
    const sessionState=session.getState();
    if(!sessionState?.authenticated||sessionState?.remoteAvailable===false||!sessionState?.user?.id)return unavailable(sessionState);
    try{return await heartbeat(token)}
    catch(error){
      if(token!==generation)return state;
      clearRuntime();
      return publish({status:'degraded',authenticated:true,remoteAvailable:true,userId:clean(sessionState.user.id),congregationIds:[],lastHeartbeatAt:null,error:error?.message||'Presence is unavailable.'});
    }
  }

  async function start(){
    if(started)return state;
    started=true;
    sessionSignature=signature(session.getState());
    unsubscribeStore=store.subscribe(next=>{
      const nextSignature=signature(next?.session||session.getState());
      if(nextSignature===sessionSignature)return;
      sessionSignature=nextSignature;
      reconcile().catch(error=>publish({status:'degraded',error:error?.message||'Presence reconciliation failed.'}));
    });
    if(typeof session.beforeSignOut==='function')unsubscribeBeforeSignOut=session.beforeSignOut(()=>leave());
    return reconcile();
  }

  async function requireActiveScope(requestedId){
    const sessionState=session.getState(),userId=clean(sessionState?.user?.id);
    if(!sessionState?.authenticated||sessionState?.remoteAvailable===false||!userId)return '';
    const activeId=await activeCongregationFor(userId);
    const requested=clean(requestedId);
    if(!activeId||!requested||requested!==activeId)return '';
    return activeId;
  }

  async function load(congregationId){
    const id=await requireActiveScope(congregationId);
    if(!id)return Object.freeze([]);
    const now=clock(),rows=await api.list(id);
    const normalized=freezeList((Array.isArray(rows)?rows:[]).map(row=>normalizeRow(row,id,now,staleMs)));
    cache.set(id,normalized);
    return normalized;
  }

  function snapshot(congregationId){
    const id=clean(congregationId),activeId=clean(congregation.getActive()?.congregationId),now=clock();
    if(!id||id!==activeId)return Object.freeze([]);
    const rows=cache.get(id)||Object.freeze([]);
    return freezeList(rows.map(row=>({...row,online:isPresenceOnline(row,now,staleMs)})));
  }

  async function leave(){
    const token=++generation;
    stopTimer();
    const sessionState=session.getState(),userId=clean(sessionState?.user?.id),ids=[...activeCongregationIds];
    activeCongregationIds=[];cache.clear();
    if(sessionState?.authenticated&&sessionState?.remoteAvailable!==false&&userId&&ids.length){
      const results=await Promise.allSettled(ids.map(congregationId=>api.leave(congregationId,userId)));
      const failed=results.find(result=>result.status==='rejected');
      if(failed&&token===generation)publish({status:'degraded',congregationIds:[],lastHeartbeatAt:null,error:failed.reason?.message||'Presence cleanup failed.'});
      else if(token===generation)publish({status:'offline',congregationIds:[],lastHeartbeatAt:null,error:''});
      return results;
    }
    if(token===generation)publish({status:'offline',congregationIds:[],lastHeartbeatAt:null,error:''});
    return [];
  }

  async function dispose({remove=true}={}){
    started=false;
    unsubscribeStore?.();unsubscribeStore=null;
    unsubscribeBeforeSignOut?.();unsubscribeBeforeSignOut=null;
    if(remove)return leave();
    ++generation;clearRuntime();
    return [];
  }

  async function activeCount(congregationId,windowMinutes=30){
    const id=await requireActiveScope(congregationId);
    if(!id)return null;
    return Object.freeze({count:Math.max(0,Number(await api.activeCount(id,windowMinutes))||0),windowMinutes});
  }

  return Object.freeze({start,heartbeat:()=>heartbeat(generation),load,snapshot,activeCount,leave,dispose,getState:()=>state,isOnline:row=>isPresenceOnline(row,clock(),staleMs),timing:()=>Object.freeze({heartbeatMs,staleMs})});
}
