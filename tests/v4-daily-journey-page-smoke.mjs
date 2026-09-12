import {chromium} from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(ok,message)=>{if(!ok)throw new Error(message)};

try{
  const page=await browser.newPage({viewport:{width:320,height:760},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});

  const result=await page.evaluate(async()=>{
    const {dailyMissionPage}=await import(`/src/features/daily-mission/index.js?v4accept=${Date.now()}`);
    const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    const passage={book:'Matthew',code:'MAT',chapter:5,from:14,to:16,title:'Salt and light'};
    const makeSnapshot=({stepId='retrieve',type='text',answered=false,index=0}={})=>({
      dateKey:'2026-09-12',passage,percent:Math.round(index/5*100),
      state:{status:'active',index,totalSteps:5,responses:answered?{[stepId]:type==='text'?'Saved response':true}:{},feedback:{},currentStep:{id:stepId,type,prompt:`${stepId} prompt`,maxLength:500,choices:type==='choice'?['One','Two']:undefined}}
    });
    const makeMission=({snapshot=makeSnapshot(),openError='',respondError='',advanceError='',readerError=''}={})=>({
      open(){if(openError)throw new Error(openError);return structuredClone(snapshot)},
      respond(){if(respondError)throw new Error(respondError);return structuredClone(snapshot)},
      advance(){if(advanceError)throw new Error(advanceError);return structuredClone(snapshot)},
      prepareReader(){if(readerError)throw new Error(readerError)},
      close(){}
    });
    const mount=async mission=>{
      let readerCalls=0,homeCalls=0;
      const host=document.createElement('div');
      host.style.width='100%';
      const def=dailyMissionPage({mission,onReader:()=>readerCalls++,onHome:()=>homeCalls++});
      host.innerHTML=def.html;
      document.body.appendChild(host);
      const dispose=def.mount(host);
      await sleep(20);
      return{host,readerCalls:()=>readerCalls,homeCalls:()=>homeCalls,dispose:()=>{dispose?.();host.remove()}};
    };

    const rawOpen='postgres lesson_sessions token=OPEN_SECRET';
    let mounted=await mount(makeMission({openError:rawOpen}));
    const openText=mounted.host.textContent||'';
    mounted.dispose();

    const rawSave='progress-state write failed key=SAVE_SECRET';
    mounted=await mount(makeMission({respondError:rawSave}));
    const textarea=mounted.host.querySelector('textarea');
    if(textarea)textarea.value='My response';
    mounted.host.querySelector('[data-daily-text-form]')?.requestSubmit();
    await sleep(20);
    const saveText=mounted.host.textContent||'';
    const mobileMetrics={
      pageWidth:mounted.host.querySelector('[data-daily-page]')?.getBoundingClientRect().width||0,
      pageScrollWidth:mounted.host.querySelector('[data-daily-page]')?.scrollWidth||0,
      stepColumns:getComputedStyle(mounted.host.querySelector('.bq-daily-steps')).gridTemplateColumns,
      minButton:Math.min(...[...mounted.host.querySelectorAll('button')].map(node=>node.getBoundingClientRect().height))
    };
    mounted.dispose();

    const rawAdvance='lesson advance internal=ADVANCE_SECRET';
    mounted=await mount(makeMission({snapshot:makeSnapshot({answered:true}),advanceError:rawAdvance}));
    mounted.host.querySelector('[data-daily-next]')?.click();
    await sleep(20);
    const advanceText=mounted.host.textContent||'';
    mounted.dispose();

    const rawReader='reader route secret=READER_SECRET';
    mounted=await mount(makeMission({snapshot:makeSnapshot({stepId:'context',type:'confirm',index:1}),readerError:rawReader}));
    mounted.host.querySelector('[data-daily-open-reader]')?.click();
    await sleep(20);
    const readerText=mounted.host.textContent||'';
    const readerCalls=mounted.readerCalls();
    mounted.dispose();

    return{rawOpen,rawSave,rawAdvance,rawReader,openText,saveText,advanceText,readerText,readerCalls,mobileMetrics};
  });

  assert(result.openText.includes('Could not open today’s journey.')&&!result.openText.includes(result.rawOpen),'Daily Journey open failure leaked raw error details.');
  assert(result.saveText.includes('Could not save this step. Retry the action.')&&!result.saveText.includes(result.rawSave),'Daily Journey save failure leaked raw error details.');
  assert(result.advanceText.includes('Could not continue today’s journey. Retry the action.')&&!result.advanceText.includes(result.rawAdvance),'Daily Journey advance failure leaked raw error details.');
  assert(result.readerText.includes('Could not open this passage in Reader. Retry the action.')&&!result.readerText.includes(result.rawReader),'Daily Journey Reader failure leaked raw error details.');
  assert(result.readerCalls===0,'Daily Journey must not navigate to Reader when Reader preparation fails.');
  assert(result.mobileMetrics.pageWidth<=320&&result.mobileMetrics.pageScrollWidth<=321,'Daily Journey page must not overflow at 320px.');
  assert(result.mobileMetrics.stepColumns.split(' ').length===1,'Daily Journey step tracker must collapse to one column on a 320px phone.');
  assert(result.mobileMetrics.minButton>=44,'Daily Journey controls must retain at least 44px touch targets.');

  await page.setViewportSize({width:900,height:900});
  const desktop=await page.evaluate(async()=>{
    const {dailyMissionPage}=await import(`/src/features/daily-mission/index.js?v4desktop=${Date.now()}`);
    const snapshot={dateKey:'2026-09-12',passage:{book:'Matthew',code:'MAT',chapter:5,from:14,to:16,title:'Salt and light'},percent:0,state:{status:'active',index:0,totalSteps:5,responses:{},feedback:{},currentStep:{id:'retrieve',type:'text',prompt:'Retrieve prompt',maxLength:500}}};
    const mission={open:()=>structuredClone(snapshot),respond:()=>structuredClone(snapshot),advance:()=>structuredClone(snapshot),prepareReader(){},close(){}};
    const host=document.createElement('div'),def=dailyMissionPage({mission,onReader:()=>{},onHome:()=>{}});
    host.innerHTML=def.html;document.body.appendChild(host);const dispose=def.mount(host);
    const tracker=host.querySelector('.bq-daily-steps');
    const result={columns:getComputedStyle(tracker).gridTemplateColumns,pageWidth:host.querySelector('[data-daily-page]').getBoundingClientRect().width,pageScrollWidth:host.querySelector('[data-daily-page]').scrollWidth};
    dispose?.();host.remove();return result;
  });
  assert(desktop.columns.split(' ').length===5,'Daily Journey step tracker must retain five-column wide composition.');
  assert(desktop.pageScrollWidth<=desktop.pageWidth+1,'Daily Journey page must not overflow at wide layout.');
  assert(errors.length===0,`Unexpected V4 Daily Journey console/page errors: ${errors.join(' | ')}`);
  await page.close();
  console.log('BibleQuest v4 Daily Journey page browser acceptance passed.');
}finally{
  await browser.close();
}
