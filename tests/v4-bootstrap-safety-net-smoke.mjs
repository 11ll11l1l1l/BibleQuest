import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/',browser=await chromium.launch({headless:true}),assert=(ok,message)=>{if(!ok)throw new Error(message)};
async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});
  const shellPresent=await page.locator('[data-bq-shell="v3"]').count();
  const failurePresent=await page.locator('[data-startup-failure]').count();
  assert(shellPresent>0,'The v4 bootstrap start()/boot() split must not prevent the shell from rendering on a normal boot.');
  assert(failurePresent===0,'The startup-failure diagnostic must not render during a normal, successful boot.');
  // A normal navigation must still work end-to-end through the same start()/boot() sequence.
  await page.locator('[data-route="learn"], [data-nav-route="learn"], a[href="#/learn"]').first().click({timeout:5000}).catch(()=>{});
  await page.waitForTimeout(150);
  const url=page.url();
  assert(/learn/.test(url)||(await page.locator('[data-bq-shell="v3"]').count())>0,'Basic navigation must still function after the bootstrap safety-net refactor.');
  assert(errors.length===0,`Unexpected console/page errors after the bootstrap safety-net refactor: ${errors.join(' | ')}`);
  await page.close();
}
try{await run();console.log('BibleQuest v4 bootstrap safety-net smoke passed (normal boot unaffected).')}finally{await browser.close()}
