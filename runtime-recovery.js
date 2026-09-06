(() => {
  'use strict';
  const inflight=new Map();
  let retryAction=null;
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const exists=fn=>{try{return Boolean(fn())}catch{return false}};
  const safe=s=>String(s||'').replace(/[<>]/g,'').slice(0,500);
  const closeSheet=()=>{document.getElementById('bqModernSheet')?.classList.add('hidden');document.body.classList.remove('modern-sheet-open')};
  const typedError=(message,kind)=>{const e=new Error(message);e.bqKind=kind;return e};
  async function waitFor(check,ms=900){const end=Date.now()+ms;while(Date.now()<end){if(exists(check))return true;await wait(60)}return exists(check)}
  async function recoverScript(src){
    if(!src)throw typedError('No recovery module was registered for this feature.','module');
    if(inflight.has(src))return inflight.get(src);
    const p=new Promise((resolve,reject)=>{
      const s=document.createElement('script');s.src=src;s.async=true;s.dataset.bqRecovery='1';
      const timer=setTimeout(()=>{s.remove();reject(typedError(`${src} did not load within 6 seconds.`,'module-timeout'))},6000);
      s.onload=()=>{clearTimeout(timer);resolve(true)};
      s.onerror=()=>{clearTimeout(timer);s.remove();reject(typedError(`${src} could not be loaded.`,'module'))};
      document.body.appendChild(s);
    }).finally(()=>inflight.delete(src));inflight.set(src,p);return p;
  }
  async function ensure(check,src=''){
    if(exists(check))return true;
    if(await waitFor(check,document.readyState==='loading'?1600:350))return true;
    if(src){await recoverScript(src);if(await waitFor(check,1200))return true}
    throw typedError(`Required feature capability${src?` from ${src}`:''} did not initialize.`,'module');
  }
  async function openApi(label,getter,method='open',src=''){
    await ensure(()=>typeof getter()?.[method]==='function',src);const api=getter(),fn=api?.[method];const out=fn.call(api);if(out&&typeof out.then==='function')await out;return true;
  }
  async function clickSelector(label,selector,src=''){
    await ensure(()=>document.querySelector(selector),src);const el=document.querySelector(selector);if(!el)throw typedError(`${label} launcher was not found.`,'module');el.click();return true;
  }
  const specs={
    'Daily Journey':()=>openApi('Daily Journey',()=>window.BQJourneyLoop,'open','journey-loop.js'),
    'Smart Review':()=>openApi('Smart Review',()=>window.BQOpenReview,'start','open-review.js'),
    'Quick Play':()=>clickSelector('Quick Play','[data-action="quick"]'),
    'Who Said It?':()=>clickSelector('Who Said It?','[data-who-said]','extra-games.js'),
    'What Happens Next?':()=>clickSelector('What Happens Next?','[data-story-next]','extra-games.js'),
    'Verse Order':()=>clickSelector('Verse Order','[data-sequence-open]','sequence.js'),
    'Bible Detective':()=>clickSelector('Bible Detective','[data-action="detective"]'),
    'Characters & Places':()=>openApi('Characters & Places',()=>window.BQExplorer,'open','innovation-suite.js'),
    'Timeline':()=>clickSelector('Timeline','[data-action="timeline"]'),
    'Context Mode':()=>clickSelector('Context Mode','[data-action="context"]'),
    'Bible Reader':()=>openApi('Bible Reader',()=>window.BQReader,'openLibrary','reader.js'),
    'Guided Study':()=>openApi('Guided Study',()=>window.BQStudy,'open','guided-study-expanded.js'),
    'Hebrew & Greek Context':()=>openApi('Hebrew & Greek Context',()=>window.BQContextLab,'open','context-lab.js'),
    'Bible Workspace':()=>openApi('Bible Workspace',()=>window.BQWorkspace,'open','workspace.js'),
    'Story Journey':()=>clickSelector('Story Journey','[data-storyjourney-open]','storyjourney.js'),
    'Recall Decks':()=>clickSelector('Recall Decks','[data-action="decks"]'),
    'Review Mistakes':()=>clickSelector('Review Mistakes','[data-action="review"]'),
    'My Mission':()=>openApi('My Mission',()=>window.BQMission,'open','innovation-suite.js'),
    'Bible World':()=>openApi('Bible World',()=>window.BQWorld,'open','innovation-suite.js'),
    'Avatar Vault':()=>openApi('Avatar Vault',()=>window.BQAvatarVault,'open','avatar-vault.js'),
    'Situations & Wisdom':()=>clickSelector('Situations & Wisdom','[data-action="situation"]'),
    'Transformation':()=>openApi('Transformation',()=>window.BQ_TRANSFORMATION,'open','transform-launcher.js'),
    'Think Deeper':()=>clickSelector('Think Deeper','[data-route="discuss"]'),
    'My Achievements':()=>openApi('My Achievements',()=>window.BQCommunity,'openBadges','community.js'),
    'Assignments & Tasks':()=>openApi('Assignments & Tasks',()=>window.BQAssignments,'open','assignment-center.js'),
    'Community Live':()=>openApi('Community Live',()=>window.BQPresence,'open','presence.js'),
    'Live BibleQuest Room':()=>openApi('Live BibleQuest Room',()=>window.BQLiveRooms,'open','live-rooms.js'),
    'Play Together':()=>openApi('Play Together',()=>window.BQGroupPlay,'open','group-play.js'),
    'Church Challenges':()=>openApi('Church Challenges',()=>window.BQChallenges,'open','innovation-suite.js'),
    'Couple Journey':()=>openApi('Couple Journey',()=>window.BQCoupleCloud,'open','couple-cloud.js'),
    'Grow Together':()=>clickSelector('Grow Together','[data-couples-open]','couples.js'),
    'Leaderboards & Awards':()=>openApi('Leaderboards & Awards',()=>window.BQCommunity,'openBoard','community.js'),
    'Congregation Badges':()=>openApi('Congregation Badges',()=>window.BQCommunity,'openBadges','community.js'),
    'Congregation Roster':()=>openApi('Congregation Roster',()=>window.BQCommunity,'openRoster','community.js')
  };
  const background=[
    ['Cloud Teams',()=>window.BQTeams,'team-center.js'],['Journey Groups',()=>window.BQJourneyGroups,'journey-groups.js'],['Ministry Hub',()=>window.BQMinistry,'ministry-hub.js'],['Videos & Media',()=>window.BQMediaLibrary,'media-library.js'],['Inbox',()=>window.BQNotifications,'notification-center.js'],['Leader Dashboard',()=>window.BQLeaderDashboard,'leader-dashboard.js'],['Security & Data',()=>window.BQSecurityCenter,'security-center.js'],['Advanced Assignments',()=>window.BQAssignmentAdvanced,'assignment-advanced.js'],['Content Reporting',()=>window.BQContentReport,'content-report.js'],['Verse Peek',()=>window.BQVersePeek,'verse-peek.js']
  ];
  async function failure(label,err,action){
    retryAction=action;
    const kind=err?.bqKind||'feature-launch';
    const diagnostic=await window.BQDiagnostics?.diagnose?.(err,{kind,feature:label}).catch?.(()=>null)||{
      code:navigator.onLine===false?'BQ-NET-001':'BQ-MOD-001',
      category:navigator.onLine===false?'Connection':'App module',
      title:navigator.onLine===false?'Device is offline':'Feature module failed',
      message:navigator.onLine===false?'BibleQuest cannot reach the internet from this device.':'BibleQuest could not initialize this feature module.',
      serverReachable:navigator.onLine===false?false:null
    };
    window.BQDiagnostics?.report?.(`${diagnostic.code} Feature launch failed: ${label}: ${err?.message||err}`,'',{kind,code:diagnostic.code,category:diagnostic.category,serverReachable:diagnostic.serverReachable,httpStatus:diagnostic.httpStatus,feature:label}).catch?.(()=>{});
    const sheet=document.getElementById('bqModernSheet'),host=sheet?.querySelector('#modernSheetContent');
    if(!sheet||!host){alert(`${label} could not open. Error ${diagnostic.code}: ${diagnostic.message}`);return}
    const networkLine=diagnostic.serverReachable===true?'Internet check passed — this points to an app/data problem.':diagnostic.serverReachable===false?'Internet/server reachability check failed — connection is the likely cause.':'BibleQuest classified the failure from the available signal.';
    host.innerHTML=`<header class="modern-sheet-head"><div><span>⚠️</span><div><small>${safe(diagnostic.code)} · ${safe(diagnostic.category)}</small><h2>${safe(label)} could not open</h2><p>${safe(diagnostic.message)}</p></div></div><button data-modern-close aria-label="Close">×</button></header><div class="modern-source-list"><article class="modern-feature-failure" role="alert"><b>${safe(diagnostic.title)}</b><p>${safe(networkLine)}</p><p><small>Technical detail: ${safe(err?.message||String(err))}</small></p><div class="actions"><button class="primary" data-runtime-retry>Try again</button><button class="secondary" data-modern-close>Close</button></div></article></div>`;
    sheet.classList.remove('hidden');document.body.classList.add('modern-sheet-open');
    host.querySelector('[data-runtime-retry]')?.addEventListener('click',()=>{closeSheet();setTimeout(()=>retryAction?.(),80)});
  }
  async function launch(label){const action=specs[label];if(!action)return false;closeSheet();try{await action();return true}catch(err){await failure(label,err,()=>launch(label));return false}}
  async function repairInjected(){for(const [label,check,src] of background){if(exists(check))continue;try{await ensure(check,src)}catch(err){const kind=err?.bqKind||'capability-recovery';const d=await window.BQDiagnostics?.diagnose?.(err,{kind,feature:label}).catch?.(()=>null);window.BQDiagnostics?.report?.(`${d?.code||'BQ-MOD-001'} Background feature missing: ${label}: ${err?.message||err}`,'',{kind,code:d?.code,category:d?.category,serverReachable:d?.serverReachable,httpStatus:d?.httpStatus,feature:label}).catch?.(()=>{})}}}
  document.addEventListener('click',e=>{
    const item=e.target.closest?.('[data-modern-item]');if(item){const label=item.querySelector('b')?.textContent?.trim();if(specs[label]){e.preventDefault();e.stopImmediatePropagation();launch(label);return}}
    if(e.target.closest?.('[data-modern-journey]')){e.preventDefault();e.stopImmediatePropagation();launch('Daily Journey');return}
    if(e.target.closest?.('[data-modern-review]')){e.preventDefault();e.stopImmediatePropagation();launch('Smart Review')}
  },true);
  window.addEventListener('load',()=>setTimeout(()=>repairInjected(),1800),{once:true});
  function audit(){return {launchers:Object.keys(specs),background:Object.fromEntries(background.map(([label,check])=>[label,exists(check)]))}}
  window.BQRuntimeRecovery={launch,recoverScript,ensure,audit,repairInjected,features:Object.keys(specs)};
})();