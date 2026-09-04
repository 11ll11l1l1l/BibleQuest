(() => {
  const APP='biblequest_state_v4';
  const GROWTH='biblequest_growth_v1';
  const LEARNING='biblequest_learning_v1';
  const STORE='biblequest_engagement_v3';

  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const read=(k,f={})=>{try{return {...f,...JSON.parse(localStorage.getItem(k)||'{}')}}catch{return {...f}}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const localDay=(d=new Date())=>{const x=new Date(d.getTime()-d.getTimezoneOffset()*60000);return x.toISOString().slice(0,10)};
  const short=(s='',n=72)=>String(s).length>n?`${String(s).slice(0,n-1).trim()}…`:String(s);
  const category=(book='')=>{
    if(book==='Genesis')return 'Genesis';
    if(['Exodus','Leviticus','Numbers','Deuteronomy'].includes(book))return 'Exodus';
    if(['Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther'].includes(book))return 'History';
    if(['Job','Psalms','Proverbs','Ecclesiastes','Song of Songs'].includes(book))return 'Wisdom';
    if(['Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi'].includes(book))return 'Prophets';
    if(['Matthew','Mark','Luke','John'].includes(book))return 'Gospels';
    if(book==='Acts')return 'Acts';
    return 'Letters';
  };

  const PATH=[
    {key:'genesis',icon:'🌍',title:'Genesis',cat:'Genesis',ref:'Genesis 1–50',discoveries:[['📍','Eden → Ararat → Canaan',10],['👤','Abraham & Joseph',25],['🧰','Ark & covenant signs',45],['⏳','Creation → Flood → Patriarchs',65],['📖','The family story that leads to Israel',85]]},
    {key:'exodus',icon:'🌊',title:'Exodus',cat:'Exodus',ref:'Exodus–Deuteronomy',discoveries:[['📍','Egypt → Sinai → wilderness',10],['👤','Moses, Aaron & Miriam',25],['🧰','Passover & tabernacle',45],['⏳','Slavery → rescue → covenant',65],['📖','A people learning freedom and faithfulness',85]]},
    {key:'kingdom',icon:'🏰',title:'Kingdom',cat:'History',ref:'Joshua–Esther',discoveries:[['📍','Jerusalem & divided kingdoms',10],['👤','Samuel, David & the kings',25],['🧰','Temple & royal symbols',45],['⏳','Judges → monarchy → exile → return',65],['📖','Why Kings and Chronicles tell overlapping history',85]]},
    {key:'prophets',icon:'📜',title:'Prophets',cat:'Prophets',ref:'Isaiah–Malachi',discoveries:[['📍','Israel, Judah & exile',10],['👤','Isaiah, Jeremiah, Daniel & others',25],['🧰','Scrolls, signs & prophetic imagery',45],['⏳','Before exile → exile → return',65],['📖','Prophets speaking into real historical crises',85]]},
    {key:'jesus',icon:'✝️',title:'Jesus',cat:'Gospels',ref:'Matthew–John',discoveries:[['📍','Galilee → Jerusalem',10],['👤','Jesus and the disciples',25],['🧰','Parables, signs & Passover',45],['⏳','Ministry → cross → resurrection',65],['📖','Four Gospel witnesses, one central story',85]]},
    {key:'church',icon:'🔥',title:'Early Church',cat:'Acts',ref:'Acts + Letters',discoveries:[['📍','Jerusalem → Antioch → Rome',10],['👤','Peter, Paul, Barnabas & Priscilla',25],['🧰','Letters carried between real churches',45],['⏳','Pentecost → mission → expanding churches',65],['📖','How Acts connects to New Testament letters',85]]}
  ];

  const APPLICATIONS={
    q1:'Preparation and trust can exist together. When responsibility is clear, faithful action may include careful planning before the crisis arrives.',
    q2:'Family betrayal does not make evil good, but Joseph’s story helps distinguish human intent from what God can later bring through suffering.',
    q3:'Calling is not only about a dramatic moment. Moses’ story also includes resistance, preparation, community, and repeated obedience.',
    q4:'David and Goliath is not a promise that every risky fight will succeed. Read the passage for David’s trust, prior experience, and concern for God’s honor.',
    q5:'Confidence in God is different from reckless confidence. David remembered prior deliverance and acted with tools he actually knew how to use.',
    q6:'Daniel’s faithfulness cost him something. A useful application is to ask what convictions remain when obedience is inconvenient or risky.',
    q7:'Daniel did not invent a new spiritual habit during the crisis; he continued an established one. Durable habits are often built before pressure arrives.',
    q8:'Jonah shows that knowing God’s command does not automatically mean wanting God’s purposes. Resistance can reveal motives worth examining honestly.',
    q9:'Jesus enters an identifiable place and history. Christian faith makes historical claims, so context matters rather than treating the story as timeless symbolism only.',
    q10:'Jesus’ baptism is part of a larger Gospel scene about identity, obedience, and the beginning of public ministry; read beyond the isolated fact.',
    q11:'Fear can redirect attention even while a person is already acting in faith. In pressure, notice what changed before judging the whole attempt as failure.',
    q12:'The Lazarus story combines grief, delay, belief, and Jesus’ authority. Do not use the miracle to dismiss real mourning in the chapter.',
    q13:'The Samaritan’s compassion becomes concrete: he stops, treats wounds, transports the man, pays, and plans follow-up. Love of neighbor becomes costly action.',
    q14:'The parable answers “Who is my neighbor?” by shifting attention toward becoming a neighbor to someone in need, even across social boundaries.',
    q15:'Saul’s change redirects identity, relationships, and purpose. Real change is more than a new opinion; it reshapes what someone does next.',
    q16:'Saul’s temporary blindness makes him dependent on others immediately after a dramatic encounter. Transformation can begin with vulnerability rather than control.',
    q17:'Peter’s public courage in Acts comes after earlier failure in the Gospels. A past failure does not automatically determine a person’s future usefulness.',
    q18:'The rainbow is tied to covenant language in Genesis. Symbols matter most when their meaning comes from the passage, not from whatever meaning we attach later.',
    q19:'Ruth’s loyalty becomes sustained action through migration, work, and care. Commitment is visible in repeated choices, not only in emotional words.',
    q20:'Esther combines courage with timing, preparation, and risk awareness. Courage is not the same as acting without strategy.',
    q21:'Joseph names both intended evil and God’s ability to bring good. This avoids pretending harmful actions were harmless or morally acceptable.',
    q22:'Jesus answers status competition with service. In a team, family, church, or workplace, greatness can be tested by who is willing to serve rather than dominate.',
    q23:'Thomas’ doubt is handled inside relationship and evidence. Honest questions can be brought into discipleship rather than hidden behind performative certainty.',
    q24:'The older brother shows that outward obedience can coexist with resentment. When doing the right thing, motives and attitudes still deserve examination.'
  };

  function questionBank(){return Array.isArray(window.BQ_QUESTIONS)?window.BQ_QUESTIONS:[]}
  function focusProfile(){
    const bank=questionBank(),m=read(LEARNING,{questionStats:{}}),today=localDay();
    const rows=bank.map(q=>{
      const st=m.questionStats?.[q.id];
      if(!st?.seen)return null;
      const seen=Number(st.seen)||0,wrong=Number(st.wrong)||0,accuracy=seen?((Number(st.correct)||0)/seen):1,due=Boolean(st.nextDue&&st.nextDue<=today);
      const score=wrong*42+(1-accuracy)*55+(due?38:0)+(st.streak===0?14:0);
      return {q,st,seen,wrong,accuracy,due,score};
    }).filter(Boolean).filter(x=>x.wrong>0||x.accuracy<0.75||x.due).sort((a,b)=>b.score-a.score);
    if(rows[0])return rows[0];
    return null;
  }

  function fallbackFocus(){
    const a=read(APP,{mastery:{}}),cats=['Genesis','Exodus','History','Wisdom','Prophets','Gospels','Acts','Letters'];
    return cats.sort((x,y)=>(a.mastery?.[x]||0)-(a.mastery?.[y]||0))[0]||'Gospels';
  }

  function enrichDailyState(){
    const g=read(GROWTH,{}),e=g.engagementV2;if(!e?.daily)return;
    const t=e.daily[localDay()];if(!t||t.completedAt)return;
    const f=focusProfile();if(!f)return;
    let changed=false;
    const recall=t.tasks?.find(x=>x.id==='recall');
    const learn=t.tasks?.find(x=>x.id==='learn');
    if(recall&&!t.done?.recall){
      const title=`Recall: ${f.q.book} · ${f.q.ref}`;
      const sub=f.wrong>1?`This concept has been missed ${f.wrong} times, so BibleQuest is bringing it back.`:'This was missed before, so it is due for retrieval again.';
      if(recall.title!==title||recall.sub!==sub){recall.title=title;recall.sub=sub;changed=true}
    }
    if(learn&&!t.done?.learn){
      const title=`Strengthen the weak link: ${category(f.q.book)}`;
      const sub=`Specific focus: ${short(f.q.q,92)}`;
      if(learn.title!==title||learn.sub!==sub){learn.title=title;learn.sub=sub;changed=true}
    }
    if(changed){g.engagementV2=e;write(GROWTH,g)}
  }

  function dailyEvidence(){return read(STORE,{daily:{},reveals:{}})}
  function recordQuestionEvidence(){
    const card=document.querySelector('.learning-card');
    const qText=card?.querySelector('h1')?.textContent?.trim();
    if(!qText)return;
    const q=questionBank().find(x=>x.q===qText);if(!q)return;
    const s=dailyEvidence(),d=localDay();s.daily=s.daily||{};const row=s.daily[d]||{questions:0,refs:[]};
    row.questions=(Number(row.questions)||0)+1;
    row.refs=[...new Set([...(row.refs||[]),q.ref].filter(Boolean))];
    s.daily[d]=row;write(STORE,s);
  }

  function applicationFor(q){
    if(APPLICATIONS[q?.id])return APPLICATIONS[q.id];
    const cat=category(q?.book||'');
    if(cat==='History')return 'When evaluating a leader, conflict, or outcome, separate success from faithfulness. Read what the passage approves or criticizes rather than assuming the result proves the motive was right.';
    if(cat==='Gospels')return 'Ask how the surrounding words and actions of Jesus change a real decision, relationship, or response today. Application should come after context, not replace it.';
    if(cat==='Acts'||cat==='Letters')return 'Bring the passage into a real community situation—conflict, encouragement, service, witness, or responsibility—and identify the behavior the text actually supports.';
    if(cat==='Wisdom')return 'Turn the principle into one concrete choice: what should you say, avoid, prepare, or do differently in the next situation where this wisdom applies?';
    return 'This fact matters when it helps you read the surrounding story accurately. Before applying it, ask what the passage reveals about God, people, responsibility, and the choices being made.';
  }

  function enhanceLearningFeedback(root=document){
    root.querySelectorAll('.learning-feedback').forEach(box=>{
      if(box.querySelector('.engagement-application'))return;
      const qText=box.closest('.learning-card')?.querySelector('h1')?.textContent?.trim();
      const q=questionBank().find(x=>x.q===qText);if(!q)return;
      const el=document.createElement('div');el.className='engagement-application';
      el.innerHTML=`<b>Why this matters</b><p>${esc(applicationFor(q))}</p><small>📖 Apply after checking ${esc(q.ref||'the passage')} in context.</small>`;
      box.appendChild(el);
    });
  }

  function weekEvidence(days=7){
    const s=dailyEvidence(),today=new Date(`${localDay()}T12:00:00`),refs=new Set(),questions=[];
    for(let i=0;i<days;i++){
      const d=new Date(today);d.setDate(d.getDate()-i);const key=localDay(d),r=s.daily?.[key];
      if(r){questions.push(Number(r.questions)||0);(r.refs||[]).forEach(x=>refs.add(x))}
    }
    return {questions:questions.reduce((a,b)=>a+b,0),refs:[...refs]};
  }

  function enhanceRecap(root=document){
    const recap=root.querySelector('.weekly-recap');if(!recap||recap.dataset.engagementV3)return;recap.dataset.engagementV3='1';
    const w=weekEvidence(),grid=recap.querySelector('.recap-grid');
    if(grid){const a=document.createElement('article');a.innerHTML=`<b>${w.refs.length}</b><small>Scripture refs reviewed</small>`;grid.appendChild(a)}
    const objective=recap.querySelector('.recap-objective'),f=focusProfile();
    if(objective&&f){const p=document.createElement('p');p.className='engagement-focus-detail';p.innerHTML=`<b>Adaptive focus:</b> ${esc(f.q.book)} · ${esc(f.q.ref)} — ${esc(short(f.q.q,105))}`;objective.insertBefore(p,objective.querySelector('button'))}
  }

  function saveReveal(root=document){
    const reveal=root.querySelector('.daily-reveal');if(!reveal)return;
    const title=reveal.querySelector('h1')?.textContent?.trim(),ref=reveal.querySelector('b')?.textContent?.trim();if(!title)return;
    const s=dailyEvidence();s.reveals=s.reveals||{};s.reveals[localDay()]={title,ref,at:new Date().toISOString()};write(STORE,s);
  }

  function journeyCardEnhance(root=document){
    enrichDailyState();
    const card=root.querySelector('.today-journey-card');if(card){
      const primary=card.querySelector('.journey-primary');
      if(primary&&!card.classList.contains('complete'))primary.textContent='Continue My Journey — 4 min';
      let focus=card.querySelector('.engagement-focus-chip');
      if(!focus){focus=document.createElement('div');focus.className='engagement-focus-chip';card.querySelector('.today-step-dots')?.insertAdjacentElement('afterend',focus)}
      if(focus){const f=focusProfile(),fallback=fallbackFocus();focus.innerHTML=f?`<span>🧠</span><div><small>ADAPTIVE FOCUS</small><b>${esc(f.q.book)} · ${esc(f.q.ref)}</b><em>${esc(f.wrong>1?`Missed ${f.wrong} times · returning now`:short(f.q.q,74))}</em></div>`:`<span>🧭</span><div><small>ADAPTIVE FOCUS</small><b>Build your ${esc(fallback)} baseline</b><em>BibleQuest will get more specific as it sees what you remember.</em></div>`}
    }
    const hero=root.querySelector('.bq-pinoy-hero');if(hero){const b=hero.querySelector('[data-pinoy-mission]');if(b){b.querySelector('b')&&(b.querySelector('b').textContent='Continue My Journey');b.querySelector('small')&&(b.querySelector('small').textContent='4 min · one activity protects your streak')}}
    root.querySelectorAll('[data-modern-item="grow:0"]').forEach(b=>{const title=b.querySelector('b'),sub=b.querySelector('small');if(title)title.textContent='Today’s Journey';if(sub)sub.textContent='Your one clear daily path · about 4 minutes'});
  }

  function interceptLegacyMission(e){
    const t=e.target.closest?.('[data-pinoy-mission],[data-modern-item="grow:0"]');if(!t)return;
    e.preventDefault();e.stopImmediatePropagation();window.BQJourneyLoop?.open?.();
  }

  function masteryFor(stage){
    const m=read(APP,{mastery:{}}).mastery||{};
    if(stage.key==='church')return Math.round(((Number(m.Acts)||0)+(Number(m.Letters)||0))/2);
    return Math.max(0,Math.min(100,Number(m[stage.cat])||0));
  }
  function currentPath(){
    const rows=PATH.map((x,i)=>({...x,pct:masteryFor(x),i}));
    const current=rows.find(x=>x.pct<70)||rows[rows.length-1];
    return {rows,current};
  }
  function nextUnlock(stage,pct){return stage.discoveries.find(x=>pct<x[2])||null}
  function collectedCount(){return Object.keys(dailyEvidence().reveals||{}).length}

  function worldLayer(){let x=document.getElementById('bqEngagementWorld');if(!x){x=document.createElement('div');x.id='bqEngagementWorld';x.className='engagement-world-layer hidden';document.body.appendChild(x)}return x}
  function closeWorld(){worldLayer().classList.add('hidden');document.body.classList.remove('engagement-world-open')}
  function openWorld(){
    const {rows,current}=currentPath(),x=worldLayer(),revealCount=collectedCount();
    x.innerHTML=`<main class="engagement-world"><header><button data-world-v3-close>← BibleQuest</button><b>Scripture Journey</b><span>🗺️</span></header><section class="engagement-world-hero"><div><small>YOU ARE HERE</small><h1>${current.icon} ${esc(current.title)}</h1><p>Finish learning evidence, see what you have opened, and know exactly what comes next. Scripture itself stays open; discoveries are the progression reward.</p></div><div class="world-collection"><b>${revealCount}</b><small>Daily Reveals collected</small></div></section><div class="engagement-world-path">${rows.map((s,i)=>{const prior=i===0?100:rows[i-1].pct,pathOpen=i===0||prior>=35,n=nextUnlock(s,s.pct),state=s.pct>=70?'complete':s.key===current.key?'current':pathOpen?'open':'fogged';return `<button class="world-v3-stage ${state}" data-world-v3-stage="${i}"><div class="world-v3-node"><span>${pathOpen?s.icon:'☁️'}</span><i></i></div><div class="world-v3-copy"><small>${s.pct>=70?'REGION EXPLORED':s.key===current.key?'CURRENT REGION':pathOpen?'OPEN TO EXPLORE':'NEXT REGION'}</small><h2>${esc(s.title)}</h2><div class="world-v3-progress"><i style="width:${s.pct}%"></i></div><p>${s.pct}% evidence · ${n?`next: ${esc(n[1])} at ${n[2]}%`:'all discoveries opened'}</p></div><em>›</em></button>`}).join('')}</div><section class="world-v3-legend"><b>Progress unlocks knowledge, not access to Scripture.</b><p>You can still read any Bible book at any time. The path controls discoveries, cards, artifacts, timeline pieces and story milestones.</p></section></main>`;
    x.classList.remove('hidden');document.body.classList.add('engagement-world-open');x.scrollTop=0;
    x.querySelector('[data-world-v3-close]').onclick=closeWorld;x.querySelectorAll('[data-world-v3-stage]').forEach(b=>b.onclick=()=>openStage(Number(b.dataset.worldV3Stage)));
  }
  function openStage(i){
    const s=PATH[i],pct=masteryFor(s),x=worldLayer();
    x.innerHTML=`<main class="engagement-world"><header><button data-world-v3-back>← Journey</button><b>${esc(s.title)}</b><span>${s.icon}</span></header><section class="engagement-stage-hero"><small>${pct}% LEARNING EVIDENCE</small><h1>${s.icon} ${esc(s.title)}</h1><p>${esc(s.ref)}</p><div class="world-v3-progress big"><i style="width:${pct}%"></i></div></section><div class="engagement-discoveries">${s.discoveries.map(d=>{const unlocked=pct>=d[2];return `<article class="${unlocked?'unlocked':'locked'}"><span>${unlocked?d[0]:'🔒'}</span><div><small>${unlocked?'UNLOCKED':`UNLOCKS AT ${d[2]}%`}</small><b>${esc(d[1])}</b></div></article>`}).join('')}</div><div class="engagement-stage-actions"><button data-stage-continue>Continue today’s Journey</button><button class="secondary" data-stage-read>Read Scripture freely</button>${pct>=25?'<button class="secondary" data-stage-explorer>Explore characters & places</button>':''}${pct>=65?'<button class="secondary" data-stage-timeline>Open timeline challenge</button>':''}</div></main>`;
    x.querySelector('[data-world-v3-back]').onclick=openWorld;
    x.querySelector('[data-stage-continue]').onclick=()=>{closeWorld();window.BQJourneyLoop?.open?.()};
    x.querySelector('[data-stage-read]').onclick=()=>{closeWorld();window.BQReader?.openLibrary?.()||document.querySelector('[data-reader-open]')?.click()};
    x.querySelector('[data-stage-explorer]')?.addEventListener('click',()=>{closeWorld();window.BQExplorer?.open?.()});
    x.querySelector('[data-stage-timeline]')?.addEventListener('click',()=>{closeWorld();document.querySelector('[data-action="timeline"]')?.click()});
  }

  function patchWorldApi(){
    if(window.BQWorld&&!window.BQWorld.__engagementV3){window.BQWorld.open=openWorld;window.BQWorld.__engagementV3=true}
  }

  function injectStyles(){if(document.getElementById('engagementV3Styles'))return;const s=document.createElement('style');s.id='engagementV3Styles';s.textContent=`
    .bq-engagement-home .today-journey-card{padding:20px;border-width:2px;box-shadow:0 20px 52px rgba(46,58,79,.14)}
    .bq-engagement-home .today-journey-top h2{font-size:28px}.bq-engagement-home .journey-primary{flex:1 0 100%;padding:14px 16px;font-size:13px;border-radius:17px}
    .engagement-focus-chip{display:grid;grid-template-columns:auto 1fr;gap:9px;align-items:center;margin:-3px 0 13px;padding:9px 10px;border-radius:14px;background:rgba(238,244,255,.78);border:1px solid rgba(73,98,135,.08)}
    .engagement-focus-chip>span{font-size:20px}.engagement-focus-chip small{display:block;font-size:7px;letter-spacing:.12em;font-weight:900;color:#7888a0}.engagement-focus-chip b{display:block;font-size:10px;margin:1px 0}.engagement-focus-chip em{display:block;font-size:8px;font-style:normal;color:#78808a;line-height:1.35}
    .engagement-application{margin-top:10px;padding:10px 11px;border-radius:13px;background:#fff7dd;border:1px solid rgba(143,109,43,.09)}.engagement-application>b{display:block;color:#65552f}.engagement-application p{margin:3px 0 5px!important}.engagement-application small{font-size:10px;color:#786d55}
    .recap-grid{grid-template-columns:repeat(2,1fr)}.engagement-focus-detail{background:rgba(255,255,255,.72);padding:9px 10px;border-radius:12px}.engagement-focus-detail b{color:#4d6754}
    .engagement-world-layer{position:fixed;inset:0;z-index:230;background:#f4f6f5;overflow:auto}.engagement-world-layer.hidden{display:none}.engagement-world{width:min(720px,100%);min-height:100%;margin:auto;padding:14px 15px calc(90px + env(safe-area-inset-bottom));color:#26323d}
    .engagement-world>header{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;position:sticky;top:0;z-index:3;padding:8px 0 12px;background:rgba(244,246,245,.95);backdrop-filter:blur(12px)}.engagement-world>header button{justify-self:start;border:0;background:#fff;border-radius:13px;padding:9px 10px;font-weight:800}.engagement-world>header b{text-align:center}.engagement-world>header span{justify-self:end}
    .engagement-world-hero,.engagement-stage-hero{border-radius:27px;padding:19px;background:linear-gradient(135deg,rgba(255,255,255,.94),rgba(239,246,255,.94)),url('assets/world-revealed.webp') center/cover;box-shadow:0 14px 36px rgba(54,70,82,.08)}.engagement-world-hero{display:grid;grid-template-columns:1fr auto;gap:12px}.engagement-world-hero small,.engagement-stage-hero small{font-size:8px;letter-spacing:.12em;font-weight:900;color:#7f6982}.engagement-world-hero h1,.engagement-stage-hero h1{margin:4px 0;font-size:25px}.engagement-world-hero p,.engagement-stage-hero p{font-size:10px;line-height:1.5;color:#6c7880;margin:0}.world-collection{align-self:start;text-align:center;background:rgba(255,255,255,.86);border-radius:17px;padding:10px;min-width:76px}.world-collection b{display:block;font-size:23px}.world-collection small{font-size:7px;color:#74808a}
    .engagement-world-path{display:grid;gap:7px;margin:12px 0}.world-v3-stage{width:100%;display:grid;grid-template-columns:50px 1fr auto;gap:10px;align-items:center;border:0;border-radius:21px;padding:11px;background:#fff;text-align:left;color:#26323d;box-shadow:0 8px 25px rgba(50,65,75,.055)}.world-v3-stage.current{box-shadow:0 0 0 3px rgba(244,157,191,.2),0 12px 30px rgba(50,65,75,.07)}.world-v3-stage.complete{background:linear-gradient(135deg,#f1fbef,#fff)}.world-v3-stage.fogged{background:linear-gradient(135deg,rgba(245,246,247,.96),rgba(235,238,241,.96)),url('assets/world-locked.webp') center/cover}.world-v3-node{position:relative}.world-v3-node span{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-size:22px;background:#f4f4f5}.world-v3-copy small{font-size:7px;letter-spacing:.1em;color:#91818b;font-weight:900}.world-v3-copy h2{font-size:14px;margin:2px 0}.world-v3-copy p{font-size:8px;color:#78828a;margin:4px 0 0}.world-v3-progress{height:6px;border-radius:99px;background:#e7e8ea;overflow:hidden}.world-v3-progress i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#ef9ebb,#7cb59a)}.world-v3-progress.big{height:8px;margin-top:13px}.world-v3-stage em{font-style:normal;font-size:20px;color:#949aa0}.world-v3-legend{padding:13px;border-radius:18px;background:#fff}.world-v3-legend b{font-size:10px}.world-v3-legend p{font-size:8px;color:#77818a;line-height:1.5;margin:4px 0 0}
    .engagement-stage-hero{background:linear-gradient(135deg,rgba(255,255,255,.96),rgba(255,244,249,.94)),url('assets/world-revealed.webp') center/cover}.engagement-discoveries{display:grid;gap:7px;margin:11px 0}.engagement-discoveries article{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:center;padding:12px;border-radius:18px;background:#fff}.engagement-discoveries article.locked{opacity:.58;background:#eceff1}.engagement-discoveries span{font-size:25px}.engagement-discoveries small{display:block;font-size:7px;letter-spacing:.09em;color:#8c8790}.engagement-discoveries b{font-size:11px}.engagement-stage-actions{display:grid;gap:7px}.engagement-stage-actions button{border:0;border-radius:15px;padding:12px;background:#293c58;color:#fff;font-weight:900}.engagement-stage-actions button.secondary{background:#fff;color:#59636b;border:1px solid rgba(60,70,80,.08)}
    body.engagement-world-open{overflow:hidden}@media(max-width:390px){.bq-engagement-home .today-journey-top h2{font-size:24px}.engagement-world-hero{grid-template-columns:1fr}.world-collection{display:flex;gap:6px;align-items:baseline;width:max-content}.world-collection b{font-size:18px}}
  `;document.head.appendChild(s)}

  let queued=false;
  function refresh(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;patchWorldApi();journeyCardEnhance(document);enhanceLearningFeedback(document);enhanceRecap(document);saveReveal(document)})}

  document.addEventListener('click',interceptLegacyMission,true);
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-smart-choice]'))setTimeout(()=>{recordQuestionEvidence();enhanceLearningFeedback(document)},0)},true);
  const observer=new MutationObserver(refresh);observer.observe(document.documentElement,{childList:true,subtree:true});
  injectStyles();refresh();setTimeout(refresh,500);setTimeout(refresh,1500);
  window.BQEngagementV3={openWorld,focus:focusProfile,weekEvidence,refresh};
})();
