(() => {
  const APP='biblequest_state_v4', KEY='biblequest_extra_games_v1';
  const speakers=[
    {code:'GEN',book:'Genesis',c:50,v:19,answer:'Joseph',choices:['Joseph','Judah','Jacob','Pharaoh']},
    {code:'EXO',book:'Exodus',c:3,v:11,answer:'Moses',choices:['Moses','Aaron','Joshua','Pharaoh']},
    {code:'RUT',book:'Ruth',c:1,v:16,answer:'Ruth',choices:['Ruth','Naomi','Boaz','Orpah']},
    {code:'1SA',book:'1 Samuel',c:17,v:45,answer:'David',choices:['David','Saul','Jonathan','Samuel']},
    {code:'2SA',book:'2 Samuel',c:12,v:13,answer:'David',choices:['David','Nathan','Solomon','Joab']},
    {code:'MAT',book:'Matthew',c:16,v:16,answer:'Simon Peter',choices:['Simon Peter','John','Thomas','Matthew']},
    {code:'MRK',book:'Mark',c:9,v:24,answer:"The boy's father",choices:["The boy's father",'Peter','A Pharisee','John the Baptist']},
    {code:'LUK',book:'Luke',c:1,v:38,answer:'Mary',choices:['Mary','Elizabeth','Anna','Martha']},
    {code:'JHN',book:'John',c:6,v:68,answer:'Simon Peter',choices:['Simon Peter','Philip','Andrew','Thomas']},
    {code:'JHN',book:'John',c:20,v:28,answer:'Thomas',choices:['Thomas','Peter','John','Nathanael']},
    {code:'ACT',book:'Acts',c:9,v:5,answer:'Saul',choices:['Saul','Ananias','Peter','Barnabas']}
  ];
  let manifest=null, session=null;const cache=new Map();
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const shuffle=a=>{const x=[...a];for(let i=x.length-1;i;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x};
  const read=(k,f={})=>{try{return {...f,...JSON.parse(localStorage.getItem(k)||'{}')}}catch{return {...f}}};
  async function json(path){if(cache.has(path))return cache.get(path);const r=await fetch(path);if(!r.ok)throw new Error(`${path} unavailable (${r.status})`);const d=await r.json();cache.set(path,d);return d;}
  async function getManifest(){return manifest||(manifest=await json('data/packs/manifest.json'));}
  function stats(){return read(KEY,{speaker:{played:0,correct:0,best:0,streak:0},story:{played:0,correct:0,best:0,streak:0}})}
  function saveStats(s){localStorage.setItem(KEY,JSON.stringify(s))}
  function award(good){const s=read(APP,{xp:0,answered:0,correct:0,rounds:0});s.answered=(s.answered||0)+1;s.correct=(s.correct||0)+(good?1:0);s.xp=(s.xp||0)+(good?8:2);localStorage.setItem(APP,JSON.stringify(s));}

  function inject(){const grid=document.querySelector('.mode-grid');if(!grid)return;if(!document.querySelector('[data-who-said]'))grid.insertAdjacentHTML('beforeend','<button class="mode-card" data-who-said><span>🗣️</span><b>Who Said It?</b><small>Real BSB verse text</small></button>');if(!document.querySelector('[data-story-next]'))grid.insertAdjacentHTML('beforeend','<button class="mode-card" data-story-next><span>➡️</span><b>What Happens Next?</b><small>Open Bible Stories</small></button>');}
  function layer(){let x=document.getElementById('bqExtraGameLayer');if(!x){x=document.createElement('div');x.id='bqExtraGameLayer';x.className='extra-game-layer hidden';document.body.appendChild(x)}return x}
  function show(html){const x=layer();x.innerHTML=`<main class="extra-game-app">${html}</main>`;x.classList.remove('hidden');document.body.classList.add('extra-game-open');bind();x.scrollTop=0}
  function close(reload=false){layer().classList.add('hidden');document.body.classList.remove('extra-game-open');session=null;if(reload)location.reload()}
  function loading(title,source){show(`<section class="extra-loading"><div>🎮</div><div class="eyebrow">BibleQuest Game</div><h1>${esc(title)}</h1><p>${esc(source)}</p><div class="extra-loadbar"><i></i></div><button data-extra-close>Cancel</button></section>`)}

  async function startSpeaker(){
    loading('Preparing Who Said It?','Loading the BSB verse pack needed for this round.');
    try{await getManifest();session={type:'speaker',items:shuffle(speakers).slice(0,5),index:0,score:0,answered:false};await renderSpeaker();}catch(e){error(e.message)}
  }
  async function renderSpeaker(){
    if(session.index>=session.items.length)return result('speaker');
    const q=session.items[session.index],m=await getManifest(),info=(m.bible_books||[]).find(x=>x.code===q.code);if(!info)return error(`${q.book} BSB pack not found.`);
    const rows=await json(info.path), verse=rows.find(x=>+x.c===q.c&&+x.v===q.v);if(!verse)return error(`${q.book} ${q.c}:${q.v} not found.`);
    session.current={...q,text:verse.t};session.answered=false;
    show(`<header class="extra-top"><button data-extra-close>← BibleQuest</button><b>Who Said It?</b><em>${session.index+1}/${session.items.length}</em></header><section class="extra-panel"><div class="extra-source-line"><span class="bq-source-badge">BSB · Berean Standard Bible</span><b>${esc(q.book)} ${q.c}:${q.v}</b></div><blockquote class="speaker-verse" data-bq-scripture="BSB">${esc(verse.t)}</blockquote><h2>Sino ang nagsabi nito?</h2><div class="extra-choices">${shuffle(q.choices).map(x=>`<button data-speaker-answer="${esc(x)}">${esc(x)}</button>`).join('')}</div><div id="extraFeedback"></div></section>`);
  }
  function answerSpeaker(ans){if(session.answered)return;session.answered=true;const q=session.current,good=ans===q.answer;if(good)session.score++;award(good);const s=stats(),g=s.speaker;g.played++;if(good){g.correct++;g.streak++;g.best=Math.max(g.best,g.streak)}else g.streak=0;saveStats(s);layer().querySelectorAll('[data-speaker-answer]').forEach(b=>{b.disabled=true;if(b.dataset.speakerAnswer===q.answer)b.classList.add('good');else if(b.dataset.speakerAnswer===ans&&!good)b.classList.add('bad')});layer().querySelector('#extraFeedback').innerHTML=`<div class="extra-feedback"><b>${good?'✓ Tama':'Answer: '+esc(q.answer)}</b><p>Source: ${esc(q.book)} ${q.c}:${q.v} · Berean Standard Bible (BSB).</p></div><button class="extra-primary" data-extra-next>${session.index===session.items.length-1?'Result':'Next verse →'}</button>`;bind();}

  async function startStory(){loading('Preparing What Happens Next?','Loading one Open Bible Stories pack at a time.');try{const m=await getManifest();const list=(m.stories||[]).filter(x=>x.scenes>=4);session={type:'story',storyList:shuffle(list).slice(0,5),index:0,score:0,answered:false};await renderStory();}catch(e){error(e.message)}}
  async function renderStory(){
    if(session.index>=session.storyList.length)return result('story');
    const meta=session.storyList[session.index],pack=await json(meta.path),scenes=pack.scenes||[];if(scenes.length<4)return error(`${meta.title} has too few scenes.`);
    const i=Math.floor(Math.random()*(scenes.length-1)),current=scenes[i],correct=scenes[i+1];
    const distract=shuffle(scenes.filter((_,n)=>n!==i&&n!==i+1)).slice(0,2);session.current={meta,current,correct,choices:shuffle([correct,...distract])};session.answered=false;
    show(`<header class="extra-top"><button data-extra-close>← BibleQuest</button><b>What Happens Next?</b><em>${session.index+1}/${session.storyList.length}</em></header><section class="extra-panel"><div class="extra-source-line"><span class="bq-source-badge story">OBS</span><b>${esc(meta.title)}</b><span>${esc(meta.reference||'')}</span></div>${current.image?`<img class="story-next-image" src="${esc(current.image)}" alt="Open Bible Stories scene">`:''}<div class="story-current source-content" data-bq-source-content="obs"><small>CURRENT SCENE</small><p>${esc(current.text)}</p></div><h2>Ano ang susunod?</h2><div class="story-next-choices">${session.current.choices.map(x=>`<button data-story-answer="${x.n}"><span>Scene ${x.n}</span><p class="source-content" data-bq-source-content="obs">${esc(x.text)}</p></button>`).join('')}</div><div id="extraFeedback"></div><div class="extra-source-note">Open Bible Stories · CC BY-SA 4.0 · story retelling, not a Bible translation. Canonical reference: ${esc(meta.reference||'see source')}.</div></section>`);
  }
  function answerStory(n){if(session.answered)return;session.answered=true;const q=session.current,good=+n===+q.correct.n;if(good)session.score++;award(good);const s=stats(),g=s.story;g.played++;if(good){g.correct++;g.streak++;g.best=Math.max(g.best,g.streak)}else g.streak=0;saveStats(s);layer().querySelectorAll('[data-story-answer]').forEach(b=>{b.disabled=true;if(+b.dataset.storyAnswer===+q.correct.n)b.classList.add('good');else if(+b.dataset.storyAnswer===+n&&!good)b.classList.add('bad')});layer().querySelector('#extraFeedback').innerHTML=`<div class="extra-feedback"><b>${good?'✓ Tama ang next scene':'Ito ang next scene'}</b><p class="source-content" data-bq-source-content="obs">${esc(q.correct.text)}</p></div><button class="extra-primary" data-extra-next>${session.index===session.storyList.length-1?'Result':'Next story →'}</button>`;bind();}

  function result(type){const total=type==='speaker'?session.items.length:session.storyList.length,pct=Math.round(session.score/total*100),s=stats()[type];show(`<section class="extra-result"><div>${type==='speaker'?'🗣️':'➡️'}</div><div class="eyebrow">GAME COMPLETE</div><h1>${session.score}/${total}</h1><p>${pct>=80?'Strong round. Source-grounded recall ang na-practice mo.':'Good learning data. Balikan ang references at context, hindi lang ang answer.'}</p><div class="extra-metrics"><div><b>${s.played}</b><span>played</span></div><div><b>${s.played?Math.round(s.correct/s.played*100):0}%</b><span>accuracy</span></div><div><b>${s.best}</b><span>best streak</span></div></div><button class="extra-primary" data-extra-finish>Back to BibleQuest</button></section>`)}
  function error(msg){show(`<section class="extra-result"><div>📦</div><h1>Game pack unavailable</h1><p>${esc(msg)}</p><button class="extra-primary" data-extra-close>Close</button></section>`)}
  function next(){session.index++;session.type==='speaker'?renderSpeaker():renderStory()}
  function bind(){const x=layer();x.querySelectorAll('[data-extra-close]').forEach(b=>b.onclick=()=>close(false));x.querySelectorAll('[data-speaker-answer]').forEach(b=>b.onclick=()=>answerSpeaker(b.dataset.speakerAnswer));x.querySelectorAll('[data-story-answer]').forEach(b=>b.onclick=()=>answerStory(b.dataset.storyAnswer));const n=x.querySelector('[data-extra-next]');if(n)n.onclick=next;const f=x.querySelector('[data-extra-finish]');if(f)f.onclick=()=>close(true)}
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-who-said]')){e.preventDefault();startSpeaker()}if(e.target.closest?.('[data-story-next]')){e.preventDefault();startStory()}});
  const obs=new MutationObserver(inject);obs.observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('DOMContentLoaded',inject);setTimeout(inject,100);
})();