import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const browser=await chromium.launch({headless:true});

async function mountedWorkbench(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.evaluate(async()=>{
    document.body.innerHTML='<main id="review-test-root"></main>';
    const {contentReviewPage}=await import('./src/features/content-review/index.js');
    const root=document.getElementById('review-test-root');
    let state={
      status:'ready',
      scopes:Object.freeze([{id:'c1',name:'First Church',role:'leader',roleLabel:'Leader',source:'membership'}]),
      congregationId:'c1',congregationName:'First Church',platformRole:'',
      books:Object.freeze([{code:'RUT',name:'Ruth',quarantinedQuestions:1}]),selectedBook:'',quarantine:Object.freeze([]),reports:Object.freeze([]),decisionCount:0,busy:false,error:'',warning:''
    };
    let reports=[{id:'7',congregationId:'c1',reporterId:'member-1',contentKey:'v3:study:item-1',contentType:'question',contentSource:'v3-screen',contentRef:'John 3:16',contentText:'Reported wording',contentPayload:{answer:'Captured answer'},reason:'accuracy',note:'Please verify.',status:'open',reporter:{userId:'member-1',displayName:'Mina',role:'member'},decision:null}];
    const cloneState=()=>Object.freeze({...state});
    window.__reviewCalls=[];
    const review={
      async refresh(){return cloneState()},
      async selectCongregation(id){state={...state,congregationId:String(id),congregationName:'First Church'};return cloneState()},
      async openQuarantine(code){state={...state,selectedBook:String(code),quarantine:Object.freeze([{id:'q1',contentKey:'question:RUT:q1',contentType:'question',origin:'quarantine',reference:'1:1',question:'Why did Naomi leave?',answer:'Because of famine.',safety:{action:'quarantine',topics:['context']},decision:null}])};return cloneState()},
      reportItems(){return Object.freeze(reports.map(row=>Object.freeze({...row})))},
      async decide(input){window.__reviewCalls.push(structuredClone(input));if(input.contentKey==='v3:study:item-1')throw new Error('RLS denied review');const decision={contentKey:input.contentKey,decision:input.decision,rationale:input.rationale||''};state={...state,quarantine:Object.freeze(state.quarantine.map(item=>item.contentKey===input.contentKey?Object.freeze({...item,decision}):item))};return {saved:true,partial:false,decision,state:cloneState()}},
      getState(){return cloneState()},
      clear(){state={...state,status:'idle'};return cloneState()}
    };
    const def=contentReviewPage({review,onBack:()=>{},onAccount:()=>{},onCongregation:()=>{}});root.innerHTML=def.html;window.__reviewCleanup=def.mount(root);
  });
  await page.locator('[data-content-review-item="question:RUT:q1"]').waitFor();
  return page;
}

try{
  const page=await mountedWorkbench();
  assert((await page.locator('h1').first().textContent())==='Content Review','Content Review heading did not render.');
  assert(await page.locator('[data-content-review-book]').inputValue()==='RUT','Quarantine book did not initialize through the service owner.');
  assert((await page.locator('[data-content-review-item="question:RUT:q1"]').textContent())?.includes('Because of famine.'),'Quarantine reference answer is missing.');

  await page.locator('[data-content-review-rationale="question:RUT:q1"]').fill('Context checked.');
  await page.locator('[data-content-review-decide="include"][data-content-key="question:RUT:q1"]').click();
  await page.locator('[data-content-review-message]').waitFor();
  assert((await page.locator('[data-content-review-message]').textContent())==='Decision saved.','Successful reviewer decision did not expose a visible confirmation.');
  const calls=await page.evaluate(()=>window.__reviewCalls);
  assert(calls.length===1&&calls[0].decision==='include'&&calls[0].rationale==='Context checked.','UI did not hand the exact decision/rationale to the Content Review owner.');
  assert(await page.locator('[data-content-review-item="question:RUT:q1"]').count()===0,'Included item must leave the default Pending filter after save.');
  await page.locator('[data-content-review-filter]').selectOption('include');
  await page.locator('[data-content-review-item="question:RUT:q1"]').waitFor();
  assert(await page.locator('[data-content-review-item="question:RUT:q1"]').getAttribute('data-content-review-state')==='include','Included filter did not expose the saved decision state without reload.');

  await page.locator('[data-content-review-tab="reports"]').click();
  await page.locator('[data-content-review-item="v3:study:item-1"]').waitFor();
  const reportText=await page.locator('[data-content-review-item="v3:study:item-1"]').textContent();
  assert(reportText?.includes('Mina')&&reportText?.includes('accuracy')&&reportText?.includes('Please verify.'),'Member report context is incomplete.');
  await page.locator('[data-content-review-decide="remove"][data-content-key="v3:study:item-1"]').click();
  await page.locator('[data-content-review-message]').waitFor();
  assert((await page.locator('[data-content-review-message]').textContent())==='RLS denied review','Reviewer write failure was not surfaced without reload.');

  await page.locator('[data-content-review-search]').fill('no match');
  await page.locator('text=No review items match this filter.').waitFor();
  await page.locator('[data-content-review-search]').fill('Reported');
  await page.locator('[data-content-review-item="v3:study:item-1"]').waitFor();
  await page.locator('[data-content-review-filter]').selectOption('all');

  const metrics=await page.evaluate(()=>{
    const scope=document.querySelector('[data-content-review-view]');
    const buttons=[...scope.querySelectorAll('button')];
    return {innerWidth,scrollWidth:document.documentElement.scrollWidth,minButton:Math.min(...buttons.map(node=>node.getBoundingClientRect().height))};
  });
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Content Review mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.minButton>=44,`Content Review button touch target is below 44px: ${metrics.minButton}px.`);
  await page.evaluate(()=>window.__reviewCleanup?.());
  await page.close();

  const routed=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await routed.goto(`${BASE}#/more`,{waitUntil:'networkidle'});
  await routed.locator('[data-open-content-review]').waitFor();
  await routed.locator('[data-open-content-review]').click();
  await routed.waitForURL(/#\/content-review$/);
  await routed.locator('[data-content-review-view]').waitFor();
  assert((await routed.locator('[data-content-review-view]').textContent())?.includes('Sign in to review content'),'Guest route must fail closed through the Session/Content Review owner.');
  const routedMetrics=await routed.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert(routedMetrics.scrollWidth<=routedMetrics.innerWidth+1,'Routed Content Review guest state overflows at 390px.');
  await routed.close();

  console.log('BibleQuest v3 Content Review browser/mobile regression passed.');
}finally{await browser.close()}
