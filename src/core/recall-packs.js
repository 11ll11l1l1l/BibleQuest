const MANIFEST_PATH='data/packs/manifest.json';
const SOURCE='unfoldingWord Translation Questions v90';
const LICENSE='CC BY-SA 4.0';
const freezeBook=row=>Object.freeze({code:row.code,name:row.name,questions:row.questions,path:row.path});
const freezeItem=row=>Object.freeze({id:row.id,reference:row.r||'',question:row.q,answer:row.a});
const validCode=value=>/^[0-9A-Z]{3}$/.test(String(value||''));

export function createRecallPackService({fetcher=(...args)=>fetch(...args)}={}){
  if(typeof fetcher!=='function')throw new Error('Recall Pack service requires a fetch function.');
  let manifestPromise=null;
  const bookCache=new Map();

  async function loadManifest(){
    if(manifestPromise)return manifestPromise;
    manifestPromise=(async()=>{
      const response=await fetcher(MANIFEST_PATH);
      if(!response?.ok)throw new Error('Per-book Recall library is unavailable.');
      const payload=await response.json();
      if(!payload||typeof payload!=='object'||!Array.isArray(payload.question_books))throw new Error('Per-book Recall manifest is malformed.');
      const seen=new Set(),books=[];
      for(const row of payload.question_books){
        const code=String(row?.code||'').toUpperCase(),name=String(row?.name||'').trim(),questions=Number(row?.questions),path=String(row?.path||'');
        if(!validCode(code)||!name||!Number.isSafeInteger(questions)||questions<1||path!==`data/packs/questions/${code}.json`)continue;
        if(seen.has(code))throw new Error(`Per-book Recall manifest has duplicate book ${code}.`);
        seen.add(code);books.push(freezeBook({code,name,questions,path}));
      }
      if(!books.length)throw new Error('Per-book Recall manifest contains no usable books.');
      return Object.freeze({source:SOURCE,license:LICENSE,books:Object.freeze(books)});
    })();
    try{return await manifestPromise}catch(error){manifestPromise=null;throw error}
  }

  async function loadBook(code){
    const normalized=String(code||'').toUpperCase();
    if(!validCode(normalized))throw new Error('Choose a valid Per-book Recall book.');
    if(bookCache.has(normalized))return bookCache.get(normalized);
    const pending=(async()=>{
      const manifest=await loadManifest();
      const book=manifest.books.find(row=>row.code===normalized);
      if(!book)throw new Error('That Bible book has no Per-book Recall pack.');
      const response=await fetcher(book.path);
      if(!response?.ok)throw new Error(`${book.name} Recall pack is unavailable.`);
      const payload=await response.json();
      if(!Array.isArray(payload))throw new Error(`${book.name} Recall pack is malformed.`);
      const seen=new Set(),items=[];
      for(const row of payload){
        if(row?.safety?.action!=='allow')continue;
        const id=String(row?.id||'').trim(),question=String(row?.q||'').trim(),answer=String(row?.a||'').trim(),reference=String(row?.r||'').trim();
        if(!id||id.length>100||!question||!answer)continue;
        if(seen.has(id))throw new Error(`${book.name} Recall pack contains duplicate item ${id}.`);
        seen.add(id);items.push(freezeItem({id,q:question,a:answer,r:reference}));
      }
      if(!items.length)throw new Error(`${book.name} Recall pack contains no approved questions.`);
      return Object.freeze({book,source:manifest.source,license:manifest.license,items:Object.freeze(items)});
    })();
    bookCache.set(normalized,pending);
    try{return await pending}catch(error){bookCache.delete(normalized);throw error}
  }

  return Object.freeze({loadManifest,loadBook,clearCache(){manifestPromise=null;bookCache.clear()},cacheSize(){return bookCache.size}});
}
