const RANGE_ENDPOINT='https://api.pwnedpasswords.com/range/';
const DEFAULT_TIMEOUT_MS=5000;

function securityError(message:string,code:string){const error=new Error(message) as Error&{code?:string};error.code=code;return error}

export async function sha1Hex(value:string){
  const bytes=new TextEncoder().encode(String(value??''));
  const digest=await crypto.subtle.digest('SHA-1',bytes);
  return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('').toUpperCase();
}

export function pwnedCountFromRange(rangeText:string,suffix:string){
  const wanted=String(suffix||'').trim().toUpperCase();
  for(const rawLine of String(rangeText||'').split(/\r?\n/)){
    const [candidate,countText]=rawLine.trim().split(':',2);
    if(!candidate||candidate.toUpperCase()!==wanted)continue;
    const count=Number(countText||0);
    return Number.isFinite(count)&&count>0?count:0;
  }
  return 0;
}

export async function pwnedPasswordCount(password:string,{fetcher=fetch,timeoutMs=DEFAULT_TIMEOUT_MS}:{fetcher?:typeof fetch,timeoutMs?:number}={}){
  const value=String(password??'');
  if(!value)throw securityError('Password is required.','BQ_PASSWORD_REQUIRED');
  const hash=await sha1Hex(value),prefix=hash.slice(0,5),suffix=hash.slice(5);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetcher(`${RANGE_ENDPOINT}${prefix}`,{method:'GET',headers:{'Add-Padding':'true','User-Agent':'BibleQuest/6 password-security'},signal:controller.signal});
    if(!response?.ok)throw securityError('Password safety check is temporarily unavailable. Try again.','BQ_PASSWORD_BREACH_CHECK_UNAVAILABLE');
    return pwnedCountFromRange(await response.text(),suffix);
  }catch(error){
    if((error as Error&{code?:string})?.code)throw error;
    throw securityError('Password safety check is temporarily unavailable. Try again.','BQ_PASSWORD_BREACH_CHECK_UNAVAILABLE');
  }finally{clearTimeout(timer)}
}

export async function assertPasswordNotCompromised(password:string,options:{fetcher?:typeof fetch,timeoutMs?:number}={}){
  const count=await pwnedPasswordCount(password,options);
  if(count>0)throw securityError('Choose a different password. This password appears in known breach data.','BQ_PASSWORD_COMPROMISED');
  return true;
}
