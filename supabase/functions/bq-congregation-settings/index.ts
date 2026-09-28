import { activeMembership, adminClient, asResponse, corsHeaders, json, parseJson, requireUser } from '../_shared/bq.ts';

function validTimeZone(value:unknown){
  const timezone=String(value??'').trim();
  if(!timezone||timezone.length>64)return '';
  try{new Intl.DateTimeFormat('en-US',{timeZone:timezone}).format(new Date(0));return timezone}catch{return ''}
}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST')return json({error:'Method not allowed'},405);
  try{
    const admin=adminClient(),user=await requireUser(req,admin),body=await parseJson(req);
    const congregationId=String(body?.congregationId??'').trim();
    const name=String(body?.name??'').trim(),timezone=validTimeZone(body?.timezone);
    if(!congregationId)return json({error:'An active congregation is required'},400);
    if(name.length<2||name.length>100)return json({error:'Congregation name must be between 2 and 100 characters'},400);
    if(!timezone)return json({error:'Choose a valid time zone'},400);
    const member=await activeMembership(admin,congregationId,user.id);
    if(!member||member.role!=='admin')return json({error:'Congregation admin permission required'},403);
    const {data,error}=await admin.from('bible_congregations').update({name,timezone}).eq('id',congregationId).eq('active',true).select('id,name,timezone').maybeSingle();
    if(error)throw error;
    if(!data)return json({error:'Congregation is unavailable or inactive'},404);
    return json({congregation:data});
  }catch(err){return asResponse(err)}
});
