import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
const page=await context.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));

try{
  await page.goto(`${BASE}#/reader`,{waitUntil:'networkidle'});
  await page.locator('[data-reader-page] h1',{hasText:'Bible Reader'}).waitFor();
  await page.locator('[data-reader-translation]').selectOption('bsb');
  await page.locator('[data-reader-book]').selectOption('GEN');
  await page.locator('[data-reader-chapter]').selectOption('1');
  await page.locator('[data-verse="1"]',{hasText:'In the beginning God created the heavens and the earth.'}).waitFor();
  assert((await page.locator('.bq-reader-source').textContent()).includes('Berean Standard Bible'),'Online BSB source attribution is missing.');

  await page.locator('[data-reader-translation]').selectOption('tl');
  await page.locator('[data-verse="1"]',{hasText:'Noong simula nilikha ng Diyos ang langit at ang lupa.'}).waitFor();
  assert((await page.locator('.bq-reader-source').textContent()).includes('Tagalog Unlocked Literal Bible'),'Online Tagalog source attribution is missing.');
  await page.locator('[data-reader-translation]').selectOption('bsb');
  await page.locator('[data-verse="1"]',{hasText:'In the beginning God created the heavens and the earth.'}).waitFor();

  await page.waitForFunction(async()=>{
    const names=await caches.keys();
    if(!names.includes('biblequest-v3-opened-bible-packs-v1'))return false;
    const cache=await caches.open('biblequest-v3-opened-bible-packs-v1'),urls=(await cache.keys()).map(request=>request.url);
    return urls.some(url=>url.includes('/data/packs/bible/GEN.json'))&&urls.some(url=>url.includes('/data/packs/tagalog/GEN.json'));
  },null,{timeout:10000});

  const cacheState=await page.evaluate(async()=>{
    const names=await caches.keys();
    const pack=await caches.open('biblequest-v3-opened-bible-packs-v1');
    const packUrls=(await pack.keys()).map(request=>request.url);
    const shellName=names.find(name=>name.startsWith('biblequest-v3-offline-shell-'))||'';
    const shellUrls=shellName?(await (await caches.open(shellName)).keys()).map(request=>request.url):[];
    return {names,packUrls,shellUrls};
  });
  assert(cacheState.packUrls.some(url=>url.endsWith('/data/packs/bible/GEN.json')),'Opened BSB Genesis pack is missing from its persistent cache.');
  assert(cacheState.packUrls.some(url=>url.endsWith('/data/packs/tagalog/GEN.json')),'Opened Tagalog Genesis pack is missing from its persistent cache.');
  assert(!cacheState.shellUrls.some(url=>url.includes('/data/packs/bible/')||url.includes('/data/packs/tagalog/')),'#98 shell cache must remain separate from #99 Bible packs.');

  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded',timeout:15000});
  await page.locator('[data-reader-page] h1',{hasText:'Bible Reader'}).waitFor({timeout:10000});
  await page.locator('[data-verse="1"]',{hasText:'In the beginning God created the heavens and the earth.'}).waitFor({timeout:10000});
  const bsbSource=await page.locator('.bq-reader-source').textContent();
  assert(bsbSource.includes('Berean Standard Bible')&&bsbSource.includes('CC0'),'Offline BSB fallback lost source/license attribution.');

  const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,controller:navigator.serviceWorker.controller?.scriptURL||''}));
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Offline opened-pack Reader overflowed horizontally: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.controller.endsWith('/offline-shell-sw.js'),'Offline Reader must still use the dedicated #98 shell worker.');

  await page.locator('[data-reader-translation]').selectOption('tl');
  await page.locator('[data-verse="1"]',{hasText:'Noong simula nilikha ng Diyos ang langit at ang lupa.'}).waitFor({timeout:10000});
  const tlSource=await page.locator('.bq-reader-source').textContent();
  assert(tlSource.includes('Tagalog Unlocked Literal Bible')&&tlSource.includes('CC BY-SA 4.0'),'Offline Tagalog fallback lost source/license attribution.');

  await page.locator('[data-reader-book]').selectOption('EXO');
  const failure=page.locator('.bq-form-message');
  await failure.waitFor({timeout:10000});
  assert(/unavailable/i.test(await failure.textContent()),'An unopened Bible pack must remain unavailable offline rather than being fabricated or generically cached.');
  assert(errors.length===0,`Offline opened Bible packs browser errors: ${errors.join(' | ')}`);
  console.log('BibleQuest v3 Offline opened Bible packs mobile browser regression passed.');
}finally{
  await context.setOffline(false).catch(()=>{});
  await browser.close();
}
