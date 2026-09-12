import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(ok,message)=>{if(!ok)throw new Error(message)};

async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});

  const result=await page.evaluate(async()=>{
    const [{createBibleDataService},{createReaderService},{readerPage}]=await Promise.all([
      import(`/src/core/bible.js?cebocbSmoke=${Date.now()}`),
      import(`/src/app/reader.js?cebocbSmoke=${Date.now()}`),
      import(`/src/features/reader/index.js?cebocbSmoke=${Date.now()}`)
    ]);
    let saved=null;
    const storage={read:(_key,fallback)=>saved?structuredClone(saved):fallback,write:(_key,value)=>{saved=structuredClone(value);return value}};
    const progress={record:()=>({date:'2026-09-12',awardedXp:10})};
    const bible=createBibleDataService();
    const reader=createReaderService({bible,storage,progress});
    reader.setTranslation('cebocb');reader.setBook('GEN',1);

    const host=document.createElement('main');host.dataset.cebocbSmoke='true';document.body.appendChild(host);
    const definition=readerPage({reader});host.innerHTML=definition.html;const dispose=definition.mount(host);
    const waitFor=async predicate=>{for(let i=0;i<80;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,25))}throw new Error('Timed out waiting for CEBOCB Reader UI.')};
    await waitFor(()=>host.querySelector('[data-reader-translation]')&&host.querySelector('[data-verse="17"]'));

    const translationSelect=host.querySelector('[data-reader-translation]');
    const selectedLabel=translationSelect?.selectedOptions?.[0]?.textContent?.trim()||'';
    const optionLabels=[...translationSelect.options].map(option=>option.textContent.trim());
    const bridgeRow=host.querySelector('[data-verse="17"]');
    const bridgeLabel=bridgeRow?.querySelector('span')?.textContent?.trim()||'';
    const bridgeText=bridgeRow?.querySelector('[data-reader-verse-text]')?.textContent?.trim()||'';
    const duplicate18=Boolean(host.querySelector('[data-verse="18"]'));
    const sourceText=host.querySelector('.bq-reader-source')?.textContent||'';

    bridgeRow?.click();
    await waitFor(()=>host.querySelector('[data-verse-dialog]')?.open===true);
    const peekReference=host.querySelector('[data-verse-dialog-body] h2')?.textContent?.trim()||'';
    const peekText=host.querySelector('.bq-peek-text')?.textContent?.trim()||'';
    host.querySelector('[data-verse-close]')?.click();

    const form=host.querySelector('[data-reader-search]');
    const input=form?.querySelector('input[name="query"]');
    input.value='Genesis 1:18';form.requestSubmit();
    await waitFor(()=>host.querySelector('.bq-search-results [data-search-result]'));
    const searchReference=host.querySelector('.bq-search-results [data-search-result] b')?.textContent?.trim()||'';
    const searchText=host.querySelector('.bq-search-results [data-search-result] span')?.textContent?.trim()||'';

    const metrics={innerWidth,htmlScrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body.scrollWidth};
    dispose?.();host.remove();
    return{selectedLabel,optionLabels,bridgeLabel,bridgeText,duplicate18,sourceText,peekReference,peekText,searchReference,searchText,metrics};
  });

  assert(result.selectedLabel==='Cebuano/Bisaya · OCCB',`Unexpected selected CEBOCB label: ${result.selectedLabel}`);
  assert(result.optionLabels.includes('Cebuano/Bisaya · OCCB'),'Translation selector must expose Cebuano/Bisaya clearly.');
  assert(result.bridgeLabel==='17–18',`Genesis source bridge must render once as 17–18, got ${result.bridgeLabel}.`);
  assert(result.duplicate18===false,'Genesis 1:17–18 bridge must not be duplicated as a second verse-18 row.');
  assert(result.bridgeText.length>20,'CEBOCB bridge text did not render.');
  assert(result.peekReference==='Genesis 1:17–18','Verse peek must preserve the source bridge range.');
  assert(result.peekText===result.bridgeText,'Verse peek must show exactly the same bridge text as the chapter row.');
  assert(result.searchReference==='Genesis 1:17–18','Searching the second verse address in a bridge must return the bridge range.');
  assert(result.searchText===result.bridgeText,'Reference search must return the same unduplicated source bridge text.');
  assert(result.sourceText.includes('CC BY-SA 4.0')&&result.sourceText.includes('Biblica'),'Reader source panel must expose CEBOCB license/source metadata.');
  assert(result.metrics.innerWidth===390,'CEBOCB Reader smoke must execute at 390px.');
  assert(result.metrics.htmlScrollWidth<=391&&result.metrics.bodyScrollWidth<=391,`CEBOCB Reader caused horizontal overflow: html=${result.metrics.htmlScrollWidth}, body=${result.metrics.bodyScrollWidth}.`);
  assert(errors.length===0,`Unexpected CEBOCB Reader console/page errors: ${errors.join(' | ')}`);
  await page.close();
}

try{await run();console.log('BibleQuest V4 CEBOCB Reader/bridge mobile smoke passed.')}finally{await browser.close()}
