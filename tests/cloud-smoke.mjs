import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
try{
  await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
  await page.waitForSelector('.modern-home');
  const config=await page.evaluate(()=>window.BQ_CLOUD_CONFIG);
  assert.equal(config.enabled,false,'Cloud sign-in must remain disabled until the BibleQuest Auth redirect URL is allowlisted');
  assert.equal(config.supabaseUrl,'https://zkfmgezvzugchcwppreq.supabase.co','BibleQuest should target the shared Karimen Supabase project');
  assert.match(config.publishableKey,/^sb_publishable_/,'Frontend must use a modern Supabase publishable key');
  assert.equal(config.redirectUrl,'https://11ll11l1l1l.github.io/BibleQuest/');
  const serialized=JSON.stringify(config);
  assert.doesNotMatch(serialized,/service[_-]?role/i,'Browser config must never expose a service-role key');
  assert.doesNotMatch(serialized,/sb_secret_/i,'Browser config must never expose a Supabase secret key');

  await page.locator('[data-modern-hub="together"]').click();
  await page.getByRole('button',{name:/Congregation Roster/}).click();
  await page.waitForSelector('.community-layer:not(.hidden)');
  await page.locator('[data-community-home]').click();
  await page.waitForSelector('[data-bq-cloud-card]');
  const text=await page.locator('[data-bq-cloud-card]').innerText();
  assert.match(text,/BACKEND READY/);
  assert.match(text,/Multi-device accounts/);
  assert.match(text,/trusted score sync/);
  await page.waitForTimeout(300);
  assert.equal(await page.locator('[data-bq-cloud-card]').count(),1,'Cloud card should not duplicate during DOM observation');
  const cloudStatus=await page.evaluate(()=>window.BQCloud.status());
  assert.equal(cloudStatus.enabled,false,'Preconfigured shared backend must not initialize Auth while disabled');
  assert.equal(cloudStatus.signedIn,false);
  assert.equal(await page.locator('script[src*="supabase-js"]').count(),0,'Supabase SDK should stay unloaded until cloud activation');
  console.log('BibleQuest shared-backend disabled-state smoke test passed');
} finally {
  await browser.close();
}
