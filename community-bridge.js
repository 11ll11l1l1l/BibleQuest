(() => {
  const APP='biblequest_state_v4';
  const COUPLES='biblequest_couples_v1';
  const original=Storage.prototype.setItem;
  let internal=false,boardPeriod='week',boardLane='overall';

  const parse=v=>{try{return JSON.parse(v||'{}')}catch{return {}}};
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const sumDeck=s=>Object.values(s?.deckStats||{}).reduce((n,x)=>n+(Number(x?.seen)||0),0);
  const sumGot=s=>Object.values(s?.deckStats||{}).reduce((n,x)=>n+(Number(x?.got)||0),0);
  const sumMastery=s=>Object.values(s?.mastery||{}).reduce((n,x)=>n+(Number(x)||0),0);
  const doneCommit=s=>(s?.commitments||[]).filter(x=>x?.done).length;
  const positive=(a,b)=>Math.max(0,(Number(b)||0)-(Number(a)||0));
  const LANES=[
    ['overall','🏆','Overall'],['knowledge','🧠','Knowledge'],['reading','📖','Reading'],['wisdom','🧭','Wisdom'],
    ['mastery','🗺️','Mastery'],['consistency','🔥','Consistency'],['group','👥','Group'],['couples','💞','Couples']
  ];
  const PERIODS=[['today','Today'],['week','This Week'],['all','All Time']];

  function award(points,category,source,meta={}){
    if(internal||!points||!window.BQCommunity?.awardPoints)return;
    internal=true;
    try{window.BQCommunity.awardPoints(window.BQCommunity.profileName(),points,category,source,meta)}finally{internal=false}
  }

  function appDelta(before,after){
    const deckBefore=sumDeck(before),deckAfter=sumDeck(after),deckDelta=positive(deckBefore,deckAfter);
    const gotDelta=positive(sumGot(before),sumGot(after));
    const situationDelta=positive(before.situations,after.situations);
    const masteryDelta=positive(sumMastery(before),sumMastery(after));
    const streakDelta=positive(before.streak,after.streak);
    const answeredDelta=positive(before.answered,after.answered);
    const correctDelta=positive(before.correct,after.correct);

    // Recall decks are reading/recall activities; don't also count their answer as generic quiz points.
    if(deckDelta)award(deckDelta*4+gotDelta*2,'reading','Recall Deck',{cards:deckDelta,remembered:gotDelta});
    if(situationDelta)award(situationDelta*5,'wisdom','Situations & Wisdom',{completed:situationDelta});
    if(masteryDelta)award(Math.max(1,Math.round(masteryDelta/2)),'mastery','Journey Mastery',{growth:masteryDelta});
    if(streakDelta)award(3,'consistency','Learning Streak',{days:after.streak||1});

    const genericAnswered=Math.max(0,answeredDelta-deckDelta);
    const genericCorrect=Math.max(0,correctDelta-gotDelta);
    if(genericAnswered){
      const incorrect=Math.max(0,genericAnswered-genericCorrect);
      if(genericCorrect)award(genericCorrect*8,'knowledge','Solo Bible Game',{correct:genericCorrect});
      if(incorrect)award(incorrect*2,'knowledge','Learning Attempt',{attempts:incorrect});
    }
  }

  function couplesDelta(before,after){
    const history=positive((before.history||[]).length,(after.history||[]).length);
    const listen=positive(before.listenCount,after.listenCount);
    const checkins=positive((before.checkins||[]).length,(after.checkins||[]).length);
    const commitments=positive(doneCommit(before),doneCommit(after));
    if(history)award(history*4,'couples','Couples Conversation',{completed:history});
    if(listen)award(listen*5,'couples','Listen First',{completed:listen});
    if(checkins)award(checkins*4,'couples','Couple Check-in',{completed:checkins});
    if(commitments)award(commitments*6,'couples','Couples Practice',{completed:commitments});
  }

  Storage.prototype.setItem=function(key,value){
    if(internal)return original.call(this,key,value);
    const watch=key===APP||key===COUPLES;
    const before=watch?parse(this.getItem(key)):null;
    const out=original.call(this,key,value);
    if(watch){
      const after=parse(value);
      queueMicrotask(()=>{
        try{key===APP?appDelta(before,after):couplesDelta(before,after)}catch(err){console.warn('BibleQuest community bridge:',err)}
      });
    }
    return out;
  };

  function expandedBoard(){
    const api=window.BQCommunity;if(!api?.standings)return;
    let layer=document.getElementById('bqCommunityLayer');
    if(!layer){layer=document.createElement('div');layer.id='bqCommunityLayer';layer.className='community-layer hidden';document.body.appendChild(layer)}
    const rows=api.standings(boardPeriod,boardLane),label=LANES.find(x=>x[0]===boardLane)?.[2]||'Overall';
    layer.innerHTML=`<main class="community-app"><header class="community-top"><button data-xboard-home>← Community</button><b>Leaderboards</b><span>🏆</span></header>
      <section class="board-head"><small>CONGREGATION RANKINGS</small><h1>${PERIODS.find(x=>x[0]===boardPeriod)?.[1]||'This Week'}</h1>
        <div class="period-tabs">${PERIODS.map(x=>`<button class="${boardPeriod===x[0]?'active':''}" data-xboard-period="${x[0]}">${x[1]}</button>`).join('')}</div>
        <div class="lane-tabs">${LANES.map(x=>`<button class="${boardLane===x[0]?'active':''}" data-xboard-lane="${x[0]}">${x[1]} ${x[2]}</button>`).join('')}</div>
      </section>
      <section class="rank-list">${rows.map((r,i)=>`<article class="${i<3?'podium':''}"><span class="rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</span><div><b>${esc(r.name)}</b><small>${label}</small></div><strong>${r.points}</strong><em>pts</em></article>`).join('')||'<div class="empty-board">No participants yet.</div>'}</section>
      <div class="community-note"><b>Eight ranking lanes</b><p>Overall combines every scored activity. Knowledge, Reading, Wisdom, Mastery, Consistency, Group, and Couples can also be viewed separately. Conversation and couples points reward participation—not spiritual correctness.</p></div></main>`;
    layer.classList.remove('hidden');document.body.classList.add('community-open');
    layer.querySelector('[data-xboard-home]').onclick=()=>api.open();
    layer.querySelectorAll('[data-xboard-period]').forEach(b=>b.onclick=()=>{boardPeriod=b.dataset.xboardPeriod;expandedBoard()});
    layer.querySelectorAll('[data-xboard-lane]').forEach(b=>b.onclick=()=>{boardLane=b.dataset.xboardLane;expandedBoard()});
    layer.scrollTop=0;
  }

  function enhanceDashboardAwards(){
    const grid=document.querySelector('#bqCommunityLayer:not(.hidden) .award-grid');
    if(!grid||grid.dataset.extraAwards)return;
    grid.dataset.extraAwards='1';
    [['consistency','🔥','Consistency Champion'],['mastery','🗺️','Mastery Builder']].forEach(([cat,icon,title])=>{
      const top=window.BQCommunity?.standings?.('week',cat)?.[0];
      const card=document.createElement('article');
      card.innerHTML=`<span>${icon}</span><small>${title}</small><b>${esc(top?.points?top.name:'—')}</b><em>${top?.points||0} pts</em>`;
      grid.appendChild(card);
    });
  }

  // Replace the compact six-lane board with the full eight-field board anywhere it is opened.
  if(window.BQCommunity)window.BQCommunity.openBoard=expandedBoard;
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-community-board]')){
      e.preventDefault();e.stopImmediatePropagation();expandedBoard();
    }
  },true);
  new MutationObserver(enhanceDashboardAwards).observe(document.documentElement,{childList:true,subtree:true});

  window.BQCommunityBridge={appDelta,couplesDelta,openBoard:expandedBoard,LANES};
})();