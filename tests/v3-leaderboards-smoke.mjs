import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/',browser=await chromium.launch({headless:true}),assert=(condition,message)=>{if(!condition)throw new Error(message)};
async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});
  const result=await page.evaluate(async()=>{
    const [{createLeaderboardsService},{leaderboardsPage}]=await Promise.all([import(`/src/app/leaderboards.js?smoke=${Date.now()}`),import(`/src/features/leaderboards/index.js?smoke=${Date.now()}`)]);
    let sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}},calls=[];
    const session={getState:()=>sessionState};
    const congregation={load:async()=>[{congregationId:'c1',roleLabel:'Member',congregation:{name:'Test Church'}}],assert:()=>true};
    const api={load:async(id,since)=>{calls.push({id,since});return{directory:[{congregation_id:'c1',user_id:'u1',display_name:'Amy',active:true},{congregation_id:'c1',user_id:'u2',display_name:'Ben',active:true}],scores:[{user_id:'u1',category:'knowledge',points:8},{user_id:'u2',category:'reading',points:4}]}}};
    const leaderboards=createLeaderboardsService({api,session,congregation,clock:()=>new Date('2026-09-09T15:30:00+09:00')});
    const host=document.createElement('div');host.innerHTML='<section class="bq-panel" data-leaderboards-view></section>';document.body.appendChild(host);
    const pageDef=leaderboardsPage({leaderboards,onBack:()=>{},onAccount:()=>{}});const dispose=pageDef.mount(host);await new Promise(resolve=>setTimeout(resolve,25));
    const initial={title:host.querySelector('h1')?.textContent||'',rows:[...host.querySelectorAll('[data-leaderboard-user]')].map(row=>row.textContent.trim()),periods:[...host.querySelectorAll('[data-leaderboard-period]')].map(button=>button.textContent.trim()),lanes:[...host.querySelectorAll('[data-leaderboard-lane]')].map(button=>button.textContent.trim())};
    host.querySelector('[data-leaderboard-lane="knowledge"]')?.click();await new Promise(resolve=>setTimeout(resolve,25));
    const knowledge=[...host.querySelectorAll('[data-leaderboard-user]')].map(row=>row.textContent.trim());
    host.querySelector('[data-leaderboard-period="today"]')?.click();await new Promise(resolve=>setTimeout(resolve,25));
    const today=leaderboards.snapshot().period;
    dispose?.();host.remove();sessionState={authenticated:false,remoteAvailable:true,user:null};
    let authCode='';try{await leaderboards.load()}catch(error){authCode=error.code||''}
    return{initial,knowledge,today,authCode,calls};
  });
  assert(result.initial.title==='Test Church','Leaderboard congregation title did not render.');
  assert(result.initial.rows[0].includes('Amy')&&result.initial.rows[0].includes('8 pts'),'Overall ranking did not sum trusted category aggregates.');
  assert(result.initial.periods.join('|')==='Today|This Week|All Time','Recovered period controls changed.');
  assert(result.initial.lanes.join('|')==='Overall|Knowledge|Reading|Wisdom|Mastery|Consistency|Group|Couples','Recovered eight lanes changed.');
  assert(result.knowledge[0].includes('Amy')&&result.knowledge[0].includes('8 pts'),'Knowledge lane ranking failed.');
  assert(result.today==='today','Today period did not apply.');
  assert(result.authCode==='BQ_LEADERBOARD_AUTH_REQUIRED','Signed-out leaderboard did not fail closed.');
  const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));assert(metrics.innerWidth===390,'Leaderboard smoke did not execute at 390px.');assert(metrics.scrollWidth<=metrics.innerWidth+1,`Leaderboard caused horizontal overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(errors.length===0,`Unexpected Leaderboards console/page errors: ${errors.join(' | ')}`);await page.close();
}
try{await run();console.log('BibleQuest v3 Leaderboards mobile browser regression passed.')}finally{await browser.close()}
