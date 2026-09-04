import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
try{
  await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
  await page.waitForSelector('.modern-home');
  const config=await page.evaluate(()=>window.BQ_CLOUD_CONFIG);
  assert.equal(config.enabled,false,'Localhost must stay cloud-disabled so tests never write production account data');
  assert.equal(config.authMode,'email-password');
  assert.equal(config.supabaseUrl,'https://zkfmgezvzugchcwppreq.supabase.co','BibleQuest should target the shared Karimen Supabase project');
  assert.match(config.publishableKey,/^sb_publishable_/,'Frontend must use a modern Supabase publishable key');
  const expectedRedirect=await page.evaluate(()=>new URL('./',location.href).href);
  assert.equal(config.redirectUrl,expectedRedirect,'Auth redirect must derive from the active deployment root instead of a retired host');
  const serialized=JSON.stringify(config);
  assert.doesNotMatch(serialized,/service[_-]?role/i,'Browser config must never expose a service-role key');
  assert.doesNotMatch(serialized,/sb_secret_/i,'Browser config must never expose a Supabase secret key');

  assert.equal(await page.evaluate(()=>typeof window.BQAccount?.open),'function','Account module should load');
  assert.equal(await page.evaluate(()=>typeof window.BQNotes?.open),'function','Private notes module should load');
  const accountStatus=await page.evaluate(()=>window.BQAccount.status());
  assert.equal(accountStatus.enabled,false,'Local smoke test must not initialize production Auth');

  await page.locator('[data-modern-hub="together"]').click();
  await page.getByRole('button',{name:/Congregation Roster/}).click();
  await page.waitForSelector('.community-layer:not(.hidden)');
  await page.locator('[data-community-home]').click();
  await page.waitForSelector('[data-bq-cloud-card]');
  const text=await page.locator('[data-bq-cloud-card]').innerText();
  assert.match(text,/LOCAL TEST/);
  assert.match(text,/live site uses cloud accounts/i);
  await page.waitForTimeout(300);
  assert.equal(await page.locator('[data-bq-cloud-card]').count(),1,'Cloud card should not duplicate during DOM observation');
  const cloudStatus=await page.evaluate(()=>window.BQCloud.status());
  assert.equal(cloudStatus.enabled,false);
  assert.equal(cloudStatus.signedIn,false);
  assert.equal(await page.locator('script[src*="supabase-js"]').count(),0,'Supabase SDK should stay unloaded on localhost');
  console.log('BibleQuest shared-backend localhost safety smoke test passed');
} finally {
  await browser.close();
}
