import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const browser=await chromium.launch({headless:true});

async function mountedConsole(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.evaluate(async()=>{
    document.body.innerHTML='<main id="admin-test-root" class="bq-main"></main>';
    const {adminConsolePage}=await import('./src/features/admin-console/index.js');
    const root=document.getElementById('admin-test-root');
    let state={status:'ready',role:'owner',busy:false,error:'',lastAction:null,users:Object.freeze([
      {id:'u1',name:'Mina',email:'mina@example.test',role:'member',accessActive:true,lastSignInAt:'2026-09-12T08:00:00Z',memberships:Object.freeze([{congregationId:'c1',congregationName:'First Church',role:'member',active:true}]),groupMemberships:Object.freeze([])},
      {id:'u2',name:'Noah',email:'noah@example.test',role:'member',accessActive:false,memberships:Object.freeze([{congregationId:'c1',congregationName:'First Church',role:'member',active:true}]),groupMemberships:Object.freeze([])}
    ],options:Object.freeze({congregations:Object.freeze([{id:'c1',name:'First Church',ownerId:'owner'},{id:'c2',name:'Second Church',ownerId:'owner'}]),groups:Object.freeze([{id:'g1',name:'Family Group',congregationId:'c1',ownerId:'other',maxMembers:6,memberCount:3}])})};
    let operationsState={status:'ready',role:'owner',currentUserId:'owner',busy:false,error:''};
    const snapshot=()=>Object.freeze({...state});
    const opSnapshot=()=>Object.freeze({...operationsState});
    window.__adminCalls=[];
    const mutate=async(name,payload)=>{window.__adminCalls.push([name,payload]);if(name==='setCongregationRole'&&payload.role==='admin')throw new Error('Owner approval required');return snapshot()};
    const opMutate=async(name,payload)=>{window.__adminCalls.push([name,payload]);return {ok:true,result:{ok:true},state:opSnapshot()}};
    const admin={
      async refresh(){return snapshot()},getState(){return snapshot()},clear(){state={...state,status:'idle'};return snapshot()},
      async setRole(id,role){return mutate('setRole',{id,role})},
      async setCongregation(id,congregationId,opts){return mutate('setCongregation',{id,congregationId,opts})},
      async removeCongregation(id,congregationId){return mutate('removeCongregation',{id,congregationId})},
      async setCongregationRole(id,congregationId,role){return mutate('setCongregationRole',{id,congregationId,role})},
      async createCongregation(name){return mutate('createCongregation',{name})},
      async createSmallGroup(payload){return mutate('createSmallGroup',payload)},
      async setGroupMembership(payload){return mutate('setGroupMembership',payload)},
      async setGroupOwner(id,groupId){return mutate('setGroupOwner',{id,groupId})}
    };
    const accountDeletion={
      async authorize(){return opSnapshot()},getState(){return opSnapshot()},clear(){operationsState={...operationsState,status:'idle'};return opSnapshot()},
      async deleteUser(id){return opMutate('deleteUser',{id})},
      async forceSignOut(id){return opMutate('forceSignOut',{id})},
      async suspendAccount(id,reason){return opMutate('suspendAccount',{id,reason})},
      async reactivateAccount(id){return opMutate('reactivateAccount',{id})},
      async setTempPassword(id,password){return opMutate('setTempPassword',{id,password})}
    };
    const def=adminConsolePage({admin,accountDeletion,onBack:()=>{},onAccount:()=>{},onOperations:()=>{}});root.innerHTML=def.html;window.__adminCleanup=def.mount(root);
  });
  await page.locator('[data-admin-user="u1"]').waitFor();
  return page;
}

try{
  const page=await mountedConsole();
  assert((await page.locator('h1').first().textContent())==='Admin Console','Admin Console heading did not render.');
  assert((await page.locator('[data-admin-user="u1"]').textContent())?.includes('First Church'),'Congregation membership is missing.');
  assert((await page.locator('[data-admin-user="u1"]').textContent())?.includes('Family Group'),'Eligible group assignment is missing.');
  for(const section of ['identity','congregations','security'])assert(await page.locator(`[data-admin-user="u1"] [data-admin-user-section="${section}"]`).count()===1,`${section} user-management section is missing.`);
  for(const severity of ['safe','elevated','critical'])assert(await page.locator(`[data-admin-user="u1"] [data-admin-severity="${severity}"]`).count()>=1,`${severity} emergency severity treatment is missing.`);
  assert((await page.locator('[data-admin-user="u1"]').textContent())?.includes('Active access'),'Active account status is not visible.');
  assert((await page.locator('[data-admin-user="u2"]').textContent())?.includes('Account suspended'),'Suspended account state is not visible.');

  page.on('dialog',async dialog=>{
    const message=dialog.message();
    if(dialog.type()==='prompt'&&message.includes('SUSPEND'))await dialog.accept('SUSPEND mina@example.test');
    else if(dialog.type()==='prompt'&&message.includes('DELETE'))await dialog.accept('DELETE mina@example.test');
    else await dialog.accept();
  });

  await page.locator('[data-admin-platform-role="u1"]').selectOption('admin');
  await page.locator('[data-admin-create-congregation] input[name="name"]').fill('New Church');
  await page.locator('[data-admin-create-congregation] button[type="submit"]').click();
  await page.locator('[data-admin-create-group] input[name="name"]').fill('Youth Group');
  await page.locator('[data-admin-create-group] button[type="submit"]').click();
  await page.locator('[data-admin-add-group="u1"]').click();

  await page.locator('[data-admin-force-signout="u1"]').click();
  await page.locator('[data-admin-suspend-reason="u1"]').fill('Security review');
  await page.locator('[data-admin-suspend-user="u1"]').click();
  await page.locator('[data-admin-temp-password="u1"]').fill('Temporary-12345');
  await page.locator('[data-admin-set-temp-password="u1"]').click();
  await page.locator('[data-admin-reactivate-user="u2"]').click();

  let calls=await page.evaluate(()=>window.__adminCalls);
  assert(calls.some(([name,payload])=>name==='setRole'&&payload.id==='u1'&&payload.role==='admin'),'Platform-role action was not handed to the Admin Console owner.');
  assert(calls.some(([name,payload])=>name==='createCongregation'&&payload.name==='New Church'),'Congregation creation was not handed to the Admin Console owner.');
  assert(calls.some(([name,payload])=>name==='createSmallGroup'&&payload.name==='Youth Group'),'Small-group creation was not handed to the Admin Console owner.');
  assert(calls.some(([name,payload])=>name==='setGroupMembership'&&payload.groupId==='g1'),'Small-group assignment was not handed to the Admin Console owner.');
  assert(calls.some(([name,payload])=>name==='forceSignOut'&&payload.id==='u1'),'Force sign-out was not handed to the existing Admin Operations owner.');
  assert(calls.some(([name,payload])=>name==='suspendAccount'&&payload.id==='u1'&&payload.reason==='Security review'),'Suspend action/reason was not handed to the existing Admin Operations owner.');
  assert(calls.some(([name,payload])=>name==='setTempPassword'&&payload.id==='u1'&&payload.password==='Temporary-12345'),'Temporary-password action was not handed to the existing Admin Operations owner.');
  assert(calls.some(([name,payload])=>name==='reactivateAccount'&&payload.id==='u2'),'Reactivate action was not handed to the existing Admin Operations owner.');

  await page.locator('[data-admin-congregation-role="u1"]').selectOption('admin');
  await page.getByText('Owner approval required').waitFor();
  const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minButton:Math.min(...[...document.querySelectorAll('button')].map(node=>node.getBoundingClientRect().height))}));
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Admin Console mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.minButton>=44,`Admin Console button touch target is below 44px: ${metrics.minButton}px.`);
  await page.evaluate(()=>window.__adminCleanup?.());
  await page.close();

  const standalone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await standalone.goto(`${BASE}admin.html`,{waitUntil:'networkidle'});
  await standalone.getByText('Sign in required').waitFor();
  assert(await standalone.locator('script[src="admin.js"]').count()===0,'v3 Admin Console must not load legacy admin.js.');
  assert(await standalone.locator('script[src*="supabase-js"]').count()===0,'v3 Admin Console must not create a second global Supabase runtime.');
  const standaloneMetrics=await standalone.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert(standaloneMetrics.scrollWidth<=standaloneMetrics.innerWidth+1,'Standalone Admin Console guest state overflows at 390px.');
  await standalone.close();

  console.log('BibleQuest Admin Console browser/mobile + emergency user-management regression passed.');
}finally{await browser.close()}
