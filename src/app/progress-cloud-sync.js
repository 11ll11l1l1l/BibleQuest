const SLICE_KEY='biblequest_global_progress_v1';

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
    const row=await api.load(userId);
    const remote=row?.state?.[SLICE_KEY]||null;
    if(remote)progress.mergeFromAccount(remote);

    const local=progress.exportAccountState();
    const remoteText=remote?JSON.stringify(remote):'';
    const localText=JSON.stringify(local);
    const saved=(!remote||remoteText!==localText)
      ?await api.saveSlice(userId,SLICE_KEY,local)
      :row;

    return publish({status:'synced',userId,updatedAt:String(saved?.updated_at||row?.updated_at||''),error:''});
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
