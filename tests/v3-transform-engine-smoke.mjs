import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
try{
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.goto(BASE,{waitUntil:'networkidle'});
  const first=await page.evaluate(async()=>{
    localStorage.removeItem('biblequest.v3.transform-state');
    const [{createTransformEngine},{storage},{SPIRITUAL_ITEMS,PERSONALITY_ITEMS,BIAS_TASKS}]=await Promise.all([import('/src/engines/transform.js'),import('/src/core/storage.js'),import('/src/features/transform/content.js')]);
    const engine=createTransformEngine({storage,clock:()=>new Date('2026-09-06T09:30:00Z')});
    for(const item of SPIRITUAL_ITEMS)engine.setSpiritualAnswer(item.id,item.id==='word'?1:5);
    engine.calculateSpiritual();
    for(const item of PERSONALITY_ITEMS)engine.setPersonalityAnswer(item.id,item.key===1?5:1);
    engine.calculatePersonality();
    for(const task of BIAS_TASKS)engine.setBiasAnswer(task.id,task.best);
    engine.calculateBias();
    engine.saveReflection({practice:'One concrete experiment',noticed:'A pattern',action:'A next action',prayer:'A prayer'});
    const state=engine.getState();
    return {frozen:Object.isFrozen(state)&&Object.isFrozen(state.personality.result.scores),focus:state.spiritual.result.focus.map(x=>x.dimension),e:state.personality.result.scores.E,helpful:state.bias.result.helpful,reflection:state.reflection,global:Boolean(window.BQ_TRANSFORMATION),rootCount:document.querySelectorAll('.bq-transform-v2').length};
  });
  assert(first.frozen,'Browser Transform snapshot is not deeply frozen.');
  assert(first.focus[0]==='Scripture','Browser spiritual scoring/focus failed.');
  assert(first.e.mean===5&&first.helpful===5,'Browser personality/bias scoring failed.');
  assert(first.reflection.action==='A next action','Browser Transform reflection did not persist.');
  assert(!first.global&&first.rootCount===0,'Transform engine reintroduced old global/modal runtime behavior.');
  await page.reload({waitUntil:'networkidle'});
  const resumed=await page.evaluate(async()=>{const[{createTransformEngine},{storage}]=await Promise.all([import('/src/engines/transform.js'),import('/src/core/storage.js')]);const state=createTransformEngine({storage}).getState();return{spiritual:Boolean(state.spiritual.result),personality:state.personality.result?.scores?.E?.mean,bias:state.bias.result?.helpful,action:state.reflection.action,history:state.history.length}});
  assert(resumed.spiritual&&resumed.personality===5&&resumed.bias===5&&resumed.action==='A next action','Transform engine did not resume persisted browser state.');
  assert(resumed.history<=10,'Transform browser history cap failed.');
  await page.close();
  console.log('BibleQuest v3 Transform engine browser regression passed.');
}finally{await browser.close()}
