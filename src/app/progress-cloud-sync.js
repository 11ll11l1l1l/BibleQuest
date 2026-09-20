const SLICE_KEY='biblequest_global_progress_v1';

const canonicalText=value=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);

export function createProgressCloudSyncService({api,session,progress}={}){
  if(!api?.load||!api?.saveSlice)throw new Error('Progress cloud sync requires progress snapshot API ownership.');
  if(!session?.getState||!session?.beforeSignOut)throw new Error('Progress cloud sync requires the account session owner.');
  if(!progress?.exportAccountState||!progress?.mergeFromAccount||!progress?.subscribe)throw new Error('Progress cloud sync requires an account-mergeable Progress owner.');

  let disposed=false;
  let chain=Promise.resolve();
  let last=Object.freeze({status:'local',userId:'',updatedAt:'',error:''});

  const publish=patch=>{last=Object.freeze({...last,...patch});return last};

  async function reconcile(){
    if(disposed)return last;
    const current=session.getState(),userId=String(current?.user?.id||'');
    if(current?.authenticated!==true||!userId)return publish({status:'local',userId:'',error:''});

    publish({status:'syncing',userId,error:''});
    for(let attempt=0;attempt<4;attempt+=1){
      const row=await api.load(userId);
      const remote=row?.state?.[SLICE_KEY]||null;
      if(remote)progress.mergeFromAccount(remote);

      const local=progress.exportAccountState();
      const remoteText=remote?canonicalText(remote):'';
      const localText=canonicalText(local);
      if(remote&&remoteText===localText){
        return publish({status:'synced',userId,updatedAt:String(row?.updated_at||''),error:''});
      }
      try{
        const saved=await api.saveSlice(userId,SLICE_KEY,local,{expectedUpdatedAt:row?.updated_at||null});
        return publish({status:'synced',userId,updatedAt:String(saved?.updated_at||row?.updated_at||''),error:''});
      }catch(error){
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
    if(disposed||source==='account'||session.getState()?.authenticated!==true)return;
    void syncNow().catch(error=>console.warn('Progress account sync unavailable',error));
  });
  const removeBeforeSignOut=session.beforeSignOut(()=>syncNow().catch(()=>{}));

  function dispose(){disposed=true;unsubscribe?.();removeBeforeSignOut?.()}

  return Object.freeze({key:SLICE_KEY,syncNow,flush:()=>chain.catch(()=>{}),getState:()=>last,dispose});
}
