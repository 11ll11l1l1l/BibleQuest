import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
try{
  await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
  await page.waitForSelector('.modern-home');
  const config=await page.evaluate(()=>window.BQ_CLOUD_CONFIG);
  assert.equal(config.enabled,false,'Cloud must remain disabled until the dedicated BibleQuest project is provisioned');
  assert.equal(config.publishableKey,'','No key should be present before activation');
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
  assert.equal(cloudStatus.enabled,false);
  assert.equal(cloudStatus.signedIn,false);
  console.log('BibleQuest cloud-ready disabled-state smoke test passed');
} finally {
  await browser.close();
}
