import { activeMembership, adminClient, asResponse, corsHeaders, inviteCode, json, parseJson, requireUser, sha256 } from '../_shared/bq.ts';

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST')return json({error:'Method not allowed'},405);
  try{
    const admin=adminClient();const user=await requireUser(req,admin);const body=await parseJson(req);
    const congregationId=String(body?.congregationId||'');
    const membership=await activeMembership(admin,congregationId,user.id);
    if(!membership||!['facilitator','leader','pastor','admin'].includes(membership.role))return json({error:'Facilitator, leader, or pastor permission required'},403);
    const maxUses=Math.min(250,Math.max(1,Number(body?.maxUses)||100));
    const expiresDays=Math.min(90,Math.max(1,Number(body?.expiresDays)||30));
    const code=inviteCode();const codeHash=await sha256(code);const expires=new Date(Date.now()+expiresDays*86400000).toISOString();
    const {error}=await admin.from('bible_congregation_invites').insert({congregation_id:congregationId,code_hash:codeHash,created_by:user.id,max_uses:maxUses,expires_at:expires,active:true});
    if(error)throw error;
    return json({inviteCode:code,expiresAt:expires,maxUses});
  }catch(err){return asResponse(err)}
});
