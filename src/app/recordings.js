const YOUTUBE_ID=/^[A-Za-z0-9_-]{6,20}$/;
const cloneRows=rows=>Object.freeze(rows.map(row=>Object.freeze({...row})));
const snapshot=state=>Object.freeze({...state,rows:cloneRows(state.rows)});

function normalizeRow(row){
  if(!row||typeof row!=='object')return null;
  const id=String(row.id||'').trim(),youtubeId=String(row.youtube_id||row.youtubeId||'').trim(),title=String(row.title||'').trim();
  if(!id||!YOUTUBE_ID.test(youtubeId)||!title)return null;
  return {id,youtubeId,title:title.slice(0,180),description:String(row.description||'').trim().slice(0,2500),featured:Boolean(row.featured),createdAt:String(row.created_at||row.createdAt||'')};
}

export function createRecordingsService({media,audio,session}){
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

  return Object.freeze({getState,load,select,play,pause,stop,seek,leave,dispose,getAudioState:audio.getState,getPlayerCount:audio.getPlayerCount});
}
