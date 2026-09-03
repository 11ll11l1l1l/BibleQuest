import { adminClient, asResponse, corsHeaders, displayName, json, parseJson, requireUser, sha256 } from '../_shared/bq.ts';

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST')return json({error:'Method not allowed'},405);
  try{
    const admin=adminClient();const user=await requireUser(req,admin);const body=await parseJson(req);
    const raw=String(body?.code||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
    if(raw.length<5)return json({error:'Invite code is invalid'},400);
    const codeHash=await sha256(raw);
    const {data:invite,error:inviteError}=await admin.from('bible_congregation_invites').select('id,congregation_id,max_uses,uses,expires_at,active').eq('code_hash',codeHash).eq('active',true).maybeSingle();
    if(inviteError)throw inviteError;
    if(!invite)return json({error:'Invite code was not found or is inactive'},404);
    if(invite.expires_at&&new Date(invite.expires_at).getTime()<Date.now())return json({error:'Invite code has expired'},410);
    if(Number(invite.uses)>=Number(invite.max_uses))return json({error:'Invite code has reached its use limit'},409);
    const {data:congregation,error:congregationError}=await admin.from('bible_congregations').select('id,name,timezone,owner_id,active').eq('id',invite.congregation_id).eq('active',true).maybeSingle();
    if(congregationError)throw congregationError;if(!congregation)return json({error:'Congregation is not active'},404);
    const profile=await admin.from('bible_profiles').select('display_name').eq('user_id',user.id).maybeSingle();
    const memberName=displayName(user,profile.data?.display_name);
    const {error:memberError}=await admin.from('bible_congregation_members').upsert({congregation_id:congregation.id,user_id:user.id,role:'member',display_name:memberName,active:true},{onConflict:'congregation_id,user_id'});
    if(memberError)throw memberError;
    const {error:useError}=await admin.from('bible_congregation_invites').update({uses:Number(invite.uses)+1}).eq('id',invite.id).eq('uses',invite.uses);
    if(useError)console.warn('Invite use counter update failed:',useError.message);
    return json({congregation:{id:congregation.id,name:congregation.name,timezone:congregation.timezone},role:'member'});
  }catch(err){return asResponse(err)}
});
