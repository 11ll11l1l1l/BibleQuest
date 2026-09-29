import { activeMembership, adminClient, asResponse, cleanText, corsHeaders, displayName, inviteCode, json, parseJson, requireUser, sha256 } from '../_shared/bq.ts';

function validTimeZone(value:unknown){
  const timezone=cleanText(value||'Asia/Tokyo',64);
  if(!timezone)return '';
  try{new Intl.DateTimeFormat('en-US',{timeZone:timezone}).format(new Date(0));return timezone}catch{return ''}
}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST')return json({error:'Method not allowed'},405);
  try{
    const admin=adminClient();const user=await requireUser(req,admin);const body=await parseJson(req);
    const name=cleanText(body?.name,100);if(name.length<2)return json({error:'Congregation name must be at least 2 characters'},400);
    const timezone=validTimeZone(body?.timezone??'Asia/Tokyo');if(!timezone)return json({error:'Choose a valid time zone'},400);
    const profile=await admin.from('bible_profiles').select('display_name,preferred_name,avatar,onboarding_complete').eq('user_id',user.id).maybeSingle();
    if(profile.error)throw profile.error;
    if(!profile.data?.onboarding_complete)return json({error:'Complete your BibleQuest profile before creating a congregation'},409);
    const memberName=displayName(user,profile.data?.preferred_name||profile.data?.display_name);
    const avatar=profile.data?.avatar||{face:'smile',outfit:'traveler',background:'olive',companion:'sheep'};
    const {data:congregation,error:createError}=await admin.from('bible_congregations').insert({owner_id:user.id,name,timezone}).select('id,name,timezone,owner_id').single();
    if(createError)throw createError;
    const {error:memberError}=await admin.from('bible_congregation_members').insert({congregation_id:congregation.id,user_id:user.id,role:'admin',display_name:memberName,avatar,active:true});
    if(memberError){await admin.from('bible_congregations').delete().eq('id',congregation.id);throw memberError}
    const code=inviteCode();const codeHash=await sha256(code);const expires=new Date(Date.now()+30*86400000).toISOString();
    const {error:inviteError}=await admin.from('bible_congregation_invites').insert({congregation_id:congregation.id,code_hash:codeHash,created_by:user.id,max_uses:100,expires_at:expires,active:true});
    if(inviteError){
      const memberCleanup=await admin.from('bible_congregation_members').delete().eq('congregation_id',congregation.id).eq('user_id',user.id);
      const congregationCleanup=await admin.from('bible_congregations').delete().eq('id',congregation.id);
      if(memberCleanup.error||congregationCleanup.error)console.error('Congregation provisioning cleanup failed',memberCleanup.error?.message||congregationCleanup.error?.message);
      throw inviteError;
    }
    const membership=await activeMembership(admin,congregation.id,user.id);
    return json({congregation,membership,inviteCode:code,inviteExpiresAt:expires});
  }catch(err){return asResponse(err)}
});
