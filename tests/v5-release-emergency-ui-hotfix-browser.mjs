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

  const iconState=await page.evaluate(()=>{
    const selectors=['[data-open-home-calendar]','[data-open-home-bible]','[data-open-home-transformation]','[data-open-home-notifications]','[data-open-tutorial]'];
    return selectors.map(selector=>{
      const icon=document.querySelector(`${selector} .bq-home-tile-icon .bq-icon`);
      const style=icon?getComputedStyle(icon):null;
      const box=icon?.getBoundingClientRect();
      return{selector,exists:Boolean(icon),display:style?.display,visibility:style?.visibility,opacity:style?.opacity,width:box?.width||0,height:box?.height||0,html:icon?.innerHTML||''};
    });
  });
  for(const icon of iconState){
    assert(icon.exists,`Missing home tile SVG: ${icon.selector}`);
    assert(icon.display!=='none'&&icon.visibility!=='hidden'&&icon.opacity!=='0',`Home tile SVG hidden: ${icon.selector}`);
    assert(icon.width>=19&&icon.height>=19,`Home tile SVG collapsed: ${icon.selector} ${icon.width}x${icon.height}`);
    assert(/<(path|rect|circle)\b/.test(icon.html),`Home tile SVG has no vector geometry: ${icon.selector}`);
  }

  await page.locator('[data-locale-select]').selectOption('tl');
  await page.waitForFunction(()=>document.querySelector('[data-bq-shell="v3"]')?.dataset.locale==='tl');

  await page.goto(new URL('#/grow',BASE).href,{waitUntil:'networkidle'});
  await page.getByRole('heading',{name:'Ang iyong pag-unlad sa BibleQuest'}).waitFor();
  await page.getByRole('button',{name:/Buksan ang Pagbabago/}).waitFor();

  await page.goto(new URL('#/transform',BASE).href,{waitUntil:'networkidle'});
  await page.getByRole('heading',{name:'Pagninilay sa pananampalataya at pagsasabuhay'}).waitFor();
  const tlPrompt=(await page.locator('[data-transform-item="word"] p').textContent())?.trim()||'';
  assert(tlPrompt.includes('Regular akong nagbabasa ng Kasulatan'),`Tagalog Transform prompt leaked/fell back: ${tlPrompt}`);
  await page.locator('[data-transform-mode-full]').click();
  await page.getByRole('heading',{name:'Unawain ang mga pattern, saka magsanay ng pagbabago'}).waitFor();
  const tlPersonality=(await page.locator('[data-transform-personality-item="E1"] p').textContent())?.trim()||'';
  assert(tlPersonality==='Ako ang nagbibigay-buhay sa isang salu-salo.',`Tagalog personality prompt not localized: ${tlPersonality}`);

  await page.goto(new URL('#/learn',BASE).href,{waitUntil:'networkidle'});
  await page.getByText('Gabay na Pag-aaral',{exact:true}).waitFor();
  await page.getByText('Malalalim na Tanong',{exact:true}).waitFor();

  await page.goto(new URL('#/more',BASE).href,{waitUntil:'networkidle'});
  await page.getByText('Sentro ng Ministeryo',{exact:true}).waitFor();
  await page.getByText('Sentro ng mga Abiso',{exact:true}).waitFor();

  await page.locator('[data-locale-select]').selectOption('ceb');
  await page.waitForFunction(()=>document.querySelector('[data-bq-shell="v3"]')?.dataset.locale==='ceb');

  await page.goto(new URL('#/grow',BASE).href,{waitUntil:'networkidle'});
  await page.getByRole('heading',{name:'Imong pag-uswag sa BibleQuest'}).waitFor();

  await page.goto(new URL('#/transform',BASE).href,{waitUntil:'networkidle'});
  const cebPrompt=(await page.locator('[data-transform-item="word"] p').textContent())?.trim()||'';
  assert(cebPrompt.includes('Kanunay akong mobasa sa Kasulatan'),`Cebuano Transform prompt leaked/fell back: ${cebPrompt}`);

  await page.goto(new URL('#/learn',BASE).href,{waitUntil:'networkidle'});
  await page.getByText('Gigiyahang Pagtuon',{exact:true}).waitFor();

  await page.goto(new URL('#/more',BASE).href,{waitUntil:'networkidle'});
  await page.getByText('Sentro sa Ministeryo',{exact:true}).waitFor();

  const layout=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert(layout.scrollWidth<=layout.innerWidth+1,`Emergency localized mobile UI overflows: ${layout.scrollWidth} > ${layout.innerWidth}`);
  assert(errors.length===0,`Emergency hotfix browser errors: ${errors.join(' | ')}`);
  console.log('BibleQuest V5 emergency icon/localization browser regression passed.');
}finally{
  await browser.close();
}
