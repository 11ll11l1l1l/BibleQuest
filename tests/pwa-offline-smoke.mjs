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
    const required=['./','./index.html','./styles.css','./app.js','./pwa-runtime.js','./operational-hardening.js','./onboarding-tutorial.js','./manifest.webmanifest','./app-icon.svg'];
    const cached={};
    for(const asset of required)cached[asset]=Boolean(await caches.match(new URL(asset,location.href).href));
    return {active:Boolean(registration.active),controlled:Boolean(navigator.serviceWorker.controller),tutorialApi:Boolean(window.BQTutorial?.open),version,appCaches,cached};
  });
  assert.equal(pwa.active,true,'installed PWA must have an active service worker');
  assert.equal(pwa.controlled,true,'first online session must become service-worker controlled');
  assert.equal(pwa.tutorialApi,true,'production boot must load the onboarding tutorial API');
  assert.ok(pwa.version>=43,`expected operational-recovery PWA baseline v43+, got v${pwa.version||'missing'}`);
  assert.equal(pwa.appCaches.length,1,`old BibleQuest caches should be removed after activation: ${pwa.appCaches.join(', ')}`);
  for(const [asset,hit] of Object.entries(pwa.cached))assert.equal(hit,true,`offline core missing from Cache Storage: ${asset}`);

  console.log('phase: offline reload');
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('.today-journey-card');
  assert.match(await page.locator('.today-journey-card').innerText(),/Continue My Journey|Journey complete/,'Daily Journey must render from the installed offline shell');
  assert.equal(await page.locator('.bottom .navbtn').count(),5,'offline shell must retain primary navigation');
  assert.equal(await page.evaluate(()=>Boolean(window.BQTutorial?.open)),true,'protected onboarding tutorial must remain available after an offline reload');

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
  console.log(`PWA offline browser smoke passed · cache v${pwa.version} · operational core, protected onboarding, offline reload, navigation fallback and recovery verified`);
} finally {
  await context.setOffline(false).catch(()=>{});
  await browser.close();
}
