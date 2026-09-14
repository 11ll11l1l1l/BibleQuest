import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const featureSource=fs.readFileSync(new URL('../src/features/daily-mission/index.js',import.meta.url),'utf8');
const lessonSource=fs.readFileSync(new URL('../src/engines/lesson.js',import.meta.url),'utf8');

assert.match(featureSource,/Write a response before saving this step\./,'Daily Journey must own a clear required-response message');
assert.match(featureSource,/aria-describedby="\$\{RESPONSE_MESSAGE_ID\}"/,'text response must reference the inline validation message');
assert.match(featureSource,/data-daily-message role="alert" aria-live="polite"/,'inline validation must be announced accessibly');
assert.match(featureSource,/addEventListener\('invalid', onInvalid, true\)/,'native required failures must be surfaced through BibleQuest inline validation');
assert.match(featureSource,/if \(!response\) \{\s*showError\(REQUIRED_RESPONSE_MESSAGE, field\)/,'whitespace-only responses must fail explicitly before save');
assert.match(featureSource,/field\.setAttribute\('aria-invalid', 'true'\)/,'invalid response field must expose aria-invalid');
assert.match(lessonSource,/if \(!allowEmpty && !text\) throw new Error\(`\$\{label\} is required\.`\)/,'lesson domain must continue rejecting blank required text');

const base=process.env.BQ_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const pageErrors=[];
page.on('pageerror',error=>pageErrors.push(String(error)));

try{
  await page.goto(`${base}/`,{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{
    const {dailyMissionPage}=await import('/src/features/daily-mission/index.js');
    const calls=[];
    const passage={book:'John',code:'JHN',chapter:15,from:1,to:12,title:'Remain in Christ'};
    const activeState={
      status:'active',index:3,totalSteps:5,
      currentStep:{id:'apply',type:'text',prompt:'Write one concrete action you can take today because of this passage.',reference:'John 15:1–12',maxLength:1200},
      responses:{retrieve:0,context:true,learn:true},feedback:{},score:{answered:3,evaluated:1,correct:1}
    };
    let snapshot={dateKey:'2026-09-14',passage,completedSteps:3,percent:60,state:activeState};
    const mission={
      open(){return snapshot},
      respond(value){
        calls.push(value);
        if(!String(value||'').trim())throw new Error('Lesson response is required.');
        const text=String(value).trim();
        snapshot={
          dateKey:'2026-09-14',passage,completedSteps:4,percent:80,
          state:{...activeState,responses:{...activeState.responses,apply:text},feedback:{apply:{correct:null,message:'Action saved.',reference:'John 15:1–12'}}}
        };
        return snapshot;
      },
      advance(){return snapshot},prepareReader(){},close(){}
    };
    document.body.innerHTML='<main id="bq-luna-daily-root"></main>';
    const root=document.getElementById('bq-luna-daily-root');
    const spec=dailyMissionPage({mission,onReader(){},onHome(){}});
    root.innerHTML=spec.html;
    window.__bqLunaDaily={calls,dispose:spec.mount(root)};
  });

  const field=page.locator('[data-daily-response]');
  const save=page.locator('[data-daily-save]');
  const message=page.locator('[data-daily-message]');

  await save.click();
  assert.equal(await message.textContent(),'Write a response before saving this step.','empty Save must show explicit inline validation');
  assert.equal(await field.getAttribute('aria-invalid'),'true','empty response must mark the field invalid');
  assert.equal(await page.evaluate(()=>document.activeElement?.matches?.('[data-daily-response]')),true,'empty response must return focus to the textarea');
  assert.equal(await page.evaluate(()=>window.__bqLunaDaily.calls.length),0,'empty response must not reach the mission save owner');

  await field.fill('   ');
  await save.click();
  assert.equal(await message.textContent(),'Write a response before saving this step.','whitespace-only Save must show explicit inline validation');
  assert.equal(await page.evaluate(()=>window.__bqLunaDaily.calls.length),0,'whitespace-only response must not be saved');

  await field.fill('  Pray before answering in frustration.  ');
  assert.equal(await message.textContent(),'','valid input must clear the required-response message before submission');
  assert.equal(await field.getAttribute('aria-invalid'),null,'valid input must clear aria-invalid');
  await save.click();

  assert.equal(await page.evaluate(()=>window.__bqLunaDaily.calls.length),1,'valid response must still save exactly once');
  assert.equal(await page.evaluate(()=>window.__bqLunaDaily.calls[0]),'Pray before answering in frustration.','valid response must be trimmed before save');
  assert.equal(await page.locator('[data-daily-next]').isVisible(),true,'successful save must preserve the normal Continue flow');
  assert.equal(await page.locator('[data-daily-response]').inputValue(),'Pray before answering in frustration.','saved answer must render normally');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false,'390px Daily Journey validation must not introduce horizontal overflow');
  assert.deepEqual(pageErrors,[],'Daily Journey validation proof must not emit browser page errors');

  console.log('v5 Luna BQ-002 Daily Journey required validation: PASS');
}finally{
  await browser.close();
}
