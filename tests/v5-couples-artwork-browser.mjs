import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base=process.env.BQ_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[];
page.on('pageerror',error=>errors.push(String(error)));
try{
  await page.goto(`${base}/`,{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(()=>{
    document.body.innerHTML=`<main>
      <section class="bq-couples">
        <div class="bq-couples-mode-grid">
          <button data-couples-mode="god"><span>✝️</span><b>Us &amp; God</b><small>Faith, prayer, grace, shared direction.</small></button>
          <button data-couples-mode="date"><span>✨</span><b>Date Night Deck</b><small>Friendship and gratitude.</small></button>
        </div>
        <div class="bq-couples-categories"><button data-couples-category="christ"><span>✝️</span><b>Us &amp; God</b></button></div>
      </section>
      <section class="bq-couples-cloud">
        <div class="bq-couples-cloud-journey">
          <button data-couple-cloud-step="0"><span>🙏</span><div><b>1. Pray Honestly</b><small>Philippians 1:9–11</small></div></button>
          <button data-couple-cloud-step="6"><span>✝️</span><div><b>7. Us &amp; God</b><small>Hebrews 10:24–25</small></div></button>
          <button class="done" data-couple-cloud-step="0"><span>✓</span><div><b>Completed prayer</b></div></button>
        </div>
      </section>
    </main>`;
    const bg=selector=>getComputedStyle(document.querySelector(selector)).backgroundImage;
    const size=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {w:r.width,h:r.height}};
    return {
      familyGod:bg('[data-couples-mode="god"]>span'),
      familyDate:bg('[data-couples-mode="date"]>span'),
      familyChrist:bg('[data-couples-category="christ"]>span'),
      cloudPrayer:bg('[data-couple-cloud-step="0"]:not(.done)>span'),
      cloudChrist:bg('[data-couple-cloud-step="6"]>span'),
      doneBg:bg('[data-couple-cloud-step="0"].done>span'),
      doneText:document.querySelector('[data-couple-cloud-step="0"].done>span').textContent,
      prayerButton:size('[data-couple-cloud-step="0"]:not(.done)'),
      labels:document.body.innerText,
      overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth
    };
  });
  assert.match(result.familyGod,/mini-cross\.png/);
  assert.match(result.familyDate,/sparkle\.png/);
  assert.match(result.familyChrist,/mini-cross\.png/);
  assert.match(result.cloudPrayer,/prayer-circle\.png/);
  assert.match(result.cloudChrist,/mini-cross\.png/);
  assert.equal(result.doneBg,'none','completed checkmark must not be covered by journey artwork');
  assert.equal(result.doneText,'✓');
  assert.ok(result.prayerButton.h>=44,'Couple Cloud journey touch target must remain at least 44px high');
  assert.match(result.labels,/Pray Honestly/);
  assert.match(result.labels,/Us & God/);
  assert.match(result.labels,/Date Night Deck/);
  assert.equal(result.overflow,false,'390px Couples artwork fixture must not overflow horizontally');
  assert.deepEqual(errors,[],'Couples artwork browser proof must not emit page errors');
  console.log('v5 Couples artwork 390px browser proof: PASS');
}finally{await browser.close();}
