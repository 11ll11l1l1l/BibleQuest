const YOUTUBE_ID=/^[A-Za-z0-9_-]{6,20}$/;
export const RECORDING_CATEGORIES=Object.freeze(['sunday-service','bible-study','worship','testimony','kids','family-couples','other']);
const cloneRows=rows=>Object.freeze(rows.map(row=>Object.freeze({...row})));
const snapshot=state=>Object.freeze({...state,rows:cloneRows(state.rows),latestService:state.latestService?Object.freeze({...state.latestService}):null});
const youtubeIdFromUrl=value=>{
  try{
    const url=new URL(String(value||'')),host=url.hostname.toLowerCase().replace(/^www\./,'').replace(/^m\./,'');
    if(host==='youtu.be')return url.pathname.match(/^\/([A-Za-z0-9_-]{6,20})\/?$/)?.[1]||'';
    if(host!=='youtube.com')return'';
    const live=url.pathname.match(/^\/live\/([A-Za-z0-9_-]{6,20})\/?$/)?.[1];
    if(live)return live;
    const shorts=url.pathname.match(/^\/shorts\/([A-Za-z0-9_-]{6,20})\/?$/)?.[1];
    if(shorts)return shorts;
    const watch=url.searchParams.get('v');
    return (watch&&YOUTUBE_ID.test(watch))?watch:'';
  }catch{return''}
};

function normalizeRow(row){
  if(!row||typeof row!=='object')return null;
  const id=String(row.id||'').trim(),storedId=String(row.youtube_id||row.youtubeId||'').trim(),derivedId=youtubeIdFromUrl(row.youtube_url||row.youtubeUrl),youtubeId=YOUTUBE_ID.test(storedId)?storedId:derivedId,title=String(row.title||'').trim();
  if(!id||!YOUTUBE_ID.test(youtubeId)||!title)return null;
  const rawCategory=String(row.category||'other');
  const category=RECORDING_CATEGORIES.includes(rawCategory)?rawCategory:'other';
  return {id,youtubeId,title:title.slice(0,180),description:String(row.description||'').trim().slice(0,2500),featured:Boolean(row.featured),category,createdAt:String(row.created_at||row.createdAt||'')};
}

const newestFirst=(a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''));

function latestServiceFromRows(rows){
  const sundayServices=rows.filter(row=>row.category==='sunday-service');
  const candidates=sundayServices.length?sundayServices:rows;
  return candidates.slice().sort(newestFirst)[0]||null;
}

export function createRecordingsService({media,audio,session,congregation}){
  if(!media||!audio||!session)throw new Error('Recordings service requires media, audio, and session owners.');
  let state={status:'idle',rows:[],selectedId:null,error:'',access:'unknown',latestService:null};
  const getState=()=>snapshot(state);
  const set=patch=>{state={...state,...patch};return getState()};

  async function load(){
    audio.unload();
    if(!session.isAuthenticated())return set({status:'locked',rows:[],selectedId:null,error:'',access:'signin',latestService:null});
    set({status:'loading',rows:[],selectedId:null,error:'',access:'granted',latestService:null});
    try{
      const input=await media.listLiveRecordings();
      const seen=new Set();
      const normalized=(Array.isArray(input)?input:[]).map(normalizeRow).filter(Boolean).sort(newestFirst);
      const rows=normalized.filter(row=>!seen.has(row.youtubeId)&&seen.add(row.youtubeId));
      return set({status:'ready',rows,selectedId:null,error:'',access:'granted',latestService:latestServiceFromRows(rows)});
    }catch(error){
      return set({status:'error',rows:[],selectedId:null,error:error?.message||'Could not load recordings.',access:'granted',latestService:null});
    }
  }

  function select(id,host){
    const row=state.rows.find(item=>item.id===String(id||''));
    if(!row)throw new Error('Recording is no longer available.');
    audio.mount(host,{kind:'youtube',id:row.youtubeId,title:row.title});
    return set({selectedId:row.id,error:''});
  }
  const requireSelection=()=>{if(!state.selectedId)throw new Error('Choose a recording first.');};
  function play(){requireSelection();audio.play();return getState()}
  function pause(){requireSelection();audio.pause();return getState()}
  function stop(){requireSelection();audio.stop();return getState()}
  function seek(seconds){requireSelection();audio.seek(seconds);return getState()}
  function leave(){audio.unload();return set({selectedId:null,error:''})}
  function dispose(){audio.dispose();state={status:'idle',rows:[],selectedId:null,error:'',access:'unknown',latestService:null}}

  async function addVideo({title,description='',youtubeUrl,congregationId,featured=false,category='other'}={}){
    const sessionState=session.getState?.();
    if(!sessionState?.authenticated||!sessionState?.user?.id)throw new Error('Sign in to add a video.');
    let id=String(congregationId||'');
    if(!id&&congregation){const memberships=await congregation.load();id=String(memberships?.[0]?.congregationId||'');}
    if(!id)throw new Error('Join a congregation before adding a video.');
    const youtubeId=youtubeIdFromUrl(youtubeUrl);
    if(!YOUTUBE_ID.test(youtubeId))throw new Error('Enter a valid YouTube video, live, or shorts link.');
    if(state.rows.some(row=>row.youtubeId===youtubeId))throw new Error('This YouTube recording is already in Videos.');
    const cleanTitle=String(title||'').trim();
    if(cleanTitle.length<2)throw new Error('Enter a title for this video.');
    const cleanCategory=RECORDING_CATEGORIES.includes(String(category))?String(category):'other';
    const created=await media.createVideo({congregation_id:id,created_by:sessionState.user.id,media_type:'youtube_video',title:cleanTitle.slice(0,160),description:String(description||'').trim().slice(0,2500),youtube_url:String(youtubeUrl||'').trim(),youtube_id:youtubeId,featured:Boolean(featured),category:cleanCategory});
    await load();
    return created;
  }
  async function setFeatured(id,featured){
    const updated=await media.updateVideo(id,{featured:Boolean(featured)});
    await load();
    return updated;
  }
  async function archive(id){
    const updated=await media.updateVideo(id,{active:false});
    await load();
    return updated;
  }

  return Object.freeze({getState,load,select,play,pause,stop,seek,leave,dispose,addVideo,setFeatured,archive,getLatestService:()=>getState().latestService,getAudioState:audio.getState,getPlayerCount:audio.getPlayerCount});
}
