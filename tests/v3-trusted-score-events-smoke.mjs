import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/',browser=await chromium.launch({headless:true}),assert=(condition,message)=>{if(!condition)throw new Error(message)};
async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});await page.locator('#bq-view').waitFor();
  const result=await page.evaluate(async()=>{
    const {createTrustedScoreEventsService}=await import(`/src/app/trusted-score-events.js?smoke=${Date.now()}`);
    let sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}},remoteCalls=0;
    const session={getState:()=>sessionState};
    const congregation={can:(id,cap)=>id==='c1'&&cap==='read',load:async()=>[{congregationId:'c1',userId:'u1'}]};
    const api={async submit(congregationId,claims){remoteCalls++;return{processed:claims.map((claim,index)=>index===0?{sourceEventId:claim.sourceEventId,accepted:true,points:5,category:'reading',targetUserId:'u1'}:{sourceEventId:claim.sourceEventId,accepted:false,duplicate:true})}}};
    const service=createTrustedScoreEventsService({api,session,congregation});
    const response=await service.submit('c1',[{sourceEventId:' browser-accepted ',source:'Guided Study',meta:{completed:1}},{sourceEventId:'browser-existing',source:'Guided Study',meta:{completed:1}}]);
    const callsAfterRemote=remoteCalls;
    let duplicateCode='';try{await service.submit('c1',[{sourceEventId:'same',source:'Guided Study'},{sourceEventId:' same ',source:'Guided Study'}])}catch(error){duplicateCode=error.code||''}
    sessionState={authenticated:false,remoteAvailable:true,user:null};let authCode='';try{await service.submit('c1',[{sourceEventId:'signed-out',source:'Guided Study'}])}catch(error){authCode=error.code||''}
    return{response,remoteCalls,callsAfterRemote,duplicateCode,authCode};
  });
  assert(result.response.accepted===1&&result.response.duplicates===1&&result.response.rejected===0,'Browser trusted-score result normalization failed.');
  assert(result.response.processed[0].sourceEventId==='browser-accepted','Browser event-ID canonicalization failed.');
  assert(result.duplicateCode==='BQ_SCORE_EVENT_DUPLICATE'&&result.remoteCalls===result.callsAfterRemote,'Browser same-batch duplicate must fail before remote mutation.');
  assert(result.authCode==='BQ_SCORE_EVENT_AUTH_REQUIRED','Browser signed-out scoring must fail closed.');
  const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));assert(metrics.innerWidth===390,'Trusted-score smoke did not execute at 390px.');assert(metrics.scrollWidth<=metrics.innerWidth+1,`Existing shell overflowed during trusted-score composition: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(errors.length===0,`Unexpected Trusted Score Events console/page errors: ${errors.join(' | ')}`);await page.close();
}
try{await run();console.log('BibleQuest v3 Trusted Score Events browser regression passed.')}finally{await browser.close()}
