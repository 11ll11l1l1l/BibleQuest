const validCode=value=>/^[0-9A-Z]{3}$/.test(String(value||''));
const validId=value=>typeof value==='string'&&value.trim().length>0&&value.trim().length<=100;

export function createRecallReviewInterface({storage,key='games-recall'}={}){
  if(!storage)throw new Error('Recall review interface requires the Storage boundary.');
  const normalize=raw=>{const value=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{},review={};if(value.review&&typeof value.review==='object'&&!Array.isArray(value.review))for(const [code,ids] of Object.entries(value.review))if(validCode(code)&&Array.isArray(ids))review[code]=[...new Set(ids.map(id=>String(id||'').trim()).filter(validId))].slice(0,5000);return{...value,version:1,review}};
  const read=()=>normalize(storage.read(key,{version:1,review:{},stats:{},results:{}}));
  function snapshot(){const review=read().review,out={};for(const [code,ids] of Object.entries(review))out[code]=Object.freeze([...ids]);return Object.freeze(out)}
  function sync(code,id,needsReview){const normalizedCode=String(code||'').toUpperCase(),normalizedId=String(id||'').trim();if(!validCode(normalizedCode)||!validId(normalizedId))throw new Error('Recall review item identity is invalid.');const current=read(),ids=current.review[normalizedCode]||[],nextIds=needsReview?[...new Set([...ids,normalizedId])]:ids.filter(item=>item!==normalizedId),next={...current,review:{...current.review,[normalizedCode]:nextIds}};storage.write(key,next);return Object.freeze([...nextIds])}
  return Object.freeze({snapshot,sync});
}
