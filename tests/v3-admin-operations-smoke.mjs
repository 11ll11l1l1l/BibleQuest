import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const browser=await chromium.launch({headless:true});

try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.evaluate(async()=>{
    const link=document.createElement('link');link.rel='stylesheet';link.href='./src/ui/admin-operations.css';document.head.append(link);
    document.body.innerHTML='<main id="ops-test-root" class="bq-main"></main>';
    const {adminOperationsPage}=await import('./src/features/admin-operations/index.js');
    const root=document.getElementById('ops-test-root');
    const state=Object.freeze({status:'ready',role:'owner',currentUserId:'owner-1',busy:false,error:'',lastAction:'refresh',frontend:Object.freeze({pwa:'70',packPolicy:'3',runtimePolicy:'3',build:'abc123def456789'}),dashboard:Object.freeze({
      congregations:Object.freeze([{id:'c1',name:'First Church'},{id:'c2',name:'Second Church'}]),
      online:Object.freeze([{congregationId:'c1',congregationName:'First Church',displayName:'Mina',role:'member',surface:'Reader',lastSeenAt:new Date().toISOString()}]),
      assignments:Object.freeze([{id:'a1',congregationId:'c1',congregationName:'First Church',title:'Read John 1',creatorName:'Pastor A',creatorRole:'pastor',assignmentType:'reading',active:true,started:2,completed:1,createdAt:new Date().toISOString(),scheduleAt:null,recurrenceRule:'',requiredReflection:true,minQuizScore:80}]),
      messages:Object.freeze([{id:'m1',congregationId:'c1',congregationName:'First Church',title:'Sunday',creatorName:'Pastor A',creatorRole:'pastor',messageType:'announcement',active:true,publishAt:new Date().toISOString(),mediaPath:'',pinned:true}]),
      polls:Object.freeze([{id:'p1',congregationId:'c1',congregationName:'First Church',prompt:'Meeting time?',creatorName:'Leader A',pollType:'single',resultsVisibility:'live',active:true,votes:4,totals:Object.freeze([{label:'Morning',total:3},{label:'Evening',total:1}]),createdAt:new Date().toISOString()}]),
      media:Object.freeze([{id:'v1',congregationId:'c1',congregationName:'First Church',title:'Bible Study',creatorName:'Owner',creatorRole:'owner',mediaType:'youtube_video',featured:true,displayOrder:1,active:true,publishAt:new Date().toISOString()}]),
      rooms:Object.freeze([{id:'r1',congregationId:'c1',congregationName:'First Church',title:'Live Study',creatorName:'Owner',creatorRole:'owner',status:'live',participants:5,createdAt:new Date().toISOString()}]),
      calendar:Object.freeze([]),recognitions:Object.freeze([]),health:Object.freeze({opsVersion:5,checkedAt:new Date().toISOString(),counts:Object.freeze({bible_assignments:9}),clientErrors24h:Object.freeze([{id:'e1',surface:'Reader',message:'Sample error',appVersion:'v3',createdAt:new Date().toISOString()}])})
    })});
    window.__opsRefresh=0;
    const operations={getState:()=>state,async refresh(){window.__opsRefresh++;return state},clear(){},async deleteUser(){throw new Error('not used')}};
    const def=adminOperationsPage({operations,onBack:()=>{},onAccount:()=>{}});root.innerHTML=def.html;window.__opsCleanup=def.mount(root);
  });
  await page.getByText('System health').waitFor();
  assert(await page.getByText('Who is online').count()===1,'Online section did not render.');
  assert(await page.getByText('Leader / pastor assignments').count()===1,'Assignments section did not render.');
  assert(await page.getByText('Devotionals & announcements').count()===1,'Messages section did not render.');
  assert(await page.getByText('Congregation polls').count()===1,'Polls section did not render.');
  assert(await page.getByText('Handpicked videos & channels').count()===1,'Curated media section did not render.');
  assert(await page.getByText('Live rooms & live polls').count()===1,'Live-room section did not render.');
  assert((await page.locator('body').textContent())?.includes('Morning: 3'),'Poll aggregate totals are missing.');
  assert(!(await page.locator('body').textContent())?.includes('secret-user'),'Privileged user identifiers leaked into operations UI.');
  await page.locator('[data-ops-filter]').selectOption('c2');
  assert(await page.getByText('Mina').count()===0,'Congregation filter did not hide another congregation.');
  await page.locator('[data-ops-refresh]').click();
  assert(await page.evaluate(()=>window.__opsRefresh)>=2,'Explicit refresh was not delegated to the Admin Operations owner.');
  const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minButton:Math.min(...[...document.querySelectorAll('button')].map(node=>node.getBoundingClientRect().height))}));
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Admin Operations mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.minButton>=44,`Admin Operations button touch target is below 44px: ${metrics.minButton}px.`);
  await page.evaluate(()=>window.__opsCleanup?.());
  await page.close();

  const standalone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await standalone.goto(`${BASE}admin-operations.html`,{waitUntil:'networkidle'});
  await standalone.getByText('Sign in required').waitFor();
  assert(await standalone.locator('script[src="admin-operations.js"]').count()===0,'v3 Admin Operations must not load legacy admin-operations.js.');
  assert(await standalone.locator('script[src="cloud-config.js"]').count()===0,'v3 Admin Operations must not load legacy cloud-config.js.');
  assert(await standalone.locator('script[src*="supabase-js"]').count()===0,'v3 Admin Operations must not create a second global Supabase runtime.');
  const standaloneMetrics=await standalone.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert(standaloneMetrics.scrollWidth<=standaloneMetrics.innerWidth+1,'Standalone Admin Operations guest state overflows at 390px.');
  await standalone.close();

  const adminPage=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await adminPage.goto(BASE,{waitUntil:'networkidle'});
  await adminPage.evaluate(async()=>{
    const link=document.createElement('link');link.rel='stylesheet';link.href='./src/ui/admin-operations.css';document.head.append(link);
    document.body.innerHTML='<main id="admin-delete-test" class="bq-main"></main>';
    const {adminConsolePage}=await import('./src/features/admin-console/index.js');
    const root=document.getElementById('admin-delete-test');
    const users=Object.freeze([
      {id:'owner-1',name:'Owner',email:'owner@example.test',role:'owner',memberships:Object.freeze([]),groupMemberships:Object.freeze([])},
      {id:'u2',name:'Mina',email:'mina@example.test',role:'member',memberships:Object.freeze([]),groupMemberships:Object.freeze([])}
    ]);
    let adminState=Object.freeze({status:'ready',role:'owner',busy:false,error:'',lastAction:null,users,options:Object.freeze({congregations:Object.freeze([]),groups:Object.freeze([])})});
    const admin={async refresh(){window.__adminRefreshes=(window.__adminRefreshes||0)+1;return adminState},getState:()=>adminState,clear(){},async setRole(){},async setCongregation(){},async removeCongregation(){},async setCongregationRole(){},async createCongregation(){},async createSmallGroup(){},async setGroupMembership(){},async setGroupOwner(){}};
    const opsState=Object.freeze({status:'ready',role:'owner',currentUserId:'owner-1',busy:false,error:''});
    window.__deleted=[];window.__adminRefreshes=0;window.prompt=()=> 'DELETE mina@example.test';
    const accountDeletion={async authorize(){return opsState},getState:()=>opsState,clear(){},async deleteUser(id){window.__deleted.push(id);return {ok:true}}};
    const def=adminConsolePage({admin,accountDeletion,onBack:()=>{},onAccount:()=>{},onOperations:()=>{}});root.innerHTML=def.html;window.__adminDeleteCleanup=def.mount(root);
  });
  await adminPage.locator('[data-admin-delete-user="u2"]').waitFor();
  assert(await adminPage.locator('[data-admin-delete-user="owner-1"]').count()===0,'Current Owner must not receive a self-delete control.');
  await adminPage.locator('[data-admin-delete-user="u2"]').click();
  await adminPage.getByText('Mina account deleted.').waitFor();
  assert(JSON.stringify(await adminPage.evaluate(()=>window.__deleted))==='["u2"]','Owner deletion was not delegated to the #93 service.');
  assert(await adminPage.evaluate(()=>window.__adminRefreshes)>=2,'Admin Console did not refresh after confirmed deletion.');
  const deleteMetrics=await adminPage.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert(deleteMetrics.scrollWidth<=deleteMetrics.innerWidth+1,'Composed Owner deletion controls overflow at 390px.');
  await adminPage.evaluate(()=>window.__adminDeleteCleanup?.());
  await adminPage.close();

  console.log('BibleQuest v3 Admin Operations browser/mobile regression passed.');
}finally{await browser.close()}