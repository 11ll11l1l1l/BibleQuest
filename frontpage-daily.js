(() => {
  const GROWTH='biblequest_growth_v1';
  const STORE='biblequest_engagement_v3';
  const FOCUS=[
    ['anxiety','🌧️','Anxiety / Worry'],['anger','🌋','Anger'],['parenting','🏡','Parenting'],['marriage','💞','Marriage'],['temptation','🧱','Temptation'],['forgiveness','🕊️','Forgiveness'],['work','🧰','Work'],['doubt','❓','Doubt'],['prayer','🙏','Prayer'],['jesus','✝️','Understanding Jesus']
  ];
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const read=(k,f={})=>{try{return {...f,...JSON.parse(localStorage.getItem(k)||'{}')}}catch{return {...f}}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const localDay=(d=new Date())=>{const x=new Date(d.getTime()-d.getTimezoneOffset()*60000);return x.toISOString().slice(0,10)};

  function focusHome(){
    const home=document.querySelector('.modern-home');if(!home)return false;
    document.body.classList.add('bq-frontpage-focus','bq-engagement-home');
    const stack=home.querySelector('.bq-engagement-stack');
    if(stack&&home.firstElementChild!==stack)home.insertBefore(stack,home.firstElementChild);
    return Boolean(stack?.querySelector('.today-journey-card'));
  }

  function promptState(){return read(STORE,{frontPrompt:{}})}
  function dailyJourney(){const g=read(GROWTH,{}),e=g.engagementV2||{};return {g,e,t:e.daily?.[localDay()]||null}}
  function shouldPrompt(){
    if(!focusHome())return false;
    if(document.body.classList.contains('account-open')||document.body.classList.contains('journey-loop-open')||document.body.classList.contains('innovation-open')||document.body.classList.contains('front-struggle-open'))return false;
    const d=localDay(),{e,t}=dailyJourney(),s=promptState();
    if(t?.completedAt)return false;
    if(e.focusDate===d&&e.focusKey)return false;
    return s.frontPrompt?.date!==d;
  }

  function layer(){let x=document.getElementById('bqFrontStruggle');if(!x){x=document.createElement('div');x.id='bqFrontStruggle';x.className='front-struggle-layer hidden';document.body.appendChild(x)}return x}
  function closePrompt(mark=true){
    const x=layer();x.classList.add('hidden');document.body.classList.remove('front-struggle-open');
    if(mark){const s=promptState();s.frontPrompt={...(s.frontPrompt||{}),date:localDay(),choice:s.frontPrompt?.choice||'skip'};write(STORE,s)}
  }
  function chooseFocus(key){
    const d=localDay(),g=read(GROWTH,{}),e=g.engagementV2||{};
    e.focusKey=key;e.focusDate=d;e.daily=e.daily||{};delete e.daily[d];g.engagementV2=e;write(GROWTH,g);
    const s=promptState();s.frontPrompt={date:d,choice:key,at:new Date().toISOString()};write(STORE,s);
    closePrompt(false);
    window.dispatchEvent(new CustomEvent('bq-journey-change'));
    window.BQJourneyLoop?.render?.();
    setTimeout(()=>window.BQEngagementV3?.refresh?.(),80);
  }

  function openPrompt(){
    if(!shouldPrompt())return;
    const x=layer();
    x.innerHTML=`<div class="front-struggle-scrim" data-front-skip></div><section class="front-struggle-card" role="dialog" aria-modal="true" aria-labelledby="frontStruggleTitle"><header><div><small>TODAY'S PERSONAL FOCUS</small><h2 id="frontStruggleTitle">What are you struggling with today?</h2><p>Pili ka ng isa. BibleQuest will use it to shape today's Scripture, context, and reflection—not to change what the Bible says.</p></div><button data-front-skip aria-label="Skip today">×</button></header><div class="front-struggle-grid">${FOCUS.map(([k,i,t])=>`<button data-front-focus="${k}"><span>${i}</span><b>${esc(t)}</b></button>`).join('')}</div><button class="front-struggle-skip" data-front-skip>Not today</button></section>`;
    x.classList.remove('hidden');document.body.classList.add('front-struggle-open');
    x.querySelectorAll('[data-front-skip]').forEach(b=>b.onclick=()=>closePrompt(true));
    x.querySelectorAll('[data-front-focus]').forEach(b=>b.onclick=()=>chooseFocus(b.dataset.frontFocus));
  }

  function maybePrompt(){if(shouldPrompt())setTimeout(()=>{if(shouldPrompt())openPrompt()},450)}

  function injectStyles(){if(document.getElementById('frontDailyStyles'))return;const s=document.createElement('style');s.id='frontDailyStyles';s.textContent=`
    body.bq-frontpage-focus>.app .hero{display:none!important}
    body.bq-frontpage-focus .modern-home>.bq-pinoy-hero{display:none!important}
    body.bq-frontpage-focus .modern-home>.modern-focus{display:none!important}
    body.bq-frontpage-focus .modern-home{margin-top:8px}
    body.bq-frontpage-focus .bq-engagement-stack{margin-top:0}
    body.bq-frontpage-focus .today-journey-card{order:-20}
    .front-struggle-layer{position:fixed;inset:0;z-index:310;display:grid;place-items:center;padding:18px;background:rgba(26,31,35,.34);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px)}
    .front-struggle-layer.hidden{display:none}.front-struggle-scrim{position:absolute;inset:0}
    .front-struggle-card{position:relative;width:min(560px,100%);max-height:min(82vh,720px);overflow:auto;border-radius:28px;padding:18px;background:linear-gradient(160deg,#fff,#fff6f9 52%,#f2f8ff);box-shadow:0 28px 80px rgba(25,34,42,.25);color:#26323d}
    .front-struggle-card header{display:grid;grid-template-columns:1fr auto;gap:12px}.front-struggle-card header small{font-size:8px;letter-spacing:.13em;font-weight:900;color:#9d6680}.front-struggle-card h2{font-size:24px;line-height:1.08;margin:5px 0}.front-struggle-card header p{font-size:10px;line-height:1.5;color:#6f7b84;margin:0}.front-struggle-card header>button{width:36px;height:36px;border:0;border-radius:50%;background:#fff;color:#66717a;font-size:20px;box-shadow:0 6px 18px rgba(50,60,70,.08)}
    .front-struggle-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0 11px}.front-struggle-grid button{display:grid;grid-template-columns:auto 1fr;gap:9px;align-items:center;border:1px solid rgba(60,75,85,.08);border-radius:17px;padding:11px;background:#fff;text-align:left;color:#26323d}.front-struggle-grid span{font-size:22px}.front-struggle-grid b{font-size:11px}.front-struggle-skip{width:100%;border:0;border-radius:14px;padding:11px;background:#eceef0;color:#6d757c;font-weight:900;font-size:10px}
    body.front-struggle-open{overflow:hidden}
    @media(max-width:390px){.front-struggle-layer{align-items:end;padding:10px}.front-struggle-card{border-radius:26px 26px 18px 18px;padding:16px;max-height:86vh}.front-struggle-card h2{font-size:21px}.front-struggle-grid{grid-template-columns:1fr 1fr;gap:7px}.front-struggle-grid button{padding:10px 9px}.front-struggle-grid b{font-size:10px}}
  `;document.head.appendChild(s)}

  let queued=false;
  function refresh(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;const ready=focusHome();if(ready)maybePrompt()})}
  const observer=new MutationObserver(refresh);observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
  injectStyles();refresh();setTimeout(refresh,700);setTimeout(refresh,1800);
  window.BQFrontDaily={openPrompt,refresh};
})();
