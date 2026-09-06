(() => {
  const TRANSFORM_STORE='biblequest_transformation_v1';
  const FACTORS=['E','A','C','S','O'];
  let activeFeature='',activeUntil=0;

  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const isObject=v=>Boolean(v&&typeof v==='object'&&!Array.isArray(v));
  const finite=v=>Number.isFinite(Number(v));
  const has=selector=>Boolean(document.querySelector(selector));

  function storageAvailable(){
    try{
      const key='__bq_storage_probe__';
      localStorage.setItem(key,'1');
      localStorage.removeItem(key);
      return true;
    }catch{return false}
  }

  function validPersonalityResult(result){
    if(!isObject(result)||!isObject(result.scores))return false;
    return FACTORS.every(k=>{
      const s=result.scores[k];
      return isObject(s)&&finite(s.mean)&&finite(s.raw)&&finite(s.index)&&typeof s.band==='string';
    });
  }

  function validBiasResult(result){
    return isObject(result)&&isObject(result.binary)&&finite(result.resistance)&&finite(result.accuracy)&&finite(result.meanConfidence)&&finite(result.gap);
  }

  function repairTransformationState(){
    const external=window.BQTransformStateGuard?.sanitize;
    if(typeof external==='function'){
      try{return external()}catch{}
    }
    if(!storageAvailable())return {ok:false,reason:'Device storage is unavailable'};
    try{
      const raw=JSON.parse(localStorage.getItem(TRANSFORM_STORE)||'{}');
      const data=isObject(raw)?raw:{};
      let changed=!isObject(raw);
      if(!isObject(data.personalityAnswers)){data.personalityAnswers={};changed=true}
      if(!isObject(data.biasAnswers)){data.biasAnswers={};changed=true}
      if(!isObject(data.calibration)){data.calibration={};changed=true}
      if(!Array.isArray(data.history)){data.history=[];changed=true}
      if(data.personalityResult&&!validPersonalityResult(data.personalityResult)){data.personalityResult=null;changed=true}
      if(data.biasResult&&!validBiasResult(data.biasResult)){data.biasResult=null;changed=true}
      if(changed)localStorage.setItem(TRANSFORM_STORE,JSON.stringify(data));
      return {ok:true,repaired:changed};
    }catch{
      try{localStorage.setItem(TRANSFORM_STORE,JSON.stringify({personalityAnswers:{},personalityResult:null,biasAnswers:{},calibration:{},biasResult:null,history:[]}));return {ok:true,repaired:true}}
      catch{return {ok:false,reason:'Transformation progress could not be read safely'}}
    }
  }

  function style(){
    if(document.getElementById('bqOperationalStyle'))return;
    const s=document.createElement('style');
    s.id='bqOperationalStyle';
    s.textContent=`
      .bq-operational-recovery{position:fixed;left:50%;bottom:calc(76px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:190;width:min(560px,calc(100% - 24px));background:#fffdf8;border:1px solid #e2d7c5;border-radius:18px;box-shadow:0 16px 50px rgba(35,45,39,.24);padding:14px;color:#25332b}
      .bq-operational-recovery b{display:block;font-size:14px}.bq-operational-recovery p{margin:5px 0 10px;color:#667069;font-size:11px;line-height:1.45}.bq-operational-actions{display:flex;gap:7px;flex-wrap:wrap}.bq-operational-actions button{min-height:40px;border-radius:12px;padding:8px 12px;font-weight:850}.bq-operational-home{border:0;background:#4f8352;color:#fff}.bq-operational-close{border:1px solid #ded5c5;background:#fff;color:#25332b}
      .transform-safe-close{width:40px;height:40px;flex:0 0 40px;border:1px solid #ddd1e8;border-radius:12px;background:#fff;color:#594b64;font-size:22px;line-height:1;display:grid;place-items:center}
      .transform-top .bq-transform-title-actions{display:flex;align-items:center;gap:7px}
    `;
    document.head.appendChild(s);
  }

  function home(){
    document.querySelector('.bq-operational-recovery')?.remove();
    const homeButton=document.querySelector('.bottom [data-route="home"], [data-route="home"]');
    if(homeButton){homeButton.click();return}
    location.href=new URL('./',location.href).href;
  }

  function showRecovery(feature,error){
    style();
    document.querySelector('.bq-operational-recovery')?.remove();
    const box=document.createElement('section');
    box.className='bq-operational-recovery';
    box.setAttribute('role','alert');
    const detail=String(error?.message||error||'The feature did not finish opening.').slice(0,240);
    box.innerHTML=`<b>${esc(feature||'BibleQuest')} recovered from an error.</b><p>${esc(detail)} Your main BibleQuest session is still available.</p><div class="bq-operational-actions"><button type="button" class="bq-operational-home">Go Home</button><button type="button" class="bq-operational-close">Dismiss</button></div>`;
    box.querySelector('.bq-operational-home').onclick=home;
    box.querySelector('.bq-operational-close').onclick=()=>box.remove();
    document.body.appendChild(box);
    console.error(`BibleQuest operational recovery: ${feature}`,error);
  }

  function markFeature(name){activeFeature=name;activeUntil=Date.now()+3000}
  function clearFeatureSoon(){setTimeout(()=>{if(Date.now()>=activeUntil)activeFeature=''},3100)}

  function guardCall(name,fn,ctx,args){
    markFeature(name);
    try{
      const result=fn.apply(ctx,args);
      if(result&&typeof result.then==='function')return result.catch(err=>{showRecovery(name,err);return undefined}).finally(clearFeatureSoon);
      clearFeatureSoon();
      return result;
    }catch(err){showRecovery(name,err);clearFeatureSoon();return undefined}
  }

  function wrapMethod(globalName,method,label){
    const api=window[globalName],fn=api?.[method];
    if(typeof fn!=='function'||fn.__bqOperationalWrapped)return false;
    const wrapped=function(...args){return guardCall(label,fn,this,args)};
    wrapped.__bqOperationalWrapped=true;
    wrapped.__bqOperationalOriginal=fn;
    api[method]=wrapped;
    return true;
  }

  function enhanceTransform(){
    const overlay=document.querySelector('.bq-transform-overlay');
    if(!overlay)return false;
    const top=overlay.querySelector('.transform-top');
    if(!top)return true;
    const chip=top.querySelector('.local-chip');
    const privateLabel='🔒 private on this device';
    if(chip&&chip.textContent!==privateLabel)chip.textContent=privateLabel;
    if(!top.querySelector('[data-transform-safe-close]')){
      const close=document.createElement('button');
      close.type='button';
      close.className='transform-safe-close';
      close.dataset.transformSafeClose='1';
      close.setAttribute('aria-label','Close Transformation');
      close.textContent='×';
      close.onclick=home;
      let actions=top.querySelector('.bq-transform-title-actions');
      if(!actions){
        actions=document.createElement('div');
        actions.className='bq-transform-title-actions';
        const chipNode=top.querySelector('.local-chip');
        if(chipNode)actions.appendChild(chipNode);
        top.appendChild(actions);
      }
      actions.appendChild(close);
    }
    return true;
  }

  function scheduleTransformEnhancement(){
    requestAnimationFrame(()=>requestAnimationFrame(()=>enhanceTransform()));
  }

  function hardenTransformation(){
    const api=window.BQ_TRANSFORMATION;
    const raw=api?.open;
    if(typeof raw!=='function'||raw.__bqOperationalWrapped)return;
    const wrapped=function(...args){
      markFeature('Transformation');
      const state=repairTransformationState();
      if(!state.ok){showRecovery('Transformation',new Error(`${state.reason}. This feature stores assessment progress on this device.`));clearFeatureSoon();return}
      try{
        const result=raw.apply(this,args);
        scheduleTransformEnhancement();
        clearFeatureSoon();
        return result;
      }catch(err){showRecovery('Transformation',err);clearFeatureSoon();return undefined}
    };
    wrapped.__bqOperationalWrapped=true;
    wrapped.__bqOperationalOriginal=raw;
    api.open=wrapped;
  }

  const REQUIREMENTS={
    'Daily 5':()=>has('[data-action="daily"]'),
    'Smart Review':()=>has('[data-open-review]'),
    'Quick Play':()=>has('[data-action="quick"]'),
    'Who Said It?':()=>has('[data-who-said]'),
    'What Happens Next?':()=>has('[data-story-next]'),
    'Verse Order':()=>has('[data-sequence-open]'),
    'Bible Detective':()=>has('[data-action="detective"]'),
    'Characters & Places':()=>typeof window.BQExplorer?.open==='function',
    'Timeline':()=>has('[data-action="timeline"]'),
    'Context Mode':()=>has('[data-action="context"]'),
    'Bible Reader':()=>has('[data-reader-open]'),
    'Guided Study':()=>typeof window.BQStudy?.open==='function',
    'Hebrew & Greek Context':()=>typeof window.BQContextLab?.open==='function',
    'Bible Workspace':()=>typeof window.BQWorkspace?.open==='function',
    'Story Journey':()=>has('[data-storyjourney-open]'),
    'Recall Decks':()=>has('[data-action="decks"]'),
    'Review Mistakes':()=>has('[data-action="review"]'),
    'My Mission':()=>typeof window.BQMission?.open==='function',
    'Bible World':()=>typeof window.BQWorld?.open==='function',
    'Avatar Vault':()=>typeof window.BQAvatarVault?.open==='function',
    'Situations & Wisdom':()=>has('[data-action="situation"]'),
    'Transformation':()=>typeof window.BQ_TRANSFORMATION?.open==='function',
    'Think Deeper':()=>has('[data-route="discuss"]'),
    'My Achievements':()=>typeof window.BQCommunity?.openBadges==='function',
    'Assignments & Tasks':()=>typeof window.BQAssignments?.open==='function',
    'Community Live':()=>typeof window.BQPresence?.open==='function',
    'Live BibleQuest Room':()=>typeof window.BQLiveRooms?.open==='function',
    'Play Together':()=>typeof window.BQGroupPlay?.open==='function',
    'Church Challenges':()=>typeof window.BQChallenges?.open==='function',
    'Couple Journey':()=>typeof window.BQCoupleCloud?.open==='function',
    'Grow Together':()=>has('[data-couples-open]'),
    'Leaderboards & Awards':()=>typeof window.BQCommunity?.openBoard==='function',
    'Congregation Badges':()=>typeof window.BQCommunity?.openBadges==='function',
    'Congregation Roster':()=>typeof window.BQCommunity?.openRoster==='function'
  };

  const ACTIVE_LAYERS=[
    ['Transformation','.bq-transform-overlay'],['BibleQuest Game','#bqExtraGameLayer:not(.hidden)'],['Bible Reader','.reader-app'],
    ['Daily Journey','#bqJourneyLoop:not(.hidden)'],['Avatar Vault','#bqAvatarVault:not(.hidden)'],['Assignments & Tasks','#bqAssignmentLayer:not(.hidden)'],
    ['Community Live','#bqPresenceLayer:not(.hidden)'],['Hebrew & Greek Context','#bqContextLab:not(.hidden)'],['Live BibleQuest Room','#bqRoomLayer:not(.hidden)']
  ];

  function markVisibleFeature(target){
    for(const [name,selector] of ACTIVE_LAYERS){if(target.closest(selector)){markFeature(name);clearFeatureSoon();return true}}
    return false;
  }

  function preflightClick(e){
    const target=e.target instanceof Element?e.target:null;
    if(!target)return;
    if(markVisibleFeature(target))return;
    const transformTab=target.closest('[data-transform-tab]');
    if(transformTab){
      if(typeof window.BQ_TRANSFORMATION?.open!=='function'){
        e.preventDefault();e.stopImmediatePropagation();showRecovery('Transformation',new Error('The Transformation module did not load.'));return
      }
      const state=repairTransformationState();
      if(!state.ok){e.preventDefault();e.stopImmediatePropagation();showRecovery('Transformation',new Error(state.reason));return}
      markFeature('Transformation');
      scheduleTransformEnhancement();
      clearFeatureSoon();
      return;
    }
    const item=target.closest('[data-modern-item]');
    if(!item)return;
    const label=item.querySelector('b')?.textContent?.trim()||'';
    const check=REQUIREMENTS[label];
    if(check&&!check()){
      e.preventDefault();e.stopImmediatePropagation();showRecovery(label,new Error('This feature entry point did not load completely. The rest of BibleQuest can continue.'));
    }else if(label){markFeature(label);clearFeatureSoon()}
  }

  function installGuards(){
    style();
    hardenTransformation();
    [
      ['BQStudy','open','Guided Study'],['BQContextLab','open','Hebrew & Greek Context'],['BQWorkspace','open','Bible Workspace'],
      ['BQMission','open','My Mission'],['BQWorld','open','Bible World'],['BQAvatarVault','open','Avatar Vault'],
      ['BQAssignments','open','Assignments & Tasks'],['BQPresence','open','Community Live'],['BQLiveRooms','open','Live BibleQuest Room'],
      ['BQGroupPlay','open','Play Together'],['BQChallenges','open','Church Challenges'],['BQCoupleCloud','open','Couple Journey'],
      ['BQCommunity','openBoard','Leaderboards & Awards'],['BQCommunity','openBadges','Achievements'],['BQCommunity','openRoster','Congregation Roster']
    ].forEach(x=>wrapMethod(...x));
    enhanceTransform();
  }

  document.addEventListener('click',preflightClick,true);
  window.addEventListener('error',e=>{
    if(activeFeature&&Date.now()<activeUntil)showRecovery(activeFeature,e.error||new Error(e.message||'Unexpected feature error'));
  });
  window.addEventListener('unhandledrejection',e=>{
    if(activeFeature&&Date.now()<activeUntil){e.preventDefault();showRecovery(activeFeature,e.reason||new Error('A feature operation failed'))}
  });

  installGuards();
  setTimeout(installGuards,300);
  setTimeout(installGuards,1200);

  window.BQOperational={
    repairTransformationState,
    recover:showRecovery,
    health:()=>Object.fromEntries(Object.entries(REQUIREMENTS).map(([name,check])=>[name,Boolean(check())])),
    storageAvailable,
    enhanceTransform
  };
})();