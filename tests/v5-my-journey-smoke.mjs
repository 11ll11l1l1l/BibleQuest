import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function installHarness(page,{empty=false,locale='en'}={}){
  await page.evaluate(async({empty,locale})=>{
    const [{createMyJourneyService},{myJourneyPage},{localization}]=await Promise.all([
      import('/src/app/my-journey.js'),import('/src/features/my-journey/index.js'),import('/src/app/localization.js')
    ]);
    window.__removeMyJourneyHarness?.();
    localization.setLocale(locale);
    const progress={getState(){return{streak:4,badges:['streak-3'],events:empty?{}:{e1:{type:'reader.chapter.read',date:'2026-09-10',at:'2026-09-10T09:00:00Z',xp:5,meaningful:true},e2:{type:'transform.spiritual.complete',date:'2026-09-11',at:'2026-09-11T09:00:00Z',xp:20,meaningful:true}}}}};
    const assignments={snapshot(){return{assignments:[]}}};
    const myJourney=createMyJourneyService({progress,assignments});
    const root=document.createElement('div');root.id='my-journey-test-root';document.body.append(root);
    const definition=myJourneyPage({myJourney,onBack:()=>{window.__mjBack=true}});root.innerHTML=definition.html;const cleanup=definition.mount(root);
    window.__removeMyJourneyHarness=()=>{cleanup?.();root.remove();delete window.__mjBack;localization.setLocale('en')};
  },{empty,locale});
}

async function showsMomentsEnglish(){
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.goto(BASE,{waitUntil:'networkidle'});
  await installHarness(page,{empty:false,locale:'en'});
  const root=page.locator('#my-journey-test-root');
  await root.locator('[data-my-journey-summary]').waitFor();
  assert(await root.locator('[data-my-journey-day]').count()===2,'Two distinct days of moments must render.');
  assert((await root.locator('[data-my-journey-moment]').first().textContent())?.includes('Completed a Transformation reflection'),'Newest moment did not render with its English label.');
  await root.locator('[data-my-journey-back]').click();
  assert(await page.evaluate(()=>window.__mjBack)===true,'Back button did not invoke onBack.');
  await page.evaluate(()=>window.__removeMyJourneyHarness());
  await page.close();
}

async function showsMomentsTagalog(){
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.goto(BASE,{waitUntil:'networkidle'});
  await installHarness(page,{empty:false,locale:'tl'});
  const root=page.locator('#my-journey-test-root');
  await root.locator('[data-my-journey-summary]').waitFor();
  assert((await root.locator('h1').textContent())==='Aking Paglalakbay','Tagalog locale did not render the Tagalog title.');
  assert((await root.locator('[data-my-journey-moment]').first().textContent())?.includes('Nakumpleto ang isang pagninilay sa Transformation'),'Tagalog moment label did not render.');
  await page.evaluate(()=>window.__removeMyJourneyHarness());
  await page.close();
}

async function showsEmptyState(){
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.goto(BASE,{waitUntil:'networkidle'});
  await installHarness(page,{empty:true});
  const root=page.locator('#my-journey-test-root');
  await root.locator('[data-my-journey-empty]').waitFor();
  assert(await root.locator('[data-my-journey-summary]').count()===0,'Empty state must not also show the summary stats.');
  await page.evaluate(()=>window.__removeMyJourneyHarness());
  await page.close();
}

async function mobile(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto(BASE,{waitUntil:'networkidle'});await installHarness(page,{empty:false});
  const root=page.locator('#my-journey-test-root');await root.locator('[data-my-journey-summary]').waitFor();
  const metrics=await page.evaluate(()=>{const scope=document.querySelector('#my-journey-test-root');const controls=[...scope.querySelectorAll('button')];return{innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...controls.map(node=>node.getBoundingClientRect().height))}});
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`My Journey mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.minTarget>=44,'My Journey mobile control target is below 44px.');
  await page.evaluate(()=>window.__removeMyJourneyHarness());await page.close();
}

try{await showsMomentsEnglish();await showsMomentsTagalog();await showsEmptyState();await mobile();console.log('BibleQuest v5 My Journey browser regression passed.')}finally{await browser.close()}
