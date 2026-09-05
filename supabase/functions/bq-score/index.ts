import { activeMembership, adminClient, asResponse, corsHeaders, json, parseJson, requireUser } from '../_shared/bq.ts';

type Claim={sourceEventId?:string;source?:string;category?:string;claimedPoints?:number;meta?:Record<string,unknown>;targetUserId?:string};
const facilitatorRoles=new Set(['facilitator','leader','pastor','admin']);
const delegatedSources=new Set(['Team Bible Sprint','Detective Hot Seat','Verse Hunt','Conversation Circle','Wisdom Table','Pair & Share','Live Room Participation']);
const dailyCaps:Record<string,number>={knowledge:1000,reading:600,wisdom:400,mastery:300,consistency:120,group:600,couples:500};
const num=(v:unknown,min=0,max=100)=>Math.min(max,Math.max(min,Math.round(Number(v)||0)));

function derive(claim:Claim){
  const m=claim.meta||{};const source=String(claim.source||'');let category='';let points=0;
  switch(source){
    case 'Solo Bible Game':category='knowledge';points=num(m.correct,1,10)*8;break;
    case 'Learning Attempt':category='knowledge';points=num(m.attempts,1,20)*2;break;
    case 'Recall Deck':category='reading';points=num(m.cards,1,20)*4+num(m.remembered,0,20)*2;break;
    case 'Situations & Wisdom':category='wisdom';points=num(m.completed,1,10)*5;break;
    case 'Journey Mastery':category='mastery';points=Math.max(1,Math.round(num(m.growth,1,100)/2));break;
    case 'Learning Streak':category='consistency';points=3;break;
    case 'Couples Conversation':category='couples';points=num(m.completed,1,10)*4;break;
    case 'Listen First':category='couples';points=num(m.completed,1,10)*5;break;
    case 'Couple Check-in':category='couples';points=num(m.completed,1,10)*4;break;
    case 'Couples Practice':category='couples';points=num(m.completed,1,10)*6;break;
    case 'Team Bible Sprint':category='knowledge';points=10;break;
    case 'Detective Hot Seat':category='knowledge';points=num(claim.claimedPoints,4,10);break;
    case 'Verse Hunt':category='reading';points=8;break;
    case 'Conversation Circle':category='group';points=2;break;
    case 'Wisdom Table':category='wisdom';points=2;break;
    case 'Pair & Share':category='group';points=3;break;
    case 'Guided Study':category='reading';points=num(m.completed,1,3)*5;break;
    case 'Bible Explorer':category='knowledge';points=num(m.completed,1,10)*2;break;
    case 'Church Challenge':category=String(claim.category||'consistency');if(!['consistency','couples','reading','wisdom','group'].includes(category))return null;points=num(m.completed,1,5)*3;break;
    case 'Live Room Participation':category='group';points=2;break;
    default:return null;
  }
  points=Math.min(100,Math.max(1,points));
  if(claim.category&&String(claim.category)!==category)return null;
  return {source,category,points};
}

