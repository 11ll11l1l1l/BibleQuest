import { activeMembership, adminClient, asResponse, cleanText, corsHeaders, displayName, inviteCode, json, parseJson, requireUser, sha256 } from '../_shared/bq.ts';

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST')return json({error:'Method not allowed'},405);
  try{
    const admin=adminClient();const user=await requireUser(req,admin);const body=await parseJson(req);
    const name=cleanText(body?.name,100);if(name.length<2)return json({error:'Congregation name must be at least 2 characters'},400);
    const profile=await admin.from('bible_profiles').select('display_name').eq('user_id',user.id).maybeSingle();
    const memberName=displayName(user,profile.data?.display_name);
    const {data:congregation,error:createError}=await admin.from('bible_congregations').insert({owner_id:user.id,name,timezone:cleanText(body?.timezone||'Asia/Tokyo',64)}).select('id,name,timezone,owner_id').single();
    if(createError)throw createError;
    const {error:memberError}=await admin.from('bible_congregation_members').insert({congregation_id:congregation.id,user_id:user.id,role:'admin',display_name:memberName,active:true});
    if(memberError){await admin.from('bible_congregations').delete().eq('id',congregation.id);throw memberError}
    const code=inviteCode();const codeHash=await sha256(code);const expires=new Date(Date.now()+30*86400000).toISOString();
    const {error:inviteError}=await admin.from('bible_congregation_invites').insert({congregation_id:congregation.id,code_hash:codeHash,created_by:user.id,max_uses:100,expires_at:expires,active:true});
    if(inviteError)throw inviteError;
    const membership=await activeMembership(admin,congregation.id,user.id);
    return json({congregation,membership,inviteCode:code,inviteExpiresAt:expires});
  }catch(err){return asResponse(err)}
});
