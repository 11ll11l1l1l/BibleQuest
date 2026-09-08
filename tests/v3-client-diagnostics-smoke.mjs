import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';const browser=await chromium.launch({headless:true});const assert=(condition,message)=>{if(!condition)throw new Error(message)};
async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE,{waitUntil:'networkidle'});await page.locator('[data-bq-shell="v3"]').waitFor();
  const liveProbe=await page.evaluate(async()=>{const {createApi}=await import('/src/core/api.js');return createApi().diagnostics.probe()});
  assert(liveProbe.reachable===true&&liveProbe.status===200,'API-owned same-origin diagnostic probe failed against the loaded app.');
  await page.evaluate(async()=>{
    const [{createClientDiagnosticsService},{createOperationalRecoveryService},{createRouter},{mountShell}]=await Promise.all([import('/src/core/client-diagnostics.js'),import('/src/app/operational-recovery.js'),import('/src/app/router.js'),import('/src/ui/shell.js')]);
    const root=document.createElement('div');root.dataset.diagnosticsTestRoot='1';document.body.appendChild(root);let reachable=true,now=Date.now(),attempts=0,router,recovery;
    const diagnostics=createClientDiagnosticsService({probe:async()=>({reachable,status:reachable?200:0,reason:reachable?'ok':'failed'}),online:()=>true,clock:()=>now});
    const shell=mountShell(root,{onNavigate:route=>router.navigate(route),onAccountOpen:()=>router.navigate('home')});
    recovery=createOperationalRecoveryService({report:(error,context)=>diagnostics.classify(error,{kind:'module',route:context.route}).then(d=>{if(recovery.getState()?.id===context.id)shell.updateRecoveryDiagnostic(context.id,d)})});
    const pageView=(title,marker)=>({title,html:`<section class="bq-panel" data-diagnostic-view="${marker}"><h1>${title}</h1></section>`});
    const routes={home:()=>pageView('Home','home'),broken:()=>{attempts++;if(attempts===1)throw new Error('private@example.com https://secret.invalid');return pageView('Recovered','recovered')},unreachable:()=>{throw new Error('token ABCDEF0123456789ABCDEF0123456789')},'not-found':()=>pageView('Not found','not-found')};
    const show=f=>shell.renderRecovery(f,{onRetry:()=>recovery.retry(),onHome:()=>recovery.home()});
    router=createRouter({routes,onRoute(route,renderPage){const result=recovery.run({route,operation:()=>shell.render(route,renderPage()),retry:()=>router.navigate(route),home:()=>router.navigate('home')});if(!result.ok)show(result.failure)}});
    window.__bqDiagnosticsHarness={navigate:r=>router.navigate(r),unreachable:()=>{reachable=false;now+=6000},destroy:()=>{root.remove();delete window.__bqDiagnosticsHarness}};router.navigate('broken');
  });
  const scope=page.locator('[data-diagnostics-test-root]');
  await scope.locator('[data-diagnostic-code]',{hasText:'BQ-MOD-001'}).waitFor();
  assert((await scope.textContent())?.includes('BibleQuest host check passed.'),'Reachable module diagnosis did not explain the successful host check.');
  assert(!((await scope.textContent())||'').includes('private@example.com'),'Diagnostic UI exposed arbitrary error data.');
  await scope.locator('[data-recovery-retry]').click();await scope.locator('[data-diagnostic-view="recovered"]').waitFor();
  await page.evaluate(()=>{window.__bqDiagnosticsHarness.unreachable();window.__bqDiagnosticsHarness.navigate('unreachable')});
  await scope.locator('[data-diagnostic-code]',{hasText:'BQ-NET-002'}).waitFor();
  assert((await scope.textContent())?.includes('BibleQuest host check failed.'),'Unreachable diagnosis did not explain the failed host check.');
  const metrics=await scope.evaluate(root=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,shells:root.querySelectorAll('[data-bq-shell="v3"]').length,targets:[...root.querySelectorAll('.bq-recovery-actions button')].map(n=>n.getBoundingClientRect().height)}));
  assert(metrics.shells===1&&metrics.scrollWidth<=metrics.innerWidth+1,'Client diagnostics recovery must preserve one non-overflowing mobile shell.');
  assert(metrics.targets.length===2&&metrics.targets.every(h=>h>=44),`Client diagnostics recovery controls are not touch-safe: ${metrics.targets.join(', ')}`);
  await scope.locator('[data-recovery-home]').click();await scope.locator('[data-diagnostic-view="home"]').waitFor();await page.evaluate(()=>window.__bqDiagnosticsHarness.destroy());
  assert(errors.length===0,`Unexpected client diagnostics console/page errors: ${errors.join(' | ')}`);await page.close();
}
try{await run();console.log('BibleQuest v3 client diagnostics browser regression passed.')}finally{await browser.close()}
