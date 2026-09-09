import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/',browser=await chromium.launch({headless:true}),assert=(condition,message)=>{if(!condition)throw new Error(message)};
async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});
  const result=await page.evaluate(async()=>{
    const [{createCongregationRecognitionService},{congregationRecognitionPage}]=await Promise.all([import(`/src/app/congregation-recognition.js?smoke=${Date.now()}`),import(`/src/features/congregation-recognition/index.js?smoke=${Date.now()}`)]);
    let sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}},awardCalls=[];
    const session={getState:()=>sessionState};
    const congregation={load:async()=>[{congregationId:'c1',role:'leader',roleLabel:'Leader',congregation:{name:'Test Church'}}],assert:()=>true};
    const data={directory:[{congregation_id:'c1',user_id:'u1',display_name:'Amy',role:'leader',active:true},{congregation_id:'c1',user_id:'u2',display_name:'Ben',role:'member',active:true}],catalog:[{id:'first-study',name:'First Study',icon:'📘',category:'Learning',description:'Study badge'}],badges:[{congregation_id:'c1',user_id:'u2',badge_id:'first-study',earned_at:'2026-09-09T00:00:00Z'}],recognitions:[{id:'r1',congregation_id:'c1',user_id:'u2',awarded_by:'u1',award_code:'encourager',title:'Encourager',note:'Thank you',icon:'💛',visible:true,created_at:'2026-09-09T01:00:00Z'}]};
    const api={load:async()=>data,award:async row=>{awardCalls.push(row);return{...row,id:'r2',visible:true,created_at:'2026-09-09T02:00:00Z'}}};
    const recognition=createCongregationRecognitionService({api,session,congregation});
    const host=document.createElement('div');host.innerHTML='<section class="bq-panel" data-recognition-view></section>';document.body.appendChild(host);
    const pageDef=congregationRecognitionPage({recognition,onBack:()=>{},onAccount:()=>{},onLeaderboards:()=>{}}),dispose=pageDef.mount(host);await new Promise(resolve=>setTimeout(resolve,30));
    const initial={title:host.querySelector('h1')?.textContent||'',recognition:host.querySelector('[data-recognition-row="r1"]')?.textContent||'',badge:host.querySelector('[data-recognition-member="u2"]')?.textContent||'',options:host.querySelectorAll('[name="award_code"] option').length,permission:host.textContent.includes('LEADER · PASTOR · ADMIN')};
    const form=host.querySelector('[data-recognition-award]');form.querySelector('[name="user_id"]').value='u2';form.querySelector('[name="award_code"]').value='consistency';form.querySelector('[name="note"]').value='Well done';form.querySelector('button[type="submit"]').click();await new Promise(resolve=>setTimeout(resolve,60));
    const after={message:host.textContent.includes('Recognition saved.'),awardCalls};
    dispose?.();host.remove();sessionState={authenticated:false,remoteAvailable:true,user:null};let authCode='';try{await recognition.load()}catch(error){authCode=error.code||''}
    return{initial,after,authCode};
  });
  assert(result.initial.title==='Test Church','Recognition congregation title did not render.');
  assert(result.initial.recognition.includes('Ben')&&result.initial.recognition.includes('Encourager'),'Visible recognition did not render.');
  assert(result.initial.badge.includes('Ben')&&result.initial.badge.includes('First Study'),'Earned congregation badge did not render.');
  assert(result.initial.options===9,'Recovered recognition presets changed.');
  assert(result.initial.permission,'Leader award permission boundary was not visible.');
  assert(result.after.message,'Recognition success state did not render.');
  assert(result.after.awardCalls.length===1&&result.after.awardCalls[0].award_code==='consistency'&&result.after.awardCalls[0].user_id==='u2','Recognition form did not submit canonical award.');
  assert(result.authCode==='BQ_RECOGNITION_AUTH_REQUIRED','Signed-out Recognition did not fail closed.');
  const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));assert(metrics.innerWidth===390,'Recognition smoke did not execute at 390px.');assert(metrics.scrollWidth<=metrics.innerWidth+1,`Recognition caused horizontal overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(errors.length===0,`Unexpected Recognition console/page errors: ${errors.join(' | ')}`);await page.close();
}
try{await run();console.log('BibleQuest v3 Congregation Recognition mobile browser regression passed.')}finally{await browser.close()}
