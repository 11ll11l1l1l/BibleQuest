import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const failures=[];
page.on('pageerror',error=>failures.push(`pageerror: ${error.message}`));
page.on('console',message=>{if(message.type()==='error')failures.push(`console: ${message.text()}`)});

await page.route('https://api.getbible.net/v2/japkougo/**',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname.endsWith('/43/3.json')) return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
    book_name:'ヨハネによる福音書',
    verses:[
      {verse:16,text:'神はそのひとり子を賜わったほどに、この世を愛して下さった。それは御子を信じる者がひとりも滅びないで、永遠の命を得るためである。'},
      {verse:17,text:'神が御子を世につかわされたのは、世をさばくためではなく、御子によって、この世が救われるためである。'}
    ]
  })});
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({verses:[{verse:1,text:'日本語テスト本文'}]})});
});

try{
  await page.goto(`${BASE}#/reader`,{waitUntil:'networkidle'});
  await page.locator('[data-reader-page] h1',{hasText:'Bible Reader'}).waitFor();
  await page.locator('[data-reader-chapter]').selectOption('3');
  await page.locator('[data-reader-translation]').selectOption('jko');
  await page.locator('[data-verse="16"]').waitFor();

  const toggle=page.locator('[data-jp-vocab-toggle]');
  assert(await toggle.isVisible(),'Japanese vocabulary control must appear only on Japanese Reader.');
  assert((await toggle.textContent()).includes('ON'),'Recovered Japanese vocabulary learning should default ON.');
  assert(await toggle.evaluate(node=>node.getBoundingClientRect().height)>=44,'Japanese vocabulary control must be at least 44px high on mobile.');

  await page.locator('[data-verse="16"]').click();
  await page.locator('[data-verse-dialog][open]').waitFor();
  const vocab=page.locator('[data-jp-vocab]');
  assert(await vocab.isVisible(),'Tapping a Japanese verse must expose vocabulary notes inside Verse Peek.');
  const vocabText=await vocab.textContent();
  assert(vocabText.includes('愛')&&vocabText.includes('あい')&&vocabText.includes('love'),'Recovered 愛 vocabulary note is missing from the selected verse.');
  assert(vocabText.includes('永遠')&&vocabText.includes('えいえん'),'Recovered 永遠 vocabulary note is missing from the selected verse.');
  assert(vocabText.includes('学習補助')&&vocabText.includes('聖書本文ではありません'),'Vocabulary UI must clearly label notes as learning aids rather than Scripture.');
  assert(await page.locator('[data-peek-context]').isVisible(),'Japanese vocabulary must not displace the existing Verse Peek Context Lab handoff.');
  await page.locator('[data-verse-close]').click();

  const xp=await page.evaluate(()=>JSON.parse(localStorage.getItem('biblequest.v3.progress-state')||'{}').xp||0);
  assert(xp===0,'Japanese vocabulary browsing must not invent XP.');

  await toggle.click();
  assert((await page.locator('[data-jp-vocab-toggle]').textContent()).includes('OFF'),'Vocabulary toggle did not disable learning notes.');
  const storedDisabled=await page.evaluate(()=>JSON.parse(localStorage.getItem('biblequest.v3.japanese-vocabulary')||'{}').enabled);
  assert(storedDisabled===false,'Vocabulary enabled preference did not persist through the Storage boundary.');
  await page.locator('[data-verse="16"]').click();
  await page.locator('[data-verse-dialog][open]').waitFor();
  assert(await page.locator('[data-jp-vocab]').count()===0,'Disabled Japanese vocabulary must not render notes in Verse Peek.');
  await page.locator('[data-verse-close]').click();

  await page.reload({waitUntil:'networkidle'});
  await page.locator('[data-verse="16"]').waitFor();
  assert(await page.locator('[data-reader-translation]').inputValue()==='jko','Japanese Reader selection must survive vocabulary reload testing.');
  assert((await page.locator('[data-jp-vocab-toggle]').textContent()).includes('OFF'),'Vocabulary preference did not survive reload.');

  await page.locator('[data-jp-vocab-toggle]').click();
  await page.locator('[data-verse="17"]').click();
  await page.locator('[data-verse-dialog][open]').waitFor();
  const emptyText=await page.locator('[data-jp-vocab]').textContent();
  assert(emptyText.includes('追加の語彙メモはありません'),'Verse with no curated match must show a safe empty state instead of fabricating a reading.');
  await page.locator('[data-verse-close]').click();

  await page.locator('[data-reader-translation]').selectOption('bsb');
  await page.locator('[data-verse="16"]').waitFor();
  assert(await page.locator('[data-jp-vocab-toggle]').count()===0,'Japanese vocabulary control must disappear outside Japanese 口語訳.');

  const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Japanese vocabulary caused horizontal overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(failures.length===0,`Japanese vocabulary browser regression saw runtime errors: ${failures.join(' | ')}`);
  console.log('BibleQuest v3 Japanese vocabulary mobile browser regression passed.');
}finally{
  await browser.close();
}
