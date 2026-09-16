import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const base=process.env.BQ_BASE_URL||'http://127.0.0.1:4173';
const expected={creation:'world-creation.png',patriarchs:'world-patriarchs.png',exodus:'world-exodus.png',kingdom:'world-kingdom.png',wisdom:'world-wisdom.png',prophets:'world-prophets.png',jesus:'world-gospels.png',church:'world-early-church.png',letters:'world-letters.png'};
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
const page=await context.newPage();
const errors=[];
page.on('pageerror',error=>errors.push(String(error)));
try{
  await page.goto(`${base}/#/bible-world`,{waitUntil:'networkidle'});
  await page.locator('[data-world-region]').first().waitFor();
  for(const [region,asset] of Object.entries(expected)){
    const button=page.locator(`[data-world-region="${region}"]`);
    const icon=button.locator('.bq-world-icon');
    assert.match(await icon.evaluate(node=>getComputedStyle(node).backgroundImage),new RegExp(asset.replace('.','\\.')));
    assert.equal(await icon.getAttribute('aria-hidden'),'true');
    assert.ok((await button.locator('.bq-world-title').innerText()).trim().length>0,`${region} must retain visible title text`);
  }
  assert.equal(await page.locator('[data-world-region]').count(),9);
  assert.equal(await page.locator('[data-world-region][disabled]').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false,'390px Bible World must not overflow horizontally');
  assert.deepEqual(errors,[],'Bible World artwork proof must not emit page errors');
}finally{await browser.close();}
console.log('V5 Bible World exact region artwork browser proof: PASS');
