import { createClient } from 'npm:@supabase/supabase-js@2.112.4';

const PRIMARY_ORIGIN='https://mybiblequest.pages.dev';
const LEGACY_ORIGIN='https://11ll11l1l1l.github.io';
const CLOUDFLARE_PROJECTS=['mybiblequest.pages.dev','biblequest-7th.pages.dev'];
const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function allowed(origin:string){if(!origin)return true;try{const u=new URL(origin);if(u.hostname==='localhost'||u.hostname==='127.0.0.1')return true;return u.protocol==='https:'&&(u.origin===LEGACY_ORIGIN||CLOUDFLARE_PROJECTS.some(host=>u.hostname===host||u.hostname.endsWith(`.${host}`)))}catch{return false}}
function headers(req:Request){const origin=req.headers.get('Origin')||'',allow=allowed(origin)?(origin||PRIMARY_ORIGIN):PRIMARY_ORIGIN;return {'Access-Control-Allow-Origin':allow,'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Vary':'Origin'}}
function json(req:Request,body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:headers(req)})}
function cleanText(value:unknown,max:number){return String(value??'').trim().replace(/\s+/g,' ').slice(0,max)}
function cleanAvatar(value:unknown){const v=(value&&typeof value==='object'?value:{}) as Record<string,unknown>;const pick=(key:string,max=24)=>cleanText(v[key],max).replace(/[^a-z0-9_-]/gi,'');return {face:pick('face')||'smile',outfit:pick('outfit')||'traveler',background:pick('background')||'olive',companion:pick('companion')||'sheep'}}
function secretKey(){const modern=Deno.env.get('SUPABASE_SECRET_KEYS');if(modern){try{const keys=JSON.parse(modern);if(keys?.default)return String(keys.default);const first=Object.values(keys||{})[0];if(first)return String(first)}catch{}}return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''}
function adminClient(){const url=Deno.env.get('SUPABASE_URL'),key=secretKey();if(!url||!key)throw new Error('Account service is not configured');return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
async function hashRaw(value:string){const bytes=new TextEncoder().encode(value);const hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function recoveryCode(){const bytes=new Uint8Array(20);crypto.getRandomValues(bytes);const raw=[...bytes].map(x=>ALPHABET[x%ALPHABET.length]).join('');return `BQ-${raw.slice(0,5)}-${raw.slice(5,10)}-${raw.slice(10,15)}-${raw.slice(15,20)}`}
function normalizedCode(value:string){return value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'')}
function clientIp(req:Request){return (req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]||'unknown').trim().slice(0,96)}
async function rateLimit(req:Request,admin:ReturnType<typeof adminClient>){const now=new Date();const hour=new Date(now);hour.setUTCMinutes(0,0,0);const ipHash=await hashRaw(`${clientIp(req)}|bq-signup-v2`);const windowStart=hour.toISOString();const {data,error}=await admin.from('bible_signup_limits').select('attempts').eq('ip_hash',ipHash).eq('window_start',windowStart).maybeSingle();if(error)throw error;const attempts=Number(data?.attempts||0);if(attempts>=8)return false;const saved=await admin.from('bible_signup_limits').upsert({ip_hash:ipHash,window_start:windowStart,attempts:attempts+1,updated_at:now.toISOString()},{onConflict:'ip_hash,window_start'});if(saved.error)throw saved.error;return true}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:headers(req)});
  if(req.method!=='POST')return json(req,{error:'Method not allowed'},405);
  if(!allowed(req.headers.get('Origin')||''))return json(req,{error:'Origin not allowed'},403);
  try{
    const admin=adminClient();
    if(!(await rateLimit(req,admin)))return json(req,{error:'Too many account creation attempts. Please wait and try again.'},429);
    const body=await req.json();
    const email=cleanText(body.email,254).toLowerCase(),password=String(body.password||''),confirm=String(body.confirm_password||''),fullName=cleanText(body.full_name,120),preferredName=cleanText(body.preferred_name,40),churchGroup=cleanText(body.church_group,120),avatar=cleanAvatar(body.avatar);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json(req,{error:'Enter a valid email address.'},400);
    if(fullName.length<2||preferredName.length<2)return json(req,{error:'Enter your name and the name BibleQuest should call you.'},400);
    if(password.length<8||password.length>128)return json(req,{error:'Password must be 8 to 128 characters.'},400);
    if(password!==confirm)return json(req,{error:'Passwords do not match.'},400);
    const {data:created,error:createError}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:fullName,preferred_name:preferredName,church_group:churchGroup,avatar,onboarding_complete:true,email_unverified:true}});
    if(createError||!created.user){const msg=String(createError?.message||'Could not create account');if(/already|registered|exists/i.test(msg))return json(req,{error:'An account already exists for this email. Sign in instead.'},409);throw createError||new Error(msg)}
    const code=recoveryCode(),codeHash=await hashRaw(normalizedCode(code)),emailHash=await hashRaw(email),expires=new Date(Date.now()+10*365.25*24*3600*1000).toISOString();
    const inserted=await admin.from('bible_password_reset_codes').insert({user_id:created.user.id,requested_by:created.user.id,code_hash:codeHash,email_hash:emailHash,expires_at:expires,attempts:0});
    if(inserted.error){await admin.auth.admin.deleteUser(created.user.id).catch(()=>{});throw inserted.error}
    return json(req,{ok:true,recovery_code:code,recovery_expires_at:expires});
  }catch(err){console.error(err);return json(req,{error:'Account creation failed. Please try again.'},500)}
});
