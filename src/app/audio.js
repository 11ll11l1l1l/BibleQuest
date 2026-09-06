const YOUTUBE_ID=/^[A-Za-z0-9_-]{6,20}$/;

const freeze=value=>Object.freeze({...value,source:value.source?Object.freeze({...value.source}):null});
const cleanSource=input=>{
  if(!input||input.kind!=='youtube'||!YOUTUBE_ID.test(String(input.id||'')))throw new Error('Audio player requires a valid YouTube recording source.');
  return Object.freeze({kind:'youtube',id:String(input.id),title:String(input.title||'Recording').trim().slice(0,180)});
};

export function createAudioManager(){
  let frame=null,host=null,disposed=false;
  let state=freeze({status:'idle',source:null,position:0,error:'',instance:0});
  const getState=()=>state;
  const publish=patch=>{state=freeze({...state,...patch});return state};
  const ensureActive=()=>{if(disposed)throw new Error('Audio player has been disposed.');if(!frame||!state.source)throw new Error('Choose a recording before using playback controls.');};
  const command=(func,args=[])=>{
    ensureActive();
    try{frame.contentWindow?.postMessage(JSON.stringify({event:'command',func,args}),'https://www.youtube-nocookie.com')}catch(error){publish({status:'error',error:error?.message||'Playback command failed.'});throw error}
  };

  function unload(){
    if(frame){try{frame.src='about:blank'}catch{}frame.remove()}
    frame=null;host=null;
    return publish({status:'idle',source:null,position:0,error:''});
  }

  function mount(target,input){
    if(disposed)throw new Error('Audio player has been disposed.');
    if(!(target instanceof Element))throw new Error('Audio player requires a valid host element.');
    const source=cleanSource(input);
    unload();
    host=target;
    host.replaceChildren();
    frame=document.createElement('iframe');
    frame.dataset.bqAudioPlayer='1';
    frame.title=`BibleQuest recording: ${source.title}`;
    frame.loading='eager';
    frame.allow='autoplay; encrypted-media; picture-in-picture';
    frame.allowFullscreen=true;
    frame.referrerPolicy='strict-origin-when-cross-origin';
    const origin=encodeURIComponent(location.origin);
    frame.src=`https://www.youtube-nocookie.com/embed/${encodeURIComponent(source.id)}?enablejsapi=1&playsinline=1&rel=0&origin=${origin}`;
    const instance=state.instance+1;
    publish({status:'loading',source,position:0,error:'',instance});
    frame.addEventListener('load',()=>{if(frame&&state.instance===instance)publish({status:'ready',error:''})},{once:true});
    frame.addEventListener('error',()=>{if(frame&&state.instance===instance)publish({status:'error',error:'The recording player could not load.'})},{once:true});
    host.append(frame);
    return getState();
  }

  function play(){command('playVideo');return publish({status:'playing',error:''})}
  function pause(){command('pauseVideo');return publish({status:'paused',error:''})}
  function stop(){command('stopVideo');return publish({status:'stopped',position:0,error:''})}
  function seek(seconds){const value=Number(seconds);if(!Number.isFinite(value)||value<0||value>86400)throw new Error('Seek position must be from 0 to 86400 seconds.');command('seekTo',[value,true]);return publish({position:value,error:''})}
  function dispose(){unload();disposed=true}

  return Object.freeze({getState,mount,play,pause,stop,seek,unload,dispose,getPlayerCount:()=>frame&&frame.isConnected?1:0});
}
