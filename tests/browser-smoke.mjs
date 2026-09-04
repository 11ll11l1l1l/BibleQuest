import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
page.setDefaultTimeout(12000);
page.setDefaultNavigationTimeout(20000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));

try{
  console.log('phase: load home');
  await page.goto('http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.modern-home');
  await page.waitForSelector('.today-journey-card');

  assert.equal(await page.locator('.modern-hub').count(),4,'Home should retain four secondary hubs');
  assert.equal(await page.locator('.modern-focus').evaluate(el=>getComputedStyle(el).display),'none','old Daily 5 block should be hidden');
  assert.equal(await page.locator('.bq-pinoy-hero').evaluate(el=>getComputedStyle(el).display),'none','large decorative hero should not compete with the Daily Journey');
  assert.match(await page.locator('.today-journey-card').innerText(),/Continue My Journey|Journey complete/);

  await page.waitForSelector('#bqFrontStruggle:not(.hidden)',{timeout:5000});
  const prompt=await page.locator('#bqFrontStruggle').innerText();
  assert.match(prompt,/What are you struggling with today/i);
  assert.match(prompt,/Anxiety \/ Worry/);assert.match(prompt,/Parenting/);assert.match(prompt,/Understanding Jesus/);
  await page.locator('#bqFrontStruggle .front-struggle-skip').click();

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
  const versions=await page.locator('#bqTranslationSelect').innerText();
  for(const label of ['BSB','TGL','日本語','NLT','ESV','NIV','AMP'])assert.match(versions,new RegExp(label));
  assert.ok((await page.locator('.verse-list').innerText()).length>100);
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

  console.log('phase: transformation');
  await page.evaluate(()=>window.BQ_TRANSFORMATION.open());
  await page.waitForSelector('.bq-transform-overlay');
  assert.match(await page.locator('.bq-transform-overlay').innerText(),/Personality Foundations/);
  assert.match(await page.locator('.local-chip').innerText(),/private on this device/i);
  const personalityApi=await page.evaluate(()=>Boolean(window.BQPersonalityProfile?.presentation&&window.BQPersonalityProfile?.result));
  assert.equal(personalityApi,true,'personality profile API should be available for later presentation personalization');
  await page.locator('[data-route="home"]').first().click().catch(()=>{});

  console.log('phase: together');
  await page.evaluate(()=>document.querySelector('.bq-transform-overlay')?.remove());
  await page.locator('[data-modern-hub="together"]').click();
  assert.match(await page.locator('.modern-sheet-list').innerText(),/Journey|Live BibleQuest Room|Play Together/);
  await page.getByRole('button',{name:/Live BibleQuest Room/}).click();
  await page.waitForSelector('#bqRoomLayer:not(.hidden)');
  assert.match(await page.locator('#bqRoomLayer').innerText(),/Sign in required/);
  await page.locator('#bqRoomLayer [data-room-close]').click();

  assert.equal(errors.length,0,`page errors: ${errors.join(' | ')}`);
  console.log('BibleQuest streamlined browser smoke test passed');
} finally {await browser.close()}
