const YOUTUBE_ID=/^[A-Za-z0-9_-]{6,20}$/;
const cloneRows=rows=>Object.freeze(rows.map(row=>Object.freeze({...row})));
const snapshot=state=>Object.freeze({...state,rows:cloneRows(state.rows)});
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
  return {id,youtubeId,title:title.slice(0,180),description:String(row.description||'').trim().slice(0,2500),featured:Boolean(row.featured),createdAt:String(row.created_at||row.createdAt||'')};
}

export function createRecordingsService({media,audio,session,congregation}){
  if(!media||!audio||!session)throw new Error('Recordings service requires media, audio, and session owners.');
  let state={status:'idle',rows:[],selectedId:null,error:'',access:'unknown'};
  const getState=()=>snapshot(state);
  const set=patch=>{state={...state,...patch};return getState()};

  async function load(){
    audio.unload();
    if(!session.isAuthenticated())return set({status:'locked',rows:[],selectedId:null,error:'',access:'signin'});
    set({status:'loading',rows:[],selectedId:null,error:'',access:'granted'});
    try{
      const input=await media.listLiveRecordings();
      const rows=(Array.isArray(input)?input:[]).map(normalizeRow).filter(Boolean);
      return set({status:'ready',rows,selectedId:null,error:'',access:'granted'});
    }catch(error){
      return set({status:'error',rows:[],selectedId:null,error:error?.message||'Could not load recordings.',access:'granted'});
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
  function dispose(){audio.dispose();state={status:'idle',rows:[],selectedId:null,error:'',access:'unknown'}}

  async function addVideo({title,description='',youtubeUrl,congregationId,featured=false}={}){
    const state=session.getState?.();
    if(!state?.authenticated||!state?.user?.id)throw new Error('Sign in to add a video.');
    let id=String(congregationId||'');
    if(!id&&congregation){const memberships=await congregation.load();id=String(memberships?.[0]?.congregationId||'');}
    if(!id)throw new Error('Join a congregation before adding a video.');
    const youtubeId=youtubeIdFromUrl(youtubeUrl);
    if(!YOUTUBE_ID.test(youtubeId))throw new Error('Enter a valid YouTube video, live, or shorts link.');
    const cleanTitle=String(title||'').trim();
    if(cleanTitle.length<2)throw new Error('Enter a title for this video.');
    // The insert itself is the real authorization check (RLS requires a
    // leader/pastor/admin/platform-admin role via private.bible_can_review_content) -
    // this call is never assumed to succeed just because the form was shown.
    const created=await media.createVideo({congregation_id:id,created_by:state.user.id,media_type:'youtube_video',title:cleanTitle.slice(0,160),description:String(description||'').trim().slice(0,2500),youtube_url:String(youtubeUrl||'').trim(),youtube_id:youtubeId,featured:Boolean(featured)});
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

  return Object.freeze({getState,load,select,play,pause,stop,seek,leave,dispose,addVideo,setFeatured,archive,getAudioState:audio.getState,getPlayerCount:audio.getPlayerCount});
}
