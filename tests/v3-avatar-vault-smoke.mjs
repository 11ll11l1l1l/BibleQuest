import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/',browser=await chromium.launch({headless:true}),assert=(ok,message)=>{if(!ok)throw new Error(message)};
async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});
  const result=await page.evaluate(async()=>{
    const [{createAvatarVaultService},{avatarVaultPage}]=await Promise.all([
      import(`/src/app/avatar-vault.js?smoke=${Date.now()}`),import(`/src/features/avatar-vault/index.js?smoke=${Date.now()}`)
    ]);
    const map=new Map();
    const privateStorage={read:(k,fb=null)=>(map.has(k)?map.get(k):fb),write:(k,v)=>{map.set(k,v);return v},remove:k=>{map.delete(k)}};
    const session={getState:()=>({authenticated:false,user:null})};
    const progress={getState:()=>({xp:3000,streak:40})};
    const api={avatarVault:{load:async()=>null,save:async()=>{}}};
    const vault=createAvatarVaultService({session,privateStorage,api,progress});
    let back=0;const host=document.createElement('div');document.body.appendChild(host);
    const def=avatarVaultPage({vault,onBack:()=>back++});host.innerHTML=def.html;let cleanup=def.mount(host);
    await new Promise(resolve=>setTimeout(resolve,50));
    const homeText=host.textContent||'';
    const cardCount=host.querySelectorAll('[data-avatar-style]').length;
    const lockedCount=host.querySelectorAll('[data-avatar-style].is-locked').length;
    const unlockedCount=host.querySelectorAll('[data-avatar-style].is-unlocked').length;
    const equipButtons=host.querySelectorAll('[data-avatar-select]');
    const first=host.querySelector('[data-avatar-style]')?.getBoundingClientRect();
    equipButtons[0]?.click();
    await new Promise(resolve=>setTimeout(resolve,50));
    const equippedAfter=host.querySelector('[data-avatar-style].is-active')?.dataset.avatarStyle||'';
    host.querySelector('[data-avatar-back]')?.click();
    const metrics={innerWidth,scrollWidth:document.documentElement.scrollWidth,cardWidth:first?.width||0};
    cleanup?.();host.remove();
    return{homeText,cardCount,lockedCount,unlockedCount,equipButtonCount:equipButtons.length,equippedAfter,back,metrics};
  });
  assert(result.homeText.includes('AVATAR VAULT'),'Avatar Vault hub did not render.');
  assert(result.cardCount===15,`Avatar Vault must render all 15 catalog styles, found ${result.cardCount}.`);
  assert(result.lockedCount>=10,`At least 10 styles must render locked/unavailable, found ${result.lockedCount}.`);
  assert(result.unlockedCount>=5,`At least 5 styles must render unlocked at rich metrics, found ${result.unlockedCount}.`);
  assert(result.equipButtonCount>0,'No equip controls rendered for unlocked styles.');
  assert(result.equippedAfter,'Equipping a style did not mark a card active.');
  assert(result.back===1,'Back navigation callback did not fire.');
  assert(result.metrics.scrollWidth<=result.metrics.innerWidth+1,`Avatar Vault overflows horizontally at 390px (scrollWidth ${result.metrics.scrollWidth} > innerWidth ${result.metrics.innerWidth}).`);
  assert(result.metrics.cardWidth>0,'Avatar style cards did not render with measurable width at 390px.');
  assert(errors.length===0,`Avatar Vault produced console/page errors: ${errors.join(' | ')}`);
  console.log('BibleQuest v3 Avatar Vault smoke regression passed.');
}
try{await run()}finally{await browser.close()}
