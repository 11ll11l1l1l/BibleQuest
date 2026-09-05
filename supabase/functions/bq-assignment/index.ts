import {activeMembership,adminClient,asResponse,corsHeaders,json,parseJson,requireUser} from '../_shared/bq.ts';

const leaderRoles=new Set(['facilitator','leader','pastor','admin']);
const allowedTypes=new Set(['reading','guided-study','mission','quiz','reflection','couples','group','custom']);
const categoryFor=(type:string)=>({reading:'reading','guided-study':'reading',mission:'consistency',quiz:'knowledge',reflection:'wisdom',couples:'couples',group:'group',custom:'consistency'} as Record<string,string>)[type]||'consistency';
const text=(v:unknown,max=500)=>String(v??'').trim().slice(0,max);

async function assignmentVisible(admin:ReturnType<typeof adminClient>,assignment:any,userId:string,role:string){
  if(leaderRoles.has(role))return true;
  if(assignment.target_scope==='all')return true;
  if(assignment.target_scope==='member')return assignment.target_id===userId;
  if(assignment.target_scope==='team'){
    const {data,error}=await admin.from('bible_team_members').select('user_id').eq('team_id',assignment.target_id).eq('user_id',userId).maybeSingle();
    if(error)throw error;return Boolean(data);
  }
  return false;
}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST')return json({error:'Method not allowed'},405);
  try{
    const admin=adminClient(),user=await requireUser(req,admin),body=await parseJson(req);
    const action=String(body?.action||'');
    const congregationId=String(body?.congregationId||'');
    if(!congregationId)return json({error:'congregationId required'},400);
    const member=await activeMembership(admin,congregationId,user.id);
    if(!member)return json({error:'Active congregation membership required'},403);

    if(action==='create'){
      if(!leaderRoles.has(member.role))return json({error:'Only facilitators, leaders, and pastors can create assignments'},403);
      const title=text(body?.title,120),instructions=text(body?.instructions,4000),assignmentType=String(body?.assignmentType||'custom');
      const targetScope=String(body?.targetScope||'all'),targetId=body?.targetId?String(body.targetId):null;
      if(title.length<2||!allowedTypes.has(assignmentType))return json({error:'Provide a valid assignment title and type'},400);
      if(!['all','member','team'].includes(targetScope))return json({error:'Invalid assignment audience'},400);
      if(targetScope!=='all'&&!targetId)return json({error:'Choose a member or team'},400);
      if(targetScope==='member'){
        const target=await activeMembership(admin,congregationId,String(targetId));
        if(!target)return json({error:'Target member is not active in this congregation'},400);
      }
      if(targetScope==='team'){
        const t=await admin.from('bible_teams').select('id').eq('id',targetId).eq('congregation_id',congregationId).maybeSingle();
        if(t.error)throw t.error;if(!t.data)return json({error:'Team not found in this congregation'},400);
      }
      const scriptureRefs=(Array.isArray(body?.scriptureRefs)?body.scriptureRefs:[]).map((x:unknown)=>text(x,80)).filter(Boolean).slice(0,20);
      const points=Math.min(25,Math.max(0,Math.round(Number(body?.points)||5)));
      let dueAt:string|null=null;
      if(body?.dueAt){const due=new Date(String(body.dueAt));if(Number.isNaN(due.getTime()))return json({error:'Invalid assignment deadline'},400);dueAt=due.toISOString()}
      const made=await admin.from('bible_assignments').insert({congregation_id:congregationId,created_by:user.id,title,instructions,assignment_type:assignmentType,scripture_refs:scriptureRefs,target_scope:targetScope,target_id:targetScope==='all'?null:targetId,due_at:dueAt,points,metadata:{created_via:'bq-assignment'},active:true}).select('*').single();
      if(made.error)throw made.error;return json({assignment:made.data});
    }

    const assignmentId=String(body?.assignmentId||'');
    if(!assignmentId)return json({error:'assignmentId required'},400);
    const found=await admin.from('bible_assignments').select('*').eq('id',assignmentId).eq('congregation_id',congregationId).maybeSingle();
    if(found.error)throw found.error;if(!found.data)return json({error:'Assignment not found'},404);
    const assignment=found.data;

    if(action==='start'||action==='complete'){
      if(!(await assignmentVisible(admin,assignment,user.id,member.role)))return json({error:'This assignment is not assigned to you'},403);
      const previous=await admin.from('bible_assignment_progress').select('*').eq('assignment_id',assignment.id).eq('user_id',user.id).maybeSingle();
      if(previous.error)throw previous.error;
      if(action==='start'&&previous.data?.status==='completed')return json({progress:previous.data,awarded:0,alreadyCompleted:true});

      const completed=action==='complete',submission=text(body?.submission,4000);
      const row={assignment_id:assignment.id,user_id:user.id,status:completed?'completed':'started',submission:completed?(submission||previous.data?.submission||null):(previous.data?.submission||null),completed_at:completed?(previous.data?.completed_at||new Date().toISOString()):null,updated_at:new Date().toISOString()};
      const saved=await admin.from('bible_assignment_progress').upsert(row,{onConflict:'assignment_id,user_id'}).select('*').single();
      if(saved.error)throw saved.error;

      let awarded=0;
      if(completed&&previous.data?.status!=='completed'&&Number(assignment.points)>0){
        const category=categoryFor(assignment.assignment_type),points=Math.min(25,Math.max(0,Number(assignment.points)||0));
        const score={congregation_id:congregationId,user_id:user.id,category,points,source:'Leader Assignment',source_event_id:`assignment:${assignment.id}`,metadata:{assignment_id:assignment.id,assignment_type:assignment.assignment_type,created_by:assignment.created_by}};
        const inserted=await admin.from('bible_score_events').upsert(score,{onConflict:'congregation_id,user_id,source_event_id',ignoreDuplicates:true}).select('source_event_id');
        if(inserted.error)throw inserted.error;if((inserted.data||[]).length)awarded=points;
      }
      return json({progress:saved.data,awarded,alreadyCompleted:previous.data?.status==='completed'});
    }

    if(action==='feedback'){
      if(!leaderRoles.has(member.role))return json({error:'Leader or pastor role required'},403);
      const targetUserId=String(body?.targetUserId||'');if(!targetUserId)return json({error:'targetUserId required'},400);
      const feedback=text(body?.feedback,2000);
      const updated=await admin.from('bible_assignment_progress').update({leader_feedback:feedback||null,updated_at:new Date().toISOString()}).eq('assignment_id',assignment.id).eq('user_id',targetUserId).select('*').maybeSingle();
      if(updated.error)throw updated.error;return json({progress:updated.data});
    }

    if(action==='archive'){
      if(!leaderRoles.has(member.role)||assignment.created_by!==user.id&&member.role!=='admin')return json({error:'Only the assignment creator or admin can archive it'},403);
      const updated=await admin.from('bible_assignments').update({active:false,updated_at:new Date().toISOString()}).eq('id',assignment.id).select('*').single();
      if(updated.error)throw updated.error;return json({assignment:updated.data});
    }

    return json({error:'Unknown action'},400);
  }catch(err){return asResponse(err)}
});
