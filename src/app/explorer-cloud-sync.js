const SLICE_KEY='biblequest_explorer_v1';
const OWNER_KEY='bq-explorer-sync-owner-v1';
const GUEST_OWNER='guest';

const canonicalText=value=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);

export function createExplorerCloudSyncService({api,session,explorer,ownerStorage,cacheStorage}={}){
  if(!api?.load||!api?.saveSlice)throw new Error('Bible Explorer cloud sync requires progress snapshot API ownership.');
  if(!session?.getState||!session?.beforeSignOut)throw new Error('Bible Explorer cloud sync requires the account session owner.');
  if(!explorer?.exportAccountState||!explorer?.replaceAccountState||!explorer?.mergeFromAccount||!explorer?.subscribe)throw new Error('Bible Explorer cloud sync requires an account-mergeable owner.');
  if(!ownerStorage?.getItem||!ownerStorage?.setItem||!cacheStorage?.read||!cacheStorage?.write)throw new Error('Bible Explorer cloud sync requires owner and account-cache storage.');

  let disposed=false,chain=Promise.resolve();
  let last=Object.freeze({status:'local',userId:'',updatedAt:'',error:''});
  const publish=patch=>{last=Object.freeze({...last,...patch});return last};
  const accountCacheKey=userId=>'explorer-account-cache:'+userId;
  const owner=()=>String(ownerStorage.getItem(OWNER_KEY)||'');
  const setOwner=value=>ownerStorage.setItem(OWNER_KEY,String(value||''));
  const cacheCurrent=userId=>{if(userId)cacheStorage.write(accountCacheKey(userId),explorer.exportAccountState())};

  function prepareOwner(userId){
    const prior=owner();
    if(prior===userId)return;
    if(prior&&prior!==GUEST_OWNER)cacheCurrent(prior);
    const cached=cacheStorage.read(accountCacheKey(userId),null);
    if(cached)explorer.replaceAccountState(cached);
    else if(prior)explorer.replaceAccountState(null);
    setOwner(userId);
    cacheCurrent(userId);
  }

  function switchToGuest(){
    const prior=owner();
    if(!prior||prior===GUEST_OWNER)return false;
    cacheCurrent(prior);
    explorer.replaceAccountState(null);
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
      const row=await api.load(userId);
      const remote=row?.state?.[SLICE_KEY]||null;
      if(remote)explorer.mergeFromAccount(remote);
      cacheCurrent(userId);
      const local=explorer.exportAccountState();
      if(remote&&canonicalText(remote)===canonicalText(local)){
        return publish({status:'synced',userId,updatedAt:String(row?.updated_at||''),error:''});
      }
      try{
        const saved=await api.saveSlice(userId,SLICE_KEY,local,{expectedUpdatedAt:row?.updated_at||null});
        cacheCurrent(userId);
        return publish({status:'synced',userId,updatedAt:String(saved?.updated_at||row?.updated_at||''),error:''});
      }catch(error){
        if(error?.code==='BQ_PROGRESS_SNAPSHOT_CONFLICT'&&attempt<3)continue;
        throw error;
      }
    }
    throw new Error('Bible Explorer account sync could not settle after concurrent updates.');
  }

  function syncNow(){
    const run=()=>reconcile().catch(error=>{
      publish({status:'offline',error:error?.message||'Bible Explorer account sync failed.'});
      throw error;
    });
    chain=chain.catch(()=>{}).then(run);
    return chain;
  }

  const unsubscribe=explorer.subscribe(({source})=>{
    if(disposed||source==='account')return;
    const state=session.getState(),userId=state?.authenticated===true?String(state.user?.id||''):'';
    if(!userId)return;
    prepareOwner(userId);
    cacheCurrent(userId);
    void syncNow().catch(error=>console.warn('Bible Explorer account sync unavailable',error));
  });

  const removeBeforeSignOut=session.beforeSignOut(async()=>{
    await syncNow().catch(()=>{});
    switchToGuest();
  });

  function dispose(){disposed=true;unsubscribe?.();removeBeforeSignOut?.()}

  return Object.freeze({
    key:SLICE_KEY,syncNow,flush:()=>chain.catch(()=>{}),switchToGuest,getState:()=>last,dispose
  });
}
