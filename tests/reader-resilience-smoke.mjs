import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:360,height:800}});
page.setDefaultTimeout(12000);

async function openGenesis(){
  await page.goto('http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.modern-home');
  await page.locator('[data-modern-hub="read"]').click();
  await page.getByRole('button',{name:/Bible Reader/}).click();
  await page.waitForSelector('[data-reader-book="GEN"]');
  await page.locator('[data-reader-book="GEN"]').first().click();
  await page.waitForSelector('#bqTranslationSelect');
}

try{
  console.log('phase: Japanese source failure');
  await page.route('https://api.getbible.net/**',route=>route.abort());
  await openGenesis();
  await page.locator('#bqTranslationSelect').selectOption('JKO');
  await page.waitForSelector('[data-reader-version-retry]');
  const jpFailure=await page.locator('.reader-load-failure').innerText();
  assert.match(jpFailure,/口語訳を読み込めませんでした/);
  assert.match(jpFailure,/推測して表示することはありません/,'Japanese failure must explicitly refuse guessed Scripture');
  assert.equal(await page.locator('.reader-load-failure .verse-text').count(),0,'failure UI must not contain fabricated Scripture rows');
  await page.locator('[data-reader-use-bsb]').click();
  await page.waitForFunction(()=>document.querySelector('.verse-list')?.dataset.bqScripture==='BSB');
  assert.ok((await page.locator('.verse-list').innerText()).length>100,'BSB fallback should restore the already-loaded canonical source');
  await page.unroute('https://api.getbible.net/**');

  console.log('phase: Tagalog pack failure');
  await page.route('**/data/packs/tagalog/GEN.json',route=>route.abort());
  await page.locator('#bqTranslationSelect').selectOption('TGL');
  await page.waitForSelector('[data-reader-version-retry]');
  const tgFailure=await page.locator('.reader-load-failure').innerText();
  assert.match(tgFailure,/Tagalog text unavailable/);
  assert.match(tgFailure,/will not substitute or invent Scripture text/);
  assert.equal(await page.locator('.reader-load-failure .verse-text').count(),0,'Tagalog failure UI must not masquerade as Scripture');
  await page.locator('[data-reader-use-bsb]').click();
  await page.waitForFunction(()=>document.querySelector('.verse-list')?.dataset.bqScripture==='BSB');
  await page.unroute('**/data/packs/tagalog/GEN.json');

  console.log('phase: licensed-link versions');
  for(const code of ['NLT','ESV','NIV','AMP']){
    await page.locator('#bqTranslationSelect').selectOption(code);
    const link=page.locator('.verse-list a.reader-primary');
    await link.waitFor();
    const href=await link.getAttribute('href');
    assert.ok(href?.startsWith('https://'),'licensed translation must leave BibleQuest through HTTPS');
    assert.equal(await page.locator('.verse-list .verse-text').count(),0,`${code} must not expose bundled copyrighted verse rows`);
    if(code==='ESV')assert.match(href,/^https:\/\/www\.esv\.org\//);
    else assert.match(href,new RegExp(`biblegateway\\.com.*version=${code}`));
  }

  const geometry=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,select:document.querySelector('#bqTranslationSelect')?.getBoundingClientRect().toJSON()}));
  assert.ok(geometry.scrollWidth<=geometry.innerWidth+1,'Reader must not horizontally overflow at 360px');
  assert.ok(geometry.select&&geometry.select.width>120,'translation selector must remain usable at 360px');

  console.log('Reader resilience smoke passed');
} finally {
  await browser.close();
}