async function awardBadges(admin:ReturnType<typeof adminClient>,congregationId:string,userId:string){
  const [{data:events,error:eventError},{data:catalog,error:catalogError}]=await Promise.all([
    admin.from('bible_score_events').select('category,points').eq('congregation_id',congregationId).eq('user_id',userId).limit(20000),
    admin.from('bible_badge_catalog').select('id,threshold').eq('active',true)
  ]);
  if(eventError)throw eventError;if(catalogError)throw catalogError;
  const sums:Record<string,number>={};const counts:Record<string,number>={};let total=0;
  for(const e of events||[]){const p=Number(e.points)||0;total+=p;sums[e.category]=(sums[e.category]||0)+p;counts[e.category]=(counts[e.category]||0)+1}
  const earned:string[]=[];
  for(const b of catalog||[]){const t=b.threshold||{};const value=Number(t.value)||0;let ok=false;
    if(t.metric==='total_points')ok=total>=value;
    if(t.metric==='category_points')ok=(sums[String(t.category)]||0)>=value;
    if(t.metric==='event_count')ok=(events?.length||0)>=value;
    if(t.metric==='category_events')ok=(counts[String(t.category)]||0)>=value;
    if(ok)earned.push(b.id);
  }
  if(earned.length){const rows=earned.map(badge_id=>({congregation_id:congregationId,user_id:userId,badge_id,metadata:{source:'trusted-score-engine'}}));const {error}=await admin.from('bible_user_badges').upsert(rows,{onConflict:'congregation_id,user_id,badge_id',ignoreDuplicates:true});if(error)throw error}
}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST')return json({error:'Method not allowed'},405);
  try{
    const admin=adminClient();const user=await requireUser(req,admin);const body=await parseJson(req);
    const congregationId=String(body?.congregationId||'');const claims=(Array.isArray(body?.claims)?body.claims:[]) as Claim[];
    if(!congregationId||!claims.length||claims.length>50)return json({error:'Provide 1 to 50 activity claims'},400);
    const caller=await activeMembership(admin,congregationId,user.id);if(!caller)return json({error:'Active congregation membership required'},403);
    const {data:memberRows,error:memberError}=await admin.from('bible_congregation_members').select('user_id,role,active').eq('congregation_id',congregationId).eq('active',true);
    if(memberError)throw memberError;const memberIds=new Set((memberRows||[]).map(x=>x.user_id));
    const ids=claims.map(c=>String(c.sourceEventId||'').slice(0,120)).filter(Boolean);
    const existingMap=new Set<string>();
    if(ids.length){const {data:existing,error}=await admin.from('bible_score_events').select('user_id,source_event_id').eq('congregation_id',congregationId).in('source_event_id',ids);if(error)throw error;(existing||[]).forEach(x=>existingMap.add(`${x.user_id}:${x.source_event_id}`))}
    const dayStart=new Date();dayStart.setUTCHours(0,0,0,0);const minuteStart=new Date(Date.now()-60000).toISOString();
    const {data:today,error:todayError}=await admin.from('bible_score_events').select('user_id,category,points,created_at').eq('congregation_id',congregationId).gte('created_at',dayStart.toISOString()).limit(10000);
    if(todayError)throw todayError;
    const daily=new Map<string,number>(),minute=new Map<string,number>();
    for(const e of today||[]){const key=`${e.user_id}:${e.category}`;daily.set(key,(daily.get(key)||0)+(Number(e.points)||0));if(e.created_at>=minuteStart)minute.set(e.user_id,(minute.get(e.user_id)||0)+1)}
    const processed:any[]=[],insertRows:any[]=[],affected=new Set<string>();
    for(const claim of claims){
      const sourceEventId=String(claim.sourceEventId||'').trim().slice(0,120);const target=String(claim.targetUserId||user.id);
      if(!sourceEventId){processed.push({sourceEventId,accepted:false,reason:'missing_event_id'});continue}
      if(!memberIds.has(target)){processed.push({sourceEventId,accepted:false,reason:'target_not_in_congregation'});continue}
      const rule=derive(claim);if(!rule){processed.push({sourceEventId,accepted:false,reason:'unsupported_or_mismatched_activity'});continue}
      if(target!==user.id&&(!facilitatorRoles.has(caller.role)||!delegatedSources.has(rule.source))){processed.push({sourceEventId,accepted:false,reason:'delegated_scoring_not_allowed'});continue}
      const duplicateKey=`${target}:${sourceEventId}`;if(existingMap.has(duplicateKey)){processed.push({sourceEventId,accepted:false,duplicate:true});continue}
      if((minute.get(target)||0)>=120){processed.push({sourceEventId,accepted:false,reason:'rate_limit'});continue}
      const cap=dailyCaps[rule.category]||300;const dayKey=`${target}:${rule.category}`;if((daily.get(dayKey)||0)+rule.points>cap){processed.push({sourceEventId,accepted:false,reason:'daily_category_cap'});continue}
      insertRows.push({congregation_id:congregationId,user_id:target,category:rule.category,points:rule.points,source:rule.source,source_event_id:sourceEventId,metadata:{...(claim.meta||{}),claimed_points:num(claim.claimedPoints,0,100),submitted_by:user.id}});
      existingMap.add(duplicateKey);daily.set(dayKey,(daily.get(dayKey)||0)+rule.points);minute.set(target,(minute.get(target)||0)+1);affected.add(target);processed.push({sourceEventId,accepted:true,points:rule.points,category:rule.category,targetUserId:target});
    }
    if(insertRows.length){const {error}=await admin.from('bible_score_events').upsert(insertRows,{onConflict:'congregation_id,user_id,source_event_id',ignoreDuplicates:true});if(error)throw error;for(const target of affected)await awardBadges(admin,congregationId,target)}
    return json({processed,accepted:processed.filter(x=>x.accepted).length,rejected:processed.filter(x=>!x.accepted&&!x.duplicate).length,duplicates:processed.filter(x=>x.duplicate).length});
  }catch(err){return asResponse(err)}
});
