import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/',browser=await chromium.launch({headless:true}),assert=(condition,message)=>{if(!condition)throw new Error(message)};
async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});
  const result=await page.evaluate(async()=>{
    const {createPresenceService,PRESENCE_STALE_MS}=await import('/src/app/presence.js');
    let now=Date.now(),sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}},state={session:sessionState},timerFn=null,cleared=0;
    const listeners=new Set(),store={getState:()=>state,setState(patch){state=typeof patch==='function'?patch(state):{...state,...patch};listeners.forEach(listener=>listener(state));return state},subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener)}};
    const api={touch:async(congregationId,userId,surface)=>({congregation_id:congregationId,user_id:userId,last_seen_at:new Date(now).toISOString(),surface}),leave:async()=>{},list:async congregationId=>[{congregation_id:congregationId,user_id:'u1',last_seen_at:new Date(now-1000).toISOString(),surface:'BibleQuest'},{congregation_id:congregationId,user_id:'u2',last_seen_at:new Date(now-PRESENCE_STALE_MS-1).toISOString(),surface:'BibleQuest'}],activeCount:async()=>1};
    const session={getState:()=>sessionState},congregation={list:()=>[{congregationId:'c1',userId:'u1'}],load:async()=>[{congregationId:'c1',userId:'u1'}],can:id=>id==='c1'};
    const presence=createPresenceService({api,session,congregation,store,clock:()=>now,setIntervalFn(fn){timerFn=fn;return 1},clearIntervalFn(){timerFn=null;cleared+=1}});
    await presence.start();const first=await presence.load('c1');now+=PRESENCE_STALE_MS+1;const aged=presence.snapshot('c1');await presence.dispose({remove:false});
    return {status:state.presence?.status,first:first.map(row=>row.online),aged:aged.map(row=>row.online),timerCleared:timerFn===null&&cleared>0};
  });
  assert(result.status==='online','Presence browser lifecycle did not publish online state.');assert(result.first.join(',')==='true,false','Presence browser stale classification drifted.');assert(result.aged.join(',')==='false,false','Presence browser cache did not age out.');assert(result.timerCleared,'Presence browser cleanup did not clear timer ownership.');assert(errors.length===0,`Unexpected Presence console/page errors: ${errors.join(' | ')}`);await page.close();
}
try{await run();console.log('BibleQuest v3 Presence browser regression passed.')}finally{await browser.close()}
