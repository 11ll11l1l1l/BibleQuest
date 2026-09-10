import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
const page=await context.newPage();
const errors=[];
page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
page.on('pageerror',error=>errors.push(error.message));

try{
  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.locator('[data-bq-shell="v3"]').waitFor({timeout:10000});
  const launcher=page.locator('[data-report-open]');
  await launcher.waitFor({state:'visible',timeout:5000});
  await launcher.click();
  await page.locator('[data-report-layer]').waitFor({state:'visible',timeout:5000});
  await page.getByText('Sign in to BibleQuest before submitting a report.').waitFor({timeout:5000});
  assert(await page.locator('[data-report-account]').isVisible(),'Signed-out reporting did not expose the explicit account recovery action.');
  await page.locator('.bq-report-close').click();

  await page.locator('[data-route-link="learn"]').click();
  await launcher.waitFor({state:'visible',timeout:5000});
  await page.goto(`${BASE}#/reader`,{waitUntil:'networkidle'});
  await page.locator('[data-reader-page]').waitFor({timeout:10000});
  assert(await launcher.isHidden(),'Reader must retain the recovered reporting exclusion.');
  await page.goto(`${BASE}#/transform`,{waitUntil:'networkidle'});
  await page.locator('[data-transform-page]').waitFor({timeout:10000});
  assert(await launcher.isHidden(),'Transform must retain the recovered reporting exclusion.');

  await page.goto(`${BASE}#/learn`,{waitUntil:'networkidle'});
  await page.locator('[data-report-open]').waitFor({state:'visible',timeout:5000});
  await page.evaluate(async()=>{
    document.querySelector('[data-content-reporting-root]')?.remove();
    const module=await import('./src/ui/content-reporting.js');
    globalThis.__reportSubmitted=[];
    globalThis.__reportRuntime=module.mountContentReportingRuntime({
      reporting:{
        async prepare(){return {congregations:[{id:'cong-a',name:'Alpha Church'},{id:'cong-b',name:'Beta Church'}],reasons:['doctrinal','accuracy','wording','inappropriate','duplicate','source','other']};},
        async submit(payload){globalThis.__reportSubmitted.push(JSON.parse(JSON.stringify(payload)));if(payload.reason==='accuracy')throw new Error('Simulated report failure.');return {id:'report-42'};}
      },
      getRoute:()=> 'learn'
    });
  });

  await page.locator('[data-report-open]').click();
  await page.locator('[data-report-form]').waitFor({timeout:5000});
  await page.locator('select[name="congregation"]').selectOption('cong-b');
  await page.locator('select[name="reason"]').selectOption('doctrinal');
  await page.locator('textarea[name="note"]').fill('Please review this wording.');
  await page.locator('[data-report-submit]').click();
  await page.getByText('Report sent. Your congregation leaders can review this content.').waitFor({timeout:5000});
  const sent=await page.evaluate(()=>globalThis.__reportSubmitted[0]);
  assert(sent.congregationId==='cong-b'&&sent.reason==='doctrinal','Report UI did not forward the selected congregation/reason.');
  assert(sent.note==='Please review this wording.','Report UI did not forward the bounded optional note.');
  assert(sent.context?.contentText&&!JSON.stringify(sent.context).includes('Please review this wording.'),'Report snapshot must be independent from the user-entered report note.');

  await page.locator('.bq-report-close').click();
  await page.locator('[data-report-open]').click();
  await page.locator('[data-report-form]').waitFor({timeout:5000});
  await page.locator('select[name="reason"]').selectOption('accuracy');
  await page.locator('[data-report-submit]').click();
  await page.getByText('Simulated report failure.').waitFor({timeout:5000});
  assert(!(await page.locator('[data-report-submit]').isDisabled()),'Failed report submission must re-enable retry.');

  const privacy=await page.evaluate(async()=>{
    const module=await import('./src/ui/content-reporting.js');
    const view=document.querySelector('#bq-view');
    view.innerHTML='<section><h1>Safe learning page</h1><article><div class="lesson-question">What happened in this passage?</div><form><textarea>PRIVATE SECRET RESPONSE</textarea></form><div class="private-note">PRIVATE NOTE TEXT</div></article></section>';
    return module.snapshotReportableContent({route:'learn'});
  });
  assert(privacy.contentText.includes('What happened in this passage?'),'Report snapshot did not select reportable learning content.');
  assert(!JSON.stringify(privacy).includes('PRIVATE SECRET')&&!JSON.stringify(privacy).includes('PRIVATE NOTE'),'Report snapshot leaked private form/note content.');

  const size=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth}));
  assert(size.scrollWidth<=size.innerWidth+1,'Content Reporting caused horizontal overflow at 390px.');
  assert(errors.length===0,`Unexpected Content Reporting console/page errors: ${errors.join(' | ')}`);
  console.log('BibleQuest v3 Content Reporting mobile success/error/privacy regression passed.');
}finally{
  await browser.close();
}
