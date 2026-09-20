const SLICE_KEY='biblequest_main_bible_quest_v1';

const canonicalText=value=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);

export function createBibleQuestCloudSyncService({api,session,bibleQuest}={}){
  if(!api?.load||!api?.saveSlice)throw new Error('Bible Quest cloud sync requires progress snapshot API ownership.');
  if(!session?.getState)throw new Error('Bible Quest cloud sync requires the account session owner.');
  if(!bibleQuest?.exportAccountState||!bibleQuest?.mergeFromAccount||!bibleQuest?.subscribe)throw new Error('Bible Quest cloud sync requires an account-mergeable Quest owner.');

  let disposed=false;
  let chain=Promise.resolve();
  let last=Object.freeze({status:'local',userId:'',updatedAt:'',winner:'same',error:''});

  const publish=patch=>{
    last=Object.freeze({...last,...patch});
    return last;
  };

  async function reconcile(){
    if(disposed)return last;
    const current=session.getState();
    const userId=String(current?.user?.id||'');
    if(current?.authenticated!==true||!userId)return publish({status:'local',userId:'',winner:'same',error:''});

    publish({status:'syncing',userId,error:''});
    for(let attempt=0;attempt<4;attempt+=1){
      const row=await api.load(userId);
      const remote=row?.state?.[SLICE_KEY]||null;
      const merge=remote?bibleQuest.mergeFromAccount(remote):Object.freeze({winner:'local'});
      const local=bibleQuest.exportAccountState();
      if(remote&&canonicalText(remote)===canonicalText(local)){
        return publish({status:'synced',userId,updatedAt:String(row?.updated_at||''),winner:merge.winner,error:''});
      }
      try{
        const saved=await api.saveSlice(userId,SLICE_KEY,local,{expectedUpdatedAt:row?.updated_at||null});
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
    if(session.getState()?.authenticated!==true)return;
    void syncNow().catch(error=>console.warn('Bible Quest account sync unavailable',error));
  });

  const removeBeforeSignOut=session.beforeSignOut?.(()=>syncNow().catch(()=>{}))||(()=>{});

  function dispose(){
    disposed=true;
    unsubscribeQuest?.();
    removeBeforeSignOut?.();
  }

  return Object.freeze({
    key:SLICE_KEY,
    syncNow,
    flush:()=>chain.catch(()=>{}),
    getState:()=>last,
    dispose
  });
}
