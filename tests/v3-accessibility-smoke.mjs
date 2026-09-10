import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'allow',reducedMotion:'no-preference'});
const page=await context.newPage();
const errors=[];
page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
page.on('pageerror',error=>errors.push(error.message));

try{
  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.locator('[data-bq-shell="v3"]').waitFor({timeout:10000});
  await page.locator('[data-route-link="more"]').click();
  await page.locator('[data-open-accessibility]').waitFor({timeout:5000});
  await page.locator('[data-open-accessibility]').click();
  await page.locator('[data-accessibility-page]').waitFor({timeout:5000});
  assert(page.url().includes('#/accessibility'),'More did not route to Accessibility through the Router.');

  let state=await page.evaluate(()=>({
    text:document.documentElement.dataset.bqText,
    motion:document.documentElement.dataset.bqMotion,
    contrast:document.documentElement.dataset.bqContrast,
    effective:document.documentElement.dataset.bqEffectiveMotion,
    scrollWidth:document.documentElement.scrollWidth,
    innerWidth
  }));
  assert(state.text==='normal'&&state.motion==='system'&&state.contrast==='normal'&&state.effective==='full','Default Accessibility root presentation state is incorrect.');
  assert(state.scrollWidth<=state.innerWidth+1,'Accessibility page has horizontal overflow at 390px.');

  const unlabeled=await page.evaluate(()=>[...document.querySelectorAll('button,a[href],input,select,textarea')].filter(el=>el.getClientRects().length&&!el.closest('[hidden]')).filter(el=>{
    const label=el.getAttribute('aria-label')||el.labels?.[0]?.textContent?.trim()||el.textContent?.trim()||el.getAttribute('title');
    return !label;
  }).map(el=>el.outerHTML));
  assert(unlabeled.length===0,`Visible Accessibility controls must have accessible labels: ${unlabeled.join(' | ')}`);

  await page.locator('[data-accessibility-setting="text"]').selectOption('xlarge');
  await page.locator('[data-accessibility-setting="motion"]').selectOption('reduce');
  await page.locator('[data-accessibility-setting="contrast"]').selectOption('strong');
  await page.waitForFunction(()=>document.documentElement.dataset.bqText==='xlarge'&&document.documentElement.dataset.bqEffectiveMotion==='reduce'&&document.documentElement.dataset.bqContrast==='strong');
  const fontSize=await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).fontSize));
  assert(fontSize>=18.9,`Extra-large mobile text preference did not increase root readability; got ${fontSize}px.`);

  await page.locator('#bq-view').focus();
  await page.keyboard.press('Tab');
  const focus=await page.evaluate(()=>{
    const el=document.activeElement,style=getComputedStyle(el);
    return {interactive:Boolean(el?.matches('a,button,input,select,textarea')),outlineStyle:style.outlineStyle,outlineWidth:parseFloat(style.outlineWidth)||0};
  });
  assert(focus.interactive,'Keyboard Tab did not move focus from the route view to an interactive control.');
  assert(focus.outlineStyle!=='none'&&focus.outlineWidth>=3,`Keyboard focus is not visibly outlined: ${focus.outlineStyle} ${focus.outlineWidth}px.`);

  await page.reload({waitUntil:'networkidle'});
  await page.locator('[data-accessibility-page]').waitFor({timeout:10000});
  state=await page.evaluate(()=>({text:document.documentElement.dataset.bqText,motion:document.documentElement.dataset.bqMotion,contrast:document.documentElement.dataset.bqContrast,effective:document.documentElement.dataset.bqEffectiveMotion}));
  assert(state.text==='xlarge'&&state.motion==='reduce'&&state.contrast==='strong'&&state.effective==='reduce','Accessibility preferences did not persist through reload.');

  await page.locator('[data-accessibility-setting="motion"]').selectOption('system');
  await page.waitForFunction(()=>document.documentElement.dataset.bqEffectiveMotion==='full');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.documentElement.dataset.bqEffectiveMotion==='reduce');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.locator('[data-accessibility-setting="motion"]').selectOption('reduce');
  await page.waitForFunction(()=>document.documentElement.dataset.bqEffectiveMotion==='reduce');

  await page.locator('[data-route-link="home"]').click();
  await page.locator('[data-open-tutorial]').click();
  await page.locator('[data-bq-tutorial-layer]').waitFor({state:'visible',timeout:5000});
  const reduced=await page.evaluate(()=>{
    const visual=document.querySelector('.bq-tutorial-trainer-visual');
    const style=getComputedStyle(visual);
    return {duration:style.animationDuration,iterations:style.animationIterationCount};
  });
  assert(reduced.duration!=='3s'&&reduced.iterations==='1',`Accessibility reduced-motion presentation did not suppress repeated trainer animation: ${reduced.duration}/${reduced.iterations}.`);

  await page.locator('[data-tutorial-next]').focus();
  await page.keyboard.press('Tab');
  assert(await page.locator('[data-tutorial-skip]').evaluate(el=>el===document.activeElement),'Tab from the last tutorial control must wrap to the first modal control.');
  await page.keyboard.press('Shift+Tab');
  assert(await page.locator('[data-tutorial-next]').evaluate(el=>el===document.activeElement),'Shift+Tab from the first tutorial control must wrap to the last modal control.');

  state=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth}));
  assert(state.scrollWidth<=state.innerWidth+1,'Accessibility preferences or modal focus support caused horizontal overflow at 390px.');
  assert(errors.length===0,`Unexpected Accessibility console/page errors: ${errors.join(' | ')}`);
  console.log('BibleQuest v3 Accessibility keyboard + readability + persistence browser regression passed.');
}finally{
  await browser.close();
}
