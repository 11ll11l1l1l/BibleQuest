import { chromium } from 'playwright';

const BASE=process.env.BQ_V6_DEV_URL||'http://127.0.0.1:4174';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});

  await page.goto(BASE,{waitUntil:'domcontentloaded'});

  const mountFixture=async()=>{
    await page.evaluate(async()=>{
      globalThis.__notificationSettingsDispose?.();
      const [{notificationCenterPage},{createNotificationSettingsController}]=await Promise.all([
        import('/src/features/notification-center/index.js'),
        import('/src/v6/notifications/index.ts')
      ]);
      const ready=Object.freeze({
        status:'ready',
        authenticated:true,
        remoteAvailable:true,
        userId:'browser-fixture',
        items:Object.freeze([]),
        unread:0,
        error:''
      });
      const notifications=Object.freeze({
        snapshot:()=>ready,
        load:async()=>ready,
        refresh:async()=>ready,
        markAllRead:async()=>ready,
        setRead:async()=>ready,
        openTarget:async()=>null
      });
      const settings=createNotificationSettingsController(globalThis.localStorage);
      const pageModel=notificationCenterPage({
        notifications,
        notificationSettings:settings,
        onNavigate:()=>{},
        onBack:()=>{},
        onAccount:()=>{}
      });
      document.body.innerHTML='<main id="notification-settings-fixture"></main>';
      const root=document.getElementById('notification-settings-fixture');
      root.innerHTML=pageModel.html;
      globalThis.__notificationSettingsDispose=pageModel.mount(root);
    });
    await page.locator('[data-v6-notification-settings]').waitFor();
  };

  await mountFixture();

  const master=page.locator('[data-notification-setting-master]');
  const categories=page.locator('[data-notification-setting-category]');
  const quietEnabled=page.locator('[data-notification-setting-quiet-enabled]');
  const quietStart=page.locator('[data-notification-setting-quiet-start]');
  const quietEnd=page.locator('[data-notification-setting-quiet-end]');

  assert(await master.isChecked(),'Notification master control must default enabled.');
  assert(await categories.count()===6,'Rendered V6 notification settings must expose six category controls.');
  assert(Boolean(await master.getAttribute('aria-label')),'Master notification control requires an accessible name.');
  for(let index=0;index<await categories.count();index+=1){
    assert(Boolean(await categories.nth(index).getAttribute('aria-label')),'Category control '+index+' requires an accessible name.');
  }
  assert(await quietStart.inputValue()==='22:00'&&await quietEnd.inputValue()==='07:00','Default quiet hours must render from the V6 model.');

  await page.locator('[data-notification-setting-category="reading"]').uncheck();
  await page.waitForFunction(()=>document.querySelector('[data-notification-setting-category="reading"]')?.checked===false);
  await quietEnabled.check();
  await page.waitForFunction(()=>document.querySelector('[data-notification-setting-quiet-start]')?.disabled===false);
  await quietStart.fill('21:30');
  await quietStart.press('Tab');
  await quietEnd.fill('06:15');
  await quietEnd.press('Tab');

  await master.uncheck();
  await page.waitForFunction(()=>[...document.querySelectorAll('[data-notification-setting-category]')].every(node=>node.disabled));
  assert(await quietEnabled.isDisabled(),'Quiet-hours toggle must disable when master notifications are off.');

  const saved=await page.evaluate(()=>{
    const raw=localStorage.getItem('biblequest.v6.notification-prefs:browser-fixture');
    return raw?JSON.parse(raw):null;
  });
  assert(saved?.version===1,'Rendered notification settings did not persist through the V6 versioned store.');
  assert(saved?.value?.masterEnabled===false,'Master setting persistence mismatch.');
  assert(saved?.value?.categories?.reading===false,'Category setting persistence mismatch.');
  assert(
    saved?.value?.quietHours?.enabled===true
      &&saved?.value?.quietHours?.start==='21:30'
      &&saved?.value?.quietHours?.end==='06:15',
    'Quiet-hours persistence mismatch.'
  );

  await mountFixture();
  assert(!(await page.locator('[data-notification-setting-master]').isChecked()),'Master preference did not survive controller recreation.');
  assert(!(await page.locator('[data-notification-setting-category="reading"]').isChecked()),'Category preference did not survive controller recreation.');
  assert(await page.locator('[data-notification-setting-quiet-start]').inputValue()==='21:30','Quiet start did not survive controller recreation.');
  assert(await page.locator('[data-notification-setting-quiet-end]').inputValue()==='06:15','Quiet end did not survive controller recreation.');

  const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert(metrics.scrollWidth<=metrics.innerWidth+1,'Rendered V6 notification settings overflow at 390px: '+metrics.scrollWidth+'px > '+metrics.innerWidth+'px.');
  assert(errors.length===0,'Unexpected notification-settings console/page errors: '+errors.join(' | '));

  await context.close();
  console.log('PASS V6 rendered notification settings browser acceptance.');
}finally{
  await browser.close();
}
