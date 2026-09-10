import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/',browser=await chromium.launch({headless:true}),assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${BASE}#/workspace`,{waitUntil:'networkidle'});await page.locator('h1').filter({hasText:'Bible Workspace'}).waitFor();
  assert(((await page.locator('#bq-view').textContent())||'').includes('Sign in to use your private Workspace'),'Real Workspace route must open and fail safely while signed out.');

  await page.evaluate(async()=>{
    window.__bqWorkspaceCleanup?.();const stamp=Date.now(),[{createWorkspaceService},{workspacePage}]=await Promise.all([import(`/src/app/workspace.js?smoke=${stamp}`),import(`/src/features/workspace/index.js?smoke=${stamp}`)]);
    window.__bqWorkspaceRoutes=[];window.__bqWorkspaceStored={version:1,view:'overview'};window.__bqWorkspaceReader=[];
    const session={getState:()=>({authenticated:true,remoteAvailable:true,user:{id:'u1'}})};
    const cloudNotes={load:async()=>[{id:'n1',userId:'u1',book:'JHN',chapter:3,verseStart:16,verseEnd:null,title:'Grace note',content:'God loved the world',tags:['love'],noteType:'study',isPinned:true,updatedAt:'2026-09-10T08:00:00.000Z'}],clear:()=>{}};
    const congregation={load:async()=>[{congregationId:'c1',role:'pastor',roleKnown:true,roleLabel:'Pastor',congregation:{name:'Grace Church'}},{congregationId:'c2',role:null,roleKnown:false,roleLabel:'Unsupported role',congregation:{name:'Unknown Church'}}],clear:()=>{}};
    const reader={getState:()=>({translation:'bsb',book:'JHN',chapter:1,read:{}}),setBook:(book,chapter)=>window.__bqWorkspaceReader.push({book,chapter})};
    const storage={read:(_key,fallback)=>window.__bqWorkspaceStored??fallback,write:(_key,value)=>(window.__bqWorkspaceStored=value)};
    const workspace=createWorkspaceService({session,cloudNotes,congregation,reader,storage}),host=document.querySelector('#bq-view'),view=workspacePage({workspace,onNavigate:route=>window.__bqWorkspaceRoutes.push(route),onBack:()=>window.__bqWorkspaceRoutes.push('more'),onAccount:()=>window.__bqWorkspaceRoutes.push('account')});
    host.innerHTML=view.html;window.__bqWorkspaceCleanup=view.mount(host);
  });
  await page.locator('[data-workspace-overview]').waitFor();let copy=(await page.locator('#bq-view').textContent())||'';
  assert(copy.includes('1 cloud note'),'Workspace must show Cloud Notes-derived state.');assert(copy.includes('Pastor'),'Known congregation role context must render.');assert(copy.includes('Unsupported role · no access expansion'),'Unsupported role must fail closed.');assert(copy.includes('No congregation role, including leader/pastor/admin, enables Workspace sharing'),'Workspace role context must not invent sharing.');

  await page.locator('[data-workspace-tab="notes"]').click();await page.locator('[data-workspace-notes-view]').waitFor();assert((await page.evaluate(()=>window.__bqWorkspaceStored.view))==='notes','Workspace view change must persist through the shared storage boundary.');
  await page.locator('[data-workspace-search] input').fill('love');await page.locator('[data-workspace-search] button').click();copy=(await page.locator('#bq-view').textContent())||'';assert(copy.includes('1 result for “love”'),'Workspace search must use loaded note state.');
  await page.locator('[data-workspace-open-scripture="n1"]').click();assert((await page.evaluate(()=>window.__bqWorkspaceRoutes.join(',')))==='reader','Workspace note Scripture must delegate only to Reader route.');assert(JSON.stringify(await page.evaluate(()=>window.__bqWorkspaceReader))===JSON.stringify([{book:'JHN',chapter:3}]),'Workspace must delegate passage state to Reader owner.');

  await page.evaluate(()=>window.__bqWorkspaceRoutes=[]);await page.locator('[data-workspace-cloud-notes]').first().click();assert((await page.evaluate(()=>window.__bqWorkspaceRoutes.join(',')))==='cloud-notes','Workspace note editing must delegate only to Cloud Notes route.');
  const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...[...document.querySelectorAll('#bq-view button')].filter(node=>!node.hidden).map(node=>node.getBoundingClientRect().height))}));
  assert(metrics.innerWidth===390,'Workspace browser regression did not execute at 390px.');assert(metrics.scrollWidth<=metrics.innerWidth+1,`Workspace mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);assert(metrics.minTarget>=44,`Workspace touch target below 44px: ${metrics.minTarget}px.`);
  await page.evaluate(()=>window.__bqWorkspaceCleanup?.());assert(errors.length===0,`Unexpected Workspace console/page errors: ${errors.join(' | ')}`);await page.close();
}

try{await run();console.log('BibleQuest v3 Workspace mobile browser regression passed.')}finally{await browser.close()}
