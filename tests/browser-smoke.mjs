import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:360,height:800}});
page.setDefaultTimeout(12000);
page.setDefaultNavigationTimeout(20000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));

try{
  console.log('phase: load home');
  await page.goto('http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.modern-home');
  await page.waitForSelector('.today-journey-card');
  await page.waitForTimeout(500);

  assert.equal(await page.locator('.modern-hub').count(),4,'Home should retain four secondary hubs');
  assert.equal(await page.locator('.modern-focus').evaluate(el=>getComputedStyle(el).display),'none','old Daily 5 block should be hidden');
  assert.equal(await page.locator('.bq-pinoy-hero').evaluate(el=>getComputedStyle(el).display),'none','large decorative hero should not compete with the Daily Journey');
  assert.equal(await page.locator('.app>.hero').evaluate(el=>getComputedStyle(el).display),'none','legacy Keep growing hero must not precede the Daily Journey on mobile');
  assert.equal(await page.locator('.app>.quick-stats').evaluate(el=>getComputedStyle(el).display),'none','legacy XP strip must not consume the first mobile viewport');
  assert.match(await page.locator('.today-journey-card').innerText(),/Continue My Journey|Journey complete/);
  assert.equal(await page.locator('.journey-node[aria-current="step"]').count(),1,'Bible Journey path should expose exactly one current marker to assistive technology');
  assert.match(await page.locator('.journey-node[aria-current="step"]').getAttribute('aria-label'),/current next path marker/i);

  // Production mobile geometry: no pinch-zoom should be needed at a 360px viewport.
  const geometry=await page.evaluate(()=>({
    innerWidth:window.innerWidth,
    scrollWidth:document.documentElement.scrollWidth,
    daily:document.querySelector('.today-journey-card')?.getBoundingClientRect().toJSON(),
    path:document.querySelector('.journey-path-card')?.getBoundingClientRect().toJSON(),
    season:document.querySelector('.journey-season,.journey-season-empty')?.getBoundingClientRect().toJSON(),
    explore:document.querySelector('.modern-label')?.getBoundingClientRect().toJSON(),
    hub:document.querySelector('.modern-hub')?.getBoundingClientRect().toJSON(),
    nav:[...document.querySelectorAll('.bottom .navbtn')].map(x=>({rect:x.getBoundingClientRect().toJSON(),label:x.textContent.trim()})),
    navColumns:getComputedStyle(document.querySelector('.bottom')).gridTemplateColumns
  }));
  assert.ok(geometry.scrollWidth<=geometry.innerWidth+1,`home must not horizontally overflow: ${geometry.scrollWidth}px > ${geometry.innerWidth}px`);
  assert.ok(geometry.daily&&geometry.daily.top<140,'Daily Journey should be the first substantial home card');
  assert.ok(geometry.daily.height<270,'Daily Journey should remain compact on a phone');
  if(geometry.path&&geometry.season)assert.ok(geometry.path.top<geometry.season.top,'Bible path should appear before the optional season');
  assert.ok(geometry.explore&&geometry.explore.top<800,'Explore should begin within roughly one phone viewport after the core journey controls');
  assert.ok(geometry.hub&&geometry.hub.height<=110,'Explore cards must stay compact on mobile');
  assert.equal(geometry.nav.length,4,'bottom navigation should contain Home, Journey, Think and Me');
  assert.deepEqual(geometry.nav.map(x=>x.label),['🏡Home','🗺️Journey','💭Think','🌱Me'],'bottom navigation destinations changed unexpectedly');
  assert.ok(Math.max(...geometry.nav.map(x=>x.rect.top))-Math.min(...geometry.nav.map(x=>x.rect.top))<3,'all four navigation tabs must remain on one row');
  assert.ok(Math.max(...geometry.nav.map(x=>x.rect.width))-Math.min(...geometry.nav.map(x=>x.rect.width))<2,'four navigation tabs must remain equal width');
  assert.equal(geometry.navColumns.trim().split(/\s+/).length,4,'computed bottom navigation must have four columns');

  // First visit must land directly on the Daily Journey. Personal focus is opt-in, not a blocking modal.
  assert.equal(await page.locator('#bqFrontStruggle:not(.hidden)').count(),0,'personal focus must not block the Daily Journey');
  const supportButton=page.locator('.today-journey-card [data-journey-support]');
  await supportButton.focus();
  await supportButton.click();
  await page.waitForSelector('#bqJourneyLoop:not(.hidden)');
  assert.match(await page.locator('#bqJourneyLoop').innerText(),/What are you carrying today\?/i);
  assert.match(await page.locator('#bqJourneyLoop').innerText(),/Anxiety \/ Worry/);
  assert.equal(await page.locator('#bqJourneyLoop').getAttribute('role'),'dialog','Journey overlay must expose dialog semantics');
  assert.equal(await page.locator('#bqJourneyLoop').getAttribute('aria-modal'),'true','Journey overlay must be marked modal');
  await page.waitForFunction(()=>document.activeElement?.hasAttribute('data-journey-close'));
  await page.keyboard.press('Escape');
  await page.waitForSelector('#bqJourneyLoop.hidden');
  await page.waitForFunction(()=>document.activeElement?.hasAttribute('data-journey-support'));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('.today-journey-card');

  const manifest=await page.evaluate(()=>fetch('manifest.webmanifest').then(r=>r.json()));
  assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'./');assert.ok(manifest.icons?.some(x=>x.src==='app-icon.svg'));

  console.log('phase: sources');
  await page.locator('[data-modern-sources]').click();
  await page.waitForSelector('.modern-sheet:not(.hidden)');
  const sources=await page.locator('.modern-source-list').innerText();
  for(const label of ['Berean Standard Bible','Tagalog ULB','New Living Translation','Open Bible Stories'])assert.match(sources,new RegExp(label));
  await page.locator('.modern-sheet-head [data-modern-close]').click();

  console.log('phase: play');
  await page.locator('[data-modern-hub="play"]').click();
  await page.waitForSelector('.modern-sheet:not(.hidden)');
  assert.match(await page.locator('.modern-sheet-list').innerText(),/Who Said It/);
  assert.match(await page.locator('.modern-sheet-list').innerText(),/Characters & Places/);
  await page.getByRole('button',{name:/Who Said It/}).click();
  await page.waitForSelector('[data-speaker-answer]');
  assert.ok((await page.locator('.speaker-verse').innerText()).length>12);
  assert.match(await page.locator('.extra-panel').innerText(),/BSB|Berean Standard Bible/);
  await page.locator('[data-extra-close]').click();

  console.log('phase: reader');
  await page.locator('[data-modern-hub="read"]').click();
  await page.getByRole('button',{name:/Bible Reader/}).click();
  await page.waitForSelector('[data-reader-book="GEN"]');
  await page.locator('[data-reader-book="GEN"]').first().click();
  await page.waitForSelector('.verse-list');
  await page.waitForSelector('#bqTranslationSelect');
  const versions=await page.locator('#bqTranslationSelect').innerText();
  for(const label of ['BSB','TGL','日本語','NLT','ESV','NIV','AMP'])assert.match(versions,new RegExp(label));
  assert.ok((await page.locator('.verse-list').innerText()).length>100);

  // Regression: on <=380px the version and chapter controls used to occupy the same grid row,
  // making Tagalog appear to have disappeared. They must remain distinct, visible controls.
  const versionBox=await page.locator('#bqTranslationSelect').boundingBox();
  const chapterBox=await page.locator('#readerChapter').boundingBox();
  assert.ok(versionBox&&versionBox.width>120,'Bible version selector must be visibly usable on narrow phones');
  assert.ok(chapterBox,'chapter selector must remain visible');
  assert.ok(versionBox.y+versionBox.height<=chapterBox.y+2,'version selector must not overlap the chapter selector');

  await page.locator('#bqTranslationSelect').selectOption('TGL');
  await page.waitForFunction(()=>document.querySelector('.verse-list')?.dataset.bqScripture==='TGL');
  const tagalog=await page.locator('.verse-list').innerText();
  assert.ok(tagalog.length>100,'Tagalog chapter must render actual Scripture text');
  assert.match(tagalog,/Diyos/i,'Tagalog Genesis should contain Tagalog Scripture, not the BSB fallback');
  assert.match(await page.locator('[data-bq-version-source]').innerText(),/Tagalog|banal na Bibliya/i);
  await page.locator('[data-reader-close]').first().click();

  console.log('phase: mission');
  await page.locator('[data-modern-hub="grow"]').click();
  const grow=await page.locator('.modern-sheet-list').innerText();
  assert.match(grow,/My Mission/);assert.match(grow,/Bible World/);
  await page.getByRole('button',{name:/My Mission/}).click();
  await page.waitForSelector('#bqJourneyLoop:not(.hidden) .journey-task');
  assert.equal(await page.locator('#bqJourneyLoop .journey-task').count(),5);
  await page.locator('#bqJourneyLoop [data-journey-close]').click();

  console.log('phase: bible world');
  if(await page.locator('#bqModernSheet:not(.hidden)').count()===0)await page.locator('[data-modern-hub="grow"]').click();
  await page.locator('[data-modern-item="grow:1"]').click();
  await page.waitForSelector('#bqEngagementWorld:not(.hidden)');
  const world=await page.locator('#bqEngagementWorld').innerText();
  assert.match(world,/Genesis/);assert.match(world,/Exodus/);assert.match(world,/Kingdom/);assert.match(world,/Jesus/);assert.match(world,/Early Church/);
  await page.locator('#bqEngagementWorld [data-world-v3-close]').click();

  console.log('phase: standalone transformation');
  await page.evaluate(()=>window.BQ_TRANSFORMATION.open());
  await page.waitForURL(/\/transform\.html$/);
  await page.waitForSelector('.bq-transform-v2');
  assert.equal(await page.evaluate(()=>window.BQ_TRANSFORMATION?.mode),'rebuilt-v2','standalone Transform must load rebuilt-v2 runtime');
  assert.match(await page.locator('.bq-transform-v2').innerText(),/Personality Foundations/);
  await page.keyboard.press('Escape');
  await page.waitForURL(url=>!url.pathname.endsWith('/transform.html'));
  await page.waitForSelector('.today-journey-card');

  console.log('phase: together');
  await page.locator('[data-modern-hub="together"]').click();
  assert.match(await page.locator('.modern-sheet-list').innerText(),/Journey|Live BibleQuest Room|Play Together/);
  await page.getByRole('button',{name:/Live BibleQuest Room/}).click();
  await page.waitForSelector('#bqRoomLayer:not(.hidden)');
  assert.match(await page.locator('#bqRoomLayer').innerText(),/Sign in required/);
  await page.locator('#bqRoomLayer [data-room-close]').click();

  assert.equal(errors.length,0,`page errors: ${errors.join(' | ')}`);
  console.log('BibleQuest streamlined browser smoke test passed');
} finally {await browser.close()}
