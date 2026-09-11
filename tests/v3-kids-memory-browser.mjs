import { chromium } from 'playwright';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const widths=[320,360,390,412,430];
const browser=await chromium.launch({headless:true});
try{
  for(const width of widths){
    const page=await browser.newPage({viewport:{width,height:780},isMobile:width<=430,hasTouch:width<=430});
    const errors=[];
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
    await page.locator('[data-route-link="play"]').click();
    await page.waitForURL(/#\/play$/);
    await page.locator('[data-memory-open]').waitFor({state:'visible',timeout:10000});
    await page.locator('[data-memory-open]').click();
    await page.locator('[data-memory-meadow]').waitFor({state:'visible'});
    const cards=page.locator('[data-memory-index]');
    const expected=width<420?12:16;
    assert(await cards.count()===expected,`Memory Meadow card count at ${width}px was not ${expected}.`);
    const columns=await page.locator('[data-memory-grid]').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length);
    assert(columns===(width<420?3:4),`Memory Meadow columns at ${width}px are wrong.`);
    const firstBox=await cards.first().boundingBox();
    assert(firstBox&&firstBox.width>=44&&firstBox.height>=44,`Memory Meadow touch target at ${width}px is below 44px.`);
    const hiddenBefore=await cards.first().getAttribute('aria-label');
    assert(hiddenBefore===`Card 1: hidden`,`Memory Meadow first card should start hidden at ${width}px.`);
    await cards.first().click();
    assert((await cards.first().getAttribute('aria-label'))!==hiddenBefore,`Memory Meadow first card did not reveal at ${width}px.`);
    const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));
    assert(metrics.scrollWidth<=metrics.innerWidth+1,`Memory Meadow horizontal overflow at ${width}px: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
    assert(errors.length===0,`Memory Meadow browser errors at ${width}px: ${errors.join(' | ')}`);
    await page.close();
  }
  console.log('BibleQuest v3 Kids Memory browser acceptance passed.');
}finally{await browser.close()}
