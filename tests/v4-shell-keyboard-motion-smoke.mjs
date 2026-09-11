import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/',browser=await chromium.launch({headless:true}),assert=(ok,message)=>{if(!ok)throw new Error(message)};
async function run(){
  const page=await browser.newPage({viewport:{width:1024,height:800}});
  const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.locator('[data-bq-shell="v3"]').waitFor();

  // Keyboard: Tab must reach every primary nav link, in visual order, each
  // with a visible focus ring driven by the certified Foundation token.
  const order=[];
  for(let i=0;i<12;i++){
    await page.keyboard.press('Tab');
    const info=await page.evaluate(()=>{
      const el=document.activeElement;
      if(!el)return null;
      const style=getComputedStyle(el);
      return {routeLink:el.getAttribute('data-route-link'),outlineWidth:style.outlineWidth,outlineStyle:style.outlineStyle};
    });
    if(info?.routeLink)order.push(info);
  }
  assert(order.length===5,`Expected to reach all 5 nav links via Tab, reached ${order.length}.`);
  assert(order.map(o=>o.routeLink).join(',')==='home,learn,play,grow,more','Tab order through primary navigation must match visual left-to-right order.');
  for(const info of order){
    assert(info.outlineStyle!=='none'&&parseFloat(info.outlineWidth)>0,`Nav link '${info.routeLink}' has no visible keyboard focus ring.`);
  }

  // Reduced motion: with the OS preference set, shell transition/animation
  // durations must collapse to effectively zero (Foundation's global override).
  const page2=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await page2.goto(BASE,{waitUntil:'networkidle'});
  await page2.locator('[data-bq-shell="v3"]').waitFor();
  const durations=await page2.evaluate(()=>{
    const nav=document.querySelector('.bq-nav a');
    const style=nav?getComputedStyle(nav):null;
    return {transitionDuration:style?.transitionDuration||'', animationDuration:style?.animationDuration||''};
  });
  assert(/^0\.00?1?ms|^0s/.test(durations.transitionDuration.split(',')[0].trim())||parseFloat(durations.transitionDuration)<=0.01,`Reduced motion did not collapse shell transition duration: ${durations.transitionDuration}`);
  await page2.close();

  assert(errors.length===0,`Unexpected console/page errors during shell keyboard/motion check: ${errors.join(' | ')}`);
  await page.close();
}
try{await run();console.log('BibleQuest v4 Shell keyboard focus and reduced-motion smoke passed.')}finally{await browser.close()}
