import { createClient } from 'npm:@supabase/supabase-js@2.112.4';

export const corsHeaders={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Content-Type':'application/json'
};

export const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:corsHeaders});

function secretKey(){
  const modern=Deno.env.get('SUPABASE_SECRET_KEYS');
  if(modern){try{const keys=JSON.parse(modern);if(keys?.default)return String(keys.default);const first=Object.values(keys||{})[0];if(first)return String(first)}catch{}}
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
}
export function adminClient(){const url=Deno.env.get('SUPABASE_URL'),key=secretKey();if(!url||!key)throw new Error('Supabase function environment is incomplete');return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
export async function requireUser(req:Request,admin=adminClient()){const auth=req.headers.get('Authorization')||'',jwt=auth.replace(/^Bearer\s+/i,'').trim();if(!jwt)throw new Response(JSON.stringify({error:'Authentication required'}),{status:401,headers:corsHeaders});const {data,error}=await admin.auth.getUser(jwt);if(error||!data.user)throw new Response(JSON.stringify({error:'Invalid or expired session'}),{status:401,headers:corsHeaders});return data.user}
export function cleanText(value:unknown,max=100){return String(value??'').trim().replace(/\s+/g,' ').slice(0,max)}
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';export function inviteCode(length=8){const bytes=new Uint8Array(length);crypto.getRandomValues(bytes);return [...bytes].map(x=>alphabet[x%alphabet.length]).join('')}
export async function sha256(value:string){const bytes=new TextEncoder().encode(value.trim().toUpperCase().replace(/[^A-Z0-9]/g,''));const hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('')}
export async function activeMembership(admin:ReturnType<typeof adminClient>,congregationId:string,userId:string){const {data,error}=await admin.from('bible_congregation_members').select('congregation_id,user_id,role,display_name,active').eq('congregation_id',congregationId).eq('user_id',userId).eq('active',true).maybeSingle();if(error)throw error;return data}
export function displayName(user:{email?:string|null},fallback?:unknown){return cleanText(fallback||user.email?.split('@')[0]||'BibleQuest member',80)}
export async function parseJson(req:Request){try{return await req.json()}catch{throw new Response(JSON.stringify({error:'Invalid JSON request'}),{status:400,headers:corsHeaders})}}
export function asResponse(err:unknown){if(err instanceof Response)return err;console.error(err);return json({error:'Unexpected server error'},500)}
