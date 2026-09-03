(() => {
  const QUESTIONS='data/questions.js';
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  let mode='home',round=0,queue=[],current=null,selectedName='',clueIndex=0;

  const discussion=[
    {cat:'Faith',icon:'✝️',q:'When does “trusting God” become an excuse for avoiding wise planning?',follow:'What would faithful planning look like in a real family decision?',refs:['Luke 14:28–30','James 4:13–15']},
    {cat:'Grace',icon:'🕊️',q:'Can you forgive someone while still rebuilding trust slowly?',follow:'What is the difference between forgiveness, reconciliation, and access?',refs:['Luke 17:3–4','Proverbs 22:3']},
    {cat:'Work',icon:'🧰',q:'How do you know when hard work has become unhealthy overwork?',follow:'What responsibility do we have to family, health, rest, and provision?',refs:['1 Timothy 5:8','Mark 6:31']},
    {cat:'Speech',icon:'💬',q:'When is correcting someone loving—and when is it mostly about winning?',follow:'What changes when correction is done privately, gently, and specifically?',refs:['Matthew 18:15','2 Timothy 2:23–25']},
    {cat:'Money',icon:'🏠',q:'What does “enough” mean for a Christian household?',follow:'Which goals are stewardship, and which may be comparison or fear?',refs:['1 Timothy 6:6–8','Luke 14:28']},
    {cat:'Community',icon:'🤝',q:'What makes a congregation feel safe enough for honest questions?',follow:'How can leaders and members respond when someone admits doubt or failure?',refs:['James 1:19','Galatians 6:1–2']},
    {cat:'Service',icon:'🫶',q:'How can helping someone become enabling instead of loving support?',follow:'What does generosity with boundaries look like?',refs:['Galatians 6:2,5','2 Thessalonians 3:10–12']},
    {cat:'Family',icon:'🌱',q:'What should children learn by watching how adults disagree?',follow:'What does a healthy repair look like after conflict?',refs:['Ephesians 4:25–32','Ephesians 6:4']},
    {cat:'Motives',icon:'🪞',q:'Is a good action still good when the motive is fear, pride, or recognition?',follow:'Can motives improve over time while someone continues practicing what is right?',refs:['Matthew 6:1–4','Philippians 2:3–4']},
    {cat:'Listening',icon:'👂',q:'What makes people feel truly heard rather than merely answered?',follow:'What is one sentence that proves you understood before giving advice?',refs:['James 1:19','Proverbs 18:13']},
    {cat:'Church',icon:'⛪',q:'How should a church handle disagreements where sincere Christians read a secondary issue differently?',follow:'Which beliefs are central, and which require humility and charity?',refs:['Romans 14:1–13','2 Timothy 2:23–25']},
    {cat:'Hope',icon:'🌤️',q:'How do you encourage someone without minimizing a difficult reality?',follow:'What is the difference between hope and forced positivity?',refs:['Romans 12:15','2 Corinthians 1:3–4']}
  ];

  const verseHunt=[
    ['Genesis 1:1','Find the opening sentence of the Bible.'],['Exodus 20:12','Find the command about honoring parents.'],['Joshua 1:9','Find the instruction to be strong and courageous.'],['Psalm 23:1','Find the verse beginning the shepherd psalm.'],['Proverbs 15:1','Find what a gentle answer does.'],['Micah 6:8','Find the three things the LORD requires.'],['Matthew 5:14','Find what Jesus calls his followers in relation to the world.'],['Matthew 6:33','Find what Jesus says to seek first.'],['Luke 10:27','Find the two great directions of love in this verse.'],['John 13:35','Find how people will recognize Jesus’ disciples.'],['Romans 12:2','Find the verse about transformation and renewing the mind.'],['1 Corinthians 13:4','Find how love begins to be described.'],['Galatians 5:22','Find the beginning of the fruit of the Spirit list.'],['Philippians 4:8','Find the list of things believers are told to think about.'],['James 1:19','Find the three-part instruction about listening, speaking, and anger.']
  ];

  const pairPrompts=[
    ['Gratitude','Tell your partner one specific thing they did recently that mattered to you.','1 Thessalonians 5:11'],
    ['Listening','Partner A speaks for 90 seconds about a current concern. Partner B may only summarize, not solve. Then switch.','James 1:19'],
    ['Faith','What is one thing you want prayer for this month—and what kind of support would actually help?','Philippians 1:9–11'],
    ['Dreams','Describe one hope for the next year. The listener may ask curious questions but may not turn it into a plan yet.','Proverbs 16:3'],
    ['Repair','Name one small recurring tension. Each person owns one part without adding “but you…”.','Matthew 7:3–5'],
    ['Family','What atmosphere do you want people to feel in your home or relationship? Name one habit that supports it.','Colossians 3:15'],
    ['Service','What need around you could you realistically serve together without overcommitting?','Galatians 5:13'],
    ['Money','What does money emotionally mean to you—security, freedom, responsibility, generosity, status, fear, or something else?','Luke 14:28']
  ];

  function community(){return window.BQCommunity}
  function roster(){return community()?.read?.().roster||[]}
  function active(){const s=community()?.read?.();return selectedName||s?.activeName||s?.roster?.[0]?.name||''}
  function layer(){let x=document.getElementById('bqGroupLayer');if(!x){x=document.createElement('div');x.id='bqGroupLayer';x.className='group-layer hidden';document.body.appendChild(x)}return x}
  function show(html){const x=layer();x.innerHTML=`<main class="group-app">${html}</main>`;x.classList.remove('hidden');document.body.classList.add('group-open');bind();x.scrollTop=0}
  function close(){layer().classList.add('hidden');document.body.classList.remove('group-open');mode='home';current=null;round=0;queue=[]}

  function participantBar(){const r=roster();return `<div class="participant-bar">${r.map(p=>`<button class="${active()===p.name?'active':''}" data-group-person="${esc(p.name)}">${esc(p.name)}</button>`).join('')}<button class="add-person" data-group-roster>＋</button></div>`}
  function requireRoster(){if(roster().length>=2)return true;community()?.openRoster?.();return false}
  function award(name,points,category,source){community()?.awardPoints?.(name,points,category,source)}
  function allParticipants(){return roster().map(x=>x.name)}
  function record(type,participants=allParticipants(),meta={}){community()?.recordSession?.(type,participants,meta)}

  function home(){
    show(`<header class="group-top"><button data-group-close>← BibleQuest</button><b>Play Together</b><span>🎮</span></header><section class="group-hero"><small>GROUP & COUPLES ACTIVITIES</small><h1>Turn one phone into a room activity.</h1><p>Team games, conversation starters, verse hunts, pair-and-share, and couples growth.</p></section>
      <section class="group-mode-grid">
        <button data-group-mode="sprint"><span>⚡</span><b>Team Bible Sprint</b><small>Pass-the-phone trivia · rotating players</small></button>
        <button data-group-mode="detective"><span>🕵️</span><b>Detective Hot Seat</b><small>Reveal clues · first correct guess wins</small></button>
        <button data-group-mode="hunt"><span>🔎</span><b>Verse Hunt</b><small>Find the passage first</small></button>
        <button data-group-mode="circle"><span>💬</span><b>Conversation Circle</b><small>Deep prompts + Scripture anchors</small></button>
        <button data-group-mode="wisdom"><span>🧭</span><b>Wisdom Table</b><small>No fake “one right answer” theology</small></button>
        <button data-group-mode="pair"><span>🤝</span><b>Pair & Share</b><small>Two-person listening and reflection</small></button>
        <button data-group-couples><span>💞</span><b>Couples Growth</b><small>Open the full Grow Together experience</small></button>
        <button data-group-board><span>🏆</span><b>Group Leaderboard</b><small>Today · week · all time</small></button>
      </section><div class="group-rule"><b>Scoring rule</b><p>Facts and game performance can earn points. Conversation, wisdom, and couples modes reward participation—not “correct spirituality.”</p></div>`)
  }

  function loadQuestions(){return new Promise((resolve,reject)=>{if(window.BQ_QUESTIONS)return resolve();const found=document.querySelector(`script[src="${QUESTIONS}"]`);if(found){found.addEventListener('load',resolve,{once:true});found.addEventListener('error',reject,{once:true});return}const s=document.createElement('script');s.src=QUESTIONS;s.onload=resolve;s.onerror=reject;document.body.appendChild(s)})}

  async function sprint(){
    if(!requireRoster())return;mode='sprint';await loadQuestions();queue=shuffle(window.BQ_QUESTIONS||[]).slice(0,12);round=0;nextSprint();
  }
  function nextSprint(){
    if(round>=queue.length){record('sprint');return finish('Team Bible Sprint complete','Knowledge points were recorded for correct answers.');}
    current=queue[round];const names=roster(),turn=names[round%names.length]?.name||active();selectedName=turn;
    show(`<header class="group-top"><button data-group-home>← Modes</button><b>Team Bible Sprint</b><span>${round+1}/${queue.length}</span></header>${participantBar()}<section class="play-card"><small>${esc(current.book)} · ${esc(current.ref)}</small><h1>${esc(current.q)}</h1><div class="group-choices">${current.choices.map((c,i)=>`<button data-sprint-answer="${i}">${esc(c)}</button>`).join('')}</div><p class="turn-note">Turn: <b>${esc(turn)}</b> · correct answer = 10 knowledge pts</p></section>`)
  }
  function sprintAnswer(i){
    const ok=Number(i)===current.answer,name=active();if(ok)award(name,10,'knowledge','Team Bible Sprint');
    const card=layer().querySelector('.play-card');card.querySelectorAll('[data-sprint-answer]').forEach((b,n)=>{b.disabled=true;if(n===current.answer)b.classList.add('correct');else if(n===Number(i))b.classList.add('wrong')});
    card.insertAdjacentHTML('beforeend',`<div class="group-feedback ${ok?'good':'miss'}"><b>${ok?'Correct · +10':'Not this one'}</b><p>${esc(current.why||'')}</p><small>${esc(current.ref||'')}</small><button data-group-next>Next →</button></div>`)
  }

  async function detective(){
    if(!requireRoster())return;mode='detective';await loadQuestions();queue=shuffle(window.BQ_DETECTIVES||[]);round=0;nextDetective();
  }
  function nextDetective(){if(round>=queue.length){record('detective');return finish('Detective round complete','Winners earned knowledge points.')}current=queue[round];clueIndex=0;renderDetective()}
  function renderDetective(){
    show(`<header class="group-top"><button data-group-home>← Modes</button><b>Detective Hot Seat</b><span>${round+1}/${queue.length}</span></header>${participantBar()}<section class="play-card detective-card"><small>BIBLE DETECTIVE</small><h1>Who am I?</h1><div class="clue-stack">${current.clues.slice(0,clueIndex+1).map((c,i)=>`<div><span>${i+1}</span>${esc(c)}</div>`).join('')}</div>${clueIndex<current.clues.length-1?'<button class="secondary-action" data-reveal-clue>Reveal another clue</button>':''}<div class="winner-grid"><small>Tap the first correct guesser:</small>${roster().map(p=>`<button data-detective-winner="${esc(p.name)}">${esc(p.name)}</button>`).join('')}</div><details><summary>Show answer</summary><b>${esc(current.answer)}</b> · ${esc(current.ref)}</details></section>`)
  }
  function detectiveWinner(name){const pts=Math.max(4,10-(clueIndex*2));award(name,pts,'knowledge','Detective Hot Seat');round++;setTimeout(nextDetective,120)}

  function hunt(){if(!requireRoster())return;mode='hunt';queue=shuffle(verseHunt).slice(0,10);round=0;nextHunt()}
  function nextHunt(){if(round>=queue.length){record('verse-hunt');return finish('Verse Hunt complete','Reading points were recorded for round winners.')}current=queue[round];show(`<header class="group-top"><button data-group-home>← Modes</button><b>Verse Hunt</b><span>${round+1}/${queue.length}</span></header><section class="play-card hunt-card"><small>FIRST TO FIND IT</small><h1>${esc(current[0])}</h1><p>${esc(current[1])}</p><div class="winner-grid"><small>Who found it first?</small>${roster().map(p=>`<button data-hunt-winner="${esc(p.name)}">${esc(p.name)}</button>`).join('')}</div><button class="secondary-action" data-hunt-skip>No winner / skip</button></section>`)}
  function huntWinner(name){award(name,8,'reading','Verse Hunt');round++;nextHunt()}

  function circle(kind='circle'){
    if(!requireRoster())return;mode=kind;current=pick(discussion.filter(x=>kind!=='wisdom'||['Faith','Grace','Work','Money','Service','Motives','Church'].includes(x.cat)));selectedName=active();
    show(`<header class="group-top"><button data-group-home>← Modes</button><b>${kind==='wisdom'?'Wisdom Table':'Conversation Circle'}</b><span>${current.icon}</span></header>${participantBar()}<section class="conversation-card"><small>${esc(current.cat).toUpperCase()}</small><h1>${esc(current.q)}</h1><div class="conversation-follow"><b>Go deeper</b><p>${esc(current.follow)}</p></div><div class="scripture-anchor"><b>Read together</b><span>${current.refs.map(esc).join(' · ')}</span></div><div class="conversation-rules"><b>Helpful rule</b><p>Ask before answering. Paraphrase before disagreeing. The most popular answer is not automatically the biblical answer.</p></div><div class="conversation-actions"><button data-conversation-done>We discussed it</button><button class="secondary-action" data-conversation-next>New topic</button></div></section>`)
  }
  function discussionDone(){const people=allParticipants();people.forEach(n=>award(n,2,mode==='wisdom'?'wisdom':'group',mode==='wisdom'?'Wisdom Table':'Conversation Circle'));record(mode==='wisdom'?'wisdom-table':'conversation-circle',people,{topic:current.cat});circle(mode)}

  function pair(){if(!requireRoster())return;mode='pair';current=pick(pairPrompts);const r=roster();show(`<header class="group-top"><button data-group-home>← Modes</button><b>Pair & Share</b><span>🤝</span></header><section class="pair-card"><small>${esc(current[0]).toUpperCase()}</small><h1>${esc(current[1])}</h1><div class="pair-steps"><div><span>1</span><p>Partner A speaks. Partner B listens and asks one curious question.</p></div><div><span>2</span><p>Partner B summarizes what they heard before responding.</p></div><div><span>3</span><p>Switch roles.</p></div></div><div class="scripture-anchor"><b>Scripture anchor</b><span>${esc(current[2])}</span></div><div class="pair-pickers"><small>Choose the two participants:</small>${r.map(p=>`<label><input type="checkbox" value="${esc(p.name)}" data-pair-person> ${esc(p.name)}</label>`).join('')}</div><div class="conversation-actions"><button data-pair-done>Completed together</button><button class="secondary-action" data-pair-next>New prompt</button></div></section>`)}
  function pairDone(){const chosen=[...layer().querySelectorAll('[data-pair-person]:checked')].map(x=>x.value);const people=chosen.length?chosen:allParticipants().slice(0,2);people.forEach(n=>award(n,3,'group','Pair & Share'));record('pair-share',people,{topic:current[0]});pair()}

  function finish(title,text){show(`<header class="group-top"><button data-group-home>← Modes</button><b>Session complete</b><span>🎉</span></header><section class="finish-card"><span>🏆</span><h1>${esc(title)}</h1><p>${esc(text)}</p><div><button data-group-board>View leaderboard</button><button class="secondary-action" data-group-home>Play another mode</button></div></section>`)}

  function bind(){
    const x=layer();x.querySelectorAll('[data-group-close]').forEach(b=>b.onclick=close);x.querySelectorAll('[data-group-home]').forEach(b=>b.onclick=home);x.querySelectorAll('[data-group-roster]').forEach(b=>b.onclick=()=>{close();community()?.openRoster?.()});x.querySelectorAll('[data-group-board]').forEach(b=>b.onclick=()=>{close();community()?.openBoard?.()});x.querySelectorAll('[data-group-person]').forEach(b=>b.onclick=()=>{selectedName=b.dataset.groupPerson;community()?.setActive?.(selectedName);if(mode==='detective')renderDetective();else if(mode==='circle'||mode==='wisdom')circle(mode)});
    x.querySelectorAll('[data-group-mode]').forEach(b=>b.onclick=()=>{const m=b.dataset.groupMode;if(m==='sprint')sprint();if(m==='detective')detective();if(m==='hunt')hunt();if(m==='circle')circle('circle');if(m==='wisdom')circle('wisdom');if(m==='pair')pair()});
    x.querySelectorAll('[data-group-couples]').forEach(b=>b.onclick=()=>{close();document.querySelector('[data-couples-open]')?.click()});
    x.querySelectorAll('[data-sprint-answer]').forEach(b=>b.onclick=()=>sprintAnswer(b.dataset.sprintAnswer));x.querySelectorAll('[data-group-next]').forEach(b=>b.onclick=()=>{round++;nextSprint()});
    x.querySelectorAll('[data-reveal-clue]').forEach(b=>b.onclick=()=>{clueIndex=Math.min(current.clues.length-1,clueIndex+1);renderDetective()});x.querySelectorAll('[data-detective-winner]').forEach(b=>b.onclick=()=>detectiveWinner(b.dataset.detectiveWinner));
    x.querySelectorAll('[data-hunt-winner]').forEach(b=>b.onclick=()=>huntWinner(b.dataset.huntWinner));x.querySelectorAll('[data-hunt-skip]').forEach(b=>b.onclick=()=>{round++;nextHunt()});
    x.querySelectorAll('[data-conversation-done]').forEach(b=>b.onclick=discussionDone);x.querySelectorAll('[data-conversation-next]').forEach(b=>b.onclick=()=>circle(mode));x.querySelectorAll('[data-pair-done]').forEach(b=>b.onclick=pairDone);x.querySelectorAll('[data-pair-next]').forEach(b=>b.onclick=pair);
  }
  document.addEventListener('click',e=>{if(e.target.closest('[data-group-open]'))home()});
  window.BQGroupPlay={open:home,sprint,detective,hunt,circle,pair};
})();