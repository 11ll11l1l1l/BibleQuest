import { createClient } from 'npm:@supabase/supabase-js@2.112.4';

const PRIMARY_ORIGIN='https://biblequest-7th.pages.dev';
const LEGACY_ORIGIN='https://11ll11l1l1l.github.io';
const SITE_ROLES=new Set(['member','leader','pastor','admin','owner']);
const CONGREGATION_ROLES=new Set(['member','facilitator','leader','pastor','admin']);

function isAllowedOrigin(value:string){
  try{
    const u=new URL(value);
    if(u.protocol!=='https:')return false;
    if(u.origin===LEGACY_ORIGIN)return true;
    return u.hostname==='biblequest-7th.pages.dev'||u.hostname.endsWith('.biblequest-7th.pages.dev');
  }catch{return false}
}
function originFor(req:Request){const origin=req.headers.get('Origin')||'';return isAllowedOrigin(origin)?origin:PRIMARY_ORIGIN}
function headers(req:Request){return {'Access-Control-Allow-Origin':originFor(req),'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Vary':'Origin'}}
const json=(req:Request,body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:headers(req)});
function safeAppUrl(req:Request,value:unknown){
  try{
    const u=new URL(String(value||''));
    if(!isAllowedOrigin(u.origin))throw new Error('untrusted origin');
    if(u.origin===LEGACY_ORIGIN&&!u.pathname.startsWith('/BibleQuest/'))throw new Error('untrusted path');
    u.hash='';u.search='';
    if(!u.pathname.endsWith('/'))u.pathname=`${u.pathname}/`;
    return u.href;
  }catch{
    const origin=originFor(req);
    return origin===LEGACY_ORIGIN?`${LEGACY_ORIGIN}/BibleQuest/`:`${origin}/`;
  }
}
function secretKey(){
  const modern=Deno.env.get('SUPABASE_SECRET_KEYS');
  if(modern){try{const keys=JSON.parse(modern);if(keys?.default)return String(keys.default);const first=Object.values(keys||{})[0];if(first)return String(first)}catch{}}
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
}
function adminClient(){
  const url=Deno.env.get('SUPABASE_URL')||'',key=secretKey();
  if(!url||!key)throw new Error('Supabase function environment is incomplete');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
}
async function requireUser(req:Request,admin:ReturnType<typeof adminClient>){
  const jwt=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'').trim();
  if(!jwt)throw new Response(JSON.stringify({error:'Authentication required'}),{status:401,headers:headers(req)});
  const {data,error}=await admin.auth.getUser(jwt);
  if(error||!data.user)throw new Response(JSON.stringify({error:'Invalid or expired session'}),{status:401,headers:headers(req)});
  return data.user;
}
async function requireAdmin(req:Request,admin:ReturnType<typeof adminClient>,userId:string){
  const {data,error}=await admin.from('bible_app_access').select('role,active').eq('user_id',userId).maybeSingle();
  if(error)throw error;
  if(!data?.active||!['owner','admin'].includes(data.role))throw new Response(JSON.stringify({error:'BibleQuest admin access required'}),{status:403,headers:headers(req)});
  return data as {role:'owner'|'admin',active:boolean};
}
async function audit(admin:ReturnType<typeof adminClient>,actorId:string,targetUserId:string|null,action:string,detail:Record<string,unknown>={}){
  const {error}=await admin.from('bible_admin_audit_log').insert({actor_id:actorId,target_user_id:targetUserId,action,detail});
  if(error)console.error('Audit insert failed',error);
}
async function parse(req:Request){try{return await req.json()}catch{return {}}}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:headers(req)});
  if(req.method!=='POST')return json(req,{error:'Method not allowed'},405);
  try{
    const admin=adminClient();
    const actor=await requireUser(req,admin);
    const access=await requireAdmin(req,admin,actor.id);
    const body=await parse(req);
    const action=String(body?.action||'status');

    if(action==='status')return json(req,{ok:true,role:access.role,userId:actor.id});

    if(action==='list_users'){
      const page=Math.max(1,Math.min(1000,Number(body?.page)||1));
      const perPage=Math.max(1,Math.min(200,Number(body?.perPage)||100));
      const listed=await admin.auth.admin.listUsers({page,perPage});
      if(listed.error)throw listed.error;
      const users=listed.data.users||[],ids=users.map(u=>u.id);
      let profiles:any[]=[],accessRows:any[]=[],memberships:any[]=[];
      if(ids.length){
        const [p,a,m]=await Promise.all([
          admin.from('bible_profiles').select('user_id,preferred_name,display_name,last_active_at').in('user_id',ids),
          admin.from('bible_app_access').select('user_id,role,active').in('user_id',ids),
          admin.from('bible_congregation_members').select('user_id,congregation_id,role,active,bible_congregations(name)').in('user_id',ids)
        ]);
        if(p.error)throw p.error;if(a.error)throw a.error;if(m.error)throw m.error;
        profiles=p.data||[];accessRows=a.data||[];memberships=m.data||[];
      }
      const profileMap=new Map(profiles.map(x=>[x.user_id,x])),accessMap=new Map(accessRows.map(x=>[x.user_id,x])),membershipMap=new Map<string,any[]>();
      for(const m of memberships){const arr=membershipMap.get(m.user_id)||[];arr.push(m);membershipMap.set(m.user_id,arr)}
      return json(req,{role:access.role,users:users.map(u=>{const p=profileMap.get(u.id)||{},a=accessMap.get(u.id);return {id:u.id,email:u.email||'',name:p.preferred_name||p.display_name||u.email?.split('@')[0]||'Member',role:a?.active===false?'member':a?.role||'member',accessActive:a?.active!==false,createdAt:u.created_at,lastSignInAt:u.last_sign_in_at||null,lastActiveAt:p.last_active_at||null,memberships:(membershipMap.get(u.id)||[]).map((m:any)=>({congregationId:m.congregation_id,congregationName:m.bible_congregations?.name||'Congregation',role:m.role,active:m.active}))}})});
    }

    if(action==='set_role'){
      const targetUserId=String(body?.targetUserId||''),role=String(body?.role||'member');
      if(!targetUserId||!SITE_ROLES.has(role))return json(req,{error:'Valid target user and role required'},400);
      const existing=await admin.from('bible_app_access').select('role,active').eq('user_id',targetUserId).maybeSingle();if(existing.error)throw existing.error;
      const currentRole=existing.data?.role||'member';
      if(access.role!=='owner'&&(role==='admin'||role==='owner'||currentRole==='admin'||currentRole==='owner'))return json(req,{error:'Only the owner can change admin or owner access'},403);
      if(targetUserId===actor.id&&access.role==='owner'&&role!=='owner')return json(req,{error:'The active owner cannot remove their own owner access'},409);
      const up=await admin.from('bible_app_access').upsert({user_id:targetUserId,role,active:true,granted_by:actor.id,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(up.error)throw up.error;
      const got=await admin.auth.admin.getUserById(targetUserId);if(got.error)throw got.error;
      const authUpdate=await admin.auth.admin.updateUserById(targetUserId,{app_metadata:{...(got.data.user?.app_metadata||{}),biblequest_role:role}});if(authUpdate.error)throw authUpdate.error;
      await audit(admin,actor.id,targetUserId,'set_role',{from:currentRole,to:role});
      return json(req,{ok:true,role});
    }

    if(action==='set_congregation_role'){
      const targetUserId=String(body?.targetUserId||''),congregationId=String(body?.congregationId||''),role=String(body?.role||'member');
      if(!targetUserId||!congregationId||!CONGREGATION_ROLES.has(role))return json(req,{error:'Valid user, congregation and role required'},400);
      if(access.role!=='owner'&&role==='admin')return json(req,{error:'Only the owner can grant congregation admin access'},403);
      const member=await admin.from('bible_congregation_members').select('role').eq('user_id',targetUserId).eq('congregation_id',congregationId).maybeSingle();
      if(member.error)throw member.error;if(!member.data)return json(req,{error:'User is not a member of that congregation'},404);
      if(access.role!=='owner'&&member.data.role==='admin')return json(req,{error:'Only the owner can change a congregation admin'},403);
      const changed=await admin.from('bible_congregation_members').update({role}).eq('user_id',targetUserId).eq('congregation_id',congregationId);if(changed.error)throw changed.error;
      await audit(admin,actor.id,targetUserId,'set_congregation_role',{congregationId,from:member.data.role,to:role});
      return json(req,{ok:true,role});
    }

    if(action==='send_password_reset'){
      const targetUserId=String(body?.targetUserId||'');
      if(!targetUserId)return json(req,{error:'Target user required'},400);
      const got=await admin.auth.admin.getUserById(targetUserId);if(got.error)throw got.error;
      const email=got.data.user?.email;if(!email)return json(req,{error:'This account has no email address'},409);
      const redirectTo=safeAppUrl(req,body?.appUrl);
      const reset=await admin.auth.resetPasswordForEmail(email,{redirectTo});if(reset.error)throw reset.error;
      await audit(admin,actor.id,targetUserId,'send_password_reset',{redirectTo});
      return json(req,{ok:true,message:'Password reset email sent.'});
    }

    return json(req,{error:'Unknown admin action'},400);
  }catch(err){
    if(err instanceof Response)return err;
    console.error(err);
    return json(req,{error:err instanceof Error?err.message:'Unexpected admin error'},500);
  }
});
