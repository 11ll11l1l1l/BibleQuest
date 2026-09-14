import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const baseURL = process.env.BQ_TEST_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
try {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    const [{ assignmentsPage }, { localization }] = await Promise.all([import('/src/features/assignments/index.js'), import('/src/app/localization.js')]);
    localization.setLocale('tl');
    const row={id:'assignment-1',title:'Read Romans 8',instructions:'Write one sentence about hope.',type:'custom',scriptureRefs:['Romans 8:28'],linkedActivity:null,progress:{status:'assigned',submission:'',leaderFeedback:''},dueState:'open',dueAt:null,scheduleAt:null,reminderAt:null,recurrenceRule:'',requiredReflection:false,evidenceType:'none',minQuizScore:null,points:5};
    const state={status:'ready',role:'member',congregationId:'cong-active',congregationName:'ICAC Tsukuba',congregations:[{id:'cong-active',name:'ICAC Tsukuba'}],assignments:[row],activeId:null,activeReview:null,publishTargets:{members:[],teams:[],groups:[]}};
    let current=state;
    const assignments={snapshot:()=>current,load:async()=>current,watch:async()=>()=>{},stopSync:()=>{},close:()=>{current={...current,activeId:null};return current},open:id=>{current={...current,activeId:id};return current},loadReview:async()=>current,start:async()=>current,complete:async()=>({state:current,alreadyCompleted:false,awarded:0}),loadPublishTargets:async()=>current,publish:async()=>current};
    document.body.innerHTML='<main id="assignments-root"></main>';
    const root=document.querySelector('#assignments-root');const feature=assignmentsPage({assignments});root.innerHTML=feature.html;feature.mount(root);window.__bqAssignmentsTitle=feature.title;
  });
  await page.waitForSelector('[data-assignment-open]');
  assert.equal(await page.evaluate(()=>window.__bqAssignmentsTitle),'Mga Gawain');
  assert.equal((await page.locator('.bq-eyebrow').first().textContent())?.trim(),'MGA GAWAIN NG KONGREGASYON');
  assert.equal((await page.locator('[data-assignment-open]').textContent())?.trim(),'Buksan ang gawain');
  assert.equal((await page.locator('[data-assignments-back]').textContent())?.trim(),'Bumalik sa Komunidad');
  assert.equal(await page.getByText('ICAC Tsukuba',{exact:true}).count(),1,'runtime congregation name must remain unchanged');
  assert.equal(await page.getByText('Read Romans 8',{exact:true}).count(),1,'source assignment title must remain unchanged');
  assert.equal(await page.getByText('Hangganan ng privacy',{exact:true}).count(),1);
  for(const leak of ['CONGREGATION TASKS','Back to Community','Assigned to you','Open task','Privacy boundary']) assert.equal(await page.getByText(leak,{exact:true}).count(),0,`Assignments exposes migrated English UI text: ${leak}`);
  const geometry=await page.evaluate(()=>({innerWidth:window.innerWidth,scrollWidth:document.documentElement.scrollWidth,minButtonHeight:Math.min(...[...document.querySelectorAll('[data-assignment-open], [data-assignments-back]')].map(node=>node.getBoundingClientRect().height))}));
  assert.ok(geometry.scrollWidth<=geometry.innerWidth+1,`Tagalog Assignments overflows at 390px: ${geometry.scrollWidth} > ${geometry.innerWidth}`);
  assert.ok(geometry.minButtonHeight>=44,`Assignments touch target regressed below 44px: ${geometry.minButtonHeight}`);
  assert.deepEqual(pageErrors,[],`Browser page errors occurred: ${pageErrors.join(' | ')}`);
  console.log('BROWSER-AUTO PASS: Tagalog Assignments list, source-data preservation, 390px touch/overflow');
} finally { await browser.close(); }