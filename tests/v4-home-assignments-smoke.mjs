import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(ok,message)=>{if(!ok)throw new Error(message)};

async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});

  const result=await page.evaluate(async()=>{
    const {homePage}=await import(`/src/features/home/index.js?homeAssignmentsSmoke=${Date.now()}`);
    const now=Date.now();
    const progress={getState:()=>({xp:120,streak:4,totalActivities:9,badges:['first']})};
    const dailyMission={today:()=>null};
    const row=(id,{title=id,type='reading',dueAt=null,dueState='open',status='assigned',submission='',leaderFeedback=''}={})=>({id,title,type,dueAt,dueState,progress:{status,submission,leaderFeedback}});
    const state={status:'ready',role:'member',assignments:[
      row('pending',{title:'Later reflection'}),
      row('started',{title:'Started study',type:'guided-study',dueAt:new Date(now+72*60*60*1000).toISOString(),status:'started'}),
      row('soon',{title:'Read John 15',dueAt:new Date(now+60*60*1000).toISOString(),submission:'PRIVATE ANSWER MUST NOT APPEAR',leaderFeedback:'PRIVATE LEADER FEEDBACK'}),
      row('overdue',{title:'Psalm reflection overdue',type:'reflection',dueAt:new Date(now-60*60*1000).toISOString(),dueState:'overdue'}),
      row('completed',{title:'Completed private task',dueState:'completed',status:'completed',submission:'COMPLETED PRIVATE ANSWER',leaderFeedback:'COMPLETED PRIVATE FEEDBACK'}),
      row('scheduled',{title:'Not open yet',dueState:'scheduled',dueAt:new Date(now+24*60*60*1000).toISOString()})
    ],activeReview:{responses:[{submission:'OTHER MEMBER PRIVATE ANSWER'}]}};
    const events=[];
    const assignments={load:async()=>state,open:id=>{events.push(`open:${id}`);return{...state,activeId:id}}};
    const host=document.createElement('main');
    host.dataset.homeAssignmentsTest='true';
    document.body.appendChild(host);
    const definition=homePage({progress,dailyMission,assignments,onAssignments:()=>events.push('navigate'),onMission:()=>{},onRecordings:()=>{},onMedia:()=>{},onTutorial:()=>{}});
    host.innerHTML=definition.html;
    const dispose=definition.mount(host);
    await new Promise(resolve=>setTimeout(resolve,40));

    const card=host.querySelector('[data-home-assignments]');
    const rows=[...host.querySelectorAll('[data-home-assignment-open]')];
    const statuses=[...host.querySelectorAll('[data-home-assignment-status]')].map(node=>({key:node.dataset.homeAssignmentStatus,text:node.textContent.trim()}));
    const beforeClick={
      hidden:card?.hidden,
      text:card?.textContent||'',
      ids:rows.map(node=>node.dataset.homeAssignmentOpen),
      statuses,
      rowHeights:rows.map(node=>node.getBoundingClientRect().height),
      cardRect:card?{left:card.getBoundingClientRect().left,right:card.getBoundingClientRect().right}:null
    };

    host.querySelector('[data-home-assignment-open="overdue"]')?.click();
    await new Promise(resolve=>setTimeout(resolve,0));
    const afterDirect=events.slice();
    host.querySelector('[data-home-assignments-all]')?.click();
    await new Promise(resolve=>setTimeout(resolve,0));
    const afterAll=events.slice();

    const failHost=document.createElement('div');
    document.body.appendChild(failHost);
    const failDefinition=homePage({progress,dailyMission,assignments:{load:async()=>{throw new Error('expected load failure')}},onAssignments:()=>events.push('unexpected-fail-navigation')});
    failHost.innerHTML=failDefinition.html;
    const failDispose=failDefinition.mount(failHost);
    await new Promise(resolve=>setTimeout(resolve,20));
    const failedHidden=failHost.querySelector('[data-home-assignments]')?.hidden===true;

    const metrics={innerWidth,htmlScrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body.scrollWidth};
    dispose?.();failDispose?.();host.remove();failHost.remove();
    return{beforeClick,afterDirect,afterAll,failedHidden,metrics};
  });

  assert(result.beforeClick.hidden===false,'Home assignment notification must become visible when current tasks exist.');
  assert(result.beforeClick.ids.join('|')==='overdue|soon|started','Home must show the three highest-priority current tasks in urgency order.');
  assert(result.beforeClick.statuses.map(item=>item.key).join('|')==='overdue|due-soon|in-progress','Home assignment status ordering is incorrect.');
  assert(result.beforeClick.statuses.map(item=>item.text).join('|')==='Overdue|Due soon|In progress','Home assignment states must remain text-visible, not color-only.');
  assert(result.beforeClick.text.includes('Your assignments'),'Member Home must use the personal assignments heading.');
  assert(!result.beforeClick.text.includes('Completed private task')&&!result.beforeClick.text.includes('Not open yet'),'Completed and not-yet-open assignments must not appear on Home.');
  for(const secret of ['PRIVATE ANSWER MUST NOT APPEAR','PRIVATE LEADER FEEDBACK','COMPLETED PRIVATE ANSWER','COMPLETED PRIVATE FEEDBACK','OTHER MEMBER PRIVATE ANSWER']) assert(!result.beforeClick.text.includes(secret),`Home leaked private assignment data: ${secret}`);
  assert(result.afterDirect.join('|')==='open:overdue|navigate','Direct Home task action must open through the existing Assignments owner before navigating to Assignments.');
  assert(result.afterAll.join('|')==='open:overdue|navigate|navigate','See all must navigate through the same Assignments route without creating another owner.');
  assert(result.failedHidden,'Assignment load failure must fail closed and hide the Home assignment card.');
  assert(result.beforeClick.rowHeights.every(value=>value>=44),`Home assignment row fell below the 44px touch target: ${result.beforeClick.rowHeights.join(', ')}`);
  assert(result.metrics.innerWidth===390,'Home Assignments smoke must execute at 390px.');
  assert(result.metrics.htmlScrollWidth<=391&&result.metrics.bodyScrollWidth<=391,`Home Assignments caused horizontal overflow at 390px: html=${result.metrics.htmlScrollWidth}, body=${result.metrics.bodyScrollWidth}.`);
  assert(result.beforeClick.cardRect?.left>=-1&&result.beforeClick.cardRect?.right<=391,'Home assignment card must fit the 390px viewport.');
  assert(errors.length===0,`Unexpected Home Assignments console/page errors: ${errors.join(' | ')}`);
  await page.close();
}

try{await run();console.log('BibleQuest v4 Home Assignments mobile/direct-open/privacy smoke passed.')}finally{await browser.close()}
