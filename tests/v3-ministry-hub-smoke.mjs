import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/',browser=await chromium.launch({headless:true}),assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${BASE}#/ministry-hub`,{waitUntil:'networkidle'});await page.locator('[data-ministry-hub-view]').waitFor();
  assert(((await page.locator('[data-ministry-hub-view]').textContent())||'').includes('Sign in to open congregation tools'),'Real Ministry Hub route must open and fail safely while signed out.');

  const mountForRole=async role=>page.evaluate(async role=>{
    window.__bqMinistryCleanup?.();
    const stamp=Date.now(),[{createMinistryHubService},{ministryHubPage}]=await Promise.all([import(`/src/app/ministry-hub.js?smoke=${stamp}`),import(`/src/features/ministry-hub/index.js?smoke=${stamp}`)]);
    const validRoles=new Set(['member','facilitator','leader','pastor','admin']),ministryRoles=new Set(['facilitator','leader','pastor','admin']);
    const congregation={isAuthenticated:()=>true,load:async()=>[{congregationId:'c1',role:validRoles.has(role)?role:null,roleKnown:validRoles.has(role),roleLabel:validRoles.has(role)?role:'Unsupported role',congregation:{id:'c1',name:'Grace Church'}}],can:(_id,capability)=>capability==='read'?validRoles.has(role):capability==='ministry'?ministryRoles.has(role):false};
    const hub=createMinistryHubService({congregation}),host=document.querySelector('#bq-view');window.__bqMinistryRoutes=[];
    const view=ministryHubPage({hub,onNavigate:route=>window.__bqMinistryRoutes.push(route),onBack:()=>window.__bqMinistryRoutes.push('more'),onAccount:()=>window.__bqMinistryRoutes.push('account'),onCongregation:()=>window.__bqMinistryRoutes.push('congregation')});host.innerHTML=view.html;window.__bqMinistryCleanup=view.mount(host);await new Promise(resolve=>setTimeout(resolve,25));
  },role);

  await mountForRole('member');
  assert(await page.locator('[data-ministry-tool="assignments"] [data-ministry-route="assignments"]').count()===1,'Member must be able to open Assignments.');
  assert(await page.locator('[data-ministry-tool="journey-groups"] [data-ministry-route="journey-groups"]').count()===1,'Member must be able to open Journey Groups.');
  assert(await page.locator('[data-ministry-privileged]').count()===0,'Ordinary member must not receive ministry-only controls.');
  assert(await page.locator('[data-ministry-deferred="live-room"]').isDisabled(),'Live Room must remain visibly unavailable.');
  await page.locator('[data-ministry-route="assignments"]').click();await page.locator('[data-ministry-route="journey-groups"]').click();
  let routes=await page.evaluate(()=>window.__bqMinistryRoutes);assert(routes.join(',')==='assignments,journey-groups','Member tool navigation callbacks drifted.');

  await mountForRole('leader');
  assert(await page.locator('[data-ministry-privileged]').count()===1,'Leader must receive bounded ministry-role presentation.');
  assert(await page.locator('[data-ministry-tool="assignment-publishing"] [data-ministry-route="assignments"]').count()===1,'Leader assignment publishing must delegate to existing Assignments route.');
  assert(await page.locator('[data-ministry-deferred="leader-dashboard"]').isDisabled(),'Leader Dashboard must remain deferred.');
  await page.locator('[data-ministry-tool="assignment-publishing"] [data-ministry-route="assignments"]').click();routes=await page.evaluate(()=>window.__bqMinistryRoutes);assert(routes.join(',')==='assignments','Ministry tool navigation did not delegate to Assignments.');

  await mountForRole('bishop');
  assert(await page.locator('[data-ministry-route]').count()===0,'Unsupported role must receive no congregation navigation controls.');
  assert(await page.locator('[data-ministry-privileged]').count()===0,'Unsupported role must fail closed for ministry controls.');
  const copy=(await page.locator('[data-ministry-hub-view]').textContent())||'';assert(copy.includes('fails closed'),'Unsupported role failure state must be visible and deterministic.');

  const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...[...document.querySelectorAll('[data-ministry-hub-view] button')].map(node=>node.getBoundingClientRect().height))}));
  assert(metrics.innerWidth===390,'Ministry Hub browser regression did not execute at 390px.');assert(metrics.scrollWidth<=metrics.innerWidth+1,`Ministry Hub mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);assert(metrics.minTarget>=44,`Ministry Hub touch target below 44px: ${metrics.minTarget}px.`);
  await page.evaluate(()=>window.__bqMinistryCleanup?.());assert(errors.length===0,`Unexpected Ministry Hub console/page errors: ${errors.join(' | ')}`);await page.close();
}

try{await run();console.log('BibleQuest v3 Ministry Hub mobile browser regression passed.')}finally{await browser.close()}
