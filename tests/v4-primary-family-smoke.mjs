import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const browser=await chromium.launch({headless:true});
const ROUTES=['home','learn','play','grow','more'];

async function verify(width,height,isMobile=false){
  const page=await browser.newPage({viewport:{width,height},isMobile,hasTouch:isMobile});
  const errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(`console: ${message.text()}`)});
  page.on('pageerror',error=>errors.push(`page: ${error.message}`));
  await page.goto(`${BASE}#/home`,{waitUntil:'networkidle'});
  await page.locator('[data-bq-shell="v3"]').waitFor();
  await page.locator('[data-home-rail]').waitFor();

  const railLabels=await page.locator('[data-home-rail-item] .bq-home-rail-label').allTextContents();
  assert(railLabels.join('|')==='Daily Journey|Reader|Assignments|Calendar|Progress',`Home shortcut rail order changed at ${width}px: ${railLabels.join('|')}`);
  assert(await page.locator('[data-home-daily]').count()===1,`Home lost Daily Journey surface at ${width}px.`);
  assert(await page.locator('[data-home-assignments]').count()===1,`Home lost Assignments surface at ${width}px.`);

  for(const route of ROUTES){
    if(route!=='home'){
      await page.locator(`[data-route-link="${route}"]`).click();
      await page.waitForURL(new RegExp(`#/${route}$`));
    }
    await page.locator(`[data-route-link="${route}"][aria-current]`).waitFor();
    if(route==='learn') await page.locator('[data-open-reader]').waitFor();
    if(route==='play') await page.locator('[data-games-page] .bq-games-head').waitFor();
    if(route==='grow') await page.locator('[data-progress-page]').waitFor();
    if(route==='more') await page.locator('[data-more-group]').first().waitFor();

    const metrics=await page.evaluate(()=>({
      innerWidth,
      htmlScrollWidth:document.documentElement.scrollWidth,
      bodyScrollWidth:document.body.scrollWidth,
      mainRight:document.querySelector('.bq-main')?.getBoundingClientRect().right||0,
      currentCount:document.querySelectorAll('.bq-nav [aria-current]').length,
      minNavHeight:Math.min(...[...document.querySelectorAll('.bq-nav [data-route-link]')].map(node=>node.getBoundingClientRect().height))
    }));
    assert(metrics.htmlScrollWidth<=width+1&&metrics.bodyScrollWidth<=width+1,`${width}px #/${route} has horizontal overflow.`);
    assert(metrics.mainRight<=width+1,`${width}px #/${route} main surface exceeds the viewport.`);
    assert(metrics.currentCount===1,`${width}px #/${route} must expose exactly one current primary tab.`);
    assert(metrics.minNavHeight>=44,`${width}px primary navigation contains a target below 44px.`);
  }

  await page.locator('[data-route-link="learn"]').click();
  await page.waitForURL(/#\/learn$/);
  for(const hook of['[data-open-reader]','[data-open-study]','[data-open-bible-world]','[data-open-open-review]'])
    assert(await page.locator(hook).count()===1,`Learn entry point disappeared at ${width}px: ${hook}`);

  await page.locator('[data-route-link="play"]').click();
  await page.waitForURL(/#\/play$/);
  assert((await page.locator('[data-games-page] .bq-games-head h1').textContent())?.trim()==='Bible games for every kind of practice',`Play launcher exposed stale heading at ${width}px.`);
  assert(await page.locator('[data-memory-open]').count()===1&&await page.locator('[data-same-room-open]').count()===1,`Play family entry points disappeared at ${width}px.`);

  await page.locator('[data-route-link="grow"]').click();
  await page.waitForURL(/#\/grow$/);
  for(const hook of['[data-open-transform]','[data-open-personality-profile]','[data-open-psychometrics]','[data-open-avatar-vault]'])
    assert(await page.locator(hook).count()===1,`Grow entry point disappeared at ${width}px: ${hook}`);

  await page.locator('[data-route-link="more"]').click();
  await page.waitForURL(/#\/more$/);
  assert(await page.locator('[data-more-group]').count()===5,`More must retain five grouped families at ${width}px.`);
  const moreText=(await page.locator('#bq-view').innerText()).toLowerCase();
  for(const banned of['active rebuild path','still being rebuilt','later admin surfaces remain intentionally unavailable'])
    assert(!moreText.includes(banned),`More exposed internal development wording at ${width}px: ${banned}`);

  assert(errors.length===0,`Primary-family acceptance produced browser errors at ${width}px: ${errors.join(' | ')}`);
  await page.close();
}

try{
  await verify(320,760,true);
  await verify(1280,900,false);
  console.log('BibleQuest v4 primary app-family browser acceptance passed at 320px and desktop.');
}finally{await browser.close()}
