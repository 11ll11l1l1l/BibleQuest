import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${BASE}#/more`,{waitUntil:'networkidle'});
  await page.locator('[data-more-workspace]').waitFor();

  const asset=await page.request.get(`${BASE}assets/more-feature-icons.svg`);
  assert(asset.ok(),`More Phase B icon sprite failed to load: ${asset.status()}`);
  const assetText=await asset.text();
  assert(assetText.includes('id="calendar"')&&assetText.includes('id="workspace"'),'Loaded More Phase B sprite is missing expected symbols.');

  const icons=page.locator('.bq-more-icon');
  assert(await icons.count()===16,`Expected 16 More feature icons, found ${await icons.count()}.`);
  const hrefs=await page.locator('.bq-more-icon use').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')));
  assert(hrefs.length===16,'Every More icon must contain one external sprite reference.');
  assert(hrefs.every(href=>href?.startsWith('assets/more-feature-icons.svg#')),'More icon reference escaped the committed sprite.');
  assert(new Set(hrefs).size===16,'More feature cards must use distinct semantic sprite symbols.');

  const visibleIconMetrics=await page.locator('[data-more-workspace] .bq-more-icon').evaluate(node=>{const box=node.getBoundingClientRect(),style=getComputedStyle(node);return{width:box.width,height:box.height,color:style.color,display:style.display}});
  assert(visibleIconMetrics.display!=='none','More feature icon must be rendered.');
  assert(visibleIconMetrics.width>=24&&visibleIconMetrics.height>=24,`More feature icon is undersized: ${visibleIconMetrics.width}x${visibleIconMetrics.height}.`);

  const metrics=await page.evaluate(()=>{
    const visibleButtons=[...document.querySelectorAll('#bq-view button')].filter(node=>{const style=getComputedStyle(node),box=node.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&box.width>0&&box.height>0});
    return{innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...visibleButtons.map(node=>node.getBoundingClientRect().height)),iconHosts:[...document.querySelectorAll('.bq-more-icon-wrap')].filter(node=>node.getBoundingClientRect().height>0).length};
  });
  assert(metrics.innerWidth===390,'More Phase B browser acceptance did not execute at 390px.');
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`More Phase B introduced horizontal overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.minTarget>=44,`More Phase B action target below 44px: ${metrics.minTarget}px.`);
  assert(metrics.iconHosts>=14,'Visible More tool cards must retain their Phase B icon hosts.');
  assert(errors.length===0,`Unexpected More Phase B console/page errors: ${errors.join(' | ')}`);
  await page.close();
  console.log('BibleQuest v3 More Phase B mobile browser acceptance passed.');
}finally{await browser.close()}
