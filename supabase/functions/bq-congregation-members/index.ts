import { activeMembership, adminClient, asResponse, corsHeaders, json, parseJson, requireUser } from '../_shared/bq.ts';

const ROLES=new Set(['member','facilitator','leader','pastor','admin']);

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST')return json({error:'Method not allowed'},405);
  try{
    const admin=adminClient(),user=await requireUser(req,admin),body=await parseJson(req);
    const congregationId=String(body?.congregationId??'').trim();
    const congregation=await admin.from('bible_congregations').select('id').eq('id',congregationId).eq('active',true).maybeSingle();
    if(congregation.error)throw congregation.error;
    if(!congregation.data)return json({error:'Congregation is unavailable or inactive'},404);
    const actor=await activeMembership(admin,congregationId,user.id);
    if(!actor||actor.role!=='admin')return json({error:'Congregation admin permission required'},403);

    if(body?.action==='list'){
      const {data,error}=await admin.from('bible_congregation_members')
        .select('user_id,display_name,role,active,joined_at')
        .eq('congregation_id',congregationId)
        .order('joined_at',{ascending:true})
        .limit(3000);
      if(error)throw error;
      return json({members:(data||[]).map(row=>({userId:row.user_id,displayName:String(row.display_name||'').trim()||'Member',role:row.role,active:row.active!==false,joinedAt:row.joined_at||null}))});
    }

    if(body?.action==='manage'){
      const targetUserId=String(body?.targetUserId??'').trim(),role=String(body?.role??''),active=body?.active;
      if(!targetUserId||!ROLES.has(role)||typeof active!=='boolean')return json({error:'Provide a member, supported congregation role and active state'},400);
      const {data,error}=await admin.rpc('bible_manage_congregation_member_v6',{
        p_congregation_id:congregationId,
        p_actor_user_id:user.id,
        p_target_user_id:targetUserId,
        p_role:role,
        p_active:active
      });
      if(error){
        const status=error.code==='42501'?403:error.code==='P0002'?404:error.code==='23514'?409:error.code==='22023'?400:500;
        return json({error:status===500?'Member update failed.':error.message},status);
      }
      return json({membership:data});
    }
    return json({error:'Unknown congregation member action'},400);
  }catch(err){return asResponse(err)}
});
