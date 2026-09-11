import { chromium } from 'playwright';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const widths=[320,360,390,412,430];
const browser=await chromium.launch({headless:true});
try{
  for(const width of widths){
    const page=await browser.newPage({viewport:{width,height:780}});
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
    await page.getByRole('button',{name:/play/i}).first().click().catch(()=>{});
    const playLink=page.locator('[data-nav="games"], [data-route="games"], [data-open-games], a[href*="games"], button').filter({hasText:/play/i}).first();
    if(await playLink.count())await playLink.click();
    await page.locator('[data-memory-open]').waitFor({state:'visible',timeout:10000});
    await page.locator('[data-memory-open]').click();
    await page.locator('[data-memory-meadow]').waitFor({state:'visible'});
    const cards=page.locator('[data-memory-index]');
    const expected=width<420?12:16;
    assert(await cards.count()===expected,`Memory Meadow card count at ${width}px was not ${expected}.`);
    const columns=await page.locator('[data-memory-grid]').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
    assert(columns===(width<420?3:4),`Memory Meadow columns at ${width}px are wrong.`);
    const firstBox=await cards.first().boundingBox();
    assert(firstBox&&firstBox.width>=44&&firstBox.height>=44,`Memory Meadow touch target at ${width}px is below 44px.`);
    await cards.first().click();
    assert(await cards.first().getAttribute('aria-label')!==`Card 1: hidden`,`Memory Meadow first card did not reveal at ${width}px.`);
    await page.close();
  }
  console.log('BibleQuest v3 Kids Memory browser acceptance passed.');
}finally{await browser.close()}
