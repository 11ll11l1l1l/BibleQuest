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
  const asset=await page.request.get(`${BASE}assets/account-feature-icons.svg`);
  assert(asset.ok(),`Account Phase B icon sprite failed to load: ${asset.status()}`);
  const assetText=await asset.text();
  for(const id of['profile','sign-in','create-account','recovery','device','security'])assert(assetText.includes(`id="${id}"`),`Loaded Account sprite missing ${id}.`);

  const result=await page.evaluate(async()=>{
    const {accountPage}=await import(`/src/features/account/index.js?phaseb=${Date.now()}`);
    const useHref=host=>host.querySelector('.bq-account-art use')?.getAttribute('href')||'';
    const box=node=>{const rect=node?.getBoundingClientRect();return{width:rect?.width||0,height:rect?.height||0}};

    let guestHome=0;
    const guestSession={getState:()=>({authenticated:false,remoteAvailable:true,user:null}),async signOut(){}};
    const guestAccount={async listDevices(){return[]},async signIn(){return{}},async signUp(){throw new Error('not used')},async resetPassword(){throw new Error('not used')},async issueRecoveryCode(){throw new Error('not used')},async changePassword(){},async removeDevice(){}};
    const guestHost=document.createElement('div');document.body.appendChild(guestHost);
    const guestDef=accountPage({account:guestAccount,session:guestSession,onHome:()=>guestHome++});
    guestHost.innerHTML=guestDef.html;const guestCleanup=guestDef.mount(guestHost);
    await new Promise(resolve=>setTimeout(resolve,20));
    const loginUse=useHref(guestHost);
    const loginArt=box(guestHost.querySelector('.bq-account-art-wrap'));
    const tabHeight=box(guestHost.querySelector('[data-account-mode="login"]')).height;
    const modeTabs=[...guestHost.querySelectorAll('[data-account-mode]')];
    const panel=guestHost.querySelector('[data-account-body]');
    const initialTabContract={
      tablistRole:guestHost.querySelector('.bq-account-tabs')?.getAttribute('role')||'',
      panelRole:panel?.getAttribute('role')||'',
      selected:modeTabs.map(tab=>tab.getAttribute('aria-selected')),
      tabIndex:modeTabs.map(tab=>tab.tabIndex),
      labelledBy:panel?.getAttribute('aria-labelledby')||''
    };
    modeTabs[0]?.focus();
    modeTabs[0]?.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));
    const arrowRightMode=document.activeElement?.getAttribute?.('data-account-mode')||'';
    const arrowSelected=modeTabs.map(tab=>tab.getAttribute('aria-selected'));
    document.activeElement?.dispatchEvent?.(new KeyboardEvent('keydown',{key:'End',bubbles:true,cancelable:true}));
    const endMode=document.activeElement?.getAttribute?.('data-account-mode')||'';
    document.activeElement?.dispatchEvent?.(new KeyboardEvent('keydown',{key:'Home',bubbles:true,cancelable:true}));
    const homeMode=document.activeElement?.getAttribute?.('data-account-mode')||'';
    guestHost.querySelector('[data-account-mode="signup"]')?.click();
    const signupUse=useHref(guestHost);
    guestHost.querySelector('[data-account-mode="recovery"]')?.click();
    const recoveryUse=useHref(guestHost);
    const guestHeight=box(guestHost.querySelector('[data-account-guest]')).height;
    const guestText=guestHost.textContent||'';
    guestHost.querySelector('[data-account-guest]')?.click();
    guestCleanup?.();guestHost.remove();

    let signedHome=0;
    const signedSession={getState:()=>({authenticated:true,remoteAvailable:true,user:{id:'user-1',displayName:'BibleQuest Learner',email:'learner@example.com'}}),async signOut(){}};
    const signedAccount={async listDevices(){return[{id:'device-1',label:'Test phone',platform:'Android',current:true,last_seen_at:'2026-09-12T00:00:00Z'}]},async issueRecoveryCode(){return{recovery_code:'BQ-TEST1-TEST2-TEST3-TEST4'}},async changePassword(){},async removeDevice(){}};
    const signedHost=document.createElement('div');document.body.appendChild(signedHost);
    const signedDef=accountPage({account:signedAccount,session:signedSession,onHome:()=>signedHome++});
    signedHost.innerHTML=signedDef.html;const signedCleanup=signedDef.mount(signedHost);
    await new Promise(resolve=>setTimeout(resolve,40));
    const signedUses=[...signedHost.querySelectorAll('.bq-account-art use')].map(node=>node.getAttribute('href')||'');
    const heroArt=box(signedHost.querySelector('.bq-account-signed-hero .bq-account-art-wrap'));
    const homeHeight=box(signedHost.querySelector('[data-account-home]')).height;
    const signoutHeight=box(signedHost.querySelector('[data-account-signout]')).height;
    const signedText=signedHost.textContent||'';
    signedHost.querySelector('[data-account-home]')?.click();
    signedCleanup?.();signedHost.remove();

    return{loginUse,signupUse,recoveryUse,loginArt,tabHeight,initialTabContract,arrowRightMode,arrowSelected,endMode,homeMode,guestHeight,guestText,guestHome,signedUses,heroArt,homeHeight,signoutHeight,signedText,signedHome,innerWidth,scrollWidth:document.documentElement.scrollWidth};
  });

  assert(result.loginUse==='assets/account-feature-icons.svg#sign-in','Account login state must render sign-in artwork.');
  assert(result.signupUse==='assets/account-feature-icons.svg#create-account','Account signup state must render create-account artwork.');
  assert(result.recoveryUse==='assets/account-feature-icons.svg#recovery','Account recovery state must render recovery artwork.');
  assert(new Set([result.loginUse,result.signupUse,result.recoveryUse]).size===3,'Account guest states must use distinct semantic artwork.');
  assert(result.loginArt.width>=48&&result.loginArt.height>=48,'Account guest artwork is not visibly rendered.');
  assert(result.initialTabContract.tablistRole==='tablist'&&result.initialTabContract.panelRole==='tabpanel','Account mode switcher must expose tablist/tabpanel semantics.');
  assert(result.initialTabContract.selected.join(',')==='true,false,false','Account must expose Sign in as the initially selected tab.');
  assert(result.initialTabContract.tabIndex.join(',')==='0,-1,-1','Account tabs must use one roving keyboard tab stop.');
  assert(result.initialTabContract.labelledBy==='bq-account-tab-login','Account tabpanel must be labelled by the selected tab.');
  assert(result.arrowRightMode==='signup','ArrowRight must move Account tab focus to Create account.');
  assert(result.arrowSelected.join(',')==='false,true,false','ArrowRight must automatically activate the newly focused Account tab.');
  assert(result.endMode==='recovery','End must move Account tab focus to Recover.');
  assert(result.homeMode==='login','Home must move Account tab focus to Sign in.');
  assert(result.tabHeight>=44&&result.guestHeight>=44,'Account guest controls fell below 44px.');
  assert(result.guestHome===1,'Continue as guest callback changed.');
  for(const text of['Recover account','Recovery code','Reset password'])assert(result.guestText.includes(text),`Account recovery text disappeared: ${text}`);

  for(const id of['profile','device','security'])assert(result.signedUses.includes(`assets/account-feature-icons.svg#${id}`),`Signed-in Account missing ${id} artwork.`);
  assert(result.heroArt.width>=48&&result.heroArt.height>=48,'Signed-in profile artwork is not visibly rendered.');
  assert(result.homeHeight>=44&&result.signoutHeight>=44,'Signed-in Account action target below 44px.');
  assert(result.signedText.includes('Remembered devices')&&result.signedText.includes('Security & recovery'),'Signed-in Account security/device text disappeared.');
  assert(result.signedHome===1,'Signed-in Return home callback changed.');
  assert(result.innerWidth===390,'Account Phase B browser acceptance did not execute at 390px.');
  assert(result.scrollWidth<=result.innerWidth+1,`Account Phase B introduced horizontal overflow: ${result.scrollWidth}px > ${result.innerWidth}px.`);
  assert(errors.length===0,`Unexpected Account Phase B console/page errors: ${errors.join(' | ')}`);
  await page.close();
  console.log('BibleQuest v3 Account Phase B mobile browser acceptance passed.');
}finally{await browser.close()}
