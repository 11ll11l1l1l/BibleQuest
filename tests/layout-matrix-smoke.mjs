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

    const geometry=await page.evaluate(()=>{
      const rect=selector=>document.querySelector(selector)?.getBoundingClientRect().toJSON();
      const px=(selector,prop)=>{const el=document.querySelector(selector);return el?(parseFloat(getComputedStyle(el)[prop])||0):0};
      const navEls=[...document.querySelectorAll('.bottom .navbtn')];
      return {
        innerWidth:window.innerWidth,
        scrollWidth:document.documentElement.scrollWidth,
        daily:rect('.today-journey-card'),
        journeyCards:[...document.querySelectorAll('.bq-engagement-stack > *')].filter(x=>getComputedStyle(x).display!=='none').map(x=>({className:x.className,rect:x.getBoundingClientRect().toJSON()})),
        path:rect('.journey-path-scroll'),
        hubs:[...document.querySelectorAll('.modern-hub')].map(x=>x.getBoundingClientRect().toJSON()),
        nav:navEls.map(x=>({rect:x.getBoundingClientRect().toJSON(),label:x.textContent.trim(),font:parseFloat(getComputedStyle(x).fontSize)||0})),
        navColumns:getComputedStyle(document.querySelector('.bottom')).gridTemplateColumns,
        columns:getComputedStyle(document.querySelector('.modern-hubs')).gridTemplateColumns,
        primaryHeight:rect('.journey-primary')?.height||0,
        primaryFont:px('.journey-primary','fontSize'),
        secondaryHeights:[...document.querySelectorAll('.today-journey-actions .journey-secondary')].map(x=>x.getBoundingClientRect().height),
        pathLabelFont:px('.journey-node small','fontSize'),
        pathTitleFont:px('.journey-node b','fontSize'),
        hubSupportFont:px('.modern-hub small','fontSize'),
        languageHeight:rect('.ui-language-toggle')?.height||44,
        languageWidth:rect('.ui-language-toggle')?.width||44
      };
    });

    assert.ok(geometry.scrollWidth<=geometry.innerWidth+1,`${name}: home must not horizontally overflow`);
    assert.ok(geometry.daily&&geometry.daily.width<=geometry.innerWidth,`${name}: Daily Journey must fit the viewport`);
    assert.ok(geometry.daily.right<=geometry.innerWidth+1,`${name}: Daily Journey right edge must stay inside viewport`);
    for(const card of geometry.journeyCards){
      assert.ok(card.rect.left>=-1,`${name}: ${card.className} must not escape left edge`);
      assert.ok(card.rect.right<=geometry.innerWidth+1,`${name}: ${card.className} must not escape right edge`);
      assert.ok(card.rect.width<=geometry.innerWidth+1,`${name}: ${card.className} must not be wider than viewport`);
    }
    assert.ok(geometry.path&&geometry.path.right<=geometry.innerWidth+1,`${name}: Journey path viewport must remain contained`);
    assert.equal(geometry.nav.length,4,`${name}: bottom navigation must match Home, Journey, Think and Me`);
    assert.deepEqual(geometry.nav.map(x=>x.label),['🏡Home','🗺️Journey','💭Think','🌱Me'],`${name}: bottom navigation destinations changed unexpectedly`);
    assert.ok(Math.max(...geometry.nav.map(x=>x.rect.top))-Math.min(...geometry.nav.map(x=>x.rect.top))<3,`${name}: bottom navigation must remain one row`);
    const navWidths=geometry.nav.map(x=>x.rect.width);
    assert.ok(Math.max(...navWidths)-Math.min(...navWidths)<2,`${name}: four navigation columns must remain equal width`);
    assert.equal(geometry.navColumns.trim().split(/\s+/).length,4,`${name}: computed bottom-nav grid must have four columns`);
    assert.equal(await page.locator('.app>.hero').evaluate(el=>getComputedStyle(el).display),'none',`${name}: legacy hero must remain suppressed`);

    if(mobile){
      assert.equal(await page.locator('.app>.quick-stats').evaluate(el=>getComputedStyle(el).display),'none',`${name}: legacy stat strip must not consume mobile viewport space`);
      assert.ok(geometry.daily.top<140,`${name}: Daily Journey must remain above the fold`);
      assert.ok(geometry.hubs.every(x=>x.width>120),`${name}: Explore cards must remain usable`);
      assert.ok(geometry.nav.every(x=>x.rect.height>=44),`${name}: bottom navigation touch targets must remain usable`);
      assert.ok(geometry.nav.every(x=>x.font>=11),`${name}: bottom navigation labels must remain readable`);
      assert.ok(geometry.primaryHeight>=44,`${name}: Daily Journey primary CTA must remain a practical touch target`);
      assert.ok(geometry.primaryFont>=14,`${name}: Daily Journey primary CTA text must remain readable`);
      assert.ok(geometry.secondaryHeights.every(x=>x>=44),`${name}: Daily Journey secondary actions must remain practical touch targets`);
      assert.ok(geometry.pathLabelFont>=11&&geometry.pathTitleFont>=11,`${name}: Journey path labels must remain readable at 100% zoom`);
      assert.ok(geometry.hubSupportFont>=11,`${name}: Explore support labels must remain readable on narrow phones`);
      assert.ok(geometry.languageHeight>=44&&geometry.languageWidth>=44,`${name}: language control must retain an accessible touch target`);
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
  for(const width of [320,360,390,412,430]){
    await checkViewport(`phone-${width}`,{width,height:932},{mobile:true});
  }
  await checkViewport('desktop',{width:1280,height:900});
  console.log('Layout matrix smoke passed');
} finally {
  await browser.close();
}
