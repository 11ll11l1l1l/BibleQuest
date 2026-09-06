const freezeRows=rows=>Object.freeze(rows.map(row=>Object.freeze({...row})));
const freezeState=state=>Object.freeze({...state,rows:freezeRows(state.rows)});
const normalizeText=value=>String(value||'').trim().toLowerCase();

export function createMediaLibraryService({recordings}){
  if(!recordings)throw new Error('Media Library requires the verified Recordings owner.');
  let state={status:'idle',rows:[],view:'all',query:'',selectedId:null,error:'',access:'unknown'};
  const getState=()=>freezeState(state);
  const set=patch=>{state={...state,...patch};return getState()};

  function visibleRows(input=state){
    const query=normalizeText(input.query);
    return freezeRows(input.rows.filter(row=>{
      if(input.view==='featured'&&!row.featured)return false;
      if(!query)return true;
      return normalizeText(`${row.title} ${row.description}`).includes(query);
    }));
  }

  async function load(){
    const result=await recordings.load();
    if(result.status==='locked')return set({status:'locked',rows:[],selectedId:null,error:'',access:result.access||'signin'});
    if(result.status==='error')return set({status:'error',rows:[],selectedId:null,error:result.error||'Could not load Media Library.',access:result.access||'granted'});
    return set({status:'ready',rows:[...(result.rows||[])],selectedId:null,error:'',access:result.access||'granted'});
  }

  function setView(view){
    if(!['all','featured'].includes(view))throw new Error('Unknown Media Library view.');
    recordings.leave();
    return set({view,selectedId:null,error:''});
  }

  function setQuery(query){
    recordings.leave();
    return set({query:String(query||'').trim().slice(0,120),selectedId:null,error:''});
  }

  function open(id,host){
    const row=state.rows.find(item=>item.id===String(id||''));
    if(!row)throw new Error('Media item is no longer available.');
    recordings.select(row.id,host);
    return set({selectedId:row.id,error:''});
  }

  function selected(){return state.rows.find(row=>row.id===state.selectedId)||null}
  function play(){if(!state.selectedId)throw new Error('Choose a media item first.');recordings.play();return getState()}
  function pause(){if(!state.selectedId)throw new Error('Choose a media item first.');recordings.pause();return getState()}
  function stop(){if(!state.selectedId)throw new Error('Choose a media item first.');recordings.stop();return getState()}
  function seek(seconds){if(!state.selectedId)throw new Error('Choose a media item first.');recordings.seek(seconds);return getState()}
  function returnToBrowse(){recordings.leave();return set({selectedId:null,error:''})}
  function leave(){recordings.leave();state={status:'idle',rows:[],view:'all',query:'',selectedId:null,error:'',access:'unknown'};return getState()}

  return Object.freeze({getState,load,setView,setQuery,visibleRows,open,selected,play,pause,stop,seek,returnToBrowse,leave,getPlayerCount:recordings.getPlayerCount});
}
