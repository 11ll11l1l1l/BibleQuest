import{chromium}from'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function completeFull(page){
  await page.locator('[data-transform-mode-full]').click();
  await page.locator('[data-transform-personality-item]').first().waitFor();
  assert(await page.locator('[data-transform-personality-item]').count()===20,'Full Transform must render all 20 personality prompts.');
  assert(await page.locator('[data-transform-bias-item]').count()===5,'Full Transform must render all five thinking-pattern scenarios.');

  const personality=page.locator('[data-transform-personality-rating][data-value="3"]');
  assert(await personality.count()===20,'Full Transform personality rating controls are incomplete.');
  for(let i=0;i<await personality.count();i++)await personality.nth(i).click();
  assert(!(await page.locator('[data-transform-personality-calculate]').isDisabled()),'Personality calculation did not enable after 20 answers.');
  await page.locator('[data-transform-personality-calculate]').click();
  await page.locator('[data-transform-personality-result]').waitFor();
  assert(await page.locator('[data-transform-personality-result] article').count()===5,'Personality result must render all five factors.');

  const bias=page.locator('[data-transform-bias-answer][data-value="1"]');
  assert(await bias.count()===5,'Full Transform thinking-pattern controls are incomplete.');
  for(let i=0;i<await bias.count();i++)await bias.nth(i).click();
  assert(!(await page.locator('[data-transform-bias-calculate]').isDisabled()),'Thinking-pattern calculation did not enable after five answers.');
  await page.locator('[data-transform-bias-calculate]').click();
  await page.locator('[data-transform-bias-result]').waitFor();
  await page.locator('[data-progress-xp]',{hasText:'35 XP'}).waitFor();
  assert((await page.locator('[data-transform-bias-result]').textContent()).includes('5/5 bias-resistant responses'),'Thinking-pattern result did not reflect the five selected best responses.');
  assert(await page.locator('[data-transform-recommendations] article').count()>=1,'Full Transform recommendations were not rendered.');
}

async function desktop(){
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  let supabase=0;
  page.on('request',request=>{if(request.url().includes('supabase.co'))supabase++});
  await page.goto(`${BASE}#/transform`,{waitUntil:'networkidle'});
  await page.locator('[data-transform-item]').first().waitFor();
  assert(await page.locator('[data-transform-item]').count()===12,'Basic Transform contract changed before Full mode is opened.');

  await completeFull(page);
  const fullText=await page.locator('[data-transform-page]').textContent();
  assert(fullText.includes('Full Transform complete'),'Full Transform did not reach its completed state.');

  await page.locator('[data-transform-reflection-practice]').fill('Pause before reacting');
  await page.locator('[data-transform-reflection-noticed]').fill('I decide better after naming the pattern.');
  await page.locator('[data-transform-reflection-action]').fill('Ask one disconfirming question this week.');
  await page.locator('[data-transform-reflection-prayer]').fill('Give me wisdom and humility.');
  await page.locator('[data-transform-reflection-save]').click();
  await page.locator('[data-transform-history-item]').first().waitFor();
  assert((await page.locator('[data-transform-history]').textContent()).includes('Ask one disconfirming question this week.'),'Full Transform reflection was not added to history.');

  await page.reload({waitUntil:'networkidle'});
  await page.locator('[data-transform-item]').first().waitFor();
  await page.locator('[data-transform-mode-full]').click();
  await page.locator('[data-transform-personality-result]').waitFor();
  await page.locator('[data-transform-bias-result]').waitFor();
  assert((await page.locator('[data-progress-xp]').textContent()).trim()==='35 XP','Full Transform reload lost or duplicated XP.');
  assert((await page.locator('[data-transform-reflection-action]').inputValue())==='Ask one disconfirming question this week.','Full Transform journal did not persist across reload.');
  assert((await page.locator('[data-transform-history]').textContent()).includes('Ask one disconfirming question this week.'),'Full Transform history did not persist across reload.');

  await page.locator('[data-transform-personality-rating="E1"][data-value="4"]').click();
  assert(await page.locator('[data-transform-personality-result]').count()===0,'Editing a personality answer must invalidate the old personality result.');
  assert((await page.locator('[data-transform-page]').textContent()).includes('Full Transform in progress'),'Editing a completed Full Transform section did not return the workflow to in-progress state.');
  await page.locator('[data-transform-personality-calculate]').click();
  await page.locator('[data-transform-personality-result]').waitFor();
  assert((await page.locator('[data-progress-xp]').textContent()).trim()==='35 XP','Full Transform recalculation farmed XP.');

  await page.locator('[data-transform-mode-basic]').click();
  await page.locator('[data-transform-item]').first().waitFor();
  assert(await page.locator('[data-transform-item]').count()===12,'Returning from Full mode did not restore the 12-item Basic Transform workflow.');
  assert(supabase===0,'Guest Full Transform must not contact Supabase.');
  await page.close();
}

async function mobile(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto(`${BASE}#/transform`,{waitUntil:'networkidle'});
  await page.locator('[data-transform-mode-full]').click();
  await page.locator('[data-transform-personality-item]').first().waitFor();
  const metrics=await page.evaluate(()=>{
    const controls=[...document.querySelectorAll('[data-transform-personality-rating], [data-transform-bias-answer]')];
    return{innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...controls.map(node=>node.getBoundingClientRect().height))};
  });
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Full Transform mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.minTarget>=44,'Full Transform mobile response target is below 44px.');
  await page.close();
}

try{
  await desktop();
  await mobile();
  console.log('BibleQuest v3 Full Transform browser regression passed.');
}finally{
  await browser.close();
}
