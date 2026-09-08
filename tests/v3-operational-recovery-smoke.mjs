import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.locator('[data-bq-shell="v3"]').waitFor();
  await page.evaluate(async()=>{
    const [{createOperationalRecoveryService},{createRouter},{mountShell}]=await Promise.all([
      import('/src/app/operational-recovery.js'),import('/src/app/router.js'),import('/src/ui/shell.js')
    ]);
    const root=document.createElement('div');root.dataset.recoveryTestRoot='1';document.body.appendChild(root);
    const reports=[];let brokenAttempts=0;let router;
    const recovery=createOperationalRecoveryService({report:(error,context)=>reports.push({message:error.message,context})});
    const shell=mountShell(root,{onNavigate:route=>router.navigate(route),onAccountOpen:()=>router.navigate('home')});
    const pageView=(title,marker,mount)=>({title,html:`<section class="bq-panel" ${marker?`data-test-view="${marker}"`:''}><h1>${title}</h1></section>`,mount});
    const routes={
      home:()=>pageView('Recovery Test Home','home'),
      broken:()=>{brokenAttempts++;if(brokenAttempts===1)throw new Error('render technical detail');return pageView('Recovered feature','recovered')},
      'mount-failure':()=>pageView('Mount failure','mount',()=>{throw new Error('mount technical detail')}),
      cleanup:()=>pageView('Cleanup source','cleanup',()=>()=>{throw new Error('cleanup technical detail')}),
      'not-found':()=>pageView('Not found','not-found')
    };
    const show=failure=>shell.renderRecovery(failure,{onRetry:()=>recovery.retry(),onHome:()=>recovery.home()});
    router=createRouter({routes,onRoute(route,renderPage){const result=recovery.run({route,operation:()=>shell.render(route,renderPage()),retry:()=>router.navigate(route),home:()=>router.navigate('home')});if(!result.ok)show(result.failure)}});
    window.__bqRecoveryHarness={navigate:route=>router.navigate(route),reports,destroy:()=>{root.remove();delete window.__bqRecoveryHarness}};
    router.navigate('broken');
  });

  const scope=page.locator('[data-recovery-test-root]');
  await scope.locator('[data-recovery-route="broken"]').waitFor();
  assert(await scope.locator('[data-bq-shell="v3"]').count()===1,'Feature render failure destroyed or duplicated the test shell.');
  assert(await scope.locator('.bq-nav').count()===1,'Primary navigation must remain mounted during recovery.');
  assert(!((await scope.textContent())||'').includes('render technical detail'),'Recovery UI exposed arbitrary technical error text.');
  await scope.locator('[data-recovery-retry]').click();
  await scope.locator('[data-test-view="recovered"]').waitFor();

  await page.evaluate(()=>window.__bqRecoveryHarness.navigate('mount-failure'));
  await scope.locator('[data-recovery-route="mount-failure"]').waitFor();
  await scope.locator('[data-recovery-home]').click();
  await scope.locator('[data-test-view="home"]').waitFor();

  await page.evaluate(()=>window.__bqRecoveryHarness.navigate('cleanup'));
  await scope.locator('[data-test-view="cleanup"]').waitFor();
  await page.evaluate(()=>window.__bqRecoveryHarness.navigate('home'));
  await scope.locator('[data-recovery-route="home"]').waitFor();
  await scope.locator('[data-recovery-retry]').click();
  await scope.locator('[data-test-view="home"]').waitFor();

  await page.evaluate(()=>window.__bqRecoveryHarness.navigate('mount-failure'));
  await scope.locator('[data-recovery-route="mount-failure"]').waitFor();
  const metrics=await scope.evaluate(root=>({
    innerWidth,
    scrollWidth:document.documentElement.scrollWidth,
    shell:root.querySelectorAll('[data-bq-shell="v3"]').length,
    alert:root.querySelectorAll('[role="alert"]').length,
    targets:[...root.querySelectorAll('.bq-recovery-actions button')].map(node=>node.getBoundingClientRect().height)
  }));
  assert(metrics.shell===1&&metrics.alert===1,'Recovery must keep one shell and one alert presentation.');
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Operational recovery mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.targets.length===2&&metrics.targets.every(height=>height>=44),`Operational recovery controls must be touch-safe: ${metrics.targets.join(', ')}.`);
  const reportCount=await page.evaluate(()=>window.__bqRecoveryHarness.reports.length);
  assert(reportCount===4,`Expected four contained failures, received ${reportCount}.`);
  await page.evaluate(()=>window.__bqRecoveryHarness.destroy());
  assert(errors.length===0,`Unexpected operational recovery console/page errors: ${errors.join(' | ')}`);
  await page.close();
}

try{await run();console.log('BibleQuest v3 operational recovery browser regression passed.')}finally{await browser.close()}
