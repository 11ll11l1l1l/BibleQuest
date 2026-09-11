import {chromium} from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});

  const asset=await page.request.get(`${BASE}assets/progress-feature-icons.svg`);
  assert(asset.ok(),`Progress Phase B icon sprite failed to load: ${asset.status()}`);
  const assetText=await asset.text();
  for(const id of['progress','xp','streak','activity','chapter','growth','profile','psychometrics','avatar','achievements','badge','badge-locked'])assert(assetText.includes(`id="${id}"`),`Loaded Progress sprite missing ${id}.`);

  const result=await page.evaluate(async()=>{
    const {progressPage}=await import(`/src/features/progress/index.js?phaseb=${Date.now()}`);
    const calls={transform:0,profile:0,psychometrics:0,avatar:0};
    const progress={
      getState:()=>({xp:120,streak:3,totalActivities:8,counters:{chaptersRead:5},badges:['first-step']}),
      badges:[
        {id:'first-step',label:'First Step',description:'Complete your first meaningful activity.'},
        {id:'reader',label:'Bible Reader',description:'Read ten Bible chapters.'}
      ]
    };
    const host=document.createElement('main');
    host.dataset.progressPhaseBHost='';
    document.body.appendChild(host);
    const def=progressPage({progress,onTransform:()=>calls.transform++,onPersonalityProfile:()=>calls.profile++,onPsychometrics:()=>calls.psychometrics++,onAvatarVault:()=>calls.avatar++});
    host.innerHTML=def.html;
    const cleanup=def.mount(host);
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));

    const href=node=>node?.querySelector('use')?.getAttribute('href')||'';
    const box=node=>{const rect=node?.getBoundingClientRect();return{width:rect?.width||0,height:rect?.height||0}};
    const stat=(selector)=>{
      const value=host.querySelector(selector);
      const card=value?.closest('.bq-progress-stats>div');
      return{value:value?.textContent?.trim()||'',href:href(card?.querySelector('.bq-progress-stat-art')),box:box(card)};
    };
    const buttons=[...host.querySelectorAll('.bq-progress-actions button')].map(button=>({height:box(button).height,href:href(button),text:button.textContent?.trim()||''}));
    const unlocked=host.querySelector('[data-progress-badge="first-step"]');
    const locked=host.querySelector('[data-progress-badge="reader"]');
    const unlockedUse=href(unlocked?.querySelector('.bq-progress-badge-art'));
    const lockedUse=href(locked?.querySelector('.bq-progress-badge-art'));
    const heroUse=href(host.querySelector('.bq-progress-hero .bq-progress-art-wrap'));
    const achievementsUse=href(host.querySelector('.bq-progress-title .bq-progress-art-wrap'));
    const heroBox=box(host.querySelector('.bq-progress-hero .bq-progress-art-wrap'));
    const visibleText=host.textContent||'';

    host.querySelector('[data-open-transform]')?.click();
    host.querySelector('[data-open-personality-profile]')?.click();
    host.querySelector('[data-open-psychometrics]')?.click();
    host.querySelector('[data-open-avatar-vault]')?.click();

    const output={
      heroUse,achievementsUse,heroBox,
      xp:stat('[data-progress-page-xp]'),
      streak:stat('[data-progress-page-streak]'),
      activities:stat('[data-progress-page-activities]'),
      chapters:stat('[data-progress-page-chapters]'),
      buttons,unlockedUse,lockedUse,calls,visibleText,
      innerWidth,scrollWidth:document.documentElement.scrollWidth
    };
    cleanup?.();host.remove();
    return output;
  });

  assert(result.heroUse==='assets/progress-feature-icons.svg#progress','Progress hero must render canonical progress artwork.');
  assert(result.achievementsUse==='assets/progress-feature-icons.svg#achievements','Achievements heading must render canonical achievements artwork.');
  assert(result.heroBox.width>=48&&result.heroBox.height>=48,'Progress hero artwork is not visibly rendered.');
  for(const [key,expectedValue,expectedIcon] of [['xp','120','xp'],['streak','3','streak'],['activities','8','activity'],['chapters','5','chapter']]){
    assert(result[key].value===expectedValue,`Progress ${key} value changed during Phase B rendering.`);
    assert(result[key].href===`assets/progress-feature-icons.svg#${expectedIcon}`,`Progress ${key} semantic artwork is wrong.`);
  }
  const expectedActions=[['Open Transformation','growth'],['Personality Profile','profile'],['Psychometrics Lab','psychometrics'],['Avatar Vault','avatar']];
  assert(result.buttons.length===4,'Progress Phase B changed the existing action count.');
  for(const [text,id] of expectedActions){const button=result.buttons.find(item=>item.text===text);assert(button,`Progress action disappeared: ${text}`);assert(button.href===`assets/progress-feature-icons.svg#${id}`,`Progress action artwork is wrong: ${text}`);assert(button.height>=44,`Progress action target below 44px: ${text}`);}
  assert(result.unlockedUse==='assets/progress-feature-icons.svg#badge','Unlocked Progress badge must use earned badge artwork.');
  assert(result.lockedUse==='assets/progress-feature-icons.svg#badge-locked','Locked Progress badge must use locked badge artwork.');
  assert(result.unlockedUse!==result.lockedUse,'Locked and unlocked Progress badge artwork must be distinct.');
  assert(result.calls.transform===1&&result.calls.profile===1&&result.calls.psychometrics===1&&result.calls.avatar===1,'Progress navigation callbacks changed.');
  assert(!result.visibleText.includes('✓')&&!result.visibleText.includes('○'),'Generic legacy badge glyphs remain rendered on Progress Phase B.');
  assert(result.innerWidth===390,'Progress Phase B acceptance did not execute at 390px.');
  assert(result.scrollWidth<=result.innerWidth+1,`Progress Phase B introduced horizontal overflow: ${result.scrollWidth}px > ${result.innerWidth}px.`);
  assert(errors.length===0,`Unexpected Progress Phase B console/page errors: ${errors.join(' | ')}`);
  await page.close();
  console.log('BibleQuest v3 Progress Phase B mobile browser acceptance passed.');
}finally{await browser.close()}
