import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const browser=await chromium.launch({headless:true});

async function mountedPage({pending=false}={}){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.evaluate(async({pending})=>{
    document.body.innerHTML='<main id="reset-test-root" class="bq-main bq-reset-shell"></main>';
    const [{createResetRecoveryService},{resetRecoveryPage}]=await Promise.all([
      import('./src/app/reset-recovery.js'),
      import('./src/features/reset-recovery/index.js')
    ]);
    window.__resetCalls=[];window.__cancelCount=0;window.__homeCount=0;window.__releaseReset=null;
    const account={resetPassword:async input=>{
      window.__resetCalls.push({...input});
      if(input.recoveryCode==='BAD')throw new Error('Recovery code is invalid or expired.');
      if(pending)await new Promise(resolve=>{window.__releaseReset=resolve});
      return {ok:true,recovery_code:'BQ-REPLACEMENT-123'};
    }};
    const recovery=createResetRecoveryService({account});
    window.__recovery=recovery;
    const root=document.getElementById('reset-test-root');
    const def=resetRecoveryPage({recovery,onCancel:()=>{window.__cancelCount+=1},onHome:()=>{window.__homeCount+=1}});
    root.innerHTML=def.html;window.__resetCleanup=def.mount(root);
  },{pending});
  await page.locator('[data-reset-recovery-form]').waitFor();
  return page;
}

async function fillForm(page,code='BQ-OLD'){
  await page.locator('input[name="email"]').fill('user@example.test');
  await page.locator('input[name="recovery_code"]').fill(code);
  await page.locator('input[name="new_password"]').fill('password123');
  await page.locator('input[name="confirm_password"]').fill('password123');
}

try{
  const standalone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await standalone.goto(`${BASE}reset.html`,{waitUntil:'networkidle'});
  await standalone.getByRole('heading',{name:'Recover your account'}).waitFor();
  assert(await standalone.locator('script[src="reset.js"]').count()===0,'v3 Reset Recovery must not load legacy reset.js.');
  assert(await standalone.locator('script[src="cloud-config.js"]').count()===0,'v3 Reset Recovery must not load legacy cloud-config.js.');
  assert(await standalone.locator('script[src*="supabase-js"]').count()===0,'v3 Reset Recovery must not load a second global Supabase runtime.');
  assert(await standalone.locator('script[type="module"][src="src/app/reset-entry.js"]').count()===1,'v3 Reset Recovery must boot one module entry.');
  const metrics=await standalone.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minButton:Math.min(...[...document.querySelectorAll('button')].map(node=>node.getBoundingClientRect().height))}));
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Reset Recovery mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.minButton>=44,`Reset Recovery touch target is below 44px: ${metrics.minButton}px.`);
  await standalone.close();

  const retry=await mountedPage();
  await fillForm(retry,'BAD');
  await retry.locator('[data-reset-submit]').click();
  await retry.getByText('Recovery code is invalid or expired.').waitFor();
  assert(await retry.locator('[data-reset-submit]').isEnabled(),'Invalid recovery must leave the form retryable.');
  assert(await retry.locator('input[name="email"]').inputValue()==='user@example.test','Invalid recovery should not erase the retry form.');
  await retry.locator('input[name="recovery_code"]').fill('BQ-OLD');
  await retry.locator('[data-reset-submit]').click();
  await retry.locator('[data-reset-recovery-code]').waitFor();
  assert((await retry.locator('[data-reset-recovery-code]').textContent())==='BQ-REPLACEMENT-123','Replacement recovery code was not rendered.');
  assert(await retry.locator('[data-reset-finish]').isDisabled(),'Return must stay disabled until the replacement code is acknowledged.');
  await retry.locator('[data-reset-saved]').check();
  assert(await retry.locator('[data-reset-finish]').isEnabled(),'Saved-code acknowledgement did not enable return.');
  await retry.locator('[data-reset-finish]').click();
  assert(await retry.evaluate(()=>window.__homeCount)===1,'Successful recovery did not hand off to the return path.');
  const calls=await retry.evaluate(()=>window.__resetCalls);
  assert(calls.length===2,'Retry path must issue exactly one Account call per submit.');
  assert(!JSON.stringify(await retry.evaluate(()=>window.__recovery.getState())).includes('password123'),'Reset state leaked the submitted password.');
  await retry.close();

  const cancelled=await mountedPage();
  await cancelled.locator('[data-reset-cancel]').click();
  assert(await cancelled.evaluate(()=>window.__cancelCount)===1,'Cancel did not hand off to the cancellation route.');
  assert((await cancelled.evaluate(()=>window.__resetCalls.length))===0,'Pre-submit cancellation must not send a reset request.');
  await cancelled.close();

  const inFlight=await mountedPage({pending:true});
  await fillForm(inFlight,'BQ-PENDING');
  await inFlight.locator('[data-reset-submit]').click();
  await inFlight.waitForFunction(()=>window.__recovery.getState().status==='submitting');
  assert(await inFlight.locator('[data-reset-cancel]').isDisabled(),'Cancel must be disabled after a reset transaction has been sent.');
  assert((await inFlight.evaluate(()=>window.__cancelCount))===0,'Submitting state must not claim cancellation.');
  await inFlight.evaluate(()=>window.__releaseReset?.());
  await inFlight.locator('[data-reset-recovery-code]').waitFor();
  await inFlight.close();

  console.log('BibleQuest v3 Reset Recovery standalone/mobile regression passed.');
}finally{await browser.close()}
