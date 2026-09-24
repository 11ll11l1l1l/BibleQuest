const ADMIN_ROLES=new Set(['owner','admin']);
const clean=value=>String(value??'').trim().toLowerCase();

export function createAdminAccessService({api,session}={}){
  if(typeof api?.status!=='function'||!session?.getState)throw new Error('Admin access requires the shared API and Session owners.');
  const empty=()=>Object.freeze({status:'idle',authorized:false,role:''});
  let state=empty(),contextUserId='',request=0;
  const listeners=new Set();
  const currentUserId=()=>{const value=session.getState();return value?.authenticated===true&&value?.user?.id?String(value.user.id):''};
  const visible=()=>!contextUserId||contextUserId===currentUserId();
  const snapshot=()=>visible()?state:empty();
  const publish=patch=>{
    state=Object.freeze({...state,...patch});
    const next=snapshot();
    listeners.forEach(listener=>listener(next));
    return next;
  };
  const reset=(userId='')=>{contextUserId=String(userId||'');state=empty();const next=snapshot();listeners.forEach(listener=>listener(next));return next};

  async function refresh(){
    const userId=currentUserId(),token=++request;
    if(!userId)return reset();
    if(contextUserId!==userId)reset(userId);
    contextUserId=userId;
    publish({status:'checking',authorized:false,role:''});
    try{
      const result=await api.status();
      if(token!==request)return snapshot();
      if(currentUserId()!==userId)return reset(currentUserId());
      const role=clean(result?.role);
      const authorized=ADMIN_ROLES.has(role);
      return publish({status:'ready',authorized,role:authorized?role:''});
    }catch{
      if(token!==request)return snapshot();
      if(currentUserId()!==userId)return reset(currentUserId());
      return publish({status:'unavailable',authorized:false,role:''});
    }
  }

  return Object.freeze({
    refresh,
    clear(){request+=1;return reset()},
    getState:snapshot,
    subscribe(listener){
      if(typeof listener!=='function')throw new Error('Admin access subscriber must be a function.');
      listeners.add(listener);
      listener(snapshot());
      return()=>listeners.delete(listener);
    }
  });
}
