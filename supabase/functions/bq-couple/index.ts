import {adminClient,asResponse,corsHeaders,inviteCode,json,parseJson,requireUser,sha256} from '../_shared/bq.ts';

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  try{
    const admin=adminClient();
    const user=await requireUser(req,admin);
    const body=await parseJson(req);
    const action=String(body?.action||'status');
    if(action==='status'){
      const {data,error}=await admin.from('bible_couple_pairs').select('id,user_a,user_b,status,created_at,updated_at').or(`user_a.eq.${user.id},user_b.eq.${user.id}`).in('status',['pending','active']).order('updated_at',{ascending:false}).limit(1).maybeSingle();
      if(error)throw error;return json({pair:data||null});
    }
    if(action==='create'){
      const existing=await admin.from('bible_couple_pairs').select('id,status').or(`user_a.eq.${user.id},user_b.eq.${user.id}`).in('status',['pending','active']).limit(1).maybeSingle();
      if(existing.error)throw existing.error;
      let pair=existing.data;
      if(!pair){const made=await admin.from('bible_couple_pairs').insert({user_a:user.id,status:'pending'}).select('id,status').single();if(made.error)throw made.error;pair=made.data;}
      if(pair.status==='active')return json({pair,alreadyPaired:true});
      const code=inviteCode(8),hash=await sha256(code);
      await admin.from('bible_couple_invites').delete().eq('pair_id',pair.id).is('used_by',null);
      const inv=await admin.from('bible_couple_invites').insert({pair_id:pair.id,code_hash:hash,created_by:user.id,expires_at:new Date(Date.now()+14*86400000).toISOString()});
      if(inv.error)throw inv.error;return json({pair,inviteCode:code,expiresInDays:14});
    }
    if(action==='join'){
      const raw=String(body?.code||'').trim();if(raw.length<5)return json({error:'Enter the couple invite code'},400);
      const hash=await sha256(raw);
      const inv=await admin.from('bible_couple_invites').select('id,pair_id,created_by,expires_at,used_by').eq('code_hash',hash).is('used_by',null).maybeSingle();
      if(inv.error)throw inv.error;if(!inv.data||new Date(inv.data.expires_at)<new Date())return json({error:'Invite is invalid or expired'},404);if(inv.data.created_by===user.id)return json({error:'Share this code with your partner instead of joining your own invite'},400);
      const existing=await admin.from('bible_couple_pairs').select('id').or(`user_a.eq.${user.id},user_b.eq.${user.id}`).eq('status','active').limit(1).maybeSingle();if(existing.error)throw existing.error;if(existing.data)return json({error:'This account is already paired'},409);
      const pair=await admin.from('bible_couple_pairs').select('id,user_a,user_b,status').eq('id',inv.data.pair_id).single();if(pair.error)throw pair.error;if(pair.data.status!=='pending'||pair.data.user_b)return json({error:'This invite has already been used'},409);
      const updated=await admin.from('bible_couple_pairs').update({user_b:user.id,status:'active',updated_at:new Date().toISOString()}).eq('id',pair.data.id).eq('status','pending').is('user_b',null).select('id,user_a,user_b,status').single();if(updated.error)throw updated.error;
      const used=await admin.from('bible_couple_invites').update({used_by:user.id}).eq('id',inv.data.id).is('used_by',null);if(used.error)throw used.error;return json({pair:updated.data});
    }
    if(action==='leave'){
      const pairId=String(body?.pairId||'');if(!pairId)return json({error:'pairId required'},400);
      const pair=await admin.from('bible_couple_pairs').select('id,user_a,user_b,status').eq('id',pairId).single();if(pair.error)throw pair.error;if(pair.data.user_a!==user.id&&pair.data.user_b!==user.id)return json({error:'Not your couple pair'},403);
      const r=await admin.from('bible_couple_pairs').update({status:'ended',updated_at:new Date().toISOString()}).eq('id',pairId);if(r.error)throw r.error;return json({ok:true});
    }
    return json({error:'Unknown action'},400);
  }catch(err){return asResponse(err)}
});
