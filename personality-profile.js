(() => {
  const STORE='biblequest_transformation_v1';
  const ACCOUNT_CACHE='biblequest_account_cache_v1';
  const ACTIVE_OWNER='biblequest_personality_active_owner_v1';
  const USER_PREFIX='biblequest_personality_state_v1:';
  const RESET_PREFIX='biblequest_personality_reset_v1:';
  const TABLE='bible_personality_profiles';
  const VERSION='ipip_big_five_50_v1';

  const parse=(raw,f={})=>{try{return {...f,...JSON.parse(raw||'{}')}}catch{return {...f}}};
  const stateDefault=()=>({personalityAnswers:{},personalityResult:null,biasAnswers:{},calibration:{},biasResult:null,history:[]});
  const userKey=id=>`${USER_PREFIX}${id||'guest'}`;
  const resetKey=id=>`${RESET_PREFIX}${id||'guest'}`;
  let owner='';
  let lastRaw='';
  let lastResultSig='';
  let cloudBusy=false;
  let lastCloudOwner='';
  let reloading=false;

  function cachedUserId(){
    const direct=window.BQAccount?.session?.()?.user?.id||window.BQAccount?.profile?.()?.user_id;
    if(direct)return direct;
    try{return JSON.parse(localStorage.getItem(ACCOUNT_CACHE)||'{}').user_id||''}catch{return ''}
  }
  function currentOwner(){return cachedUserId()||'guest'}
  function fixedRaw(){return localStorage.getItem(STORE)||'{}'}
  function fixedState(){return parse(fixedRaw(),stateDefault())}
  function stash(id,raw=fixedRaw()){if(id)localStorage.setItem(userKey(id),raw||'{}')}
  function resultSig(result){return result?JSON.stringify(result):''}

  function activate(next=currentOwner()){
    next=next||'guest';
    const previous=localStorage.getItem(ACTIVE_OWNER)||'';
    const before=fixedRaw();
    if(previous&&previous!==next)stash(previous,before);
    let target=localStorage.getItem(userKey(next));
    if(target===null){
      if((!previous||previous===next)&&before&&before!=='{}'){
        target=before;
        stash(next,target);
      }else target='{}';
    }
    localStorage.setItem(ACTIVE_OWNER,next);
    owner=next;
    if(before!==target){
      localStorage.setItem(STORE,target);
      lastRaw=target;
      lastResultSig=resultSig(parse(target,stateDefault()).personalityResult);
      if(window.BQ_TRANSFORMATION&&!reloading){
        reloading=true;
        sessionStorage.setItem('bq_personality_owner_reload',next);
        setTimeout(()=>location.reload(),60);
        return true;
      }
    }else{
      lastRaw=before;
      lastResultSig=resultSig(fixedState().personalityResult);
    }
    return false;
  }

  function presentationProfile(result){
    const s=result?.scores||{};
    const mean=k=>Number(s[k]?.mean)||3;
    return {
      schema:1,
      content_boundary:'presentation_only',
      depth:mean('O')>3.4?'deeper_context':mean('O')<2.6?'concrete_first':'balanced',
      structure:mean('C')>3.4?'structured':mean('C')<2.6?'small_steps':'balanced',
      interaction:mean('E')>3.4?'interactive':mean('E')<2.6?'reflective':'balanced',
      challenge_style:mean('A')<2.6?'direct_evidence_first':mean('A')>3.4?'cooperative':'balanced',
      pacing:mean('S')<2.6?'calm_short_steps':'normal'
    };
  }

  function client(){return window.BQAccount?.client?.()||window.BQ_SUPABASE_CLIENT||null}
  function sessionUser(){return window.BQAccount?.session?.()?.user||null}
  function completedAt(result){
    const t=Date.parse(result?.updatedAt||'');if(t)return new Date(t).toISOString();
    const d=result?.date;if(d){const x=Date.parse(`${d}T12:00:00Z`);if(x)return new Date(x).toISOString()}
    return new Date().toISOString();
  }

  async function pushCloud(result){
    const c=client(),u=sessionUser();if(!c||!u||!result||u.id!==owner||cloudBusy)return;
    cloudBusy=true;
    try{
      const row={user_id:u.id,assessment_version:VERSION,result,presentation_profile:presentationProfile(result),completed_at:completedAt(result),updated_at:new Date().toISOString()};
      const r=await c.from(TABLE).upsert(row,{onConflict:'user_id'});if(r.error)throw r.error;
      localStorage.removeItem(resetKey(u.id));
      window.BQAccount?.track?.('personality_profile','synced',{assessment_version:VERSION}).catch?.(()=>{});
    }catch(err){console.warn('BibleQuest personality sync:',err?.message||err)}finally{cloudBusy=false}
  }

  async function clearCloud(){
    const c=client(),u=sessionUser();if(!c||!u||u.id!==owner||cloudBusy)return;
    cloudBusy=true;
    try{const r=await c.from(TABLE).delete().eq('user_id',u.id);if(r.error)throw r.error;localStorage.setItem(resetKey(u.id),new Date().toISOString())}
    catch(err){console.warn('BibleQuest personality reset sync:',err?.message||err)}finally{cloudBusy=false}
  }

  function writeState(next,{reload=false}={}){
    const raw=JSON.stringify(next);
    localStorage.setItem(STORE,raw);stash(owner,raw);lastRaw=raw;lastResultSig=resultSig(next.personalityResult);
    if(reload&&!reloading){reloading=true;setTimeout(()=>location.reload(),60)}
  }

  async function pullCloud(){
    const c=client(),u=sessionUser();if(!c||!u||u.id!==owner||cloudBusy||lastCloudOwner===owner)return;
    lastCloudOwner=owner;cloudBusy=true;
    try{
      const r=await c.from(TABLE).select('assessment_version,result,presentation_profile,completed_at,updated_at').eq('user_id',u.id).maybeSingle();if(r.error)throw r.error;
      const local=fixedState(),remote=r.data;
      if(!remote?.result){if(local.personalityResult)await pushAfterUnlock(local.personalityResult);return}
      if(localStorage.getItem(resetKey(u.id)))return;
      const localTs=Date.parse(local.personalityResult?.updatedAt||`${local.personalityResult?.date||'1970-01-01'}T00:00:00Z`)||0;
      const remoteTs=Date.parse(remote.updated_at)||0;
      if(!local.personalityResult||remoteTs>localTs+1000){
        local.personalityResult={...remote.result,updatedAt:remote.updated_at};
        local.history=[...(local.history||[]).filter(x=>x.type!=='personality'),{type:'personality',date:local.personalityResult.date,scores:local.personalityResult.scores}].slice(-8);
        writeState(local,{reload:true});
      }else if(localTs>remoteTs+1000){await pushAfterUnlock(local.personalityResult)}
    }catch(err){console.warn('BibleQuest personality load:',err?.message||err)}finally{cloudBusy=false}
  }

  async function pushAfterUnlock(result){
    cloudBusy=false;
    await pushCloud(result);
  }

  function patchPrivacyLabels(){
    const signed=Boolean(sessionUser());
    document.querySelectorAll('.local-chip').forEach(x=>x.textContent=signed?'🔒 private account profile':'🔒 private on this device');
    document.querySelectorAll('.transform-summary .section-title small').forEach(x=>x.textContent=signed?'private to this BibleQuest account':'stored on this device');
  }

  function inspectChanges(){
    const next=currentOwner();
    if(next!==owner){if(activate(next))return;lastCloudOwner=''}
    const raw=fixedRaw();
    if(raw!==lastRaw){
      const previous=parse(lastRaw,stateDefault()).personalityResult;
      const nextState=parse(raw,stateDefault());
      let result=nextState.personalityResult;
      stash(owner,raw);lastRaw=raw;
      if(previous&&!result){lastResultSig='';clearCloud();}
      else if(result&&resultSig(result)!==lastResultSig){
        if(!result.updatedAt){result={...result,updatedAt:new Date().toISOString()};nextState.personalityResult=result;writeState(nextState)}
        else lastResultSig=resultSig(result);
        pushCloud(result);
      }
    }
    patchPrivacyLabels();
    pullCloud();
  }

  activate(currentOwner());
  const observer=new MutationObserver(patchPrivacyLabels);observer.observe(document.documentElement,{childList:true,subtree:true});
  setInterval(inspectChanges,900);
  setTimeout(inspectChanges,300);setTimeout(inspectChanges,1600);

  window.BQPersonalityProfile={
    result:()=>fixedState().personalityResult||null,
    presentation:()=>presentationProfile(fixedState().personalityResult),
    owner:()=>owner,
    sync:()=>pushCloud(fixedState().personalityResult)
  };
})();
