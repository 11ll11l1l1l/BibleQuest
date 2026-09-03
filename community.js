(() => {
  const KEY='biblequest_community_v1';
  const APP='biblequest_state_v4';
  const COUPLES='biblequest_couples_v1';
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const now=()=>new Date().toISOString();
  const uid=()=>`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const blank=()=>({roster:[],events:[],sessions:[],manualAwards:[],activeName:'',createdAt:now()});
  const readJson=(key,fallback={})=>{try{return {...fallback,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{return {...fallback}}};
  const read=()=>readJson(KEY,blank());
  const write=s=>{localStorage.setItem(KEY,JSON.stringify(s));window.dispatchEvent(new CustomEvent('bq-community-change'));};
  const app=()=>readJson(APP,{});
  const couples=()=>readJson(COUPLES,{favorites:[],history:[],commitments:[],checkins:[],listenCount:0});

  function profileName(){return (app().profile?.name||'').trim()||'You'}
  function ensureRoster(){
    const s=read(),name=profileName();
    if(!s.roster.some(x=>x.name.toLowerCase()===name.toLowerCase()))s.roster.unshift({id:uid(),name,joinedAt:now(),kind:'member'});
    if(!s.activeName)s.activeName=name;
    write(s);return s;
  }
  function addMember(name,kind='member'){
    name=String(name||'').trim();if(!name)return false;
    const s=read();if(s.roster.some(x=>x.name.toLowerCase()===name.toLowerCase()))return false;
    s.roster.push({id:uid(),name,joinedAt:now(),kind});if(!s.activeName)s.activeName=name;write(s);return true;
  }
  function removeMember(name){const s=read();s.roster=s.roster.filter(x=>x.name!==name);s.events=s.events.filter(x=>x.name!==name);if(s.activeName===name)s.activeName=s.roster[0]?.name||'';write(s)}
  function setActive(name){const s=read();if(s.roster.some(x=>x.name===name)){s.activeName=name;write(s)}}
  function awardPoints(name,points,category='overall',source='activity',meta={}){
    name=String(name||'').trim();points=Math.max(0,Math.round(Number(points)||0));if(!name||!points)return;
    const s=read();if(!s.roster.some(x=>x.name===name))s.roster.push({id:uid(),name,joinedAt:now(),kind:'member'});
    s.events.push({id:uid(),name,points,category,source,meta,at:now()});
    if(s.events.length>5000)s.events=s.events.slice(-5000);write(s);
  }
  function recordSession(type,participants=[],meta={}){
    const s=read();s.sessions.push({id:uid(),type,participants:[...new Set(participants)],meta,at:now()});if(s.sessions.length>1000)s.sessions=s.sessions.slice(-1000);write(s);
  }

  function startOf(period){
    const d=new Date();
    if(period==='today'){d.setHours(0,0,0,0);return d.getTime()}
    if(period==='week'){const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);d.setHours(0,0,0,0);return d.getTime()}
    return 0;
  }
  function filteredEvents(period='all',category='overall'){
    const cutoff=startOf(period);
    return read().events.filter(e=>(!cutoff||new Date(e.at).getTime()>=cutoff)&&(category==='overall'||e.category===category));
  }
  function standings(period='all',category='overall'){
    const s=read(),events=filteredEvents(period,category),map=new Map(s.roster.map(x=>[x.name,0]));
    events.forEach(e=>map.set(e.name,(map.get(e.name)||0)+e.points));
    return [...map].map(([name,points])=>({name,points})).sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name));
  }
  function eventCount(name,category=null){return read().events.filter(e=>e.name===name&&(!category||e.category===category)).length}
  function sessionCount(type=null){return read().sessions.filter(s=>!type||s.type===type).length}

  const BADGES=[
    ['first_step','🌱','First Step','Knowledge',m=>m.answered>=1,'Answer your first question'],
    ['curious_10','🔎','Curious Ten','Knowledge',m=>m.answered>=10,'Answer 10 questions'],
    ['learner_25','📗','Learning Habit','Knowledge',m=>m.answered>=25,'Answer 25 questions'],
    ['scholar_50','📚','Growing Scholar','Knowledge',m=>m.answered>=50,'Answer 50 questions'],
    ['scholar_100','🎓','Century Scholar','Knowledge',m=>m.answered>=100,'Answer 100 questions'],
    ['scholar_250','🏛️','Scripture Student','Knowledge',m=>m.answered>=250,'Answer 250 questions'],
    ['scholar_500','🧠','Deep Learner','Knowledge',m=>m.answered>=500,'Answer 500 questions'],
    ['correct_10','⭐','Ten Correct','Knowledge',m=>m.correct>=10,'Get 10 correct'],
    ['correct_50','🌟','Fifty Correct','Knowledge',m=>m.correct>=50,'Get 50 correct'],
    ['correct_100','💫','Hundred Correct','Knowledge',m=>m.correct>=100,'Get 100 correct'],
    ['accuracy_70','🎯','Steady Aim','Knowledge',m=>m.answered>=20&&m.accuracy>=70,'70% accuracy after 20 answers'],
    ['accuracy_80','🏹','Sharp Recall','Knowledge',m=>m.answered>=40&&m.accuracy>=80,'80% accuracy after 40 answers'],
    ['accuracy_90','💎','Precision Learner','Knowledge',m=>m.answered>=75&&m.accuracy>=90,'90% accuracy after 75 answers'],
    ['xp100','⚡','100 XP','Progress',m=>m.xp>=100,'Earn 100 XP'],
    ['xp250','🔥','250 XP','Progress',m=>m.xp>=250,'Earn 250 XP'],
    ['xp500','✨','500 XP','Progress',m=>m.xp>=500,'Earn 500 XP'],
    ['xp1000','🏆','1K XP','Progress',m=>m.xp>=1000,'Earn 1,000 XP'],
    ['xp2500','👑','2.5K XP','Progress',m=>m.xp>=2500,'Earn 2,500 XP'],
    ['streak3','🔥','3-Day Spark','Consistency',m=>m.streak>=3,'Learn 3 days in a row'],
    ['streak7','🕯️','Week of Light','Consistency',m=>m.streak>=7,'Learn 7 days in a row'],
    ['streak14','🌤️','Two-Week Rhythm','Consistency',m=>m.streak>=14,'Learn 14 days in a row'],
    ['streak30','🌞','Monthly Rhythm','Consistency',m=>m.streak>=30,'Learn 30 days in a row'],
    ['streak60','🛡️','Steady Disciple','Consistency',m=>m.streak>=60,'Learn 60 days in a row'],
    ['master25','🗺️','Trail Marker','Mastery',m=>m.mastery.some(x=>x>=25),'Reach 25% in a journey track'],
    ['master50','⛰️','Halfway There','Mastery',m=>m.mastery.some(x=>x>=50),'Reach 50% in a journey track'],
    ['master75','🏔️','High Ground','Mastery',m=>m.mastery.some(x=>x>=75),'Reach 75% in a journey track'],
    ['master100','🏁','Track Master','Mastery',m=>m.mastery.some(x=>x>=100),'Master one journey track'],
    ['master4','🧭','Wide Explorer','Mastery',m=>m.mastery.filter(x=>x>=50).length>=4,'Reach 50% in four tracks'],
    ['masterall','🌍','Whole-Bible Explorer','Mastery',m=>m.mastery.length>=8&&m.mastery.every(x=>x>=50),'Reach 50% in every track'],
    ['wisdom1','🧭','Wisdom Starter','Wisdom',m=>m.situations>=1,'Complete one wisdom situation'],
    ['wisdom3','🪴','Wisdom Explorer','Wisdom',m=>m.situations>=3,'Complete three wisdom situations'],
    ['wisdom10','🌿','Thoughtful Disciple','Wisdom',m=>m.situations>=10,'Complete 10 wisdom situations'],
    ['wisdom25','🌳','Wise Practice','Wisdom',m=>m.situations>=25,'Complete 25 wisdom situations'],
    ['reader20','📖','Page Turner','Reading',m=>m.deckSeen>=20,'Study 20 recall cards'],
    ['reader50','📘','Book Explorer','Reading',m=>m.deckSeen>=50,'Study 50 recall cards'],
    ['reader100','📚','Library Walker','Reading',m=>m.deckSeen>=100,'Study 100 recall cards'],
    ['reader250','🗃️','Recall Keeper','Reading',m=>m.deckSeen>=250,'Study 250 recall cards'],
    ['couple1','💞','First Conversation','Couples',m=>m.coupleHistory>=1,'Complete one couples conversation'],
    ['couple5','💛','Five Good Talks','Couples',m=>m.coupleHistory>=5,'Complete five couples conversations'],
    ['couple10','🤝','Growing Together','Couples',m=>m.coupleHistory>=10,'Complete 10 couples conversations'],
    ['couple20','🏡','Strong Table','Couples',m=>m.coupleHistory>=20,'Complete 20 couples conversations'],
    ['listen3','👂','Listen First','Couples',m=>m.listenCount>=3,'Complete Listen First three times'],
    ['listen10','🎧','Deep Listener','Couples',m=>m.listenCount>=10,'Complete Listen First 10 times'],
    ['commit1','✅','Practice It','Couples',m=>m.commitDone>=1,'Complete one couples practice'],
    ['commit5','🪢','Keep the Promise','Couples',m=>m.commitDone>=5,'Complete five couples practices'],
    ['checkin3','🌡️','Check-In Habit','Couples',m=>m.checkins>=3,'Complete three couple check-ins'],
    ['group1','👥','Joined the Circle','Community',m=>m.groupSessions>=1,'Complete one group session'],
    ['group5','🫶','Community Regular','Community',m=>m.groupSessions>=5,'Complete five group sessions'],
    ['group10','🏘️','Table Builder','Community',m=>m.groupSessions>=10,'Complete 10 group sessions'],
    ['group25','⛪','Community Pillar','Community',m=>m.groupSessions>=25,'Complete 25 group sessions'],
    ['group100','💯','100 Group Points','Community',m=>m.groupPoints>=100,'Earn 100 group-play points'],
    ['group500','🏅','500 Group Points','Community',m=>m.groupPoints>=500,'Earn 500 group-play points'],
    ['talk5','💬','Conversation Starter','Community',m=>m.discussionSessions>=5,'Complete five discussion activities'],
    ['team5','🎮','Team Player','Community',m=>m.teamSessions>=5,'Complete five scored team games']
  ];

  function metrics(){
    const a=app(),c=couples(),name=profileName(),events=read().events.filter(e=>e.name===name),sessions=read().sessions.filter(s=>s.participants?.includes(name));
    const deckSeen=Object.values(a.deckStats||{}).reduce((n,x)=>n+(x.seen||0),0);
    return {answered:a.answered||0,correct:a.correct||0,accuracy:a.answered?Math.round((a.correct||0)/a.answered*100):0,xp:a.xp||0,streak:a.streak||0,situations:a.situations||0,mastery:Object.values(a.mastery||{}),deckSeen,coupleHistory:(c.history||[]).length,listenCount:c.listenCount||0,commitDone:(c.commitments||[]).filter(x=>x.done).length,checkins:(c.checkins||[]).length,groupSessions:sessions.length,groupPoints:events.reduce((n,e)=>n+e.points,0),discussionSessions:sessions.filter(x=>/conversation|wisdom|pair/i.test(x.type)).length,teamSessions:sessions.filter(x=>/sprint|detective|hunt/i.test(x.type)).length};
  }
  function unlockedBadges(){const m=metrics();return BADGES.filter(b=>b[4](m))}

  function awards(period='week'){
    const lanes=[['overall','🏆','Overall Leader'],['knowledge','🧠','Knowledge Leader'],['reading','📖','Reading Leader'],['wisdom','🧭','Wisdom Builder'],['group','👥','Group Catalyst'],['couples','💞','Couples Builder']];
    return lanes.map(([cat,icon,title])=>{const top=standings(period,cat)[0];return {...{cat,icon,title},name:top?.points?top.name:'—',points:top?.points||0}});
  }

  let period='week',lane='overall',badgeFilter='All';
  function layer(){let x=document.getElementById('bqCommunityLayer');if(!x){x=document.createElement('div');x.id='bqCommunityLayer';x.className='community-layer hidden';document.body.appendChild(x)}return x}
  function show(html){const x=layer();x.innerHTML=`<main class="community-app">${html}</main>`;x.classList.remove('hidden');document.body.classList.add('community-open');bind();x.scrollTop=0}
  function close(){layer().classList.add('hidden');document.body.classList.remove('community-open')}

  function dashboard(){
    ensureRoster();const s=read(),badges=unlockedBadges();
    show(`<header class="community-top"><button data-community-close>← BibleQuest</button><b>Community</b><span>🏆</span></header>
      <section class="community-hero"><div><small>CONGREGATION MODE</small><h1>Grow together. Celebrate progress.</h1><p>Leaderboards reward learning and participation—not spiritual worth.</p></div><button data-community-board>Open leaderboards →</button></section>
      <section class="community-quick"><button data-community-board><span>🏆</span><b>Leaderboards</b><small>Today · Week · All time</small></button><button data-community-badges><span>🎖️</span><b>Badges</b><small>${badges.length}/${BADGES.length} unlocked</small></button><button data-community-roster><span>👥</span><b>Roster</b><small>${s.roster.length} local participants</small></button><button data-group-open><span>🎮</span><b>Group Play</b><small>Teams · circles · couples</small></button></section>
      <div class="community-section-title"><h2>This week’s awards</h2><small>Based on scored activities on this device</small></div>
      <section class="award-grid">${awards('week').map(a=>`<article><span>${a.icon}</span><small>${a.title}</small><b>${esc(a.name)}</b><em>${a.points} pts</em></article>`).join('')}</section>
      <div class="community-note"><b>Congregation sync</b><p>The screens and scoring model are ready for church-wide use. Right now the leaderboard is local to this device. Cross-device congregation rankings will activate when BibleQuest gets its own Supabase project and sign-in; no fake members or fake scores are shown.</p></div>`);
  }

  function board(){
    ensureRoster();const rows=standings(period,lane),periods=[['today','Today'],['week','This Week'],['all','All Time']],lanes=[['overall','Overall'],['knowledge','Knowledge'],['reading','Reading'],['wisdom','Wisdom'],['group','Group'],['couples','Couples']];
    show(`<header class="community-top"><button data-community-home>← Community</button><b>Leaderboards</b><span>🏆</span></header><section class="board-head"><small>LOCAL CONGREGATION BOARD</small><h1>${periods.find(x=>x[0]===period)?.[1]||'This Week'}</h1><div class="period-tabs">${periods.map(x=>`<button class="${period===x[0]?'active':''}" data-board-period="${x[0]}">${x[1]}</button>`).join('')}</div><div class="lane-tabs">${lanes.map(x=>`<button class="${lane===x[0]?'active':''}" data-board-lane="${x[0]}">${x[1]}</button>`).join('')}</div></section>
      <section class="rank-list">${rows.map((r,i)=>`<article class="${i<3?'podium':''}"><span class="rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</span><div><b>${esc(r.name)}</b><small>${lane==='overall'?'All scored activities':lanes.find(x=>x[0]===lane)?.[1]}</small></div><strong>${r.points}</strong><em>pts</em></article>`).join('')||'<div class="empty-board">No participants yet.</div>'}</section>
      <section class="award-strip">${awards(period).slice(0,3).map(a=>`<div><span>${a.icon}</span><b>${esc(a.name)}</b><small>${a.title}</small></div>`).join('')}</section>`);
  }

  function badges(){
    const unlocked=new Set(unlockedBadges().map(b=>b[0])),cats=['All',...new Set(BADGES.map(b=>b[3]))],shown=BADGES.filter(b=>badgeFilter==='All'||b[3]===badgeFilter);
    show(`<header class="community-top"><button data-community-home>← Community</button><b>Achievements</b><span>🎖️</span></header><section class="badge-head"><small>MULTI-FIELD ACHIEVEMENTS</small><h1>${unlocked.size} / ${BADGES.length} badges</h1><p>Knowledge, consistency, mastery, wisdom, reading, couples and community participation all count.</p><div class="badge-tabs">${cats.map(c=>`<button class="${badgeFilter===c?'active':''}" data-badge-filter="${esc(c)}">${esc(c)}</button>`).join('')}</div></section><section class="badge-grid">${shown.map(b=>`<article class="${unlocked.has(b[0])?'unlocked':'locked'}"><span>${unlocked.has(b[0])?b[1]:'🔒'}</span><div><small>${esc(b[3])}</small><b>${esc(b[2])}</b><p>${esc(b[5])}</p></div></article>`).join('')}</section>`);
  }

  function roster(){
    ensureRoster();const s=read();
    show(`<header class="community-top"><button data-community-home>← Community</button><b>Local roster</b><span>👥</span></header><section class="roster-head"><h1>Who is playing?</h1><p>Add congregation members, teams, friends, or couples sharing this device.</p><form data-roster-form><input name="name" maxlength="32" placeholder="Name or team" required><button>Add</button></form></section><section class="roster-list">${s.roster.map((r,i)=>`<article><button class="roster-person ${s.activeName===r.name?'active':''}" data-roster-active="${esc(r.name)}"><span>${i===0?'🌱':'👤'}</span><div><b>${esc(r.name)}</b><small>${eventCount(r.name)} scored activities · ${standings('all')[standings('all').findIndex(x=>x.name===r.name)]?.points||0} pts</small></div></button>${r.name!==profileName()?`<button class="remove-person" data-roster-remove="${esc(r.name)}" aria-label="Remove">×</button>`:''}</article>`).join('')}</section>`);
  }

  function bind(){
    const x=layer();x.querySelectorAll('[data-community-close]').forEach(b=>b.onclick=close);x.querySelectorAll('[data-community-home]').forEach(b=>b.onclick=dashboard);x.querySelectorAll('[data-community-board]').forEach(b=>b.onclick=board);x.querySelectorAll('[data-community-badges]').forEach(b=>b.onclick=badges);x.querySelectorAll('[data-community-roster]').forEach(b=>b.onclick=roster);
    x.querySelectorAll('[data-group-open]').forEach(b=>b.onclick=()=>{close();window.BQGroupPlay?.open?.()});
    x.querySelectorAll('[data-board-period]').forEach(b=>b.onclick=()=>{period=b.dataset.boardPeriod;board()});x.querySelectorAll('[data-board-lane]').forEach(b=>b.onclick=()=>{lane=b.dataset.boardLane;board()});x.querySelectorAll('[data-badge-filter]').forEach(b=>b.onclick=()=>{badgeFilter=b.dataset.badgeFilter;badges()});
    const form=x.querySelector('[data-roster-form]');if(form)form.onsubmit=e=>{e.preventDefault();const name=new FormData(form).get('name');if(addMember(name))roster()};
    x.querySelectorAll('[data-roster-active]').forEach(b=>b.onclick=()=>{setActive(b.dataset.rosterActive);roster()});x.querySelectorAll('[data-roster-remove]').forEach(b=>b.onclick=()=>{removeMember(b.dataset.rosterRemove);roster()});
  }

  document.addEventListener('click',e=>{if(e.target.closest('[data-community-open]'))dashboard()});
  window.BQCommunity={open:dashboard,openBoard:board,openBadges:badges,openRoster:roster,addMember,removeMember,setActive,awardPoints,recordSession,standings,read,profileName,BADGES,metrics,unlockedBadges};
})();