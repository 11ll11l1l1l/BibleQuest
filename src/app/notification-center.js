const ACTION_ROUTES=Object.freeze({assignment:'assignments',ministry:'ministry-hub',recognition:'recognition',media:'media'});
const cleanText=(value,max)=>String(value??'').replace(/\r\n?/g,'\n').trim().slice(0,max);
const notificationError=(message,code)=>{const error=new Error(message);error.code=code;return error};
const validTimestamp=(value,{nullable=false}={})=>{
  if(value==null||value===''){
    if(nullable)return null;
    throw notificationError('Notification is missing a required timestamp.','BQ_NOTIFICATION_DATA');
  }
  const text=String(value),time=Date.parse(text);
  if(!Number.isFinite(time))throw notificationError('Notification contains an invalid timestamp.','BQ_NOTIFICATION_DATA');
  return new Date(time).toISOString();
};

function normalizeRow(row,userId,nowMs=Date.now()){
  const id=cleanText(row?.id,120),owner=String(row?.user_id||''),title=cleanText(row?.title,180),type=cleanText(row?.notification_type,60).toLowerCase()||'info';
  if(!id||owner!==userId||!title)throw notificationError('Notification response contained malformed or out-of-scope data.','BQ_NOTIFICATION_SCOPE');
  const createdAt=validTimestamp(row?.created_at),readAt=validTimestamp(row?.read_at,{nullable:true}),expiresAt=validTimestamp(row?.expires_at,{nullable:true});
  if(expiresAt&&Date.parse(expiresAt)<=nowMs)throw notificationError('Notification response contained an expired item.','BQ_NOTIFICATION_EXPIRED');
  const actionKind=cleanText(row?.action_kind,60).toLowerCase();
  return Object.freeze({
    id,userId,congregationId:cleanText(row?.congregation_id,120),createdBy:cleanText(row?.created_by,120),type,title,
    body:cleanText(row?.body,1200),actionKind,route:ACTION_ROUTES[actionKind]||'',
    actionPayload:row?.action_payload&&typeof row.action_payload==='object'?Object.freeze({...row.action_payload}):Object.freeze({}),
    createdAt,readAt,expiresAt,isRead:Boolean(readAt)
  });
}

export function createNotificationCenterService({api,session}={}){
  if(!api?.list||!api?.setReadState||!api?.markAllRead||!session)throw new Error('Notification Center requires shared API and session owners.');
  let current=Object.freeze({status:'idle',authenticated:false,remoteAvailable:true,userId:'',items:Object.freeze([]),unread:0,error:''});
  const sessionState=()=>session.getState?.()||{};
  const snapshot=()=>current;
  const setState=patch=>{current=Object.freeze({...current,...patch});return current};
  const requireAccount=()=>{
    const state=sessionState();
    if(!state.authenticated||!state.user?.id)throw notificationError('Sign in to use your BibleQuest inbox.','BQ_NOTIFICATION_AUTH_REQUIRED');
    if(state.remoteAvailable===false)throw notificationError('BibleQuest inbox is unavailable in local preview.','BQ_NOTIFICATION_REMOTE_DISABLED');
    return state;
  };
  const publishItems=(items,extra={})=>setState({...extra,items:Object.freeze(items),unread:items.filter(item=>!item.isRead).length,error:''});

  async function load(){
    const state=sessionState();
    if(!state.authenticated||!state.user?.id)return setState({status:'signed-out',authenticated:false,remoteAvailable:state.remoteAvailable!==false,userId:'',items:Object.freeze([]),unread:0,error:''});
    if(state.remoteAvailable===false)return setState({status:'unavailable',authenticated:true,remoteAvailable:false,userId:String(state.user.id),items:Object.freeze([]),unread:0,error:'BibleQuest inbox is unavailable in local preview.'});
    const userId=String(state.user.id),now=Date.now();
    setState({status:'loading',authenticated:true,remoteAvailable:true,userId,error:''});
    try{
      const rows=await api.list(userId,new Date(now).toISOString());
      const items=(Array.isArray(rows)?rows:[]).map(row=>normalizeRow(row,userId,now)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
      return publishItems(items,{status:'ready',authenticated:true,remoteAvailable:true,userId});
    }catch(error){
      setState({status:'error',authenticated:true,remoteAvailable:true,userId,error:cleanText(error?.message||error,300)||'Inbox could not be loaded.'});
      throw error;
    }
  }

  async function setRead(id,read=true){
    const state=requireAccount(),userId=String(state.user.id),target=current.items.find(item=>item.id===String(id||''));
    if(!target)throw notificationError('Choose a notification from the current inbox.','BQ_NOTIFICATION_NOT_FOUND');
    const requestedReadAt=read?new Date().toISOString():null;
    const saved=await api.setReadState(userId,target.id,requestedReadAt);
    const normalized=normalizeRow(saved,userId);
    if(normalized.id!==target.id||Boolean(normalized.readAt)!==Boolean(read))throw notificationError('Notification read state did not match the requested update.','BQ_NOTIFICATION_RESPONSE');
    const items=current.items.map(item=>item.id===target.id?normalized:item);
    return publishItems(items,{status:'ready'});
  }

  async function markAllRead(){
    const state=requireAccount(),userId=String(state.user.id);
    if(!current.items.some(item=>!item.isRead))return current;
    await api.markAllRead(userId,new Date().toISOString());
    return load();
  }

  async function openTarget(id){
    const target=current.items.find(item=>item.id===String(id||''));
    if(!target)throw notificationError('Choose a notification from the current inbox.','BQ_NOTIFICATION_NOT_FOUND');
    if(!target.route)throw notificationError('This notification does not have a migrated BibleQuest destination yet.','BQ_NOTIFICATION_TARGET_UNAVAILABLE');
    if(!target.isRead)await setRead(target.id,true);
    return target.route;
  }

  function clear(){
    const state=sessionState();
    current=Object.freeze({status:'idle',authenticated:state.authenticated===true,remoteAvailable:state.remoteAvailable!==false,userId:state.user?.id?String(state.user.id):'',items:Object.freeze([]),unread:0,error:''});
  }

  return Object.freeze({snapshot,load,refresh:load,setRead,markAllRead,openTarget,clear});
}

export const notificationCenterContract=Object.freeze({actionRoutes:ACTION_ROUTES,maxItems:100});
