import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const WIDTHS=[320,430];
const MAINTAINED_ROUTES=[
  'home','mission','learn','study','deep-questions','story-journey','wisdom-situations','adaptive-learning','bible-world','open-review','private-notes','cloud-notes',
  'couples-family','couples-cloud','journey-groups','encouragements','community','live-rooms','ministry-hub','notification-center','workspace','team-center','leaderboards','recognition','assignments','content-review',
  'reader','play','grow','transform','personality-profile','psychometrics','avatar-vault','my-mission','calendar','recordings','media','more','accessibility','backup','congregation','account'
];
const TEXT_STRESS_ROUTES=['home','learn','reader','play','grow','more','assignments','calendar','community','couples-family','congregation','account'];
const TEXT_SAMPLES=[
  'Continue today’s Bible learning journey with your congregation',
  '今日の聖書学習の旅を教会のみんなと一緒に続ける',
  'Padayon sa imong pagtuon sa Biblia uban sa imong kongregasyon karong adlawa'
];
const assert=(ok,message)=>{if(!ok)throw new Error(message)};
const browser=await chromium.launch({headless:true});

const delta=(a,b)=>Math.abs((a??0)-(b??0));

async function navigate(page,route){
  await page.evaluate(route=>{
    const next=`#/${route}`;
    if(location.hash===next)window.dispatchEvent(new Event('hashchange'));
    else location.hash=next;
  },route);
  await page.waitForFunction(route=>location.hash===`#/${route}`&&Boolean(document.querySelector('#bq-view')?.textContent?.trim()),route,{timeout:5000});
  await page.waitForTimeout(90);
}

async function sampleGeometry(page){
  return page.evaluate(()=>{
    const rect=selector=>{const node=document.querySelector(selector),box=node?.getBoundingClientRect();return box?{left:box.left,right:box.right,top:box.top,bottom:box.bottom,width:box.width,height:box.height}:null};
    const first=document.querySelector('#bq-view')?.firstElementChild?.getBoundingClientRect();
    return{
      topbar:rect('.bq-topbar'),nav:rect('.bq-nav'),main:rect('.bq-main'),
      firstTop:first?.top??null,
      htmlScrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body.scrollWidth,
      startup:Boolean(document.querySelector('[data-startup-failure]')),recovery:Boolean(document.querySelector('.bq-recovery-panel')),
      title:document.title,mainText:(document.querySelector('#bq-view')?.textContent||'').trim()
    };
  });
}

async function verifyWidth(width){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:width<600,hasTouch:width<600});
  const errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${BASE}#/home`,{waitUntil:'networkidle'});
  await page.locator('[data-bq-shell="v3"]').waitFor();
  await page.locator('[data-session-label]',{hasText:'Guest'}).waitFor();

  let errorCursor=errors.length;
  for(const route of MAINTAINED_ROUTES){
    await navigate(page,route);
    const before=await sampleGeometry(page);
    await page.waitForTimeout(300);
    const after=await sampleGeometry(page);
    const routeErrors=errors.slice(errorCursor);errorCursor=errors.length;

    assert(!after.startup,`${width}px #/${route} rendered the startup-failure surface.`);
    assert(!after.recovery,`${width}px #/${route} fell into generic recovery instead of its maintained route state.`);
    assert(after.mainText.length>0,`${width}px #/${route} rendered a blank main surface.`);
    assert(!/Page not found/i.test(after.mainText),`${width}px #/${route} resolved to not-found.`);
    assert(after.htmlScrollWidth<=width+1&&after.bodyScrollWidth<=width+1,`${width}px #/${route} has document overflow: html=${after.htmlScrollWidth}, body=${after.bodyScrollWidth}.`);
    assert(after.main&&after.main.left>=-1&&after.main.right<=width+1,`${width}px #/${route} main surface exceeds the viewport.`);
    assert(before.topbar&&after.topbar&&delta(before.topbar.left,after.topbar.left)<=2&&delta(before.topbar.right,after.topbar.right)<=2&&delta(before.topbar.top,after.topbar.top)<=2,`${width}px #/${route} caused a late topbar geometry shift.`);
    assert(before.nav&&after.nav&&delta(before.nav.left,after.nav.left)<=2&&delta(before.nav.right,after.nav.right)<=2&&delta(before.nav.bottom,after.nav.bottom)<=2,`${width}px #/${route} caused a late navigation geometry shift.`);
    if(before.firstTop!==null&&after.firstTop!==null)assert(delta(before.firstTop,after.firstTop)<=12,`${width}px #/${route} shifted its leading content by ${delta(before.firstTop,after.firstTop).toFixed(1)}px after render.`);
    assert(routeErrors.length===0,`${width}px #/${route} produced console/page errors: ${routeErrors.join(' | ')}`);
  }

  if(width===320){
    for(const route of TEXT_STRESS_ROUTES){
      await navigate(page,route);
      const metrics=await page.evaluate(samples=>{
        const main=document.querySelector('#bq-view');
        const candidates=[...main.querySelectorAll('h1,h2,h3,p,button,a,label,small')].filter(node=>{
          const style=getComputedStyle(node),box=node.getBoundingClientRect();
          return style.display!=='none'&&style.visibility!=='hidden'&&box.width>0&&box.height>0;
        }).slice(0,24);
        candidates.forEach((node,index)=>{
          if(node.matches('input,textarea,select'))return;
          if(node.children.length>0&&!node.matches('button,a'))return;
          node.textContent=samples[index%samples.length];
          node.lang=index%3===1?'ja':index%3===2?'ceb':'en';
        });
        return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve({
          innerWidth,htmlScrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body.scrollWidth,
          mainRight:main.getBoundingClientRect().right,
          clipped:candidates.filter(node=>node.scrollWidth>node.clientWidth+2&&getComputedStyle(node).overflowX==='visible').length
        }))));
      },TEXT_SAMPLES);
      assert(metrics.htmlScrollWidth<=metrics.innerWidth+1&&metrics.bodyScrollWidth<=metrics.innerWidth+1,`320px #/${route} failed English/Japanese/Cebuano text-expansion stress with document overflow.`);
      assert(metrics.mainRight<=metrics.innerWidth+1,`320px #/${route} main surface escaped viewport during localization stress.`);
    }
  }

  await page.close();
}

try{
  for(const width of WIDTHS)await verifyWidth(width);
  console.log(`BibleQuest v4 deep-route/browser resilience audit passed across ${MAINTAINED_ROUTES.length} maintained routes at ${WIDTHS.join('/')}px.`);
}finally{
  await browser.close();
}
