import { createClient } from 'npm:@supabase/supabase-js@2.112.4';

const PRIMARY_ORIGIN='https://mybiblequest.pages.dev';
const LEGACY_ORIGIN='https://11ll11l1l1l.github.io';
const CLOUDFLARE_PROJECTS=['mybiblequest.pages.dev','biblequest-7th.pages.dev'];
const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function allowed(origin:string){if(!origin)return true;try{const u=new URL(origin);if(u.hostname==='localhost'||u.hostname==='127.0.0.1')return true;return u.protocol==='https:'&&(u.origin===LEGACY_ORIGIN||CLOUDFLARE_PROJECTS.some(host=>u.hostname===host||u.hostname.endsWith(`.${host}`)))}catch{return false}}
function headers(req:Request){const origin=req.headers.get('Origin')||'',allow=allowed(origin)?(origin||PRIMARY_ORIGIN):PRIMARY_ORIGIN;return {'Access-Control-Allow-Origin':allow,'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Vary':'Origin'}}
function json(req:Request,body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:headers(req)})}
function secretKey(){const modern=Deno.env.get('SUPABASE_SECRET_KEYS');if(modern){try{const keys=JSON.parse(modern);if(keys?.default)return String(keys.default);const first=Object.values(keys||{})[0];if(first)return String(first)}catch{}}return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''}
function adminClient(){const url=Deno.env.get('SUPABASE_URL'),key=secretKey();if(!url||!key)throw new Error('Recovery service is not configured');return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
async function hashRaw(value:string){const bytes=new TextEncoder().encode(value);const hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function normalizeCode(value:string){return value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'')}
function recoveryCode(){const bytes=new Uint8Array(20);crypto.getRandomValues(bytes);const raw=[...bytes].map(x=>ALPHABET[x%ALPHABET.length]).join('');return `BQ-${raw.slice(0,5)}-${raw.slice(5,10)}-${raw.slice(10,15)}-${raw.slice(15,20)}`}
function safeEqual(a:string,b:string){if(a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0}
function clientIp(req:Request){return (req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]||'unknown').trim().slice(0,96)}
async function rateLimit(req:Request,admin:ReturnType<typeof adminClient>,action:'reset'|'issue'){
  const now=new Date(),hour=new Date(now);hour.setUTCMinutes(0,0,0);
  const limit=action==='reset'?20:8;
  const ipHash=await hashRaw(`${clientIp(req)}|bq-password-reset-v3|${action}`),windowStart=hour.toISOString();
  const {data,error}=await admin.from('bible_signup_limits').select('attempts').eq('ip_hash',ipHash).eq('window_start',windowStart).maybeSingle();if(error)throw error;
  const attempts=Number(data?.attempts||0);if(attempts>=limit)return false;
  const saved=await admin.from('bible_signup_limits').upsert({ip_hash:ipHash,window_start:windowStart,attempts:attempts+1,updated_at:now.toISOString()},{onConflict:'ip_hash,window_start'});if(saved.error)throw saved.error;
  return true;
}
async function insertCode(admin:ReturnType<typeof adminClient>,userId:string,email:string){const code=recoveryCode(),now=new Date().toISOString(),expires=new Date(Date.now()+10*365.25*24*3600*1000).toISOString();await admin.from('bible_password_reset_codes').update({used_at:now}).eq('user_id',userId).is('used_at',null);const inserted=await admin.from('bible_password_reset_codes').insert({user_id:userId,requested_by:userId,code_hash:await hashRaw(normalizeCode(code)),email_hash:await hashRaw(email.trim().toLowerCase()),expires_at:expires,attempts:0,locked_until:null,last_attempt_at:null});if(inserted.error)throw inserted.error;return {code,expires}}
async function requireUser(req:Request,admin:ReturnType<typeof adminClient>){const jwt=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'').trim();if(!jwt)throw new Error('Authentication required');const {data,error}=await admin.auth.getUser(jwt);if(error||!data.user)throw new Error('Invalid or expired session');return data.user}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:headers(req)});
  if(req.method!=='POST')return json(req,{error:'Method not allowed'},405);
  if(!allowed(req.headers.get('Origin')||''))return json(req,{error:'Origin not allowed'},403);
  const admin=adminClient();
  try{
    const body=await req.json(),action=String(body.action||'reset');
    if(action==='issue'){
      if(!(await rateLimit(req,admin,'issue')))return json(req,{error:'Too many recovery-code requests. Please wait and try again.'},429);
      const user=await requireUser(req,admin);if(!user.email)return json(req,{error:'This account has no sign-in email.'},400);
      const fresh=await insertCode(admin,user.id,user.email);
      return json(req,{ok:true,recovery_code:fresh.code,recovery_expires_at:fresh.expires});
    }
    if(action!=='reset')return json(req,{error:'Unknown recovery action.'},400);
    if(!(await rateLimit(req,admin,'reset')))return json(req,{error:'Too many recovery attempts from this connection. Please wait and try again.'},429);
    const email=String(body.email||'').trim().toLowerCase(),code=String(body.recovery_code||''),password=String(body.new_password||''),confirm=String(body.confirm_password||'');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!code)return json(req,{error:'Email or recovery code is incorrect.'},400);
    if(password.length<8||password.length>128)return json(req,{error:'New password must be 8 to 128 characters.'},400);
    if(password!==confirm)return json(req,{error:'Passwords do not match.'},400);
    const emailHash=await hashRaw(email),now=new Date();
    const {data:row,error:findError}=await admin.from('bible_password_reset_codes').select('id,user_id,code_hash,expires_at,attempts,locked_until').eq('email_hash',emailHash).is('used_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle();
    if(findError)throw findError;if(!row||new Date(row.expires_at)<=now)return json(req,{error:'Email or recovery code is incorrect.'},400);
    if(row.locked_until&&new Date(row.locked_until)>now)return json(req,{error:'Too many incorrect recovery attempts. Try again later.'},429);
    const suppliedHash=await hashRaw(normalizeCode(code));
    if(!safeEqual(suppliedHash,String(row.code_hash))){const previousLock=row.locked_until&&new Date(row.locked_until)<=now;const attempts=(previousLock?0:Number(row.attempts||0))+1;const locked=attempts>=5?new Date(Date.now()+15*60*1000).toISOString():null;const updated=await admin.from('bible_password_reset_codes').update({attempts:attempts>=5?0:attempts,locked_until:locked,last_attempt_at:now.toISOString()}).eq('id',row.id);if(updated.error)throw updated.error;return json(req,{error:locked?'Too many incorrect recovery attempts. Try again in 15 minutes.':'Email or recovery code is incorrect.'},locked?429:400)}
    const claimed=await admin.from('bible_password_reset_codes').update({used_at:now.toISOString(),last_attempt_at:now.toISOString()}).eq('id',row.id).is('used_at',null).select('id').maybeSingle();if(claimed.error)throw claimed.error;if(!claimed.data)return json(req,{error:'This recovery code has already been used.'},409);
    const changed=await admin.auth.admin.updateUserById(row.user_id,{password});if(changed.error){await admin.from('bible_password_reset_codes').update({used_at:null}).eq('id',row.id);throw changed.error}
    const {data:userData,error:userError}=await admin.auth.admin.getUserById(row.user_id);if(userError||!userData.user?.email)throw userError||new Error('Account email unavailable');
    const fresh=await insertCode(admin,row.user_id,userData.user.email);
    return json(req,{ok:true,recovery_code:fresh.code,recovery_expires_at:fresh.expires,message:'Password updated. Save your new recovery code; the old code is no longer valid.'});
  }catch(err){console.error(err);const msg=err instanceof Error?err.message:'Recovery failed';const status=/Authentication required|Invalid or expired session/.test(msg)?401:500;return json(req,{error:status===401?msg:'Recovery service is temporarily unavailable.'},status)}
});
