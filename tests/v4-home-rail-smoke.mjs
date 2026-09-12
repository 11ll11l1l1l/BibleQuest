import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/',browser=await chromium.launch({headless:true}),assert=(ok,message)=>{if(!ok)throw new Error(message)};
async function run(){
  const page=await browser.newPage({viewport:{width:320,height:800},isMobile:true,hasTouch:true});
  const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.locator('[data-home-rail]').waitFor();

  const items=page.locator('[data-home-rail-item]');
  assert(await items.count()===5,`Expected 5 shortcut rail items, found ${await items.count()}.`);

  // No document-level horizontal overflow at 320px - the rail must scroll
  // internally, not push the page wider than the viewport.
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert(overflow<=1,`Shortcut rail caused document horizontal overflow at 320px: ${overflow}px.`);

  // The rail's own track must actually be scrollable (its content is wider than its box).
  const scrollable=await page.evaluate(()=>{
    const track=document.querySelector('[data-home-rail-track]');
    return track.scrollWidth>track.clientWidth;
  });
  assert(scrollable,'Shortcut rail track is not horizontally scrollable at 320px - all 5 items should not fit without scrolling.');

  // Keyboard: focus the first item, press ArrowRight, confirm focus moved to the second.
  await items.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  const focusedId=await page.evaluate(()=>document.activeElement?.getAttribute('data-home-rail-item'));
  assert(focusedId==='reader',`ArrowRight from 'daily' should move focus to 'reader', got '${focusedId}'.`);

  // Click routing: the Calendar shortcut must actually navigate to Calendar.
  await page.locator('[data-home-rail-item="calendar"]').click();
  await page.waitForTimeout(150);
  const onCalendar=await page.locator('[data-calendar-page]').count();
  assert(onCalendar>0,'Clicking the Calendar shortcut did not navigate to the Calendar route.');

  assert(errors.length===0,`Unexpected console/page errors: ${errors.join(' | ')}`);
  await page.close();
}
try{await run();console.log('BibleQuest v4 Home shortcut rail smoke passed.')}finally{await browser.close()}
