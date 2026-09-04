import {adminClient,requireUser,parseJson,json,corsHeaders,asResponse,cleanText,inviteCode,sha256,activeMembership} from '../_shared/bq.ts';

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST')return json({error:'POST required'},405);
  const admin=adminClient();
  try{
    const user=await requireUser(req,admin);
    const body=await parseJson(req) as Record<string,unknown>;
    const action=cleanText(body.action,24);
    if(action==='create'){
      const congregationId=cleanText(body.congregation_id,64),membership=await activeMembership(admin,congregationId,user.id);
      if(!membership||!['facilitator','leader','admin','pastor'].includes(String(membership.role)))return json({error:'Leader access required'},403);
      const name=cleanText(body.name,60);if(name.length<2)return json({error:'Group name is required'},400);
      const maxMembers=Math.min(6,Math.max(2,Number(body.max_members)||6)),raw=inviteCode(8),hash=await sha256(raw);
      const {data:group,error}=await admin.from('bible_groups').insert({owner_id:user.id,congregation_id:congregationId,kind:'small_group',name,description:cleanText(body.description,240),schedule_text:cleanText(body.schedule_text,100),max_members:maxMembers,invite_code_hash:hash,active:true,updated_at:new Date().toISOString()}).select('id,congregation_id,name,description,schedule_text,max_members,active').single();if(error)throw error;
      const member=await admin.from('bible_group_members').upsert({group_id:group.id,user_id:user.id,role:'leader',active:true},{onConflict:'group_id,user_id'});if(member.error)throw member.error;return json({group,invite_code:raw});
    }
    if(action==='join'){
      const code=cleanText(body.invite_code,20).toUpperCase().replace(/[^A-Z0-9]/g,'');if(code.length<6)return json({error:'Enter a valid group code'},400);const hash=await sha256(code);
      const {data:group,error}=await admin.from('bible_groups').select('id,congregation_id,name,description,schedule_text,max_members,active').eq('invite_code_hash',hash).eq('active',true).maybeSingle();if(error)throw error;if(!group)return json({error:'Group code not found or expired'},404);
      const membership=await activeMembership(admin,group.congregation_id,user.id);if(!membership)return json({error:'Join the congregation before joining this small group'},403);
      const {count,error:countError}=await admin.from('bible_group_members').select('user_id',{count:'exact',head:true}).eq('group_id',group.id).eq('active',true);if(countError)throw countError;
      const existing=await admin.from('bible_group_members').select('role,active').eq('group_id',group.id).eq('user_id',user.id).maybeSingle();if(existing.error)throw existing.error;if(!existing.data?.active&&(count||0)>=Number(group.max_members))return json({error:'This Journey Group is already full'},409);
      const joined=await admin.from('bible_group_members').upsert({group_id:group.id,user_id:user.id,role:existing.data?.role||'member',active:true,joined_at:new Date().toISOString()},{onConflict:'group_id,user_id'});if(joined.error)throw joined.error;return json({group});
    }
    if(action==='rotate_code'){
      const groupId=cleanText(body.group_id,64),groupRes=await admin.from('bible_groups').select('id,owner_id').eq('id',groupId).maybeSingle();if(groupRes.error)throw groupRes.error;if(!groupRes.data)return json({error:'Group not found'},404);
      const gm=await admin.from('bible_group_members').select('role,active').eq('group_id',groupId).eq('user_id',user.id).maybeSingle();if(gm.error)throw gm.error;if(groupRes.data.owner_id!==user.id&&!(gm.data?.active&&gm.data.role==='leader'))return json({error:'Group leader access required'},403);
      const raw=inviteCode(8),hash=await sha256(raw),up=await admin.from('bible_groups').update({invite_code_hash:hash,updated_at:new Date().toISOString()}).eq('id',groupId);if(up.error)throw up.error;return json({invite_code:raw});
    }
    if(action==='leave'){
      const groupId=cleanText(body.group_id,64),groupRes=await admin.from('bible_groups').select('owner_id').eq('id',groupId).maybeSingle();if(groupRes.error)throw groupRes.error;if(groupRes.data?.owner_id===user.id)return json({error:'The group leader cannot leave until leadership is transferred or the group is archived'},409);
      const up=await admin.from('bible_group_members').update({active:false}).eq('group_id',groupId).eq('user_id',user.id);if(up.error)throw up.error;return json({ok:true});
    }
    return json({error:'Unsupported action'},400);
  }catch(err){return asResponse(err)}
});
