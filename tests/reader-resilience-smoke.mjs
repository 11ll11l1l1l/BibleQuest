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

function nltFixture(route){
  const url=new URL(route.request().url());
  const ref=url.searchParams.get('ref')||'';
  return route.fulfill({status:200,contentType:'text/html',body:`<div class="nlt-test-fixture">NLT TEST FIXTURE ${ref}</div><script>window.__nltUnsafe=1</script>`});
}

function rangeSize(ref=''){
  const m=ref.match(/:(\d+)-(\d+)$/);return m?Number(m[2])-Number(m[1])+1:Infinity;
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

  console.log('phase: live NLT success');
  const nltRequests=[];
  await page.route('https://api.nlt.to/**',route=>{nltRequests.push(route.request().url());return nltFixture(route)});
  await page.locator('#bqTranslationSelect').selectOption('NLT');
  await page.waitForFunction(()=>document.querySelector('.verse-list')?.dataset.bqScripture==='NLT');
  assert.match(await page.locator('.verse-list').innerText(),/NLT TEST FIXTURE/,'NLT should render the live publisher-response surface');
  assert.equal(await page.locator('.verse-list script').count(),0,'NLT publisher HTML must be sanitized before insertion');
  assert.equal(await page.evaluate(()=>Boolean(window.__nltUnsafe)),false,'sanitized NLT HTML must not execute publisher-returned script');
  assert.ok(nltRequests.length>=1,'NLT selection must call the official NLT API');
  for(const request of nltRequests){const url=new URL(request),ref=url.searchParams.get('ref');assert.equal(url.hostname,'api.nlt.to');assert.equal(url.searchParams.get('key'),'TEST');assert.ok(rangeSize(ref)<=50,`NLT request must stay within 50 verses: ${ref}`)}

  console.log('phase: NLT explicit failure and recovery');
  await page.locator('#bqTranslationSelect').selectOption('BSB');
  await page.locator('#readerChapter').selectOption('2');
  await page.waitForSelector('#bqTranslationSelect');
  await page.unroute('https://api.nlt.to/**');
  await page.route('https://api.nlt.to/**',route=>route.abort());
  await page.locator('#bqTranslationSelect').selectOption('NLT');
  await page.waitForSelector('.reader-load-failure');
  const nltFailure=await page.locator('.reader-load-failure').innerText();
  assert.match(nltFailure,/NLT text unavailable/);
  assert.match(nltFailure,/will not substitute another translation under an NLT label or invent missing Scripture text/);
  assert.equal(await page.locator('.verse-list[data-bq-scripture="NLT"]').count(),0,'failed NLT request must not retain an NLT Scripture label');
  assert.equal(await page.locator('.reader-load-failure .verse-text').count(),0,'failed NLT request must not synthesize verse rows');
  const nltFallback=await page.locator('.reader-load-failure a[href*="version=NLT"]').getAttribute('href');
  assert.match(nltFallback,/^https:\/\/www\.biblegateway\.com\//,'NLT failure must retain a legal external-reader fallback');
  await page.locator('[data-reader-use-bsb]').click();
  await page.waitForFunction(()=>document.querySelector('.verse-list')?.dataset.bqScripture==='BSB');
  await page.unroute('https://api.nlt.to/**');

  console.log('phase: NLT 50-verse request ceiling');
  const psalmRequests=[];
  await page.route('https://api.nlt.to/**',route=>{psalmRequests.push(route.request().url());return nltFixture(route)});
  await page.evaluate(()=>window.BQReader.openBook('PSA',119));
  await page.waitForSelector('#bqTranslationSelect');
  await page.locator('#bqTranslationSelect').selectOption('NLT');
  await page.waitForFunction(()=>document.querySelector('.verse-list')?.dataset.bqScripture==='NLT');
  assert.equal(psalmRequests.length,4,'Psalm 119 should be split into four <=50-verse NLT requests');
  const psalmRefs=psalmRequests.map(x=>new URL(x).searchParams.get('ref'));
  assert.ok(psalmRefs.every(ref=>rangeSize(ref)<=50),`all NLT chunks must stay <=50 verses: ${psalmRefs.join(', ')}`);
  assert.match(psalmRefs[0],/Psalm[s]? 119:1-50/i);
  assert.match(psalmRefs.at(-1),/119:151-176$/);
  await page.unroute('https://api.nlt.to/**');

  console.log('phase: linked licensed versions');
  await page.locator('#bqTranslationSelect').selectOption('BSB');
  for(const code of ['ESV','NIV','AMP']){
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
