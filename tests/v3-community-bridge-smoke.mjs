import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/',browser=await chromium.launch({headless:true}),assert=(condition,message)=>{if(!condition)throw new Error(message)};
async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${BASE}#/community`,{waitUntil:'networkidle'});await page.locator('[data-community-view]').waitFor();assert(((await page.locator('[data-community-view]').textContent())||'').includes('Sign in to connect'),'Signed-out Community route must fail safely.');
  await page.evaluate(async()=>{
    const {communityPage}=await import('/src/features/community/index.js'),host=document.querySelector('#bq-view');window.__bqCommunityRoutes=[];
    const state={status:'ready',authenticated:true,remoteAvailable:true,congregations:[{id:'c1',name:'Grace Church',role:'leader',roleLabel:'Leader',canMinistry:true}],groups:[{id:'g1',congregationId:'c1',name:'Faith Group',role:'leader',memberCount:2,maxMembers:6}],encouragementCount:3};
    const bridge={async load(){return state}};const view=communityPage({bridge,onNavigate:route=>window.__bqCommunityRoutes.push(route),onBack:()=>window.__bqCommunityRoutes.push('more'),onAccount:()=>window.__bqCommunityRoutes.push('account')});host.innerHTML=view.html;window.__bqCommunityCleanup=view.mount(host);
  });
  await page.locator('[aria-label="Community connection summary"]').waitFor();const copy=(await page.locator('[data-community-view]').textContent())||'';assert(copy.includes('Grace Church')&&copy.includes('Faith Group')&&copy.includes('3Encouragements'),'Community projection summary is incomplete.');assert(copy.includes('Private notes')&&copy.includes('do not cross this bridge'),'Privacy boundary is not visible.');
  for(const route of ['congregation','journey-groups','encouragements'])await page.locator(`[data-community-route="${route}"]`).click();const routes=await page.evaluate(()=>window.__bqCommunityRoutes);assert(routes.join(',')==='congregation,journey-groups,encouragements','Community navigation callbacks drifted.');
  const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...[...document.querySelectorAll('[data-community-view] button')].map(node=>node.getBoundingClientRect().height))}));assert(metrics.scrollWidth<=metrics.innerWidth+1,`Community mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);assert(metrics.minTarget>=44,`Community touch target below 44px: ${metrics.minTarget}px.`);
  await page.evaluate(()=>window.__bqCommunityCleanup?.());assert(errors.length===0,`Unexpected Community console/page errors: ${errors.join(' | ')}`);await page.close();
}
try{await run();console.log('BibleQuest v3 Community Bridge browser regression passed.')}finally{await browser.close()}
