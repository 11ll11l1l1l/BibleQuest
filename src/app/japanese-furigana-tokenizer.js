const SCRIPT_URL='https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/build/kuromoji.js';
const DICT_URL='https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/';

export function createJapaneseFuriganaTokenizerRuntime({documentRef=globalThis.document,windowRef=globalThis.window}={}){
  let tokenizer=null, tokenizerPromise=null;
  function loadScript(){
    if(windowRef?.kuromoji) return Promise.resolve();
    if(!documentRef?.head) return Promise.reject(new Error('Japanese reading engine requires a browser document.'));
    const selector='script[data-bq-jp-kuromoji]';
    const existing=documentRef.querySelector(selector);
    if(existing){
      if(existing.dataset.state==='loaded'&&windowRef?.kuromoji) return Promise.resolve();
      if(existing.dataset.state==='error'||existing.dataset.state==='loaded') existing.remove();
      else return new Promise((resolve,reject)=>{
        existing.addEventListener('load',()=>windowRef?.kuromoji?resolve():reject(new Error('Japanese reading engine did not initialize.')),{once:true});
        existing.addEventListener('error',()=>reject(new Error('Japanese reading engine could not load.')),{once:true});
      });
    }
    return new Promise((resolve,reject)=>{
      const script=documentRef.createElement('script');
      script.src=SCRIPT_URL;
      script.async=true;
      script.dataset.bqJpKuromoji='1';
      script.dataset.state='loading';
      script.addEventListener('load',()=>{script.dataset.state='loaded';windowRef?.kuromoji?resolve():reject(new Error('Japanese reading engine did not initialize.'))},{once:true});
      script.addEventListener('error',()=>{script.dataset.state='error';script.remove();reject(new Error('Japanese reading engine could not load.'))},{once:true});
      documentRef.head.appendChild(script);
    });
  }
  async function getTokenizer(){
    if(tokenizer) return tokenizer;
    if(!tokenizerPromise) tokenizerPromise=(async()=>{
      await loadScript();
      return new Promise((resolve,reject)=>windowRef.kuromoji.builder({dicPath:DICT_URL}).build((error,built)=>error?reject(error):resolve(built)));
    })();
    try{tokenizer=await tokenizerPromise;return tokenizer}catch(error){tokenizerPromise=null;throw error}
  }
  return Object.freeze({async tokenize(text){return (await getTokenizer()).tokenize(String(text||''))}});
}
