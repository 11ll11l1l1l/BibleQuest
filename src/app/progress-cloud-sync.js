const SLICE_KEY='biblequest_global_progress_v1';
const OWNER_KEY='bq-progress-sync-owner-v1';
const GUEST_OWNER='guest';

const canonicalText=value=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);

export function createProgressCloudSyncService({api,session,progress,ownerStorage,cacheStorage}={}){
  if(!api?.load||!api?.saveSlice)throw new Error('Progress cloud sync requires progress snapshot API ownership.');
  if(!session?.getState||!session?.beforeSignOut)throw new Error('Progress cloud sync requires the account session owner.');
  if(!progress?.exportAccountState||!progress?.replaceAccountState||!progress?.mergeFromAccount||!progress?.subscribe)throw new Error('Progress cloud sync requires an account-mergeable Progress owner.');
  if(!ownerStorage?.getItem||!ownerStorage?.setItem||!cacheStorage?.read||!cacheStorage?.write)throw new Error('Progress cloud sync requires owner and account-cache storage.');

  let disposed=false;
  let chain=Promise.resolve();
  let last=Object.freeze({status:'local',userId:'',updatedAt:'',error:''});

  const publish=patch=>{last=Object.freeze({...last,...patch});return last};
  const accountCacheKey=userId=>`progress-account-cache:${userId}`;
  const owner=()=>String(ownerStorage.getItem(OWNER_KEY)||'');
  const setOwner=value=>ownerStorage.setItem(OWNER_KEY,String(value||''));
  const currentUserId=()=>{const state=session.getState();return state?.authenticated===true?String(state.user?.id||''):''};
  const isCurrentUser=userId=>Boolean(userId)&&!disposed&&currentUserId()===userId;
  const cacheCurrent=userId=>{
    if(!userId)return;
    cacheStorage.write(accountCacheKey(userId),progress.exportAccountState());
  };

  function prepareOwner(userId){
    const prior=owner();
    if(prior===userId)return;
    if(prior&&prior!==GUEST_OWNER)cacheCurrent(prior);

    const cached=cacheStorage.read(accountCacheKey(userId),null);
    if(cached)progress.replaceAccountState(cached);
    else if(prior)progress.replaceAccountState(null);
    // prior==='' is the one-time upgrade path: preserve the legacy device
    // state so the currently restored account can adopt it.
    setOwner(userId);
    cacheCurrent(userId);
  }

  function switchToGuest(){
    const prior=owner();
    if(!prior||prior===GUEST_OWNER)return false;
    cacheCurrent(prior);
    progress.replaceAccountState(null);
    setOwner(GUEST_OWNER);
    publish({status:'local',userId:'',updatedAt:'',error:''});
    return true;
  }

  async function reconcile(){
    if(disposed)return last;
    const current=session.getState(),userId=String(current?.user?.id||'');
    if(current?.authenticated!==true||!userId)return publish({status:'local',userId:'',error:''});

    prepareOwner(userId);
    publish({status:'syncing',userId,error:''});
    for(let attempt=0;attempt<4;attempt+=1){
      if(!isCurrentUser(userId))return last;
      let row;
      try{row=await api.load(userId)}catch(error){if(!isCurrentUser(userId))return last;throw error}
      if(!isCurrentUser(userId))return last;
      const remote=row?.state?.[SLICE_KEY]||null;
      if(remote)progress.mergeFromAccount(remote);
      if(!isCurrentUser(userId))return last;
      cacheCurrent(userId);

      const local=progress.exportAccountState();
      const remoteText=remote?canonicalText(remote):'';
      const localText=canonicalText(local);
      if(remote&&remoteText===localText){
        return publish({status:'synced',userId,updatedAt:String(row?.updated_at||''),error:''});
      }
      if(!isCurrentUser(userId))return last;
      try{
        const saved=await api.saveSlice(userId,SLICE_KEY,local,{expectedUpdatedAt:row?.updated_at||null});
        if(!isCurrentUser(userId))return last;
        cacheCurrent(userId);
        return publish({status:'synced',userId,updatedAt:String(saved?.updated_at||row?.updated_at||''),error:''});
      }catch(error){
        if(!isCurrentUser(userId))return last;
        if(error?.code==='BQ_PROGRESS_SNAPSHOT_CONFLICT'&&attempt<3)continue;
        throw error;
      }
    }
    throw new Error('Progress account sync could not settle after concurrent updates.');
  }

  function syncNow(){
    const run=()=>reconcile().catch(error=>{
      publish({status:'offline',error:error?.message||'Progress account sync failed.'});
      throw error;
    });
    chain=chain.catch(()=>{}).then(run);
    return chain;
  }

  const unsubscribe=progress.subscribe(({source})=>{
    if(disposed||source==='account')return;
    const state=session.getState(),userId=state?.authenticated===true?String(state.user?.id||''):'';
    if(!userId)return;
    prepareOwner(userId);
    cacheCurrent(userId);
    void syncNow().catch(error=>console.warn('Progress account sync unavailable',error));
  });

  const removeBeforeSignOut=session.beforeSignOut(async()=>{
    await syncNow().catch(()=>{});
    switchToGuest();
  });

  function dispose(){disposed=true;unsubscribe?.();removeBeforeSignOut?.()}

  return Object.freeze({key:SLICE_KEY,syncNow,flush:()=>chain.catch(()=>{}),switchToGuest,getState:()=>last,dispose});
}
