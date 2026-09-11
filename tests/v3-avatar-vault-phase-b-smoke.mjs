import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const styleIds=['starter','sakura','lantern','flame','crown','scholar','scroll','shepherd','couple','community','world','kitsune','moon','fuji','tea'];
const legacyEmoji=/[🌱🌸🏮🔥👑🎓📜🐑💞⛪🌏🦊🌙🗻🍵🔒]/u;
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});
  const asset=await page.request.get(`${BASE}assets/avatar-vault-icons.svg`);
  assert(asset.ok(),`Avatar Vault Phase B sprite failed to load: ${asset.status()}`);
  const assetText=await asset.text();
  for(const id of[...styleIds,'lock'])assert(assetText.includes(`id="${id}"`),`Loaded Avatar Vault sprite missing ${id}.`);

  const result=await page.evaluate(async()=>{
    const [{avatarVaultPage},{STYLES}]=await Promise.all([
      import(`/src/features/avatar-vault/index.js?phaseb=${Date.now()}`),
      import(`/src/engines/avatar-vault.js?phaseb=${Date.now()}`)
    ]);
    const makeState=(allUnlocked,selectedId='starter')=>{
      const styles=STYLES.map(style=>Object.freeze({...style,unlocked:allUnlocked||style.id==='starter',active:style.id===selectedId,progressLabel:'Ready'}));
      return Object.freeze({owner:'guest',scope:'guest-device',selected:STYLES.find(style=>style.id===selectedId)||STYLES[0],styles:Object.freeze(styles)});
    };
    const renderVault=async({allUnlocked})=>{
      let state=makeState(allUnlocked),back=0,selected='';
      const vault={
        load:async()=>state,
        getState:()=>state,
        select:async id=>{
          selected=id;
          state=Object.freeze({...makeState(allUnlocked,id),synced:true});
          return state;
        }
      };
      const host=document.createElement('div');document.body.appendChild(host);
      const def=avatarVaultPage({vault,onBack:()=>back++});host.innerHTML=def.html;const cleanup=def.mount(host);
      await new Promise(resolve=>setTimeout(resolve,30));
      const cards=[...host.querySelectorAll('[data-avatar-style]')].map(card=>({
        id:card.dataset.avatarStyle,
        locked:card.classList.contains('is-locked'),
        use:card.querySelector('.bq-avatar-art use')?.getAttribute('href')||''
      }));
      const firstEquip=host.querySelector('[data-avatar-select]');
      const equipHeight=firstEquip?.getBoundingClientRect().height||0;
      if(firstEquip){firstEquip.click();await new Promise(resolve=>setTimeout(resolve,30));}
      const active=host.querySelector('[data-avatar-style].is-active')?.dataset.avatarStyle||'';
      const heroUse=host.querySelector('.bq-vault-hero .bq-avatar-art use')?.getAttribute('href')||'';
      const html=host.innerHTML;
      const backButton=host.querySelector('[data-avatar-back]');
      const backHeight=backButton?.getBoundingClientRect().height||0;
      backButton?.click();
      cleanup?.();host.remove();
      return{cards,equipHeight,selected,active,heroUse,html,backHeight,back};
    };
    const unlocked=await renderVault({allUnlocked:true});
    const locked=await renderVault({allUnlocked:false});
    return{unlocked,locked,innerWidth,scrollWidth:document.documentElement.scrollWidth};
  });

  assert(result.unlocked.cards.length===15,`Phase B unlocked gallery must render 15 styles, found ${result.unlocked.cards.length}.`);
  for(const id of styleIds){
    const card=result.unlocked.cards.find(row=>row.id===id);
    assert(card,`Unlocked gallery missing style ${id}.`);
    assert(card.use===`assets/avatar-vault-icons.svg#${id}`,`Unlocked ${id} card must render its semantic artwork, got ${card.use}.`);
  }
  assert(result.unlocked.selected&&result.unlocked.active===result.unlocked.selected,'Phase B Equip interaction did not keep active card in sync.');
  assert(result.unlocked.heroUse===`assets/avatar-vault-icons.svg#${result.unlocked.selected}`,'Equipped hero artwork did not follow selected style.');
  assert(result.unlocked.equipHeight>=44,'Avatar Vault Phase B Equip target below 44px.');
  assert(result.unlocked.backHeight>=44&&result.unlocked.back===1,'Avatar Vault Phase B Back control changed or is below 44px.');
  assert(result.locked.cards.filter(card=>card.locked).length===14,'Locked gallery must keep all non-starter styles visibly locked.');
  for(const card of result.locked.cards.filter(card=>card.locked))assert(card.use==='assets/avatar-vault-icons.svg#lock',`Locked ${card.id} card must render committed lock artwork.`);
  assert(!legacyEmoji.test(result.unlocked.html)&&!legacyEmoji.test(result.locked.html),'Avatar Vault Phase B browser output must not render catalog/lock emoji artwork.');
  assert(result.innerWidth===390,'Avatar Vault Phase B acceptance did not execute at 390px.');
  assert(result.scrollWidth<=result.innerWidth+1,`Avatar Vault Phase B introduced horizontal overflow: ${result.scrollWidth}px > ${result.innerWidth}px.`);
  assert(errors.length===0,`Unexpected Avatar Vault Phase B console/page errors: ${errors.join(' | ')}`);
  await page.close();
  console.log('BibleQuest v3 Avatar Vault Phase B mobile browser acceptance passed.');
}finally{await browser.close()}
