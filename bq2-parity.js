(()=>{'use strict';
const A=window.BQ2,D=window.BQ2_DATA;if(!A||!D)return;
const {esc}=A;
const native=[
  ['Daily Journey','Retrieve · Context · Learn · Apply · Reflect','#/mission'],
  ['Bible Reader','66 books · BSB + Tagalog','#/reader'],
  ['Bible Quiz','Recall, context and mixed challenges','#/games'],
  ['Book Recall','Large per-book recall decks','#/bookquiz'],
  ['Bible World','Visual Scripture journey and unlocks','#/world'],
  ['Transformation','12-dimension reflection and next steps','#/transform'],
  ['Play Together','Same-room rotating team play','#/together'],
  ['Kids Games','Memory, Hiragana and Bible games','#/kids'],
  ['Story Journey','Scene-by-scene Bible stories','#/study'],
  ['Wisdom Situations','Practical biblical application','#/study'],
  ['Deep Questions','Unscored discussion prompts','#/study'],
  ['Private Notes','Local private study notes','#/notes'],
  ['Recordings','Safe external recording library','#/recordings'],
  ['Couples & Family','Guided family discussion topics','#/family']
];
const standalone=[
  ['Transformation Pro','Original full assessment','transform.html'],
  ['Psychometrics','Original personality and insight suite','psychometrics.html'],
  ['Content Review','Doctrinal/content review workbench','content-review.html'],
  ['Admin','Original administration console','admin.html'],
  ['Admin Operations','Operational owner tools','admin-operations.html'],
  ['Reset / Recovery','Original local recovery page','reset.html']
];
const originalGroups=[
  ['Account & Cloud',[
    ['Accounts','Email/password signup and login'],['Recovery Codes','Private rotating account recovery'],['Cross-device Sync','Progress, Daily Journey and notes'],['Remembered Devices','Account security/device management']
  ]],
  ['Bible & Study',[
    ['Japanese 口語訳','Japanese reading, furigana and vocabulary'],['NLT Path','Live in-app translation path'],['ESV / NIV / AMP','Licensed-reader links'],['Verse Peek','Fast verse/context preview'],['STEPBible Context','Hebrew/Greek lexical context'],['Adaptive Review','Weak-area review and reinforcement'],['Guided Study','Expanded guided-study tools']
  ]],
  ['Community & Play',[
    ['Journey Groups','Group progress and encouragements'],['Live Rooms','Remote/shared live play'],['Congregation','Membership, roles and community tools'],['Recognition','Congregation achievements and recognition'],['Leaderboards','Trusted score events and rankings'],['Presence','Member/activity presence'],['Team Center','Team and group coordination']
  ]],
  ['Assignments & Ministry',[
    ['Assignments','Assignment center and pushes'],['Advanced Assignments','Expanded assignment workflows'],['Ministry Hub','Ministry-focused tools'],['Media Library','Original media and recordings library'],['Notifications','Inbox and notification center'],['Workspace','Shared study/workspace tools']
  ]],
  ['Growth & Personalization',[
    ['Personality Profile','Original profile insights'],['Avatars','Avatar vault and unlocks'],['Couples Cloud','Synced couples tools'],['Challenges','Linked activities and challenges'],['Innovation Suite','Original experimental learning tools'],['Accessibility','Journey accessibility support']
  ]],
  ['Safety & Operations',[
    ['Content Reporting','Report questionable content'],['Moderation','Runtime content moderation'],['Doctrinal Safety','Context/safety classification'],['Diagnostics','Client diagnostics and recovery'],['Source Labels','Source/translation attribution'],['Tutorial / Onboarding','Original guided onboarding trainer']
  ]]
];
function declaration(){return`<div class="declaration"><span class="cross">✝</span><span><strong>I confess that Jesus is Lord</strong> and the authority of my life.</span></div>`}
function home(){const s=A.state,m=A.missionState(),p=A.missionPct(),d=A.daily();
  const hubs=[
    ['read','▤','Read','Bible, context and study','#/reader'],
    ['play','◆','Play','Quizzes, recall and kids games','#/games'],
    ['grow','◌','Grow','Bible World and Transformation','#/world'],
    ['together','♟','Together','Family and group activities','#/together']
  ];
  A.$('#main').innerHTML=`<div class="parity-home">${declaration()}
    <section class="parity-hero"><div class="parity-hero-copy"><div class="eyebrow">BibleQuest · Scripture-first learning</div><h1>Know the Bible. Live what you learn.</h1><p>Games, stories, context, reflection and community tools — rebuilt on a stable core while preserving the original BibleQuest resources.</p></div><img class="parity-hero-art" src="assets/bq-pinoy-japan-hero.svg" alt="" aria-hidden="true"></section>
    <div class="parity-stats"><div class="parity-stat"><b>${s.profile.xp}</b><span>XP</span></div><div class="parity-stat"><b>${s.profile.streak}</b><span>Streak</span></div><div class="parity-stat"><b>${s.profile.totalActivities}</b><span>Activities</span></div><div class="parity-stat"><b>${s.badges.length}</b><span>Badges</span></div></div>
    <a class="parity-daily" href="#/mission"><span class="parity-daily-icon">✦</span><span><small>Today · ${esc(d.title)}</small><strong>${p===100?'Daily Journey complete':'Continue My Journey — 4 min'}</strong><p>Remember → read in context → learn → apply → reflect · ${m.done.length}/5 complete</p><span class="parity-progress"><span style="width:${p}%"></span></span></span><i>›</i></a>
    <div class="parity-label"><h2>Explore BibleQuest</h2><small>Original quality · clean core</small></div>
    <div class="parity-hubs">${hubs.map(([c,i,t,sub,r])=>`<a class="parity-hub ${c}" href="${r}"><span class="icon">${i}</span><strong>${t}</strong><span>${sub}</span></a>`).join('')}
      <a class="parity-hub full" href="#/features"><span class="icon">BQ</span><span><strong>All BibleQuest Features</strong><span>Accounts, Japanese, groups, ministry, assignments, media, admin, psychometrics and the complete original toolset</span></span></a>
    </div>
    <div class="parity-label"><h2>Quick access</h2><small>Learning first</small></div>
    <div class="parity-feature-grid"><a class="parity-feature native" href="#/bookquiz"><b>Book Recall</b><small>Large per-book question banks</small></a><a class="parity-feature native" href="#/study"><b>Study & Reflect</b><small>Stories, wisdom situations and deep questions</small></a><a class="parity-feature native" href="#/notes"><b>Private Notes</b><small>Local notes and reflections</small></a><a class="parity-feature native" href="#/recordings"><b>Recordings</b><small>Safe external recording library</small></a></div>
  </div>`;
}
function tile([name,sub,href],kind='native'){return`<a class="parity-feature ${kind}" href="${href}"><b>${esc(name)}</b><small>${esc(sub)}</small></a>`}
function originalTile([name,sub]){return`<a class="parity-feature compat" href="classic.html"><b>${esc(name)}</b><small>${esc(sub)} · Full original mode</small></a>`}
function features(){
  A.$('#main').innerHTML=`${A.pageHead('All BibleQuest Features','Complete feature surface from the original app, with stable clean replacements where available.','<a class="btn secondary" href="#/home">Home</a>')}
  <div class="parity-feature-intro"><div class="eyebrow">Parity architecture</div><h2>No original feature is discarded.</h2><p>The rebuilt core handles the features already rewritten cleanly. The complete latest original application is retained as an isolated compatibility mode for cloud, community, Japanese, ministry, assignment and administration capabilities while those modules are migrated one by one.</p></div>
  <div class="parity-mode-card" style="margin-top:12px"><img src="assets/avatar-scholar.webp" alt=""><div><h3>Full Original Feature Mode</h3><p>Opens the latest original BibleQuest UI and complete feature chain without replacing the clean host service worker. Use this for any original capability not yet native in the rebuilt shell.</p><a class="btn" href="classic.html">Open complete BibleQuest</a></div></div>
  <div class="parity-label"><h2>Clean native features</h2><small>${native.length} capabilities</small></div><div class="parity-feature-grid">${native.map(x=>tile(x)).join('')}</div>
  <div class="parity-label"><h2>Isolated full tools</h2><small>Original standalone applications</small></div><div class="parity-feature-grid">${standalone.map(x=>tile(x,'standalone')).join('')}</div>
  <div class="parity-label"><h2>Original compatibility coverage</h2><small>Preserved from current main</small></div><div class="parity-groups">${originalGroups.map(([title,items])=>`<section class="parity-group"><h3>${esc(title)}</h3><div class="parity-feature-grid">${items.map(originalTile).join('')}</div></section>`).join('')}</div>
  <div class="parity-note" style="margin-top:12px"><strong>Important:</strong> “Original” means the latest current-main capability is preserved and available in compatibility mode. “Clean” means it has already been rewritten on the new explicit runtime. The target is to convert every Original item to Clean without removing functionality during the transition.</div>`;
}
function tuneShell(){document.body.classList.add('bq-parity');const small=document.querySelector('.brand-copy small');if(small)small.textContent='Learn · Play · Grow'}
A.route('home',home);A.route('features',features);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tuneShell,{once:true});else tuneShell();
})();
