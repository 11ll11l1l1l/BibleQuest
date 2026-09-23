import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const assert=(ok,message)=>{if(!ok)throw new Error(message)};
const browser=await chromium.launch({headless:true});

try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});

  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.locator('[data-locale-select]').waitFor();

  const iconSelectors=[
    '[data-open-home-next-event]',
    '[data-open-home-continue-reading]',
    '[data-open-home-transformation]',
    '[data-open-home-notifications]',
    '[data-open-tutorial]'
  ];
  const iconState=await page.evaluate(selectors=>selectors.map(selector=>{
    const icon=document.querySelector(`${selector} .bq-home-tile-icon .bq-icon`);
    const style=icon?getComputedStyle(icon):null;
    const box=icon?.getBoundingClientRect();
    return{selector,exists:Boolean(icon),display:style?.display,visibility:style?.visibility,opacity:style?.opacity,width:box?.width||0,height:box?.height||0,html:icon?.innerHTML||''};
  }),iconSelectors);
  for(const icon of iconState){
    assert(icon.exists,`Missing Home tile icon: ${icon.selector}`);
    assert(icon.display!=='none'&&icon.visibility!=='hidden'&&icon.opacity!=='0',`Hidden Home tile icon: ${icon.selector}`);
    assert(icon.width>=19&&icon.height>=19,`Collapsed Home tile icon: ${icon.selector} ${icon.width}x${icon.height}`);
    assert(/<(path|rect|circle)\b/.test(icon.html),`No vector geometry: ${icon.selector}`);
  }

  await page.locator('[data-locale-select]').selectOption('tl');
  await page.waitForFunction(()=>document.querySelector('[data-bq-shell="v3"]')?.dataset.locale==='tl');

  await page.goto(new URL('#/grow',BASE).href,{waitUntil:'networkidle'});
  await page.getByRole('heading',{name:'Ang iyong pag-unlad sa BibleQuest'}).waitFor();
  await page.getByRole('button',{name:/Buksan ang Pagbabago/}).waitFor();

  await page.goto(new URL('#/transform',BASE).href,{waitUntil:'networkidle'});
  await page.getByRole('heading',{name:'Pagninilay sa pananampalataya at pagsasabuhay'}).waitFor();
  assert(((await page.locator('[data-transform-item="word"] p').textContent())||'').includes('Regular akong nagbabasa ng Kasulatan'),'Tagalog Transform prompt leaked English.');
  await page.locator('[data-transform-mode-full]').click();
  await page.getByRole('heading',{name:'Unawain ang mga pattern, saka magsanay ng pagbabago'}).waitFor();

  await page.goto(new URL('#/learn',BASE).href,{waitUntil:'networkidle'});
  await page.getByText('Gabay na Pag-aaral',{exact:true}).waitFor();
  await page.getByText('Mga Tauhan at Lugar',{exact:true}).waitFor();
  await page.getByText('Mga Sitwasyon ng Karunungan',{exact:true}).waitFor();

  await page.goto(new URL('#/more',BASE).href,{waitUntil:'networkidle'});
  await page.getByText('Sentro ng Ministeryo',{exact:true}).waitFor();
  await page.getByText('Mga Personal na Hamon',{exact:true}).waitFor();

  await page.locator('[data-locale-select]').selectOption('ceb');
  await page.waitForFunction(()=>document.querySelector('[data-bq-shell="v3"]')?.dataset.locale==='ceb');

  await page.goto(new URL('#/grow',BASE).href,{waitUntil:'networkidle'});
  await page.getByRole('heading',{name:'Imong pag-uswag sa BibleQuest'}).waitFor();

  await page.goto(new URL('#/transform',BASE).href,{waitUntil:'networkidle'});
  assert(((await page.locator('[data-transform-item="word"] p').textContent())||'').includes('Kanunay akong mobasa sa Kasulatan'),'Cebuano Transform prompt leaked English.');

  await page.goto(new URL('#/learn',BASE).href,{waitUntil:'networkidle'});
  await page.getByText('Gigiyahang Pagtuon',{exact:true}).waitFor();
  await page.getByText('Mga Tawo ug Lugar',{exact:true}).waitFor();

  await page.goto(new URL('#/more',BASE).href,{waitUntil:'networkidle'});
  await page.getByText('Sentro sa Ministeryo',{exact:true}).waitFor();
  await page.getByText('Personal nga mga Hagit',{exact:true}).waitFor();

  const layout=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert(layout.scrollWidth<=layout.innerWidth+1,`Localized mobile UI overflows: ${layout.scrollWidth} > ${layout.innerWidth}`);
  assert(errors.length===0,`V5.1 localization browser errors: ${errors.join(' | ')}`);
  console.log('PASS V5.1 localization stabilization browser regression');
}finally{
  await browser.close();
}
