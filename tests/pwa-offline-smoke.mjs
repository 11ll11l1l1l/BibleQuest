import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const ORIGIN='http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844}});
const page=await context.newPage();
page.setDefaultTimeout(15000);
page.setDefaultNavigationTimeout(20000);
const pageErrors=[];
page.on('pageerror',error=>pageErrors.push(error.message));
const isTransform=url=>url.pathname.replace(/\/+$/,'')==='/transform';

try{
  console.log('phase: first online install');
  await page.goto(ORIGIN,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.today-journey-card');
  await page.waitForFunction(async()=>{
    if(!('serviceWorker' in navigator))return false;
    const registration=await navigator.serviceWorker.ready;
    return Boolean(registration.active);
  });
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));

  const pwa=await page.evaluate(async()=>{
    const registration=await navigator.serviceWorker.ready;
    const keys=await caches.keys();
    const appCaches=keys.filter(key=>/^biblequest-v\d+$/.test(key));
    const version=Math.max(0,...appCaches.map(key=>Number(key.match(/v(\d+)$/)?.[1]||0)));
    const required=['./','./index.html','./transform.html','./styles.css','./mobile-readability.css','./home-professional.css','./transformation-v2.css','./app.js','./transform-launcher.js','./transformation-v2.js','./pwa-runtime.js','./onboarding-tutorial.js','./manifest.webmanifest','./app-icon.svg'];
    const cached={};
    for(const asset of required)cached[asset]=Boolean(await caches.match(new URL(asset,location.href).href));
    return {active:Boolean(registration.active),controlled:Boolean(navigator.serviceWorker.controller),tutorialApi:Boolean(window.BQTutorial?.open),version,appCaches,cached};
  });
  assert.equal(pwa.active,true,'installed PWA must have an active service worker');
  assert.equal(pwa.controlled,true,'first online session must become service-worker controlled');
  assert.equal(pwa.tutorialApi,true,'production boot must load the onboarding tutorial API');
  assert.ok(pwa.version>=75,`expected canonical-route/Home-polish PWA baseline v75+, got v${pwa.version||'missing'}`);
  assert.equal(pwa.appCaches.length,1,`old BibleQuest caches should be removed after activation: ${pwa.appCaches.join(', ')}`);
  for(const [asset,hit] of Object.entries(pwa.cached))assert.equal(hit,true,`offline core missing from Cache Storage: ${asset}`);

  console.log('phase: warm one Scripture book online');
  await page.locator('[data-modern-hub="read"]').click();
  await page.getByRole('button',{name:/Bible Reader/}).click();
  await page.waitForSelector('[data-reader-book="GEN"]');
  await page.locator('[data-reader-book="GEN"]').first().click();
  await page.waitForSelector('.verse-list');
  const onlineGenesis=(await page.locator('.verse-list').innerText()).slice(0,220);
  assert.ok(onlineGenesis.length>100,'online warm-up must load real Genesis text before testing offline reuse');
  await page.locator('[data-reader-close]').first().click();

  console.log('phase: offline reload');
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('.today-journey-card');
  assert.match(await page.locator('.today-journey-card').innerText(),/Continue My Journey|Journey complete/,'Daily Journey must render from the installed offline shell');
  assert.equal(await page.locator('.bottom .navbtn').count(),4,'offline shell must retain the four production navigation tabs');
  assert.equal(await page.evaluate(()=>Boolean(window.BQTutorial?.open)),true,'protected onboarding tutorial must remain available after an offline reload');

  console.log('phase: offline canonical standalone Transform');
  await page.locator('[data-modern-hub="grow"]').click();
  await page.getByRole('button',{name:/Transformation/}).click();
  await page.waitForURL(isTransform);
  await page.waitForSelector('.bq-transform-v2');
  assert.equal(await page.evaluate(()=>window.BQ_TRANSFORMATION?.mode),'rebuilt-v2','offline Transform must initialize the standalone v2 runtime');
  await page.keyboard.press('Escape');
  await page.waitForURL(url=>!isTransform(url));
  await page.waitForSelector('.today-journey-card');

  console.log('phase: cached Scripture offline');
  await page.locator('[data-modern-hub="read"]').click();
  await page.getByRole('button',{name:/Bible Reader/}).click();
  await page.waitForSelector('[data-reader-book="GEN"]');
  await page.locator('[data-reader-book="GEN"]').first().click();
  await page.waitForSelector('.verse-list');
  const offlineGenesis=(await page.locator('.verse-list').innerText()).slice(0,220);
  assert.equal(offlineGenesis,onlineGenesis,'a successfully loaded Scripture book must remain readable offline');
  await page.locator('[data-reader-close]').first().click();

  console.log('phase: offline navigation fallback');
  await page.goto(`${ORIGIN}?offline-reload=1`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.today-journey-card');
  assert.match(await page.locator('.brand').innerText(),/BibleQuest/i,'offline navigation must fall back to the app shell');

  console.log('phase: network recovery');
  await context.setOffline(false);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('.today-journey-card');
  const recovered=await page.evaluate(()=>navigator.onLine&&Boolean(navigator.serviceWorker.controller));
  assert.equal(recovered,true,'PWA must recover online while remaining service-worker controlled');

  assert.equal(pageErrors.length,0,`uncaught page errors during PWA install/offline/recovery: ${pageErrors.join(' | ')}`);
  console.log(`PWA offline browser smoke passed · cache v${pwa.version} · canonical standalone Transform, cached Scripture, four-tab shell, offline reload and recovery verified`);
} finally {
  await context.setOffline(false).catch(()=>{});
  await browser.close();
}
