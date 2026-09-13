import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function installHarness(page,{role='leader'}={}){
  await page.evaluate(async(role)=>{
    const [{createLeaderCenterService},{leaderCenterPage}]=await Promise.all([
      import('/src/app/leader-center.js'),import('/src/features/leader-center/index.js')
    ]);
    window.__removeLeaderCenterHarness?.();
    const assignments={
      async load(){return{status:'ready',role,congregationId:'c1',congregationName:'Harness Congregation',assignments:[{id:'a1',scheduleAt:null,title:'Open task'}]}},
      snapshot(){return this.load()}
    };
    const presence={async activeCount(){return{count:4,windowMinutes:30}}};
    const leaderCenter=createLeaderCenterService({assignments,presence});
    const root=document.createElement('div');root.id='leader-center-test-root';document.body.append(root);
    const definition=leaderCenterPage({leaderCenter,onBack:()=>{},onAccount:()=>{},onAssignments:()=>{window.__lcNav='assignments'},onJourneyGroups:()=>{window.__lcNav='journey-groups'},onTeamCenter:()=>{window.__lcNav='team-center'},onCongregation:()=>{window.__lcNav='congregation'}});
    root.innerHTML=definition.html;const cleanup=definition.mount(root);
    window.__removeLeaderCenterHarness=()=>{cleanup?.();root.remove();delete window.__lcNav};
  },role);
}

async function leaderSeesOverview(){
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.goto(BASE,{waitUntil:'networkidle'});
  await installHarness(page,{role:'leader'});
  const root=page.locator('#leader-center-test-root');
  await root.locator('[data-leader-overview]').waitFor();
  assert(await root.locator('[data-leader-center-denied]').count()===0,'A real leader must not see the denied state.');
  assert((await root.locator('[data-leader-active-count]').textContent())==='4','Active-count figure did not render from the composed Overview.');
  assert(await root.locator('[data-leader-open-count]').textContent()==='1','Open-assignment count did not render correctly.');
  await root.locator('[data-leader-open-assignments]').click();
  assert(await page.evaluate(()=>window.__lcNav)==='assignments','Quick action did not navigate to Assignments.');
  await page.evaluate(()=>window.__removeLeaderCenterHarness());
  await page.close();
}

async function memberIsDenied(){
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.goto(BASE,{waitUntil:'networkidle'});
  await installHarness(page,{role:'member'});
  const root=page.locator('#leader-center-test-root');
  await root.locator('[data-leader-center-denied]').waitFor();
  assert(await root.locator('[data-leader-overview]').count()===0,'An ordinary member must never see Leader Center data, not even briefly.');
  assert(await root.locator('[data-leader-open-count]').count()===0,'No assignment figures may render for a denied caller.');
  await page.evaluate(()=>window.__removeLeaderCenterHarness());
  await page.close();
}

async function mobile(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto(BASE,{waitUntil:'networkidle'});await installHarness(page,{role:'leader'});
  const root=page.locator('#leader-center-test-root');await root.locator('[data-leader-overview]').waitFor();
  const metrics=await page.evaluate(()=>{const scope=document.querySelector('#leader-center-test-root');const controls=[...scope.querySelectorAll('button')];return{innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...controls.map(node=>node.getBoundingClientRect().height))}});
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Leader Center mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.minTarget>=44,'Leader Center mobile control target is below 44px.');
  await page.evaluate(()=>window.__removeLeaderCenterHarness());await page.close();
}

try{await leaderSeesOverview();await memberIsDenied();await mobile();console.log('BibleQuest v5 Leader Center browser regression passed.')}finally{await browser.close()}
