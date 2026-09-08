import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.evaluate(()=>localStorage.setItem('biblequest.v3.private-notes',JSON.stringify({version:1,noteSeq:1,notes:[{id:'note-1',title:'Private stays local',body:'Do not upload me',createdAt:'2026-09-08T00:00:00.000Z',updatedAt:'2026-09-08T00:00:00.000Z'}]})));
  const before=await page.evaluate(()=>localStorage.getItem('biblequest.v3.private-notes'));
  await page.locator('[data-route-link="learn"]').click();await page.waitForURL(/#\/learn$/);await page.locator('[data-open-cloud-notes]').waitFor();
  assert((await page.locator('[data-open-cloud-notes]').textContent())?.includes('Cloud Notes'),'Learn page does not expose Cloud Notes.');
  await page.locator('[data-open-cloud-notes]').click();await page.waitForURL(/#\/cloud-notes$/);await page.locator('[data-cloud-auth]').waitFor();
  const text=(await page.locator('[data-cloud-notes-view]').textContent())||'';assert(text.includes('Cloud account actions are disabled in local preview.'),'Local-preview Cloud Notes must not pretend account sync is available.');assert(text.includes('Private Notes remain device-only')&&text.includes('never uploaded automatically'),'Cloud Notes page must preserve the explicit Private Notes boundary.');
  const after=await page.evaluate(()=>localStorage.getItem('biblequest.v3.private-notes'));assert(after===before,'Opening Cloud Notes modified Private Notes local persistence.');
  const cloudKeys=await page.evaluate(()=>Object.keys(localStorage).filter(key=>/cloud.?notes/i.test(key)));assert(cloudKeys.length===0,`Cloud Notes must not create a local persistence key: ${cloudKeys.join(', ')}`);
  const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...[...document.querySelectorAll('[data-cloud-notes-view] button')].map(node=>node.getBoundingClientRect().height))}));assert(metrics.scrollWidth<=metrics.innerWidth+1,`Cloud Notes mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);assert(metrics.minTarget>=44,`Cloud Notes touch target below 44px: ${metrics.minTarget}px.`);
  assert(errors.length===0,`Unexpected Cloud Notes console/page errors: ${errors.join(' | ')}`);await page.close();
}
try{await run();console.log('BibleQuest v3 Cloud Notes browser regression passed.')}finally{await browser.close()}
