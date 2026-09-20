const SLICE_KEY='biblequest_main_bible_quest_v1';
const OWNER_KEY='bq-main-quest-sync-owner-v1';
const GUEST_OWNER='guest';

const canonicalText=value=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);

export function createBibleQuestCloudSyncService({api,session,bibleQuest,ownerStorage,cacheStorage}={}){
  if(!api?.load||!api?.saveSlice)throw new Error('Bible Quest cloud sync requires progress snapshot API ownership.');
  if(!session?.getState||!session?.beforeSignOut)throw new Error('Bible Quest cloud sync requires the account session owner.');
  if(!bibleQuest?.exportAccountState||!bibleQuest?.replaceAccountState||!bibleQuest?.mergeFromAccount||!bibleQuest?.subscribe)throw new Error('Bible Quest cloud sync requires an account-mergeable Quest owner.');
  if(!ownerStorage?.getItem||!ownerStorage?.setItem||!cacheStorage?.read||!cacheStorage?.write)throw new Error('Bible Quest cloud sync requires owner and account-cache storage.');

  let disposed=false;
  let chain=Promise.resolve();
  let last=Object.freeze({status:'local',userId:'',updatedAt:'',winner:'same',error:''});

  const publish=patch=>{last=Object.freeze({...last,...patch});return last};
  const accountCacheKey=userId=>`main-quest-account-cache:${userId}`;
  const owner=()=>String(ownerStorage.getItem(OWNER_KEY)||'');
  const setOwner=value=>ownerStorage.setItem(OWNER_KEY,String(value||''));
  const cacheCurrent=userId=>{if(userId)cacheStorage.write(accountCacheKey(userId),bibleQuest.exportAccountState())};

  function prepareOwner(userId){
    const prior=owner();
    if(prior===userId)return;
    if(prior&&prior!==GUEST_OWNER)cacheCurrent(prior);
    const cached=cacheStorage.read(accountCacheKey(userId),null);
    if(cached)bibleQuest.replaceAccountState(cached);
    else if(prior)bibleQuest.replaceAccountState(null);
    // Empty owner is the one-time upgrade path for pre-account-cache installs.
    setOwner(userId);
    cacheCurrent(userId);
  }

  function switchToGuest(){
    const prior=owner();
    if(!prior||prior===GUEST_OWNER)return false;
    cacheCurrent(prior);
    bibleQuest.replaceAccountState(null);
    setOwner(GUEST_OWNER);
    publish({status:'local',userId:'',updatedAt:'',winner:'same',error:''});
    return true;
  }

  async function reconcile(){
    if(disposed)return last;
    const current=session.getState();
    const userId=String(current?.user?.id||'');
    if(current?.authenticated!==true||!userId)return publish({status:'local',userId:'',winner:'same',error:''});

    prepareOwner(userId);
    publish({status:'syncing',userId,error:''});
    for(let attempt=0;attempt<4;attempt+=1){
      const row=await api.load(userId);
      const remote=row?.state?.[SLICE_KEY]||null;
      const merge=remote?bibleQuest.mergeFromAccount(remote):Object.freeze({winner:'local'});
      cacheCurrent(userId);
      const local=bibleQuest.exportAccountState();
      if(remote&&canonicalText(remote)===canonicalText(local)){
        return publish({status:'synced',userId,updatedAt:String(row?.updated_at||''),winner:merge.winner,error:''});
      }
      try{
        const saved=await api.saveSlice(userId,SLICE_KEY,local,{expectedUpdatedAt:row?.updated_at||null});
        cacheCurrent(userId);
        return publish({
          status:'synced',userId,updatedAt:String(saved?.updated_at||row?.updated_at||''),
          winner:remote?merge.winner:'local',error:''
        });
      }catch(error){
        if(error?.code==='BQ_PROGRESS_SNAPSHOT_CONFLICT'&&attempt<3)continue;
        throw error;
      }
    }
    throw new Error('Bible Quest account sync could not settle after concurrent updates.');
  }

  function syncNow(){
    const run=()=>reconcile().catch(error=>{
      publish({status:'offline',error:error?.message||'Bible Quest account sync failed.'});
      throw error;
    });
    chain=chain.catch(()=>{}).then(run);
    return chain;
  }

  const unsubscribeQuest=bibleQuest.subscribe(({source})=>{
    if(source==='account'||disposed)return;
    const state=session.getState(),userId=state?.authenticated===true?String(state.user?.id||''):'';
    if(!userId)return;
    prepareOwner(userId);
    cacheCurrent(userId);
    void syncNow().catch(error=>console.warn('Bible Quest account sync unavailable',error));
  });

  const removeBeforeSignOut=session.beforeSignOut(async()=>{
    await syncNow().catch(()=>{});
    switchToGuest();
  });

  function dispose(){disposed=true;unsubscribeQuest?.();removeBeforeSignOut?.()}

  return Object.freeze({
    key:SLICE_KEY,syncNow,flush:()=>chain.catch(()=>{}),switchToGuest,getState:()=>last,dispose
  });
}
