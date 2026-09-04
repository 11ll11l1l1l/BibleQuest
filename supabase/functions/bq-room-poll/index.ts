import {activeMembership,adminClient,asResponse,corsHeaders,json,parseJson,requireUser} from '../_shared/bq.ts';

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST')return json({error:'Method not allowed'},405);
  try{
    const admin=adminClient(),user=await requireUser(req,admin),body=await parseJson(req);
    const sessionId=String(body?.sessionId||''),round=Math.max(0,Math.floor(Number(body?.round)||0));
    if(!sessionId)return json({error:'sessionId required'},400);
    const s=await admin.from('bible_shared_sessions').select('id,congregation_id').eq('id',sessionId).maybeSingle();
    if(s.error)throw s.error;if(!s.data)return json({error:'Room not found'},404);
    const member=await activeMembership(admin,s.data.congregation_id,user.id);
    if(!member)return json({error:'Active congregation membership required'},403);
    const r=await admin.from('bible_room_responses').select('response').eq('session_id',sessionId).eq('round_no',round).limit(5000);
    if(r.error)throw r.error;
    const counts=new Map<string,number>();
    for(const row of r.data||[]){const choice=String(row.response?.choice||'');if(choice)counts.set(choice,(counts.get(choice)||0)+1)}
    return json({totals:[...counts].map(([choice,total])=>({choice,total}))});
  }catch(err){return asResponse(err)}
});
