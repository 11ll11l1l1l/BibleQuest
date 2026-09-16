import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function installHarness(page,{role='leader',directoryFails=false}={}){
  await page.evaluate(async({role,directoryFails})=>{
    const [{createLeaderCenterService},{leaderCenterPage}]=await Promise.all([
      import('/src/app/leader-center.js'),import('/src/features/leader-center/index.js')
    ]);
    window.__removeLeaderCenterHarness?.();
    window.__lcReviewCalls=[];
    const baseState={status:'ready',role,congregationId:'c1',congregationName:'Harness Congregation',assignments:[{id:'a1',scheduleAt:null,title:'Open task'},{id:'a2',scheduleAt:'2999-01-01T00:00:00.000Z',title:'Future task'}]};
    const assignments={
      async load(){return baseState},
      snapshot(){return baseState},
      async loadPublishTargets(){
        if(directoryFails)throw new Error('directory unavailable');
        return {...baseState,publishTargets:{
          members:[{id:'m1',label:'Ana Member',role:'member'},{id:'m2',label:'Ben Leader',role:'leader'}],
          groups:[{id:'g1',label:'Young Adults'}],
          teams:[{id:'t1',label:'Worship Team',type:'ministry'}]
        }};
      },
      open(id){window.__lcReviewCalls.push(['open',id])},
      async loadReview(id){window.__lcReviewCalls.push(['loadReview',id]);return{activeId:id,activeReview:{status:'ready'}}}
    };
    const presence={async activeCount(){return{count:4,windowMinutes:30}}};
    const leaderCenter=createLeaderCenterService({assignments,presence});
    const root=document.createElement('div');root.id='leader-center-test-root';document.body.append(root);
    const definition=leaderCenterPage({leaderCenter,onBack:()=>{},onAccount:()=>{},onAssignments:()=>{window.__lcNav='assignments'},onJourneyGroups:()=>{window.__lcNav='journey-groups'},onTeamCenter:()=>{window.__lcNav='team-center'},onCongregation:()=>{window.__lcNav='congregation'}});
    root.innerHTML=definition.html;const cleanup=definition.mount(root);
    window.__removeLeaderCenterHarness=()=>{cleanup?.();root.remove();delete window.__lcNav};
  },{role,directoryFails});
}

async function leaderSeesComposedCenter(){
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.goto(BASE,{waitUntil:'networkidle'});
  await installHarness(page,{role:'leader'});
  const root=page.locator('#leader-center-test-root');
  await root.locator('[data-leader-overview]').waitFor();
  assert(await root.locator('[data-leader-center-denied]').count()===0,'A real leader must not see the denied state.');
  assert(await root.locator('[data-leader-active-count]').textContent()==='4','Active count did not render.');
  assert(await root.locator('[data-leader-member-count]').textContent()==='2','Member count did not render from the ministry-safe directory.');
  assert(await root.locator('[data-leader-open-count]').textContent()==='1','Open assignment count did not render.');
  assert(await root.locator('[data-leader-scheduled-count]').textContent()==='1','Scheduled assignment count did not render.');
  assert((await root.locator('[data-leader-people]').innerText()).includes('Ana Member'),'People directory is missing the safe member label.');
  assert(!(await root.locator('[data-leader-people]').innerText()).match(/reflection|personality answer/i),'People view contains sensitive content.');
  const spaces=await root.locator('[data-leader-groups-teams]').innerText();
  assert(spaces.includes('Young Adults')&&spaces.includes('Worship Team'),'Groups/Teams composition did not render.');

  await root.locator('[data-leader-review-assignment="a1"]').click();
  await page.waitForFunction(()=>window.__lcNav==='assignments');
  assert(JSON.stringify(await page.evaluate(()=>window.__lcReviewCalls))===JSON.stringify([['open','a1'],['loadReview','a1']]),'Response review did not delegate through the existing Assignments owner.');

  await page.evaluate(()=>{window.__lcNav='';});
  await root.locator('[data-leader-open-groups]').click();
  assert(await page.evaluate(()=>window.__lcNav)==='journey-groups','Journey Groups handoff failed.');
  await page.evaluate(()=>{window.__lcNav='';});
  await root.locator('[data-leader-open-teams]').click();
  assert(await page.evaluate(()=>window.__lcNav)==='team-center','Team Center handoff failed.');
  await page.evaluate(()=>window.__removeLeaderCenterHarness());
  await page.close();
}

async function directoryFailureIsTruthful(){
  const page=await browser.newPage({viewport:{width:900,height:800}});
  await page.goto(BASE,{waitUntil:'networkidle'});await installHarness(page,{role:'leader',directoryFails:true});
  const root=page.locator('#leader-center-test-root');await root.locator('[data-leader-overview]').waitFor();
  assert(await root.locator('[data-leader-member-count]').textContent()==='—','Directory failure must render unknown member count, not zero.');
  assert((await root.locator('[data-leader-people]').innerText()).includes('unavailable'),'Directory failure needs an intentional unavailable state.');
  await page.evaluate(()=>window.__removeLeaderCenterHarness());await page.close();
}

async function memberIsDenied(){
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.goto(BASE,{waitUntil:'networkidle'});
  await installHarness(page,{role:'member'});
  const root=page.locator('#leader-center-test-root');
  await root.locator('[data-leader-center-denied]').waitFor();
  assert(await root.locator('[data-leader-overview]').count()===0,'An ordinary member must never see Leader Center data.');
  assert(await root.locator('[data-leader-people]').count()===0,'An ordinary member must never see the ministry directory.');
  await page.evaluate(()=>window.__removeLeaderCenterHarness());
  await page.close();
}

async function mobile(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(BASE,{waitUntil:'networkidle'});await installHarness(page,{role:'leader'});
  const root=page.locator('#leader-center-test-root');await root.locator('[data-leader-overview]').waitFor();
  const metrics=await page.evaluate(()=>{const scope=document.querySelector('#leader-center-test-root');const controls=[...scope.querySelectorAll('button')];return{innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...controls.map(node=>node.getBoundingClientRect().height))}});
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Leader Center mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.minTarget>=44,'Leader Center mobile control target is below 44px.');
  assert(errors.length===0,`Leader Center mobile page errors: ${errors.join(' | ')}`);
  await page.evaluate(()=>window.__removeLeaderCenterHarness());await page.close();
}

try{await leaderSeesComposedCenter();await directoryFailureIsTruthful();await memberIsDenied();await mobile();console.log('BibleQuest v5 Leader Center browser regression passed.')}finally{await browser.close()}
