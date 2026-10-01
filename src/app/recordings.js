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
  const id=String(row.id||'').trim(),congregationId=String(row.congregation_id||row.congregationId||'').trim(),storedId=String(row.youtube_id||row.youtubeId||'').trim(),derivedId=youtubeIdFromUrl(row.youtube_url||row.youtubeUrl),youtubeId=YOUTUBE_ID.test(storedId)?storedId:derivedId,title=String(row.title||'').trim();
  if(!id||!YOUTUBE_ID.test(youtubeId)||!title)return null;
  const rawCategory=String(row.category||'other');
  const category=RECORDING_CATEGORIES.includes(rawCategory)?rawCategory:'other';
  return {id,congregationId,youtubeId,title:title.slice(0,180),description:String(row.description||'').trim().slice(0,2500),featured:Boolean(row.featured),category,createdAt:String(row.created_at||row.createdAt||'')};
}

const newestFirst=(a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''));

function latestServiceFromRows(rows){
  const sundayServices=rows.filter(row=>row.category==='sunday-service');
  const candidates=sundayServices.length?sundayServices:rows;
  return candidates.slice().sort(newestFirst)[0]||null;
}

export function createRecordingsService({media,audio,session,congregation}){
  if(!media||!audio||!session||!congregation)throw new Error('Recordings service requires media, audio, session, and congregation owners.');
  let state={status:'idle',rows:[],selectedId:null,error:'',access:'unknown',latestService:null};
  const getState=()=>snapshot(state);
  const set=patch=>{state={...state,...patch};return getState()};

  async function load(){
    await audio.unload();
    if(!session.isAuthenticated())return set({status:'locked',rows:[],selectedId:null,error:'',access:'signin',latestService:null});
    set({status:'loading',rows:[],selectedId:null,error:'',access:'granted',latestService:null});
    try{
      await congregation.load();
      const account=session.getState?.(),userId=String(account?.user?.id||''),active=congregation.getActive?.(),tenantId=String(active?.congregationId||'');
      if(!tenantId||(userId&&active?.userId&&String(active.userId)!==userId))return set({status:'ready',rows:[],selectedId:null,error:'',access:'granted',latestService:null});
      const input=await media.listLiveRecordings(tenantId);
      const current=congregation.getActive?.();
      if(String(current?.congregationId||'')!==tenantId||(userId&&current?.userId&&String(current.userId)!==userId))return set({status:'ready',rows:[],selectedId:null,error:'',access:'granted',latestService:null});
      const seen=new Set();
      const normalized=(Array.isArray(input)?input:[]).map(normalizeRow).filter(Boolean).sort(newestFirst);
      const rows=normalized.filter(row=>row.congregationId===tenantId&&!seen.has(row.youtubeId)&&seen.add(row.youtubeId));
      return set({status:'ready',rows,selectedId:null,error:'',access:'granted',latestService:latestServiceFromRows(rows)});
    }catch(error){
      return set({status:'error',rows:[],selectedId:null,error:error?.message||'Could not load recordings.',access:'granted',latestService:null});
    }
  }

  const afterAudio=(result,done)=>result&&typeof result.then==='function'?result.then(done):done();
  function select(id,host){
    const row=state.rows.find(item=>item.id===String(id||''));
    if(!row)throw new Error('Recording is no longer available.');
    return afterAudio(audio.mount(host,{kind:'youtube',id:row.youtubeId,title:row.title}),()=>set({selectedId:row.id,error:''}));
  }
  const requireSelection=()=>{if(!state.selectedId)throw new Error('Choose a recording first.');};
  function play(){requireSelection();return afterAudio(audio.play(),()=>getState())}
  function pause(){requireSelection();return afterAudio(audio.pause(),()=>getState())}
  function stop(){requireSelection();return afterAudio(audio.stop(),()=>getState())}
  function seek(seconds){requireSelection();return afterAudio(audio.seek(seconds),()=>getState())}
  function leave(){audio.unload();return set({selectedId:null,error:''})}
  function dispose(){audio.dispose();state={status:'idle',rows:[],selectedId:null,error:'',access:'unknown',latestService:null}}

  const assertCurationContext=scope=>{
    if(!congregation)throw new Error('Denied.');
    const sessionState=session.getState?.(),active=congregation.getActive?.();
    if(!sessionState?.authenticated||String(sessionState.user?.id||'')!==scope.userId||String(active?.congregationId||'')!==scope.congregationId||String(active?.userId||'')!==scope.userId||!congregation.can(scope.congregationId,'ministry'))throw new Error('Denied.');
  };
  async function requireCurationScope(expectedCongregationId=''){
    if(!congregation)throw new Error('Denied.');
    const sessionState=session.getState?.();
    if(!sessionState?.authenticated||!sessionState.user?.id)throw new Error('Sign in to add or manage a video.');
    const userId=String(sessionState.user.id);
    await congregation.load();
    const active=congregation.getActive?.(),congregationId=String(active?.congregationId||'');
    const scope=Object.freeze({userId,congregationId});
    assertCurationContext(scope);
    if(expectedCongregationId&&String(expectedCongregationId)!==congregationId)throw new Error('Denied.');
    return scope;
  }

  async function addVideo({title,description='',youtubeUrl,congregationId,featured=false,category='other'}={}){
    const scope=await requireCurationScope(congregationId);
    const youtubeId=youtubeIdFromUrl(youtubeUrl);
    if(!YOUTUBE_ID.test(youtubeId))throw new Error('Enter a valid YouTube video, live, or shorts link.');
    if(state.rows.some(row=>row.youtubeId===youtubeId))throw new Error('This YouTube recording is already in Videos.');
    const cleanTitle=String(title||'').trim();
    if(cleanTitle.length<2)throw new Error('Enter a title for this video.');
    const cleanCategory=RECORDING_CATEGORIES.includes(String(category))?String(category):'other';
    const created=await media.createVideo(scope.congregationId,{created_by:scope.userId,media_type:'youtube_video',title:cleanTitle.slice(0,160),description:String(description||'').trim().slice(0,2500),youtube_url:String(youtubeUrl||'').trim(),youtube_id:youtubeId,featured:Boolean(featured),category:cleanCategory});
    assertCurationContext(scope);
    await load();
    return created;
  }
  async function setFeatured(id,featured){
    const row=state.rows.find(item=>item.id===String(id||''));
    if(!row)throw new Error('Recording is no longer available.');
    if(!row.congregationId)throw new Error('Reload Videos before managing this recording.');
    const scope=await requireCurationScope(row.congregationId);
    const updated=await media.updateVideo(scope.congregationId,row.id,{featured:Boolean(featured)});
    assertCurationContext(scope);
    await load();
    return updated;
  }
  async function archive(id){
    const row=state.rows.find(item=>item.id===String(id||''));
    if(!row)throw new Error('Recording is no longer available.');
    if(!row.congregationId)throw new Error('Reload Videos before managing this recording.');
    const scope=await requireCurationScope(row.congregationId);
    const updated=await media.updateVideo(scope.congregationId,row.id,{active:false});
    assertCurationContext(scope);
    await load();
    return updated;
  }

  function getResumePosition(recordingId){
    const row=state.rows.find(item=>item.id===String(recordingId||''));
    if(!row||typeof audio.getSavedPosition!=='function')return 0;
    const seconds=Number(audio.getSavedPosition(row.youtubeId));
    return Number.isFinite(seconds)&&seconds>0&&seconds<=604800?seconds:0;
  }

  return Object.freeze({getState,load,select,play,pause,stop,seek,leave,dispose,addVideo,setFeatured,archive,getLatestService:()=>getState().latestService,getAudioState:audio.getState,getPlayerCount:audio.getPlayerCount,getResumePosition});
}
