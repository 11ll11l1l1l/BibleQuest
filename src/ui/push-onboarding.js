const DEFAULT_CATEGORIES=Object.freeze(['assignment','ministry','calendar']);
const SEEN_PREFIX='bq:v5:push-onboarding-seen:';

const clean=value=>String(value??'').trim();

function installedApp(){
  try{
    if(globalThis.matchMedia?.('(display-mode: standalone)')?.matches)return true;
  }catch{}
  return globalThis.navigator?.standalone===true;
}

export function mountPushOnboarding({push,session,ownerStorage,eventTarget=globalThis.window,documentRef=globalThis.document}={}){
  let node=null,busy=false,disposed=false,installedThisSession=false;

  const currentUserId=()=>{
    const state=session?.getState?.()||{};
    return state.authenticated===true&&state.user?.id?clean(state.user.id):'';
  };
  const seenKey=userId=>`${SEEN_PREFIX}${userId}`;
  const wasSeen=userId=>{
    try{return ownerStorage?.getItem?.(seenKey(userId))==='1'}catch{return false}
  };
  const markSeen=userId=>{
    try{ownerStorage?.setItem?.(seenKey(userId),'1')}catch{}
  };
  const close=()=>{
    node?.remove?.();
    node=null;
  };
  const show=userId=>{
    if(disposed||node||!documentRef?.body)return false;
    const wrap=documentRef.createElement('div');
    wrap.className='bq-push-onboarding-backdrop';
    wrap.setAttribute('data-push-onboarding','');
    wrap.innerHTML=`<section class="bq-panel bq-push-onboarding-card" role="dialog" aria-modal="true" aria-labelledby="bqPushOnboardingTitle"><p class="bq-eyebrow">STAY CONNECTED</p><h2 id="bqPushOnboardingTitle">Enable BibleQuest notifications?</h2><p>Get assignment alerts, ministry updates, and calendar reminders even when BibleQuest is closed.</p><div class="bq-push-onboarding-actions"><button type="button" class="bq-primary-button" data-push-onboarding-enable>Enable notifications</button><button type="button" class="bq-secondary-button" data-push-onboarding-later>Not now</button></div><p class="bq-push-onboarding-status" data-push-onboarding-status aria-live="polite"></p></section>`;
    const enable=wrap.querySelector('[data-push-onboarding-enable]');
    const later=wrap.querySelector('[data-push-onboarding-later]');
    const status=wrap.querySelector('[data-push-onboarding-status]');
    enable?.addEventListener('click',async()=>{
      if(busy)return;
      busy=true;
      if(enable)enable.disabled=true;
      if(later)later.disabled=true;
      if(status)status.textContent='Opening the Android/browser notification permission request…';
      try{
        await push.enable(DEFAULT_CATEGORIES);
        markSeen(userId);
        if(status)status.textContent='Notifications are enabled on this device.';
        globalThis.setTimeout?.(()=>close(),650);
      }catch(error){
        if(status)status.textContent=error?.message||'Notifications could not be enabled.';
        if(enable)enable.disabled=false;
        if(later)later.disabled=false;
      }finally{busy=false}
    });
    later?.addEventListener('click',()=>{
      markSeen(userId);
      close();
    });
    documentRef.body.appendChild(wrap);
    enable?.focus?.();
    node=wrap;
    return true;
  };

  const maybePrompt=async({force=false}={})=>{
    if(disposed)return false;
    const state=session?.getState?.()||{};
    const userId=currentUserId();
    if(!userId||state.remoteAvailable===false)return false;
    let pushState;
    try{pushState=await push?.getState?.()}catch{return false}
    if(!pushState?.supported||pushState.enabled||pushState.permission==='denied'){
      if(pushState?.enabled)markSeen(userId);
      close();
      return false;
    }
    const shouldOffer=force||installedThisSession||installedApp();
    if(!shouldOffer||(!force&&wasSeen(userId)))return false;
    return show(userId);
  };

  const onInstalled=()=>{
    installedThisSession=true;
    void maybePrompt({force:true});
  };
  eventTarget?.addEventListener?.('appinstalled',onInstalled);

  return Object.freeze({
    maybePrompt,
    dispose(){
      if(disposed)return;
      disposed=true;
      eventTarget?.removeEventListener?.('appinstalled',onInstalled);
      close();
    }
  });
}
