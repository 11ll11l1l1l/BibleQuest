const STORAGE_KEY='progress-leaderboard-delivery-v1';
const VERSION=1;
const SCORE_EVENT_ID_MAX=120;
const MAX_SETTLED=2000;

const clean=value=>String(value??'').trim();
const clone=value=>JSON.parse(JSON.stringify(value));
const nowIso=()=>new Date().toISOString();

function stableScoreEventId(progressEventId){
  const raw=`progress:${clean(progressEventId)}`;
  if(raw.length<=SCORE_EVENT_ID_MAX)return raw;
  let hash=2166136261;
  for(let index=0;index<raw.length;index+=1){
    hash^=raw.charCodeAt(index);
    hash=Math.imul(hash,16777619)>>>0;
  }
  return `progress:${hash.toString(16).padStart(8,'0')}:${raw.slice(-92)}`.slice(0,SCORE_EVENT_ID_MAX);
}

function normalizeLedger(input){
  const base={version:VERSION,pending:{},settled:{}};
  if(!input||typeof input!=='object'||Array.isArray(input)||Number(input.version)!==VERSION)return base;
  const pending={},settled={};
  if(input.pending&&typeof input.pending==='object'&&!Array.isArray(input.pending)){
    for(const [key,row] of Object.entries(input.pending)){
      if(!row||typeof row!=='object'||Array.isArray(row))continue;
      const userId=clean(row.userId),congregationId=clean(row.congregationId),sourceEventId=clean(row.claim?.sourceEventId),source=clean(row.claim?.source);
      if(!userId||!congregationId||!sourceEventId||!source)continue;
      pending[key]={userId,congregationId,claim:clone(row.claim),queuedAt:clean(row.queuedAt)};
    }
  }
  if(input.settled&&typeof input.settled==='object'&&!Array.isArray(input.settled)){
    for(const [key,row] of Object.entries(input.settled)){
      if(!row||typeof row!=='object'||Array.isArray(row))continue;
      settled[key]={status:clean(row.status),reason:clean(row.reason),settledAt:clean(row.settledAt)};
    }
  }
  return {version:VERSION,pending,settled};
}

function chapterFromReaderEvent(id){
  const parts=clean(id).split(':');
  if(parts[0]!=='reader.read'||parts.length<3)return null;
  const code=clean(parts.at(-2)).toUpperCase(),chapter=Number(parts.at(-1));
  if(!/^[0-9A-Z]{3}$/.test(code)||!Number.isInteger(chapter)||chapter<1||chapter>200)return null;
  return {code,chapter};
}

function chapterFromQuestEvent(id){
  const match=/^bible-quest:([0-9A-Z]{3}):(\d+)$/i.exec(clean(id));
  if(!match)return null;
  const code=match[1].toUpperCase(),chapter=Number(match[2]);
  if(!Number.isInteger(chapter)||chapter<1||chapter>200)return null;
  return {code,chapter};
}

function gameEvidence(id,state,type){
  const prefix=clean(id).replace(/:complete$/,'');
  const rows=Object.entries(state?.events||{}).filter(([eventId])=>eventId.startsWith(`${prefix}:`)).map(([,row])=>row);
  if(type==='game.recall.complete'){
    const cards=rows.filter(row=>row?.type==='game.recall').length;
    const remembered=rows.filter(row=>row?.type==='game.recall').reduce((sum,row)=>sum+(Number(row?.metrics?.quizCorrect)||0),0);
    return {cards:Math.max(1,cards),remembered:Math.max(0,remembered)};
  }
  const correct=rows.reduce((sum,row)=>sum+(Number(row?.metrics?.quizCorrect)||0),0);
  return {correct:Math.max(0,correct)};
}

export function claimForProgressEvent(id,row,state){
  if(!row||typeof row!=='object')return null;
  if(row.type==='reader.chapter.read'){
    const chapter=chapterFromReaderEvent(id);
    if(!chapter)return null;
    return Object.freeze({sourceEventId:`reading.chapter:${chapter.code}:${chapter.chapter}`,source:'Bible Chapter Read',category:'reading',meta:Object.freeze({...chapter,origin:'reader'})});
  }
  if(row.type==='bible.quest.chapter.complete'){
    const chapter=chapterFromQuestEvent(id);
    if(!chapter)return null;
    return Object.freeze({sourceEventId:`reading.chapter:${chapter.code}:${chapter.chapter}`,source:'Bible Chapter Read',category:'reading',meta:Object.freeze({...chapter,origin:'main-quest'})});
  }
  if(row.type==='study.complete')return Object.freeze({sourceEventId:stableScoreEventId(id),source:'Guided Study',category:'reading',meta:Object.freeze({completed:1})});
  if(row.type==='wisdom-situation.complete')return Object.freeze({sourceEventId:stableScoreEventId(id),source:'Situations & Wisdom',category:'wisdom',meta:Object.freeze({completed:1})});
  if(row.type==='story-journey-checkpoint')return Object.freeze({sourceEventId:stableScoreEventId(id),source:'Journey Mastery',category:'mastery',meta:Object.freeze({growth:Math.max(1,Math.min(100,Number(row.xp)||1))})});
  if(row.type==='daily.complete')return Object.freeze({sourceEventId:stableScoreEventId(id),source:'Learning Streak',category:'consistency',meta:Object.freeze({completed:1})});
  if(row.type==='transform.spiritual.complete'||row.type==='transform.full.complete'){
    const depth=row.type==='transform.full.complete'?'full':'spiritual';
    return Object.freeze({sourceEventId:stableScoreEventId(id),source:'Transformation Complete',category:'mastery',meta:Object.freeze({depth})});
  }
  if(row.type==='game.recall.complete')return Object.freeze({sourceEventId:stableScoreEventId(id),source:'Recall Deck',category:'reading',meta:Object.freeze(gameEvidence(id,state,row.type))});
  if(row.type==='game.round.complete'||row.type==='game.detective.complete'||row.type==='game.timeline.complete'){
    return Object.freeze({sourceEventId:stableScoreEventId(id),source:'Solo Bible Game',category:'knowledge',meta:Object.freeze(gameEvidence(id,state,row.type))});
  }
  return null;
}

