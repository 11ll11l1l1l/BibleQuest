import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/',browser=await chromium.launch({headless:true}),assert=(ok,message)=>{if(!ok)throw new Error(message)};
async function run(){
  const page=await browser.newPage({viewport:{width:320,height:800},isMobile:true,hasTouch:true});
  const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.locator('[data-home-feature]').waitFor();
  assert(await page.locator('[data-home-rail-action]').count()===0, 'Duplicate shortcut rail must remain removed.');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert(overflow<=1,`Home actions caused horizontal overflow at 320px: ${overflow}px.`);
  for (const selector of ['[data-home-hero-reader]', '[data-open-daily]', '[data-open-home-next-event]']) {
    const button=page.locator(selector).first();
    const box=await button.boundingBox();
    assert(box && box.height>=44 && box.width>=44, `Home action is below 44px: ${selector}`);
    assert((await button.textContent()).trim().length>0, `Home action has no visible text: ${selector}`);
  }
  await page.locator('[data-home-hero-reader]').focus();
  await page.keyboard.press('Enter');
  await page.locator('.bq-reader-passage').waitFor();
  assert(new URL(page.url()).hash.startsWith('#/reader'), 'Keyboard activation of Bible action must reach Reader.');
  await page.goto(`${BASE}#/home`,{waitUntil:'networkidle'});
  await page.locator('[data-open-home-next-event]').first().click();
  await page.locator('[data-calendar-page]').waitFor();
  assert(new URL(page.url()).hash.startsWith('#/calendar'), 'Calendar action must reach Calendar.');

  assert(errors.length===0,`Unexpected console/page errors: ${errors.join(' | ')}`);
  await page.close();
}
try{await run();console.log('BibleQuest Home compact destination and keyboard smoke passed.')}finally{await browser.close()}
