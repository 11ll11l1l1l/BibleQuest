import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function installHarness(page,{single=false}={}){
  await page.evaluate(async(single)=>{
    const {congregationPage}=await import('/src/features/congregation/index.js');
    window.__removeCongregationHarness?.();
    const rows=[
      {congregationId:'c1',userId:'u1',role:'member',roleKnown:true,roleLabel:'Member',congregation:{id:'c1',name:'ICAC Aizu',timezone:'Asia/Tokyo'}},
      {congregationId:'c2',userId:'u1',role:'leader',roleKnown:true,roleLabel:'Leader',congregation:{id:'c2',name:'ICAC Tsukuba',timezone:'Asia/Tokyo'}}
    ];
    let memberships=single?rows.slice(0,1):rows.slice();
    let activeId='c1';
    const membership={
      isAuthenticated:()=>true,
      async load(){return memberships.slice()},
      list(){return memberships.slice()},
      getActive(){return memberships.find(row=>row.congregationId===activeId)||null},
      setActive(id){
        const next=memberships.find(row=>row.congregationId===String(id));
        if(!next)throw new Error('You are not a member of that congregation.');
        activeId=next.congregationId;return next;
      },
      async join(){return memberships.slice()}
    };
    const root=document.createElement('div');root.id='congregation-switcher-test-root';document.body.append(root);
    const definition=congregationPage({membership,onAccount:()=>{},onBack:()=>{}});
    root.innerHTML=definition.html;const cleanup=definition.mount(root);
    window.__removeCongregationHarness=()=>{cleanup?.();root.remove()};
  },single);
}

async function switcherWorks(){
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});await installHarness(page);
  const root=page.locator('#congregation-switcher-test-root');
  await root.locator('[data-congregation-current="true"]').waitFor();
  assert(await root.locator('[data-congregation-current="true"] h2').textContent()==='ICAC Aizu','Initial active congregation marker is incorrect.');
  assert(await root.locator('[data-congregation-switch="c2"]').count()===1,'Inactive membership must expose exactly one switch control.');
  await root.locator('[data-congregation-switch="c2"]').click();
  await root.locator('[data-congregation-current="true"] h2').filter({hasText:'ICAC Tsukuba'}).waitFor();
  assert(await root.locator('[data-congregation-switch="c1"]').count()===1,'Previous congregation must become switchable after selection changes.');
  assert((await root.locator('[data-congregation-message]').textContent())==='Active congregation changed to ICAC Tsukuba.','Successful switch must be announced through the live status message.');
  assert(pageErrors.length===0,`Congregation switcher page errors: ${pageErrors.join('; ')}`);
  await page.evaluate(()=>window.__removeCongregationHarness());await page.close();
}

async function singleMembershipHasNoSwitcher(){
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.goto(BASE,{waitUntil:'networkidle'});await installHarness(page,{single:true});
  const root=page.locator('#congregation-switcher-test-root');
  await root.locator('[data-congregation-current="true"]').waitFor();
  assert(await root.locator('[data-congregation-switch]').count()===0,'Single-membership users must not see a congregation switch action.');
  assert(await root.locator('[data-congregation-active]').count()===1,'Single membership must still be visibly identified as active.');
  await page.evaluate(()=>window.__removeCongregationHarness());await page.close();
}

async function mobile(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});await installHarness(page);
  const root=page.locator('#congregation-switcher-test-root');await root.locator('[data-congregation-switch="c2"]').waitFor();
  const metrics=await page.evaluate(()=>{
    const scope=document.querySelector('#congregation-switcher-test-root');
    const controls=[...scope.querySelectorAll('button')];
    return {innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...controls.map(node=>node.getBoundingClientRect().height))};
  });
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Congregation switcher mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.minTarget>=44,'Congregation switcher mobile control target is below 44px.');
  assert(pageErrors.length===0,`Congregation switcher mobile page errors: ${pageErrors.join('; ')}`);
  await page.evaluate(()=>window.__removeCongregationHarness());await page.close();
}

try{await switcherWorks();await singleMembershipHasNoSwitcher();await mobile();console.log('BibleQuest v5 active congregation switcher browser regression passed.')}finally{await browser.close()}
