import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const browser=await chromium.launch({headless:true});

async function inspect(width,height,isMobile=false){
  const page=await browser.newPage({viewport:{width,height},isMobile,hasTouch:isMobile});
  const errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${BASE}#/grow`,{waitUntil:'networkidle'});
  await page.locator('[data-progress-page]').waitFor();
  const result=await page.evaluate(()=>{
    const buttons=[...document.querySelectorAll('.bq-progress-actions button')];
    const stats=[...document.querySelectorAll('.bq-progress-stats>div')];
    const badges=[...document.querySelectorAll('.bq-badge-card')];
    const hero=document.querySelector('.bq-progress-hero .bq-progress-art-wrap');
    const use=hero?.querySelector('use')?.getAttribute('href')||'';
    const bounds=[...buttons,...stats,...badges].map(node=>node.getBoundingClientRect());
    return{
      innerWidth,
      scrollWidth:document.documentElement.scrollWidth,
      use,
      actionCount:buttons.length,
      minActionHeight:Math.min(...buttons.map(node=>node.getBoundingClientRect().height)),
      statCount:stats.length,
      badgeCount:badges.length,
      minLeft:Math.min(...bounds.map(box=>box.left)),
      maxRight:Math.max(...bounds.map(box=>box.right)),
      xp:document.querySelector('[data-progress-page-xp]')?.textContent?.trim()||'',
      streak:document.querySelector('[data-progress-page-streak]')?.textContent?.trim()||'',
      labels:buttons.map(button=>button.textContent?.trim()||'')
    };
  });
  assert(result.scrollWidth<=result.innerWidth+1,`V4 Progress/Grow document overflow at ${width}px: ${result.scrollWidth}px > ${result.innerWidth}px.`);
  assert(result.minLeft>=-1&&result.maxRight<=result.innerWidth+1,`V4 Progress/Grow cards/actions escape the ${width}px viewport.`);
  assert(result.use==='assets/progress-feature-icons.svg#progress','V4 Progress/Grow hero lost canonical semantic artwork.');
  assert(result.actionCount===4,'V4 Progress/Grow must retain all four growth-tool actions.');
  assert(result.minActionHeight>=44,'V4 Progress/Grow action target is below 44px.');
  assert(result.statCount===4,'V4 Progress/Grow must retain the four canonical progress statistics.');
  assert(result.badgeCount>0,'V4 Progress/Grow badge surface disappeared.');
  assert(/^\d+$/.test(result.xp)&&/^\d+$/.test(result.streak),'V4 Progress/Grow canonical XP/streak values are not rendered as readable values.');
  for(const label of['Open Transformation','Personality Profile','Psychometrics Lab','Avatar Vault'])assert(result.labels.includes(label),`V4 Progress/Grow action disappeared: ${label}`);
  assert(errors.length===0,`Unexpected V4 Progress/Grow console/page errors at ${width}px: ${errors.join(' | ')}`);
  await page.close();
}

try{
  await inspect(320,760,true);
  await inspect(1280,900,false);
  console.log('BibleQuest v4 Progress/Grow page acceptance passed at 320px and desktop.');
}finally{await browser.close()}
