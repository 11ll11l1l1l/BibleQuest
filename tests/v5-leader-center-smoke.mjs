import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function installHarness(page,{role='leader',directoryFails=false,switchDuringLifecycle=false}={}){
  await page.evaluate(async({role,directoryFails,switchDuringLifecycle})=>{
    const [{createLeaderCenterService},{leaderCenterPage}]=await Promise.all([
      import('/src/app/leader-center.js'),import('/src/features/leader-center/index.js')
    ]);
    window.__removeLeaderCenterHarness?.();
    window.__lcReviewCalls=[];
    const baseState={status:'ready',role,userId:'leader-a',congregationId:'c1',congregationName:'Harness Congregation',assignments:[{id:'a1',scheduleAt:null,title:'Open task'},{id:'a2',scheduleAt:'2999-01-01T00:00:00.000Z',title:'Future task'}]};
    let currentState=baseState;
    const assignments={
      async load(){return currentState},
      snapshot(){return currentState},
      async loadPublishTargets(){
        if(directoryFails)throw new Error('directory unavailable');
        return {...currentState,publishTargets:{
          members:[{id:'m1',label:'Ana Member',role:'member'},{id:'m2',label:'Ben Leader',role:'leader'}],
          groups:[{id:'g1',label:'Young Adults'}],
          teams:[{id:'t1',label:'Worship Team',type:'ministry'}]
        }};
      },
      async loadLifecycle(){
        if(switchDuringLifecycle){
          currentState={...currentState,congregationId:'c2',congregationName:'Other Congregation',assignments:[]};
          return [];
        }
        return[
          {assignmentId:'a1',status:'completed',recipientCount:2,completedCount:2},
          {assignmentId:'a2',status:'scheduled',recipientCount:2,completedCount:0}
        ];
      },
      open(id){window.__lcReviewCalls.push(['open',id])},
      async loadReview(id){window.__lcReviewCalls.push(['loadReview',id]);return{activeId:id,activeReview:{status:'ready'}}}
    };
    const presence={async activeCount(){if(switchDuringLifecycle)throw new Error('Stale tenant must stop before presence.');return{count:4,windowMinutes:30}}};
    const calendar={async loadSharedAgenda(){return{status:'ready',congregationId:'c1',agenda:[{date:'2026-09-27',events:[
      {id:'due-a1',source:'assignment',date:'2026-09-27',title:'Due: Read Romans 8'},
      {id:'event-c1',source:'congregation',date:'2026-09-28',title:'Prayer meeting'},
      {id:'private-p1',source:'personal',date:'2026-09-29',title:'Private appointment',notes:'must never render'}
    ]}]}}};
    const leaderCenter=createLeaderCenterService({assignments,presence,calendar});
    const root=document.createElement('div');root.id='leader-center-test-root';document.body.append(root);
    const definition=leaderCenterPage({leaderCenter,onBack:()=>{},onAccount:()=>{},onAssignments:()=>{window.__lcNav='assignments'},onCalendar:()=>{window.__lcNav='calendar'},onJourneyGroups:()=>{window.__lcNav='journey-groups'},onTeamCenter:()=>{window.__lcNav='team-center'},onCongregation:()=>{window.__lcNav='congregation'}});
    root.innerHTML=definition.html;const cleanup=definition.mount(root);
    window.__removeLeaderCenterHarness=()=>{cleanup?.();root.remove();delete window.__lcNav};
  },{role,directoryFails,switchDuringLifecycle});
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
  assert(await root.locator('[data-leader-published-count]').textContent()==='0','Published assignment count did not render.');
  assert(await root.locator('[data-leader-scheduled-count]').textContent()==='1','Scheduled assignment count did not render.');
  assert(await root.locator('[data-leader-completed-count]').textContent()==='1','Completed assignment count did not render.');
  assert((await root.locator('[data-leader-review]').innerText()).includes('2/2 completed'),'Recipient completion denominator did not render.');
  const personRows=root.locator('[data-leader-person-row]');
  assert(await personRows.count()===2,'People directory did not render the two safe member rows.');
  const peopleData=await personRows.allInnerTexts();
  assert(peopleData.some(text=>text.includes('Ana Member')),'People directory is missing the safe member label.');
  assert(!peopleData.join(' ').match(/reflection|note|couples|personality|psychometric/i),'People data rows contain sensitive content.');
  const spaces=await root.locator('[data-leader-groups-teams]').innerText();
  assert(spaces.includes('Young Adults')&&spaces.includes('Worship Team'),'Groups/Teams composition did not render.');
  const upcomingRows=root.locator('[data-leader-upcoming-row]');
  assert(await upcomingRows.count()===2,'Leader Center upcoming surface must render only assignment and congregation rows.');
  const upcomingText=await root.locator('[data-leader-upcoming]').innerText();
  assert(upcomingText.includes('Due: Read Romans 8')&&upcomingText.includes('Prayer meeting'),'Leader Center upcoming rows are missing shared due/event content.');
  assert(!upcomingText.includes('Private appointment')&&!upcomingText.includes('must never render'),'Personal Calendar content leaked into Leader Center upcoming surface.');
  assert(await root.locator('[data-leader-upcoming-source="assignment"]').count()===1,'Assignment due row is not identified correctly.');
  assert(await root.locator('[data-leader-upcoming-source="congregation"]').count()===1,'Congregation event row is not identified correctly.');

  await page.evaluate(()=>{window.__lcNav='';});
  await root.locator('[data-leader-open-calendar]').click();
  assert(await page.evaluate(()=>window.__lcNav)==='calendar','Leader Center Calendar handoff failed.');

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

async function ministryRoleMatrix(){
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.goto(BASE,{waitUntil:'networkidle'});
  for(const role of ['facilitator','leader','pastor','admin']){
    await installHarness(page,{role});
    const root=page.locator('#leader-center-test-root');
    await root.locator('[data-leader-overview]').waitFor();
    assert(await root.locator('[data-leader-center-denied]').count()===0,`Ministry role '${role}' must be authorized in the Leader Center browser matrix.`);
    assert((await root.locator('[data-leader-overview]').innerText()).includes(role),`Leader Center did not render the verified '${role}' role.`);
  }
  await page.evaluate(()=>window.__removeLeaderCenterHarness());
  await page.close();
}

async function tenantSwitchFailsClosed(){
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.goto(BASE,{waitUntil:'networkidle'});
  await installHarness(page,{role:'leader',switchDuringLifecycle:true});
  const root=page.locator('#leader-center-test-root');
  await root.locator('[data-leader-center-denied]').waitFor();
  assert(await root.locator('[data-leader-overview]').count()===0,'Leader Center must not render stale congregation A overview after A→B switch.');
  assert(await root.locator('[data-leader-people]').count()===0,'Leader Center must not render stale congregation A directory after A→B switch.');
  assert(!((await root.innerText())||'').includes('Harness Congregation'),'Stale congregation A identity leaked after active tenant switch.');
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

try{await leaderSeesComposedCenter();await directoryFailureIsTruthful();await memberIsDenied();await ministryRoleMatrix();await tenantSwitchFailsClosed();await mobile();console.log('BibleQuest v5 Leader Center browser regression passed.')}finally{await browser.close()}
