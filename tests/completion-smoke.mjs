import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(e.message));

try{
  await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
  await page.waitForSelector('.modern-home');

  const modules=await page.evaluate(()=>({
    context:Boolean(window.BQContextLab?.open),
    assignments:Boolean(window.BQAssignments?.open),
    assignmentPush:Boolean(window.BQAssignmentPush?.refresh),
    presence:Boolean(window.BQPresence?.open),
    avatars:Boolean(window.BQAvatarVault?.open),
    pinoyHero:Boolean(window.BQPinoyHero?.render)
  }));
  assert.deepEqual(modules,{context:true,assignments:true,assignmentPush:true,presence:true,avatars:true,pinoyHero:true},'completion-stage modules should load');

  await page.waitForSelector('.bq-pinoy-hero .bq-pinoy-hero-art');
  const heroText=await page.locator('.bq-pinoy-hero').innerText();
  assert.match(heroText,/PINOY IN JAPAN · BIBLEQUEST/);
  assert.match(heroText,/Different places\. Same Jesus\. One family\./);
  assert.match(heroText,/Shiba-Sheep/);
  assert.match(heroText,/My Mission/);
  const heroBg=await page.locator('.bq-pinoy-hero-art').evaluate(el=>getComputedStyle(el).backgroundImage);
  assert.match(heroBg,/bq-pinoy-japan-hero\.svg/,'real Pinoy-in-Japan artwork should be wired into the Home hero');
  assert.equal(await page.locator('body.bq-modern-home > .app .hero:visible').count(),0,'legacy generic hero should be hidden on modern Home');

  const contextManifest=await page.evaluate(()=>fetch('data/packs/context/manifest.json').then(r=>r.json()));
  assert.equal(contextManifest.books?.length,66,'all 66 original-language context packs should be discoverable');
  assert.equal(contextManifest.license,'CC BY 4.0');

  await page.evaluate(()=>window.BQContextLab.open({code:'JHN',chapter:3,verse:16}));
  await page.waitForSelector('#bqContextLab:not(.hidden) .lexeme-card',{timeout:15000});
  const contextText=await page.locator('#bqContextLab').innerText();
  assert.match(contextText,/ORIGINAL-LANGUAGE CONTEXT LAB/);
  assert.match(contextText,/John 3:16/);
  assert.match(contextText,/Three rules for a safer word study/);
  assert.match(contextText,/STEPBible/);
  assert.ok((await page.locator('#bqContextLab .lexeme-card').count())>0,'John 3:16 should expose Greek lexical entries');
  assert.ok((await page.locator('#bqContextLab .lexeme-usage').count())>0,'lexemes should expose in-book usage context');
  assert.ok((await page.locator('#bqContextLab .verse-context-strip button').count())>=1,'context lab should show surrounding verses');
  const firstDetails=page.locator('#bqContextLab .lexeme-usage').first();
  if(await firstDetails.count()){
    await firstDetails.locator('summary').click();
    const firstUsage=firstDetails.locator('[data-context-ref]').first();
    if(await firstUsage.count()){
      const before=await page.locator('#bqContextLab .context-scripture small').innerText();
      await firstUsage.click();
      await page.waitForTimeout(120);
      const after=await page.locator('#bqContextLab .context-scripture small').innerText();
      assert.ok(after.length>0&&before.length>0,'usage navigation should retain valid Scripture context');
    }
  }
  await page.locator('#bqContextLab [data-context-close]').click();

  await page.evaluate(()=>window.BQAssignments.open());
  await page.waitForSelector('#bqAssignmentLayer:not(.hidden)');
  assert.match(await page.locator('#bqAssignmentLayer').innerText(),/Sign in to receive church assignments/);
  await page.locator('#bqAssignmentLayer [data-assignment-close]').click();

  await page.evaluate(()=>window.BQPresence.open());
  await page.waitForSelector('#bqPresenceLayer:not(.hidden)');
  assert.match(await page.locator('#bqPresenceLayer').innerText(),/Sign in to see Community Live/);
  await page.locator('#bqPresenceLayer [data-presence-close]').click();

  await page.evaluate(()=>window.BQAvatarVault.open());
  await page.waitForSelector('#bqAvatarVault:not(.hidden) .vault-card');
  assert.ok((await page.locator('#bqAvatarVault .vault-card').count())>=15,'avatar vault should expose the expanded unlock collection');
  const vaultText=await page.locator('#bqAvatarVault').innerText();
  assert.match(vaultText,/Kitsune Bookworm/);
  assert.match(vaultText,/Moonlight Reader/);
  assert.match(vaultText,/Fuji Explorer/);
  assert.match(vaultText,/Tea Garden Scholar/);
  assert.ok((await page.locator('#bqAvatarVault .vault-card.locked').count())>=1,'future avatar rewards should be visibly locked');
  assert.match(vaultText,/how to unlock|Answer 500|Study 250|Complete 10 leader assignments/i);
  await page.locator('#bqAvatarVault [data-vault-close]').click();

  assert.equal(await page.locator('[data-assignment-pill]').count(),0,'signed-out local smoke run should not invent leader notifications');
  assert.equal(pageErrors.length,0,`browser page errors: ${pageErrors.join(' | ')}`);
  console.log('BibleQuest completion-stage browser smoke test passed');
} finally {
  await browser.close();
}
