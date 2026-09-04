import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});

async function checkViewport(name,viewport,{mobile=false}={}){
  const page=await browser.newPage({viewport});
  page.setDefaultTimeout(12000);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
    console.log(`phase: ${name} ${viewport.width}x${viewport.height}`);
    await page.goto('http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});
    await page.waitForSelector('.today-journey-card');
    await page.waitForTimeout(350);

    const geometry=await page.evaluate(()=>({
      innerWidth:window.innerWidth,
      scrollWidth:document.documentElement.scrollWidth,
      daily:document.querySelector('.today-journey-card')?.getBoundingClientRect().toJSON(),
      journeyCards:[...document.querySelectorAll('.bq-engagement-stack > *')].filter(x=>getComputedStyle(x).display!=='none').map(x=>({className:x.className,rect:x.getBoundingClientRect().toJSON()})),
      path:document.querySelector('.journey-path-scroll')?.getBoundingClientRect().toJSON(),
      hubs:[...document.querySelectorAll('.modern-hub')].map(x=>x.getBoundingClientRect().toJSON()),
      nav:[...document.querySelectorAll('.bottom .navbtn')].map(x=>x.getBoundingClientRect().toJSON()),
      columns:getComputedStyle(document.querySelector('.modern-hubs')).gridTemplateColumns
    }));

    assert.ok(geometry.scrollWidth<=geometry.innerWidth+1,`${name}: home must not horizontally overflow`);
    assert.ok(geometry.daily&&geometry.daily.width<=geometry.innerWidth,`${name}: Daily Journey must fit the viewport`);
    assert.ok(geometry.daily.right<=geometry.innerWidth+1,`${name}: Daily Journey right edge must stay inside viewport`);
    for(const card of geometry.journeyCards){
      assert.ok(card.rect.left>=-1,`${name}: ${card.className} must not escape left edge`);
      assert.ok(card.rect.right<=geometry.innerWidth+1,`${name}: ${card.className} must not escape right edge`);
      assert.ok(card.rect.width<=geometry.innerWidth+1,`${name}: ${card.className} must not be wider than viewport`);
    }
    assert.ok(geometry.path&&geometry.path.right<=geometry.innerWidth+1,`${name}: Journey path viewport must remain contained`);
    assert.equal(geometry.nav.length,5,`${name}: bottom navigation must keep five destinations`);
    assert.ok(Math.max(...geometry.nav.map(x=>x.top))-Math.min(...geometry.nav.map(x=>x.top))<3,`${name}: bottom navigation must remain one row`);
    assert.equal(await page.locator('.app>.hero').evaluate(el=>getComputedStyle(el).display),'none',`${name}: legacy hero must remain suppressed`);

    if(mobile){
      assert.equal(await page.locator('.app>.quick-stats').evaluate(el=>getComputedStyle(el).display),'none',`${name}: legacy stat strip must not consume mobile viewport space`);
      assert.ok(geometry.daily.top<140,`${name}: Daily Journey must remain above the fold`);
      assert.ok(geometry.hubs.every(x=>x.width>120),`${name}: Explore cards must remain usable`);
    }else{
      assert.ok(geometry.columns.split(' ').length>=4,`${name}: desktop Explore should use the wide layout`);
      assert.ok(geometry.daily.width>500,`${name}: desktop content should use available width without becoming phone-sized`);
    }

    // Admin entry must never be exposed to an anonymous browser session.
    assert.equal(await page.locator('[data-admin-link]').count(),0,`${name}: anonymous users must not see the Admin link`);
    assert.equal(errors.length,0,`${name}: page errors: ${errors.join(' | ')}`);
  } finally {
    await page.close();
  }
}

try{
  for(const width of [320,360,375,390,412,430]){
    await checkViewport(`phone-${width}`,{width,height:932},{mobile:true});
  }
  await checkViewport('desktop',{width:1280,height:900});
  console.log('Layout matrix smoke passed');
} finally {
  await browser.close();
}