export function createProgressLeaderboardBridgeService({progress,scoreEvents,session,congregation,storage}={}){
  if(!progress?.getState||!progress?.subscribe)throw new Error('Progress leaderboard bridge requires Progress ownership.');
  if(!scoreEvents?.submit)throw new Error('Progress leaderboard bridge requires trusted score-event submission.');
  if(!session?.getState)throw new Error('Progress leaderboard bridge requires Session ownership.');
  if(!congregation?.load||!congregation?.getActive||!congregation?.can)throw new Error('Progress leaderboard bridge requires Congregation ownership.');
  if(!storage?.read||!storage?.write)throw new Error('Progress leaderboard bridge requires persistent queue storage.');

  let ledger=normalizeLedger(storage.read(STORAGE_KEY,null));
  let known=new Set(Object.keys(progress.getState()?.events||{}));
  let disposed=false;
  let chain=Promise.resolve();
  let status=Object.freeze({state:'idle',pending:Object.keys(ledger.pending).length,lastError:''});

  const publish=(state,lastError='')=>{
    status=Object.freeze({state,pending:Object.keys(ledger.pending).length,lastError:clean(lastError)});
    return status;
  };
  const persist=()=>{
    const settledKeys=Object.keys(ledger.settled);
    if(settledKeys.length>MAX_SETTLED){
      for(const key of settledKeys.slice(0,settledKeys.length-MAX_SETTLED))delete ledger.settled[key];
    }
    storage.write(STORAGE_KEY,ledger);
    publish(status.state,status.lastError);
  };
  const deliveryKey=(userId,congregationId,sourceEventId)=>`${userId}:${congregationId}:${sourceEventId}`;

  async function queueFresh(fresh,state){
    if(disposed||!fresh.length)return;
    const mapped=fresh.map(id=>({id,claim:claimForProgressEvent(id,state.events?.[id],state)})).filter(item=>item.claim);
    if(!mapped.length)return;
    const sessionState=session.getState();
    if(sessionState.authenticated!==true||sessionState.remoteAvailable===false||!sessionState.user?.id)return;
    await congregation.load();
    const active=congregation.getActive();
    const congregationId=clean(active?.congregationId),userId=clean(sessionState.user.id);
    if(!congregationId||!congregation.can(congregationId,'read'))return;
    for(const item of mapped){
      const key=deliveryKey(userId,congregationId,item.claim.sourceEventId);
      if(ledger.pending[key]||ledger.settled[key])continue;
      ledger.pending[key]={userId,congregationId,claim:clone(item.claim),queuedAt:nowIso()};
    }
    persist();
  }

  async function flushPending(){
    if(disposed)return publish('disposed');
    const sessionState=session.getState();
    if(sessionState.authenticated!==true||sessionState.remoteAvailable===false||!sessionState.user?.id)return publish('idle');
    const userId=clean(sessionState.user.id);
    await congregation.load();
    const grouped=new Map();
    for(const [key,row] of Object.entries(ledger.pending)){
      if(row.userId!==userId||!congregation.can(row.congregationId,'read'))continue;
      if(!grouped.has(row.congregationId))grouped.set(row.congregationId,[]);
      grouped.get(row.congregationId).push({key,row});
    }
    if(!grouped.size)return publish('synced');
    publish('syncing');
    for(const [congregationId,items] of grouped){
      for(let offset=0;offset<items.length;offset+=50){
        const batch=items.slice(offset,offset+50);
        const result=await scoreEvents.submit(congregationId,batch.map(item=>item.row.claim));
        const byId=new Map(batch.map(item=>[item.row.claim.sourceEventId,item]));
        for(const processed of result.processed||[]){
          const sourceEventId=clean(processed?.sourceEventId),item=byId.get(sourceEventId);
          if(!item)continue;
          const settledStatus=processed.accepted?'accepted':processed.duplicate?'duplicate':'rejected';
          ledger.settled[item.key]={status:settledStatus,reason:clean(processed.reason),settledAt:nowIso()};
          delete ledger.pending[item.key];
        }
        persist();
      }
    }
    return publish('synced');
  }

  const schedule=task=>{
    chain=chain.then(task).catch(error=>{
      publish('error',error?.message||'Leaderboard score sync failed.');
      console.warn('Progress leaderboard sync unavailable',error);
    });
    return chain;
  };

  const unsubscribe=progress.subscribe(({source,state})=>{
    const ids=Object.keys(state?.events||{}),fresh=ids.filter(id=>!known.has(id));
    known=new Set(ids);
    if(disposed||source!=='local'||!fresh.length)return;
    schedule(async()=>{await queueFresh(fresh,state);await flushPending()});
  });

  async function syncNow(){
    await chain;
    try{return await flushPending()}
    catch(error){
      publish('error',error?.message||'Leaderboard score sync failed.');
      throw error;
    }
  }

  function dispose(){
    disposed=true;
    unsubscribe?.();
    publish('disposed');
  }

  return Object.freeze({syncNow,flush:syncNow,getState:()=>status,dispose,claimForProgressEvent});
}
