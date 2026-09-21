const ADMIN_ROLES=new Set(['owner','admin']);
const clean=value=>String(value??'').trim().toLowerCase();

export function createAdminAccessService({api,session}={}){
  if(typeof api?.status!=='function'||!session?.getState)throw new Error('Admin access requires the shared API and Session owners.');
  let state=Object.freeze({status:'idle',authorized:false,role:''});
  let request=0;
  const listeners=new Set();
  const publish=patch=>{
    state=Object.freeze({...state,...patch});
    listeners.forEach(listener=>listener(state));
    return state;
  };
  const reset=()=>publish({status:'idle',authorized:false,role:''});

  async function refresh(){
    const user=session.getState()?.authenticated===true?session.getState()?.user:null;
    const token=++request;
    if(!user?.id)return reset();
    publish({status:'checking',authorized:false,role:''});
    try{
      const result=await api.status();
      if(token!==request)return state;
      const role=clean(result?.role);
      const authorized=ADMIN_ROLES.has(role);
      return publish({status:'ready',authorized,role:authorized?role:''});
    }catch{
      if(token!==request)return state;
      return publish({status:'unavailable',authorized:false,role:''});
    }
  }

  return Object.freeze({
    refresh,
    clear(){request+=1;return reset()},
    getState:()=>state,
    subscribe(listener){
      if(typeof listener!=='function')throw new Error('Admin access subscriber must be a function.');
      listeners.add(listener);
      listener(state);
      return()=>listeners.delete(listener);
    }
  });
}
