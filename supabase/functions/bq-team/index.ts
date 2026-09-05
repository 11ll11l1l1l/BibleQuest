import {activeMembership,adminClient,asResponse,cleanText,corsHeaders,json,parseJson,requireUser} from '../_shared/bq.ts';

const leaderRoles=new Set(['facilitator','leader','pastor','admin']);

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST')return json({error:'Method not allowed'},405);
  try{
    const admin=adminClient(),user=await requireUser(req,admin),body=await parseJson(req);
    const action=cleanText(body?.action,24),congregationId=cleanText(body?.congregationId,64);
    if(!congregationId)return json({error:'congregationId required'},400);
    const membership=await activeMembership(admin,congregationId,user.id);
    if(!membership)return json({error:'Active congregation membership required'},403);
    if(!leaderRoles.has(String(membership.role)))return json({error:'Facilitator, leader, pastor, or admin access required'},403);

    if(action==='create'){
      const name=cleanText(body?.name,60);if(name.length<2)return json({error:'Team name is required'},400);
      const made=await admin.from('bible_teams').insert({congregation_id:congregationId,created_by:user.id,team_type:'assignment',name,active:true}).select('id,congregation_id,created_by,team_type,name,active,created_at').single();
      if(made.error)throw made.error;
      const joined=await admin.from('bible_team_members').upsert({team_id:made.data.id,user_id:user.id},{onConflict:'team_id,user_id'});
      if(joined.error)throw joined.error;
      return json({team:made.data});
    }

    const teamId=cleanText(body?.teamId,64);if(!teamId)return json({error:'teamId required'},400);
    const found=await admin.from('bible_teams').select('id,congregation_id,created_by,team_type,name,active').eq('id',teamId).eq('congregation_id',congregationId).maybeSingle();
    if(found.error)throw found.error;if(!found.data||!found.data.active)return json({error:'Active team not found in this congregation'},404);
    const team=found.data;

    if(action==='add'){
      const targetUserId=cleanText(body?.targetUserId,64);if(!targetUserId)return json({error:'targetUserId required'},400);
      const target=await activeMembership(admin,congregationId,targetUserId);if(!target)return json({error:'Target user is not an active congregation member'},400);
      const added=await admin.from('bible_team_members').upsert({team_id:team.id,user_id:targetUserId},{onConflict:'team_id,user_id'});
      if(added.error)throw added.error;return json({ok:true});
    }

    if(action==='remove'){
      const targetUserId=cleanText(body?.targetUserId,64);if(!targetUserId)return json({error:'targetUserId required'},400);
      if(targetUserId===team.created_by)return json({error:'The team creator stays a member while the team is active'},409);
      const removed=await admin.from('bible_team_members').delete().eq('team_id',team.id).eq('user_id',targetUserId);
      if(removed.error)throw removed.error;return json({ok:true});
    }

    if(action==='rename'){
      const name=cleanText(body?.name,60);if(name.length<2)return json({error:'Team name is required'},400);
      const updated=await admin.from('bible_teams').update({name}).eq('id',team.id).select('id,name').single();
      if(updated.error)throw updated.error;return json({team:updated.data});
    }

    if(action==='archive'){
      if(team.created_by!==user.id&&membership.role!=='admin')return json({error:'Only the team creator or congregation admin can archive this team'},403);
      const updated=await admin.from('bible_teams').update({active:false}).eq('id',team.id);
      if(updated.error)throw updated.error;return json({ok:true});
    }

    return json({error:'Unknown action'},400);
  }catch(err){return asResponse(err)}
});
