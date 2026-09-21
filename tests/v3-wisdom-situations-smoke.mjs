import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const progressState=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('biblequest.v3.progress-state')||'{"xp":0,"counters":{"quizCorrect":0,"situations":0},"events":{}}'));

async function run(){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await context.addInitScript(()=>{Math.random=()=>0});
  const page=await context.newPage();
  const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));

  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.evaluate(()=>{
    localStorage.removeItem('biblequest.v3.wisdom-situations-cycle-v2');
    localStorage.removeItem('biblequest.v3.lesson-sessions');
    localStorage.setItem('biblequest.v3.locale',JSON.stringify('en'));
  });
  await page.reload({waitUntil:'networkidle'});
  await page.locator('[data-route-link="learn"]').click();await page.waitForURL(/#\/learn$/);await page.locator('[data-open-wisdom-situations]').waitFor();
  await page.locator('[data-open-wisdom-situations]').click();await page.waitForURL(/#\/wisdom-situations$/);await page.locator('[data-wisdom-session="hw01"]').waitFor();

  assert((await page.locator('[data-wisdom-session="hw01"] h1').textContent())?.includes('Confidentiality or protection?'),'Foundation Wisdom scenario hw01 did not open.');
  assert(await page.locator('[data-wisdom-choice]').count()===4,'Wisdom must present four plausible choices.');
  assert((await page.locator('.bq-wisdom-warning').textContent())?.includes('intentionally plausible'),'Wisdom difficulty guardrail must tell users that all four answers are deliberately plausible.');
  assert((await page.locator('.bq-game-topline span').textContent())?.includes('/8'),'Wisdom UI must use the new eight-level difficulty scale.');
  assert((await page.locator('.bq-game-topline span').textContent())?.includes('1/72'),'Wisdom UI must expose full-cycle progress.');

  let metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...[...document.querySelectorAll('[data-wisdom-page] button')].map(node=>node.getBoundingClientRect().height))}));
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Wisdom mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.minTarget>=44,`Wisdom touch target below 44px: ${metrics.minTarget}px.`);

  const before=await progressState(page);
  await page.locator('[data-wisdom-choice="0"]').click();await page.locator('[data-wisdom-complete="hw01"]').waitFor();
  const firstText=await page.locator('[data-wisdom-complete="hw01"]').textContent();
  assert(firstText?.includes('+8 XP'),'First completion of a Wisdom scenario must show +8 XP.');
  assert(await page.locator('.bq-wisdom-rationales article').count()===4,'Wisdom result must explain all four competing options.');
  assert((await page.locator('.bq-wisdom-refs').textContent())?.includes('Proverbs 11:13'),'Wisdom Scripture references are missing.');
  const strongestText=await page.locator('.bq-wisdom-result p').textContent();
  assert(/Strongest supported option: [A-D]/.test(strongestText||''),'Wisdom must reveal the strongest displayed option without assuming a fixed letter.');

  const after=await progressState(page);
  assert((after.xp||0)-(before.xp||0)===8,'First Wisdom completion must award exactly +8 XP.');
  assert((after.counters?.situations||0)-(before.counters?.situations||0)===1,'First Wisdom completion must increment situations once.');

  await page.reload({waitUntil:'networkidle'});
  await page.locator('[data-wisdom-complete="hw01"]').waitFor();
  assert((await page.locator('[data-wisdom-complete="hw01"]').textContent())?.includes('no extra XP'),'Reloaded completed Wisdom case must resume feedback without claiming another XP award.');
  const reloaded=await progressState(page);
  assert(reloaded.xp===after.xp&&reloaded.counters?.situations===after.counters?.situations,'Reloading completed Wisdom case duplicated progress.');

  await page.locator('[data-wisdom-restart]').click();await page.locator('[data-wisdom-session="hw01"]').waitFor();
  await page.locator('[data-wisdom-choice="0"]').click();await page.locator('[data-wisdom-complete="hw01"]').waitFor();
  assert((await page.locator('[data-wisdom-complete="hw01"]').textContent())?.includes('no extra XP'),'Replaying the same Wisdom scenario must not be an XP farm.');
  const replayed=await progressState(page);
  assert(replayed.xp===after.xp&&replayed.counters?.situations===after.counters?.situations,'Replay incorrectly awarded additional Wisdom progress.');

  await page.locator('[data-wisdom-another]').click();await page.locator('[data-wisdom-session="hw02"]').waitFor();
  assert((await page.locator('.bq-game-topline span').textContent())?.includes('2/72'),'Second unseen scenario must advance full-cycle progress.');

  await page.evaluate(()=>localStorage.setItem('biblequest.v3.locale',JSON.stringify('tl')));
  await page.reload({waitUntil:'networkidle'});await page.locator('[data-wisdom-session="hw02"]').waitFor();
  assert((await page.locator('[data-wisdom-session="hw02"] h1').textContent())?.includes('Katapatan sa employer'),'Tagalog locale did not translate the Wisdom scenario.');
  assert((await page.locator('.bq-wisdom-warning').textContent())?.includes('Sadyang plausible'),'Tagalog locale did not translate the hard-choice guidance.');
  const tlChoices=await page.locator('[data-wisdom-choice] b').allTextContents();
  assert(tlChoices.some(text=>/procedure|manager|channel|pamilya/i.test(text)),'Tagalog Wisdom answers were not rendered.');

  await page.evaluate(()=>localStorage.setItem('biblequest.v3.locale',JSON.stringify('ceb')));
  await page.reload({waitUntil:'networkidle'});await page.locator('[data-wisdom-session="hw02"]').waitFor();
  assert((await page.locator('.bq-wisdom-warning').textContent())?.includes('Tinuyo nga plausible'),'Cebuano locale did not translate the hard-choice guidance.');
  assert((await page.locator('[data-wisdom-session="hw02"] h1').textContent())?.includes('Loyalty sa employer'),'Cebuano locale did not translate the Wisdom scenario.');

  metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...[...document.querySelectorAll('[data-wisdom-page] button')].map(node=>node.getBoundingClientRect().height))}));
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Localized Wisdom mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.minTarget>=44,`Localized Wisdom control below 44px: ${metrics.minTarget}px.`);

  await page.locator('[data-wisdom-learn]').click();await page.waitForURL(/#\/learn$/);
  assert(errors.length===0,`Unexpected Wisdom console/page errors: ${errors.join(' | ')}`);
  await context.close();
}
try{await run();console.log('BibleQuest v5 72-item multilingual Wisdom browser regression passed.')}finally{await browser.close()}
