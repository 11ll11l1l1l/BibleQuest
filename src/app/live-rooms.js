const ROOM_CODE=/^[A-Z0-9]{4,8}$/;
const ROOM_STATUSES=new Set(['lobby','active','ended']);
const ROOM_ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const cleanText=(value,max=80)=>String(value??'').replace(/\r\n?/g,'\n').trim().slice(0,max);
const roomError=(message,code)=>{const error=new Error(message);error.code=code;return error};
const normalizeCode=value=>cleanText(value,8).toUpperCase().replace(/[^A-Z0-9]/g,'');
function secureCode(){const bytes=new Uint8Array(6);crypto.getRandomValues(bytes);return [...bytes].map(value=>ROOM_ALPHABET[value%ROOM_ALPHABET.length]).join('')}
function normalizeRoom(row){
  const id=String(row?.id||''),congregationId=String(row?.congregation_id||''),createdBy=String(row?.created_by||''),sessionType=String(row?.session_type||''),roomCode=normalizeCode(row?.room_code),status=String(row?.status||'');
  if(!id||!congregationId||!createdBy||sessionType!=='live-room'||!ROOM_CODE.test(roomCode)||!ROOM_STATUSES.has(status))throw roomError('Live Rooms received malformed room data.','BQ_LIVE_ROOMS_MALFORMED');
  return Object.freeze({id,congregationId,createdBy,title:cleanText(row?.title,80)||'BibleQuest Live',roomCode,status,state:Object.freeze({...((row?.state&&typeof row.state==='object')?row.state:{})}),updatedAt:row?.updated_at||null});
}
function normalizeParticipants(result,room){
  const rows=Array.isArray(result?.participants)?result.participants:[],directory=Array.isArray(result?.directory)?result.directory:[],byId=new Map(directory.map(row=>[String(row?.user_id||''),row]));
  return Object.freeze(rows.filter(row=>String(row?.session_id||'')===room.id&&row?.user_id).map(row=>{const userId=String(row.user_id),member=byId.get(userId)||{};return Object.freeze({userId,displayName:cleanText(member.display_name,80)||'Member',avatar:member.avatar||null,joinedAt:row.created_at||null})}));
}
export function createLiveRoomsService({api,session,congregation,codeFactory=secureCode}){
  if(!api||!session||!congregation)throw new Error('Live Rooms requires shared API, session and congregation owners.');
  let memberships=[],membershipUserId='',room=null,participants=Object.freeze([]),connected=false,connectionStatus='idle',stopChannel=null;
  const listeners=new Set();
  const sessionState=()=>session.getState?.()||{};
  const identity=()=>{const state=sessionState();if(!state.authenticated||!state.user?.id)throw roomError('Sign in to use Live Rooms.','BQ_LIVE_ROOMS_AUTH_REQUIRED');if(state.remoteAvailable===false)throw roomError('Live Rooms are unavailable in local preview.','BQ_LIVE_ROOMS_REMOTE_DISABLED');return String(state.user.id)};
  const snapshot=()=>Object.freeze({authenticated:sessionState().authenticated===true,remoteAvailable:sessionState().remoteAvailable!==false,memberships:memberships.slice(),room,participants:participants.slice(),isHost:Boolean(room&&room.createdBy===String(sessionState().user?.id||'')),connected,connectionStatus});
  const emit=()=>{const state=snapshot();for(const listener of listeners)listener(state);return state};
  const disconnect=()=>{if(stopChannel)stopChannel();stopChannel=null;connected=false;connectionStatus=room?'disconnected':'idle';return emit()};
  const clearRoom=()=>{if(stopChannel)stopChannel();stopChannel=null;room=null;participants=Object.freeze([]);connected=false;connectionStatus='idle'};
  async function loadMemberships(){const userId=identity(),rows=await congregation.load();memberships=(Array.isArray(rows)?rows:[]).map(row=>Object.freeze({...row,canHost:congregation.can?.(row.congregationId,'ministry')===true}));membershipUserId=userId;return memberships}
  async function ensureMemberships(){const userId=identity();if(membershipUserId!==userId)await loadMemberships();return memberships}
  function requireMembership(congregationId){const membership=congregation.get(String(congregationId||''));if(!membership)throw roomError('Join this room’s congregation before using Live Rooms.','BQ_LIVE_ROOMS_CONGREGATION');return membership}
  async function refreshParticipants(){if(!room)return Object.freeze([]);participants=normalizeParticipants(await api.participants(room.id,room.congregationId),room);emit();return participants}
  async function attach(){
    if(!room||room.status==='ended')return;
    if(stopChannel)stopChannel();
    connectionStatus='connecting';
    stopChannel=await api.subscribe(room.id,event=>{
      if(!room)return;
      if(event?.type==='room'){
        try{const next=normalizeRoom(event.room);if(next.id!==room.id)return;room=next;if(room.status==='ended'){if(stopChannel)stopChannel();stopChannel=null;connected=false;connectionStatus='ended'}emit()}catch{connected=false;connectionStatus='error';emit()}
      }else if(event?.type==='participants'){void refreshParticipants().catch(()=>{connected=false;connectionStatus='error';emit()})}
      else if(event?.type==='connection'){connectionStatus=String(event.status||'').toLowerCase();connected=event.status==='SUBSCRIBED';emit()}
    });
    connected=true;connectionStatus='subscribed';emit();
  }
  async function activate(nextRoom,{joinParticipant=true}={}){
    const next=normalizeRoom(nextRoom);requireMembership(next.congregationId);
    if(next.status==='ended'){clearRoom();throw roomError('This Live Room has ended.','BQ_LIVE_ROOMS_ENDED')}
    if(stopChannel)stopChannel();stopChannel=null;participants=Object.freeze([]);connected=false;connectionStatus='connecting';room=next;
    if(joinParticipant)await api.joinParticipant(room.id,identity());
    await refreshParticipants();await attach();return snapshot();
  }
  async function load(){
    try{await ensureMemberships()}catch(error){if(error?.code==='BQ_LIVE_ROOMS_AUTH_REQUIRED'||error?.code==='BQ_LIVE_ROOMS_REMOTE_DISABLED'){memberships=[];membershipUserId='';clearRoom();emit()}throw error}
    if(room)await reconnect();else emit();return snapshot();
  }
  async function create({congregationId,title='BibleQuest Live'}={}){
    const userId=identity();await ensureMemberships();const id=String(congregationId||'');congregation.assert(id,'ministry');const name=cleanText(title,80)||'BibleQuest Live',roomCode=normalizeCode(codeFactory());if(!ROOM_CODE.test(roomCode))throw roomError('Live Rooms could not create a valid room code.','BQ_LIVE_ROOMS_CODE');
    const created=await api.create({congregation_id:id,created_by:userId,session_type:'live-room',title:name,room_code:roomCode,status:'lobby',state:{round:0,activity:'lobby'},metadata:{version:1}});return activate(created);
  }
  async function join(rawCode){
    identity();await ensureMemberships();const code=normalizeCode(rawCode);if(!ROOM_CODE.test(code))throw roomError('Enter a valid Live Room code.','BQ_LIVE_ROOMS_CODE');const found=await api.findByCode(code);if(!found)throw roomError('Live Room not found or already ended.','BQ_LIVE_ROOMS_NOT_FOUND');return activate(found);
  }
  async function reconnect(){
    identity();if(!room)throw roomError('There is no Live Room to reconnect.','BQ_LIVE_ROOMS_NO_ACTIVE');await ensureMemberships();const roomId=room.id;const fresh=await api.loadRoom(roomId);if(!fresh){clearRoom();emit();throw roomError('This Live Room is no longer available.','BQ_LIVE_ROOMS_NOT_FOUND')}try{return await activate(fresh)}catch(error){if(error?.code==='BQ_LIVE_ROOMS_ENDED')emit();throw error}
  }
  function leave(){clearRoom();return emit()}
  async function end(){const userId=identity();if(!room||room.createdBy!==userId)throw roomError('Only the room host can end this Live Room.','BQ_LIVE_ROOMS_PERMISSION');const roomId=room.id;const ended=await api.endRoom(roomId,userId);if(!ended)throw roomError('Live Room could not be ended.','BQ_LIVE_ROOMS_NOT_FOUND');clearRoom();return emit()}
  function clear(){memberships=[];membershipUserId='';clearRoom();emit()}
  function subscribe(listener){if(typeof listener!=='function')return()=>{};listeners.add(listener);listener(snapshot());return()=>listeners.delete(listener)}
  return Object.freeze({snapshot,load,create,join,reconnect,disconnect,leave,end,clear,subscribe});
}
