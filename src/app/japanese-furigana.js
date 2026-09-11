import { JAPANESE_VOCABULARY_TERMS } from '../features/reader/vocabulary-content.js';

const STORAGE_KEY='japanese-furigana';
const MODES=Object.freeze(['off','support','all']);
const DEFAULT_STATE=Object.freeze({version:1,mode:'support'});
const TERMS=Object.freeze([...JAPANESE_VOCABULARY_TERMS].sort((a,b)=>b.term.length-a.term.length));
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const hiragana=value=>String(value||'').replace(/[ァ-ヶ]/g,char=>String.fromCharCode(char.charCodeAt(0)-0x60));
const hasKanji=value=>/[一-龯々〆ヵヶ]/.test(String(value||''));

function supportRuby(text){
  const source=String(text||'');
  let html=escapeHtml(source), used=[];
  for(const item of TERMS){
    if(!source.includes(item.term)) continue;
    const token=`@@BQJPF${used.length}@@`;
    html=html.split(escapeHtml(item.term)).join(token);
    used.push({token,html:`<ruby>${escapeHtml(item.term)}<rt>${escapeHtml(item.reading)}</rt></ruby>`});
  }
  for(const item of used) html=html.split(item.token).join(item.html);
  return html;
}

export function createJapaneseFuriganaService({storage,tokenizer=null}){
  if(!storage) throw new Error('Japanese furigana service requires Storage.');
  const normalize=input=>({version:1,mode:MODES.includes(input?.mode)?input.mode:'support'});
  let state=normalize(storage.read(STORAGE_KEY,DEFAULT_STATE));
  const getState=()=>Object.freeze({...state});
  const persist=()=>{storage.write(STORAGE_KEY,state);return getState()};
  function setMode(mode){
    if(!MODES.includes(mode)) throw new Error(`Unsupported Japanese furigana mode: ${mode}`);
    state={...state,mode};
    return persist();
  }
  async function render(text){
    const source=String(text||''), mode=state.mode;
    if(mode==='off') return Object.freeze({html:escapeHtml(source),mode,fallback:false});
    if(mode==='support') return Object.freeze({html:supportRuby(source),mode,fallback:false});
    try{
      if(!tokenizer?.tokenize) throw new Error('Japanese tokenizer unavailable.');
      const tokens=await tokenizer.tokenize(source);
      const html=(tokens||[]).map(token=>{
        const surface=String(token?.surface_form||''), reading=hiragana(token?.reading||'');
        return hasKanji(surface)&&reading?`<ruby>${escapeHtml(surface)}<rt>${escapeHtml(reading)}</rt></ruby>`:escapeHtml(surface);
      }).join('');
      if(!html&&source) throw new Error('Japanese tokenizer returned no text.');
      return Object.freeze({html,mode,fallback:false});
    }catch{
      return Object.freeze({html:supportRuby(source),mode,fallback:true});
    }
  }
  return Object.freeze({getState,setMode,render,modes:MODES});
}
