import { chromium } from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const failures=[];
page.on('pageerror',error=>failures.push(`pageerror: ${error.message}`));
page.on('console',message=>{if(message.type()==='error')failures.push(`console: ${message.text()}`)});
await page.addInitScript(()=>{window.kuromoji={builder:()=>({build:callback=>callback(null,{tokenize:text=>text.startsWith('神')?[{surface_form:'神',reading:'カミ'},{surface_form:text.slice(1),reading:''}]:[{surface_form:text,reading:''}]})})}});
await page.route('https://api.getbible.net/v2/japkougo/**',async route=>{const url=new URL(route.request().url());if(url.pathname.endsWith('/43/3.json'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({book_name:'ヨハネによる福音書',verses:[{verse:16,text:'神はそのひとり子を賜わったほどに、この世を愛して下さった。それは御子を信じる者がひとりも滅びないで、永遠の命を得るためである。'},{verse:17,text:'神が御子を世につかわされたのは、世をさばくためではなく、御子によって、この世が救われるためである。'}]})});return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({verses:[{verse:1,text:'日本語テスト本文'}]})})});
try{
 await page.goto(`${BASE}#/reader`,{waitUntil:'networkidle'});await page.locator('[data-reader-chapter]').selectOption('3');await page.locator('[data-reader-translation]').selectOption('jko');await page.locator('[data-verse="16"]').waitFor();
 const control=page.locator('[data-reader-furigana]');assert(await control.isVisible(),'Furigana control must appear for JKO.');assert(await control.inputValue()==='support','Support mode must default ON.');
 await page.locator('[data-verse="16"] ruby').first().waitFor();const support=await page.locator('[data-verse="16"]').innerHTML();assert(support.includes('<ruby>愛<rt>あい</rt></ruby>'),'Support furigana missing.');
 await control.selectOption('off');await page.waitForFunction(()=>document.querySelectorAll('[data-verse="16"] ruby').length===0);const storedOff=await page.evaluate(()=>JSON.parse(localStorage.getItem('biblequest.v3.japanese-furigana')||'{}').mode);assert(storedOff==='off','OFF mode did not persist.');
 await page.reload({waitUntil:'networkidle'});await page.locator('[data-verse="16"]').waitFor();assert(await page.locator('[data-reader-furigana]').inputValue()==='off','Mode did not survive reload.');assert(await page.locator('[data-verse="16"] ruby').count()===0,'OFF mode leaked ruby after reload.');
 await page.locator('[data-reader-furigana]').selectOption('support');await page.locator('[data-verse="16"] ruby').first().waitFor();await page.locator('[data-reader-furigana]').selectOption('all');await page.waitForFunction(()=>document.querySelector('[data-verse="16"] ruby rt')?.textContent==='かみ');
 await page.locator('[data-reader-translation]').selectOption('bsb');await page.locator('[data-verse="16"]').waitFor();assert(await page.locator('[data-reader-furigana]').count()===0,'Furigana control must disappear outside JKO.');assert(await page.locator('[data-verse="16"] ruby').count()===0,'Ruby leaked into non-Japanese translation.');
 const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));assert(metrics.scrollWidth<=metrics.innerWidth+1,`Furigana caused horizontal overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);assert(failures.length===0,`Runtime errors: ${failures.join(' | ')}`);console.log('BibleQuest v3 Japanese furigana mobile browser regression passed.');
}finally{await browser.close()}
