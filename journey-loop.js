(() => {
  const APP='biblequest_state_v4',GROWTH='biblequest_growth_v1',COMMUNITY='biblequest_community_v1';
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const parse=(k,f={})=>{try{return {...f,...JSON.parse(localStorage.getItem(k)||'{}')}}catch{return {...f}}};
  const localDay=(d=new Date())=>{const x=new Date(d.getTime()-d.getTimezoneOffset()*60000);return x.toISOString().slice(0,10)};
  const dayDiff=(a,b)=>Math.round((new Date(`${b}T12:00:00`).getTime()-new Date(`${a}T12:00:00`).getTime())/86400000);
  const monthKey=d=>String(d||localDay()).slice(0,7);
  const uid=s=>`${s}-${Math.random().toString(36).slice(2,7)}`;
  let booted=false,evidenceTimer=null;

  const STAGES=[
    {key:'creation',icon:'🌍',title:'Creation',cat:'Genesis',progress:m=>Math.min(100,(m.Genesis||0)*2),ref:{code:'GEN',chapter:1,verse:1}},
    {key:'patriarchs',icon:'🏕️',title:'Patriarchs',cat:'Genesis',progress:m=>Math.max(0,Math.min(100,((m.Genesis||0)-50)*2)),ref:{code:'GEN',chapter:12,verse:1}},
    {key:'exodus',icon:'🌊',title:'Exodus',cat:'Exodus',progress:m=>m.Exodus||0,ref:{code:'EXO',chapter:3,verse:1}},
    {key:'kingdom',icon:'🏰',title:'Kingdom',cat:'History',progress:m=>m.History||0,ref:{code:'1SA',chapter:16,verse:1}},
    {key:'wisdom',icon:'🎵',title:'Wisdom',cat:'Wisdom',progress:m=>m.Wisdom||0,ref:{code:'PSA',chapter:23,verse:1}},
    {key:'prophets',icon:'📜',title:'Prophets',cat:'Prophets',progress:m=>m.Prophets||0,ref:{code:'ISA',chapter:6,verse:1}},
    {key:'jesus',icon:'✝️',title:'Jesus',cat:'Gospels',progress:m=>m.Gospels||0,ref:{code:'JHN',chapter:3,verse:16}},
    {key:'church',icon:'🔥',title:'Early Church',cat:'Acts',progress:m=>m.Acts||0,ref:{code:'ACT',chapter:2,verse:1}},
    {key:'letters',icon:'✉️',title:'Letters',cat:'Letters',progress:m=>m.Letters||0,ref:{code:'ROM',chapter:12,verse:1}}
  ];

  const SEASONS={
    jesus7:{icon:'✝️',title:'7 Days With Jesus',days:7,desc:'Seven short Gospel-centered daily journeys.',refs:[['MRK',1,15,'Mark 1:15'],['MAT',5,3,'Matthew 5:3'],['LUK',10,27,'Luke 10:27'],['JHN',3,16,'John 3:16'],['MRK',10,45,'Mark 10:45'],['JHN',13,34,'John 13:34'],['MAT',28,19,'Matthew 28:19']]},
    proverbs14:{icon:'🧭',title:'14 Days of Wisdom',days:14,desc:'A two-week Proverbs rhythm with practical application.',refs:Array.from({length:14},(_,i)=>['PRO',i+1,1,`Proverbs ${i+1}:1`])},
    acts21:{icon:'🔥',title:'21 Days Through Acts',days:21,desc:'Follow witness, community, conflict and mission in Acts.',refs:Array.from({length:21},(_,i)=>['ACT',i+1,1,`Acts ${i+1}:1`])},
    exodus7:{icon:'🕵️',title:'Bible Detective: Exodus',days:7,desc:'A seven-day context and story challenge through Exodus.',refs:[[ 'EXO',1,8,'Exodus 1:8'],['EXO',3,2,'Exodus 3:2'],['EXO',5,1,'Exodus 5:1'],['EXO',12,13,'Exodus 12:13'],['EXO',14,21,'Exodus 14:21'],['EXO',19,5,'Exodus 19:5'],['EXO',20,1,'Exodus 20:1']]}
  };

  const SUPPORT={
    anxiety:{icon:'🌧️',title:'Anxiety / Worry',ref:{code:'PHP',chapter:4,verse:6,label:'Philippians 4:6–9'},prompt:'What is the passage asking you to bring to God, think about, or practice today?'},
    anger:{icon:'🌋',title:'Anger',ref:{code:'JAS',chapter:1,verse:19,label:'James 1:19–20'},prompt:'Where would being quick to listen and slow to speak change your next response?'},
    parenting:{icon:'🏡',title:'Parenting',ref:{code:'DEU',chapter:6,verse:6,label:'Deuteronomy 6:6–9'},prompt:'What ordinary daily moment could become a gentle teaching moment?'},
    marriage:{icon:'💞',title:'Marriage',ref:{code:'COL',chapter:3,verse:12,label:'Colossians 3:12–14'},prompt:'Which quality in this passage would most improve how you treat your spouse today?'},
    temptation:{icon:'🧱',title:'Temptation',ref:{code:'JAS',chapter:1,verse:12,label:'James 1:12–15'},prompt:'What desire, trigger, and next choice can you name clearly before acting?'},
    forgiveness:{icon:'🕊️',title:'Forgiveness',ref:{code:'COL',chapter:3,verse:13,label:'Colossians 3:13'},prompt:'What is forgiveness asking of you—and what wise boundary may still be needed?'},
    work:{icon:'🧰',title:'Work',ref:{code:'ECC',chapter:3,verse:12,label:'Ecclesiastes 3:12–13'},prompt:'What good can you faithfully do in the work that is actually in front of you?'},
    doubt:{icon:'❓',title:'Doubt',ref:{code:'MRK',chapter:9,verse:24,label:'Mark 9:24'},prompt:'What do you believe, and what part are you still honestly struggling to believe?'},
    prayer:{icon:'🙏',title:'Prayer',ref:{code:'MAT',chapter:6,verse:9,label:'Matthew 6:9–13'},prompt:'What does Jesus’ pattern of prayer put before your own requests?'},
    jesus:{icon:'✝️',title:'Understanding Jesus',ref:{code:'JHN',chapter:1,verse:14,label:'John 1:14'},prompt:'What does this passage actually say about Jesus before you add assumptions?' }
  };

  const REVEALS=[
    {icon:'🧭',title:'A disagreement became two mission paths',text:'Acts 15:36–41 records a sharp disagreement between Paul and Barnabas. They separated, and both continued ministry.',ref:'Acts 15:36–41'},
    {icon:'📜',title:'Ruth enters David’s family line',text:'The closing genealogy of Ruth connects Ruth and Boaz to David.',ref:'Ruth 4:13–22'},
    {icon:'🧠',title:'The Bereans checked what they heard',text:'Acts describes the Bereans receiving the message eagerly while examining the Scriptures daily.',ref:'Acts 17:10–12'},
    {icon:'👥',title:'Priscilla and Aquila helped Apollos',text:'They heard Apollos, took him aside, and explained the way of God to him more accurately.',ref:'Acts 18:24–26'},
    {icon:'🛤️',title:'Mark’s story continues after an early departure',text:'John Mark leaves the journey in Acts 13; later Paul asks Timothy to bring Mark because he is useful to him.',ref:'Acts 13:13 · 2 Timothy 4:11'},
    {icon:'🌊',title:'Psalm 23 includes danger, not only calm',text:'The psalm moves from green pastures to the darkest valley and even a table in the presence of enemies.',ref:'Psalm 23'},
    {icon:'🏠',title:'The early church learned around tables too',text:'Acts 2 describes teaching, fellowship, breaking bread, prayer, generosity and shared meals.',ref:'Acts 2:42–47'},
    {icon:'🌍',title:'The Ethiopian official was already reading Scripture',text:'Philip’s conversation begins with the official reading Isaiah and asking for help understanding it.',ref:'Acts 8:26–40'},
    {icon:'🔥',title:'Peter’s public courage follows earlier failure',text:'The Gospels record Peter denying Jesus; Acts 2 records Peter speaking publicly about Jesus in Jerusalem.',ref:'Luke 22:54–62 · Acts 2'},
    {icon:'🏙️',title:'Paul’s letters connect to real cities',text:'Acts places Paul in cities such as Corinth and Ephesus, helping readers connect letters with the story of early churches.',ref:'Acts 18–19 · 1 Corinthians · Ephesians'}
  ];

  function readEng(){const g=parse(GROWTH,{});return {version:2,daily:{},history:{},streak:{count:0,lastMeaningful:'',graceByMonth:{}},season:{key:'',progress:0,lastCountDate:'',completed:[]},...g.engagementV2}}
  function writeEng(e){const g=parse(GROWTH,{});g.engagementV2=e;localStorage.setItem(GROWTH,JSON.stringify(g));window.dispatchEvent(new CustomEvent('bq-journey-change'));return e}
  function app(){return parse(APP,{mastery:{},profile:{}})}
  function community(){return parse(COMMUNITY,{events:[]})}
  function deckSeen(a=app()){return Object.values(a.deckStats||{}).reduce((n,x)=>n+(Number(x?.seen)||0),0)}
  function metrics(){const a=app();return {answered:Number(a.answered)||0,correct:Number(a.correct)||0,situations:Number(a.situations)||0,rounds:Number(a.rounds)||0,xp:Number(a.xp)||0,deckSeen:deckSeen(a),mastery:{...(a.mastery||{})},events:(community().events||[]).length}}
  function due(){try{return Number(window.BQOpenReview?.countDue?.())||0}catch{return 0}}
  function activeName(){return window.BQCommunity?.read?.()?.activeName||app().profile?.name||'You'}
  function weakest(m=app().mastery||{}){const cats=['Genesis','Exodus','History','Wisdom','Prophets','Gospels','Acts','Letters'];return cats.sort((a,b)=>(m[a]||0)-(m[b]||0))[0]||'Gospels'}
  function categoryRef(cat){return STAGES.find(x=>x.cat===cat&&x.key!=='creation')?.ref||STAGES.find(x=>x.cat===cat)?.ref||{code:'JHN',chapter:3,verse:16}}
  function seasonRef(e){const s=SEASONS[e.season?.key];if(!s)return null;const n=Math.min(s.refs.length-1,Math.max(0,Number(e.season.progress)||0)),r=s.refs[n];return r?{code:r[0],chapter:r[1],verse:r[2],label:r[3]}:null}

  function createToday(e){const d=localDay(),base=metrics(),weak=weakest(base.mastery),focus=e.focusDate===d?SUPPORT[e.focusKey]:null,sref=seasonRef(e),ref=focus?.ref||sref||categoryRef(weak);const label=focus?.ref?.label||sref?.label||`${weak} context`;
    const tasks=[
      {id:'recall',type:'recall',icon:'🧠',title:due()?`Recall what is due (${due()})`:'Quick retrieval',sub:'Answer before revealing.',why:'Retrieval strengthens what you can actually remember—not just what feels familiar.',action:'review'},
      {id:'context',type:'context',icon:'🔎',title:`Read the context · ${label}`,sub:focus?`Today’s focus: ${focus.title}`:'Look closely at the passage and its surrounding context.',why:'Context protects us from building a conclusion on an isolated word or verse.',action:'context',ref},
      {id:'learn',type:'learn',icon:'📘',title:'Learn one new connection',sub:`Your lightest Journey area is ${weak}.`,why:'New information is more useful when it connects to the larger biblical story.',action:'study'},
      {id:'apply',type:'apply',icon:'🧭',title:'Why this matters today',sub:'Work through one practical biblical-wisdom situation.',why:'Bible knowledge becomes formation when it changes attention, choices, relationships and habits.',action:'wisdom'},
      {id:'reflect',type:'reflect',icon:'✍️',title:'One-sentence reflection',sub:focus?.prompt||'What is one thing you want to remember or practice?',why:'A short reflection forces you to name the point instead of merely finishing a screen.',action:'reflect'}
    ];
    e.daily[d]={date:d,createdAt:new Date().toISOString(),baseline:base,tasks,done:{},reflection:'',completedAt:'',revealId:'',focusKey:e.focusDate===d?e.focusKey:'',seasonKey:e.season?.key||''};
    return writeEng(e).daily[d]
  }
  function todayState(){let e=readEng(),d=localDay();return e.daily[d]||createToday(e)}

  function graceRemaining(e=readEng()){const m=monthKey(),used=Number(e.streak.graceByMonth?.[m])||0;return Math.max(0,2-used)}
  function recordMeaningful(source='activity'){
    let e=readEng(),d=localDay(),s=e.streak||{count:0,lastMeaningful:'',graceByMonth:{}};
    if(s.lastMeaningful===d)return s;
    if(!s.lastMeaningful)s.count=1;
    else{
      const gap=dayDiff(s.lastMeaningful,d),missed=Math.max(0,gap-1),m=monthKey(d),used=Number(s.graceByMonth?.[m])||0,available=Math.max(0,2-used);
      if(gap===1)s.count=(Number(s.count)||0)+1;
      else if(missed>0&&missed<=available){s.graceByMonth={...(s.graceByMonth||{}),[m]:used+missed};s.count=(Number(s.count)||0)+gap;s.lastGrace={date:d,used:missed};}
      else s.count=1;
    }
    s.lastMeaningful=d;e.streak=s;e.history[d]={...(e.history[d]||{}),active:true,lastActivity:new Date().toISOString(),source};writeEng(e);
    window.BQAccount?.track?.('journey_streak','meaningful_activity',{date:d,source,streak:s.count,grace_remaining:graceRemaining(e)}).catch?.(()=>{});
    return s;
  }

  async function syncDailyCloud(t){
    const client=window.BQAccount?.client?.()||window.BQ_SUPABASE_CLIENT;if(!client)return;
    const sr=await client.auth.getSession();const user=sr.data?.session?.user;if(!user)return;
    const done=Object.keys(t.done||{}).length,row={user_id:user.id,journey_date:t.date,status:t.completedAt?'complete':'started',completed_steps:done,total_steps:t.tasks.length,season_key:t.seasonKey||null,updated_at:new Date().toISOString()};
    await client.from('bible_daily_journey_status').upsert(row,{onConflict:'user_id,journey_date'}).catch?.(()=>{});
  }

  function updateHistory(e,t){const d=t.date,b=t.baseline||{},m=metrics(),old=e.history[d]||{};e.history[d]={...old,active:old.active||Object.keys(t.done||{}).length>0,answeredStart:b.answered??m.answered,answeredEnd:m.answered,deckStart:b.deckSeen??m.deckSeen,deckEnd:m.deckSeen,masteryStart:b.mastery||{},masteryEnd:m.mastery||{},tasksDone:Object.keys(t.done||{}).length,journeyComplete:Boolean(t.completedAt),updatedAt:new Date().toISOString()};}

  function completeTask(id,evidence='manual'){
    let e=readEng(),t=e.daily[localDay()]||createToday(e);if(t.done?.[id])return;
    t.done={...(t.done||{}),[id]:{at:new Date().toISOString(),evidence}};e.daily[t.date]=t;writeEng(e);recordMeaningful(`daily_${id}`);e=readEng();t=e.daily[localDay()];updateHistory(e,t);
    if(Object.keys(t.done).length===t.tasks.length&&!t.completedAt){t.completedAt=new Date().toISOString();t.revealId=String(Math.abs([...t.date].reduce((n,c)=>n+c.charCodeAt(0),0))%REVEALS.length);e.daily[t.date]=t;e.history[t.date]={...(e.history[t.date]||{}),journeyComplete:true};const season=SEASONS[e.season?.key];if(season&&e.season.lastCountDate!==t.date){e.season.progress=Math.min(season.days,(Number(e.season.progress)||0)+1);e.season.lastCountDate=t.date;if(e.season.progress>=season.days&&!e.season.completed?.includes(e.season.key))e.season.completed=[...(e.season.completed||[]),e.season.key]}
      window.BQCommunity?.awardPoints?.(activeName(),10,'consistency','Daily Journey',{date:t.date,completed:1});window.BQAccount?.track?.('daily_journey','completed',{date:t.date,season:e.season?.key||'',focus:t.focusKey||''}).catch?.(()=>{});
    }
    updateHistory(e,t);writeEng(e);syncDailyCloud(t);renderHome();if(t.completedAt)setTimeout(()=>openReveal(),250);
  }

  let activeTask='',contextOpenedAt=0,lastMetrics=metrics();
  function click(selector){const x=document.querySelector(selector);if(x){x.click();return true}return false}
  function launch(task){activeTask=task.id;if(task.action==='review'){if(!click('[data-open-review]'))click('[data-action="quick"]')}
    else if(task.action==='context'){contextOpenedAt=Date.now();window.BQContextLab?.open?.(task.ref)}
    else if(task.action==='study')window.BQStudy?.open?.();
    else if(task.action==='wisdom')click('[data-action="situation"]');
    else if(task.action==='reflect')openJourney(task.id);
  }
  function evidenceTick(){const m=metrics(),t=todayState();if(m.answered>lastMetrics.answered||m.situations>lastMetrics.situations||m.rounds>lastMetrics.rounds||m.deckSeen>lastMetrics.deckSeen||m.events>lastMetrics.events)recordMeaningful('app_activity');
    if(activeTask==='recall'&&m.answered>(t.baseline?.answered||0))completeTask('recall','answered');
    if(activeTask==='apply'&&m.situations>(t.baseline?.situations||0))completeTask('apply','wisdom_completed');
    if(activeTask==='learn'){const newer=(community().events||[]).some(x=>/Guided Study|Bible Explorer|Story Journey/i.test(String(x.source||''))&&new Date(x.at).getTime()>=new Date(t.createdAt).getTime());if(newer)completeTask('learn','learning_event')}
    if(activeTask==='context'){const layer=document.querySelector('#bqContextLab');if(layer&&!layer.classList.contains('hidden')){if(!contextOpenedAt)contextOpenedAt=Date.now()}else if(contextOpenedAt&&Date.now()-contextOpenedAt>6000){completeTask('context','context_read');activeTask='';contextOpenedAt=0}}
    lastMetrics=m;
  }

  function progressStages(){const m=app().mastery||{};return STAGES.map(s=>({...s,pct:Math.round(s.progress(m))}))}
  function currentStage(){const rows=progressStages();return rows.find(x=>x.pct<60)||rows[rows.length-1]}
  function stageHtml(){const rows=progressStages(),cur=currentStage();return `<section class="journey-path-card"><div class="journey-card-head"><div><small>YOUR BIBLE JOURNEY</small><b>${cur.icon} ${esc(cur.title)} is your next path marker</b></div><button data-journey-world>Open Bible World</button></div><div class="journey-path-scroll">${rows.map(x=>`<button class="journey-node ${x.key===cur.key?'current':''} ${x.pct>=60?'explored':''}" data-journey-world title="${esc(x.title)} ${x.pct}%"><span>${x.icon}</span><i></i><b>${esc(x.title)}</b><small>${x.pct}%</small></button>`).join('')}</div><p>Scripture is never locked. These markers show where your learning evidence is strongest and what to explore next.</p></section>`}

  function seasonHtml(e=readEng()){const s=SEASONS[e.season?.key];if(!s)return `<button class="journey-season-empty" data-journey-seasons><span>🌸</span><div><b>Start a short Season</b><small>7–21 day finish lines make a huge Bible feel manageable.</small></div><i>›</i></button>`;const pct=Math.round((Number(e.season.progress)||0)/s.days*100);return `<button class="journey-season" data-journey-seasons><span>${s.icon}</span><div><small>ACTIVE SEASON · DAY ${Math.min(s.days,(Number(e.season.progress)||0)+1)}/${s.days}</small><b>${esc(s.title)}</b><div class="journey-season-bar"><i style="width:${pct}%"></i></div></div><em>${pct}%</em></button>`}

  function homeCard(){const t=todayState(),done=Object.keys(t.done||{}).length,e=readEng(),complete=Boolean(t.completedAt),focus=t.focusKey?SUPPORT[t.focusKey]:null;return `<section class="today-journey-card ${complete?'complete':''}" data-today-journey><div class="today-journey-top"><div><small>${complete?'TODAY COMPLETE':'TODAY · 3–5 MIN'}</small><h2>${complete?'Journey complete':'Continue My Journey'}</h2><p>${complete?'Your learning is saved. Open today’s reveal or explore deeper.':`${done}/${t.tasks.length} steps · one meaningful activity protects your streak.`}</p></div><div class="journey-streak"><span>🔥</span><b>${e.streak.count||0}</b><small>${graceRemaining(e)} grace left</small></div></div><div class="today-step-dots">${t.tasks.map(x=>`<i class="${t.done?.[x.id]?'done':''}"></i>`).join('')}</div><div class="today-journey-actions"><button class="journey-primary" data-journey-open>${complete?'See today’s journey':'Continue · next step'}</button><button class="journey-secondary" data-journey-support>${focus?focus.icon+' '+esc(focus.title):'💬 What are you carrying today?'}</button>${complete?'<button class="journey-secondary" data-journey-reveal>🎁 Daily Reveal</button>':''}</div></section>`}

  function renderHome(){const home=document.querySelector('.modern-home');if(!home)return;document.body.classList.add('bq-engagement-home');let wrap=home.querySelector('.bq-engagement-stack');if(!wrap){wrap=document.createElement('div');wrap.className='bq-engagement-stack';const hero=home.querySelector('.bq-pinoy-hero');(hero||home.firstElementChild)?.insertAdjacentElement(hero?'afterend':'beforebegin',wrap)}wrap.innerHTML=homeCard()+seasonHtml()+stageHtml()+`<div class="journey-mini-row"><button data-journey-recap>📊 Weekly recap</button><button data-journey-groups>👥 Journey Groups</button></div>`;bindHome(wrap)}
  function bindHome(root){root.querySelector('[data-journey-open]')?.addEventListener('click',()=>openJourney());root.querySelector('[data-journey-support]')?.addEventListener('click',openSupport);root.querySelector('[data-journey-reveal]')?.addEventListener('click',openReveal);root.querySelector('[data-journey-seasons]')?.addEventListener('click',openSeasons);root.querySelectorAll('[data-journey-world]').forEach(b=>b.onclick=()=>window.BQWorld?.open?.());root.querySelector('[data-journey-recap]')?.addEventListener('click',openRecap);root.querySelector('[data-journey-groups]')?.addEventListener('click',()=>window.BQJourneyGroups?.open?.())}

  function layer(){let x=document.getElementById('bqJourneyLoop');if(!x){x=document.createElement('div');x.id='bqJourneyLoop';x.className='journey-loop-layer hidden';document.body.appendChild(x)}return x}
  function show(html){const x=layer();x.innerHTML=`<main class="journey-loop-app">${html}</main>`;x.classList.remove('hidden');document.body.classList.add('journey-loop-open');x.scrollTop=0;return x}
  function close(){layer().classList.add('hidden');document.body.classList.remove('journey-loop-open');renderHome()}

  function openJourney(scrollId=''){const t=todayState(),done=Object.keys(t.done||{}).length,e=readEng(),x=show(`<header class="journey-loop-head"><button data-journey-close>← BibleQuest</button><b>Today’s Journey</b><span>${done}/${t.tasks.length}</span></header><section class="journey-loop-hero"><small>ONE PATH · LESS CHOICE OVERLOAD</small><h1>${t.completedAt?'You finished today’s core journey.':'Five small movements. One clear next step.'}</h1><p>One meaningful activity keeps the habit alive. Finish all five for full Journey progress and today’s learning reveal.</p></section>${t.tasks.map((task,i)=>`<article class="journey-task ${t.done?.[task.id]?'done':''}" data-task="${task.id}"><div class="journey-task-num">${t.done?.[task.id]?'✓':i+1}</div><div><small>${task.type.toUpperCase()}</small><h2>${task.icon} ${esc(task.title)}</h2><p>${esc(task.sub)}</p>${t.done?.[task.id]?`<div class="journey-why"><b>Why this matters</b>${esc(task.why)}</div>`:''}${task.id==='reflect'?`<textarea data-journey-reflection placeholder="${esc(task.sub)}">${esc(t.reflection||'')}</textarea>`:''}</div><button data-task-action="${task.id}">${t.done?.[task.id]?'Done':task.id==='reflect'?'Save':'Start'}</button></article>`).join('')}${t.completedAt?`<button class="journey-reveal-cta" data-journey-reveal>🎁 Reveal today’s discovery</button>`:''}<section class="journey-streak-detail"><div><span>🔥</span><b>${e.streak.count||0}-day Journey Streak</b><small>Only one meaningful Bible activity is required each day.</small></div><div><b>${graceRemaining(e)}</b><small>Grace Days left this month</small></div></section>`);
    x.querySelector('[data-journey-close]').onclick=close;x.querySelector('[data-journey-reveal]')?.addEventListener('click',openReveal);x.querySelectorAll('[data-task-action]').forEach(b=>b.onclick=()=>{const id=b.dataset.taskAction,task=t.tasks.find(z=>z.id===id);if(t.done?.[id])return;if(id==='reflect'){const text=x.querySelector('[data-journey-reflection]')?.value?.trim()||'';if(text.length<12){x.querySelector('[data-journey-reflection]')?.focus();return}let en=readEng(),tt=en.daily[localDay()];tt.reflection=text.slice(0,1200);en.daily[tt.date]=tt;writeEng(en);window.BQAccount?.track?.('daily_journey','reflection_saved',{date:tt.date,length:text.length}).catch?.(()=>{});completeTask('reflect','reflection_saved');openJourney('reflect');return}launch(task);b.textContent='Return after finishing';});if(scrollId)x.querySelector(`[data-task="${scrollId}"]`)?.scrollIntoView({block:'center'})}

  function openSupport(){const e=readEng(),d=localDay(),x=show(`<header class="journey-loop-head"><button data-journey-close>← Today</button><b>What are you carrying today?</b><span>💬</span></header><section class="support-intro"><h1>Choose one area. BibleQuest will point you to Scripture—not pretend one verse solves everything.</h1><p>The passage, context and your real situation still require careful thought, prayer and sometimes help from trusted people.</p></section><div class="support-grid">${Object.entries(SUPPORT).map(([k,v])=>`<button data-support="${k}" class="${e.focusDate===d&&e.focusKey===k?'active':''}"><span>${v.icon}</span><b>${esc(v.title)}</b><small>${esc(v.ref.label)}</small></button>`).join('')}</div>`);x.querySelector('[data-journey-close]').onclick=()=>openJourney();x.querySelectorAll('[data-support]').forEach(b=>b.onclick=()=>{let en=readEng();en.focusKey=b.dataset.support;en.focusDate=d;delete en.daily[d];writeEng(en);createToday(en);openJourney()})}

  function openSeasons(){const e=readEng(),x=show(`<header class="journey-loop-head"><button data-journey-close>← Today</button><b>Short Seasons</b><span>🌸</span></header><section class="support-intro"><h1>Frequent finish lines.</h1><p>Seasons steer the context passage inside your normal Daily Journey. They never lock the rest of the Bible.</p></section><div class="season-grid">${Object.entries(SEASONS).map(([k,s])=>`<article class="season-option ${e.season?.key===k?'active':''}"><span>${s.icon}</span><div><small>${s.days} DAYS</small><h2>${esc(s.title)}</h2><p>${esc(s.desc)}</p></div><button data-season="${k}">${e.season?.key===k?'Active':'Start'}</button></article>`).join('')}</div>${e.season?.key?'<button class="season-stop" data-season-stop>Pause current Season</button>':''}`);x.querySelector('[data-journey-close]').onclick=close;x.querySelectorAll('[data-season]').forEach(b=>b.onclick=()=>{let en=readEng();en.season={key:b.dataset.season,progress:0,lastCountDate:'',completed:en.season?.completed||[]};delete en.daily[localDay()];writeEng(en);createToday(en);close()});x.querySelector('[data-season-stop]')?.addEventListener('click',()=>{let en=readEng();en.season={key:'',progress:0,lastCountDate:'',completed:en.season?.completed||[]};delete en.daily[localDay()];writeEng(en);createToday(en);close()})}

  function openReveal(){const t=todayState();if(!t.completedAt){openJourney();return}const r=REVEALS[Number(t.revealId)||0]||REVEALS[0],x=show(`<header class="journey-loop-head"><button data-journey-close>← Journey</button><b>Daily Reveal</b><span>🎁</span></header><section class="daily-reveal"><div>${r.icon}</div><small>THE REWARD TEACHES TOO</small><h1>${esc(r.title)}</h1><p>${esc(r.text)}</p><b>${esc(r.ref)}</b><button data-reveal-context>Explore the Bible again →</button></section>`);x.querySelector('[data-journey-close]').onclick=close;x.querySelector('[data-reveal-context]').onclick=()=>{close();window.BQWorld?.open?.()}}

  function openRecap(){const e=readEng(),today=localDay(),days=Object.entries(e.history||{}).filter(([d])=>{const n=dayDiff(d,today);return n>=0&&n<=6}),active=days.filter(([,v])=>v.active).length,complete=days.filter(([,v])=>v.journeyComplete).length,questions=days.reduce((n,[,v])=>n+Math.max(0,(v.answeredEnd||0)-(v.answeredStart||0)),0),recalls=days.filter(([,v])=>(v.tasksDone||0)>0).length,m=app().mastery||{},strong=Object.entries(m).sort((a,b)=>(b[1]||0)-(a[1]||0))[0]?.[0]||'Gospels',weak=weakest(m),gains={};days.forEach(([,v])=>Object.keys(v.masteryEnd||{}).forEach(k=>gains[k]=(gains[k]||0)+Math.max(0,(v.masteryEnd[k]||0)-(v.masteryStart?.[k]||0))));const improving=Object.entries(gains).sort((a,b)=>b[1]-a[1])[0]?.[0]||weak,x=show(`<header class="journey-loop-head"><button data-journey-close>← BibleQuest</button><b>Your Week</b><span>📊</span></header><section class="weekly-recap"><small>LAST 7 DAYS</small><h1>${active} active day${active===1?'':'s'} · ${complete} full journey${complete===1?'':'s'}</h1><div class="recap-grid"><article><b>${questions}</b><small>questions answered</small></article><article><b>${recalls}</b><small>days with Journey evidence</small></article><article><b>${esc(strong)}</b><small>strongest area</small></article><article><b>${esc(improving)}</b><small>improving focus</small></article></div><div class="recap-objective"><small>ONE OBJECTIVE FOR NEXT WEEK</small><h2>Strengthen ${esc(weak)}</h2><p>Your current learning evidence is lightest here. BibleQuest will quietly bring this area back into Daily Journeys.</p><button data-recap-start>Start today’s next step →</button></div></section>`);x.querySelector('[data-journey-close]').onclick=close;x.querySelector('[data-recap-start]').onclick=()=>openJourney()}

  function boot(){
    if(booted)return;
    booted=true;
    todayState();
    renderHome();
    evidenceTimer=setInterval(evidenceTick,1200);
    window.addEventListener('bq-modern-home-rendered',renderHome);
    window.addEventListener('bq-community-change',evidenceTick);
    window.addEventListener('bq-account-profile',renderHome);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){evidenceTick();renderHome()}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,420),{once:true});
  else setTimeout(boot,0);
  setTimeout(boot,900);
  window.BQJourneyLoop={open:openJourney,openRecap,openSupport,openSeasons,completeTask,recordMeaningful,read:readEng,render:renderHome,diagnostics:()=>({booted,evidenceTimerActive:Boolean(evidenceTimer)})};
})();
