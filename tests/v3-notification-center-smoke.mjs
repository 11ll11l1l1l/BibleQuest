import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/',browser=await chromium.launch({headless:true}),assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${BASE}#/notification-center`,{waitUntil:'networkidle'});await page.locator('h1').filter({hasText:'Notification Center'}).waitFor();
  assert(((await page.locator('#bq-view').textContent())||'').includes('Sign in to load your private BibleQuest inbox.'),'Real Notification Center route must open and fail safely while signed out.');

  await page.evaluate(async()=>{
    window.__bqNotificationCleanup?.();
    const stamp=Date.now(),[{createNotificationCenterService},{notificationCenterPage}]=await Promise.all([import(`/src/app/notification-center.js?smoke=${stamp}`),import(`/src/features/notification-center/index.js?smoke=${stamp}`)]);
    window.__bqNotificationRoutes=[];window.__bqNotificationListCalls=0;window.__bqNotificationMarkCalls=0;
    let rows=[
      {id:'n1',user_id:'u1',notification_type:'assignment',title:'New assignment',body:'Read John 1',action_kind:'assignment',action_payload:{assignment_id:'a1'},read_at:null,expires_at:'2099-01-01T00:00:00.000Z',created_at:'2026-09-10T08:00:00.000Z'},
      {id:'n2',user_id:'u1',notification_type:'info',title:'Legacy target',body:'Readable but not executable',action_kind:'https://evil.example',action_payload:{route:'https://evil.example'},read_at:null,expires_at:'2099-01-01T00:00:00.000Z',created_at:'2026-09-10T08:20:00.000Z'},
      {id:'n3',user_id:'u1',notification_type:'award',title:'Recognition',body:'Keep going',action_kind:'recognition',action_payload:{recognition_id:'r1'},read_at:'2026-09-10T08:30:00.000Z',expires_at:null,created_at:'2026-09-10T08:10:00.000Z'}
    ];
    const session={getState:()=>({authenticated:true,remoteAvailable:true,user:{id:'u1'}})};
    const api={
      list:async()=>{window.__bqNotificationListCalls++;return rows.map(row=>({...row}))},
      setReadState:async(userId,id,readAt)=>{rows=rows.map(row=>row.id===id?{...row,user_id:userId,read_at:readAt}:row);return {...rows.find(row=>row.id===id)}},
      markAllRead:async(userId,readAt)=>{window.__bqNotificationMarkCalls++;rows=rows.map(row=>row.user_id===userId&&!row.read_at?{...row,read_at:readAt}:row);return rows.filter(row=>row.user_id===userId).map(row=>({id:row.id}))}
    };
    const notifications=createNotificationCenterService({api,session}),host=document.querySelector('#bq-view');
    const view=notificationCenterPage({notifications,onNavigate:route=>window.__bqNotificationRoutes.push(route),onBack:()=>window.__bqNotificationRoutes.push('more'),onAccount:()=>window.__bqNotificationRoutes.push('account')});
    host.innerHTML=view.html;window.__bqNotificationCleanup=view.mount(host);
  });
  await page.locator('[data-notification-item="n1"]').waitFor();
  let copy=(await page.locator('#bq-view').textContent())||'';assert(copy.includes('2 unread'),'Mock inbox must render recovered unread count.');
  assert(await page.locator('[data-notification-item="n2"] [data-notification-open]').count()===0,'Unsupported notification target must not expose an Open action.');
  assert(await page.locator('[data-notification-item="n2"] button[disabled]').count()>=1,'Unsupported notification target must remain visibly unavailable.');

  await page.locator('[data-notification-open="n1"]').click();
  await page.waitForFunction(()=>window.__bqNotificationRoutes?.includes('assignments'));
  assert((await page.evaluate(()=>window.__bqNotificationRoutes.join(',')))==='assignments','Supported assignment notification must delegate only to the allowlisted Assignments route.');
  copy=(await page.locator('#bq-view').textContent())||'';assert(copy.includes('1 unread'),'Opening an unread supported target must update unread presentation after persisted read state.');

  const beforeRefresh=await page.evaluate(()=>window.__bqNotificationListCalls);await page.locator('[data-notification-refresh]').click();await page.waitForFunction(before=>window.__bqNotificationListCalls>before,beforeRefresh);
  assert((await page.evaluate(()=>window.__bqNotificationRoutes.join(',')))==='assignments','Refresh must not navigate.');

  await page.locator('[data-notification-read-all]').click();await page.waitForFunction(()=>window.__bqNotificationMarkCalls===1);
  copy=(await page.locator('#bq-view').textContent())||'';assert(copy.includes('0 unread'),'Mark all read must reload authoritative state and clear unread presentation.');
  assert(await page.locator('[data-notification-read-all]').isDisabled(),'Mark all read must disable when no unread notifications remain.');

  const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...[...document.querySelectorAll('#bq-view button')].filter(node=>!node.hidden).map(node=>node.getBoundingClientRect().height))}));
  assert(metrics.innerWidth===390,'Notification Center browser regression did not execute at 390px.');assert(metrics.scrollWidth<=metrics.innerWidth+1,`Notification Center mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);assert(metrics.minTarget>=44,`Notification Center touch target below 44px: ${metrics.minTarget}px.`);
  await page.evaluate(()=>window.__bqNotificationCleanup?.());assert(errors.length===0,`Unexpected Notification Center console/page errors: ${errors.join(' | ')}`);await page.close();
}

try{await run();console.log('BibleQuest v3 Notification Center mobile browser regression passed.')}finally{await browser.close()}
