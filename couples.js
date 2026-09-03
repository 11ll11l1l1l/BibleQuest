(() => {
  const KEY='biblequest_couples_v1';
  const CATS={
    christ:['✝️','Us & God'],communication:['👂','Listen & Understand'],conflict:['🕊️','Repair & Forgive'],gratitude:['💛','Friendship & Gratitude'],stewardship:['🏠','Money & Responsibilities'],intimacy:['🤍','Closeness & Affection'],family:['🌱','Parenting & Family'],mission:['🧭','Purpose & Future']
  };
  const cards=[
    {id:'c01',cat:'christ',title:'Same direction?',prompt:'Sa season natin ngayon, saan mo pinaka-nararamdaman na hinihila tayo ni Christ na mag-grow bilang mag-asawa?',follow:'Ano ang isang maliit na spiritual habit na kaya nating gawin together nang realistic?',practice:'10 minutes this week: read, pray, then share one sentence each.',ref:'Colossians 3:12–14',code:'COL',chapter:3},
    {id:'c02',cat:'christ',title:'Faith without performance',prompt:'May part ba ng spiritual life natin na ginagawa natin dahil “dapat,” pero hindi na natin pinag-uusapan nang totoo?',follow:'Ano ang makakatulong para maging mas honest at less performative ang faith natin sa bahay?',practice:'Ask one honest faith question without trying to fix the answer.',ref:'Psalm 139:23–24',code:'PSA',chapter:139},
    {id:'c03',cat:'christ',title:'Pray for me like this',prompt:'Kung isang bagay lang ang ipagpe-pray mo para sa akin this month, ano iyon—and why?',follow:'Ano ang ayaw mong gawing “project” kita habang ipinagpe-pray kita?',practice:'Pray one specific, non-corrective prayer for your spouse.',ref:'Philippians 1:9–11',code:'PHP',chapter:1},
    {id:'c04',cat:'christ',title:'Grace at home',prompt:'Saan ako pinakamadaling bigyan ng grace ng ibang tao pero pinakamahirap bigyan ng grace sa bahay?',follow:'Paano natin mapaghihiwalay ang grace sa pag-iwas sa accountability?',practice:'Name one grace you received from your spouse this week.',ref:'Ephesians 4:2–3',code:'EPH',chapter:4},

    {id:'c05',cat:'communication',title:'Do you feel heard?',prompt:'Kailan mo huling naramdaman na talagang naintindihan kita—not just narinig?',follow:'Ano ang ginawa ko noon na gusto mong ulitin ko?',practice:'For one conversation, summarize before giving your opinion.',ref:'James 1:19',code:'JAS',chapter:1},
    {id:'c06',cat:'communication',title:'What I miss',prompt:'Anong signal mo kapag pagod, worried, o overwhelmed ka na madalas kong nami-miss?',follow:'Ano ang pinaka-helpful kong response kapag nakikita ko ang signal na iyon?',practice:'Agree on one simple phrase that means “I need support, not solutions.”',ref:'Proverbs 18:13',code:'PRO',chapter:18},
    {id:'c07',cat:'communication',title:'Advice or presence?',prompt:'Kapag may problema ka, paano ko malalaman kung gusto mo ng advice, tulong, prayer, o simpleng kasama lang?',follow:'May example ba recently na maling mode ang ginamit ko?',practice:'Ask: “Makikinig lang ba ako, tutulong, or mag-iisip tayo ng solution?”',ref:'Romans 12:15',code:'ROM',chapter:12},
    {id:'c08',cat:'communication',title:'Hard truth, gentle delivery',prompt:'Ano ang isang concern na gusto mong mas safe sabihin sa akin nang hindi ako agad defensive?',follow:'Anong wording o timing ang makakatulong para marinig ko ito nang maayos?',practice:'Use one specific observation, not “always” or “never.”',ref:'Ephesians 4:15',code:'EPH',chapter:4},

    {id:'c09',cat:'conflict',title:'The real issue',prompt:'Kapag paulit-ulit ang argument natin, ano sa tingin mo ang deeper need sa ilalim ng topic?',follow:'Ano ang fear o assumption na baka hindi natin nasasabi?',practice:'Name the issue in one sentence without blame.',ref:'Proverbs 15:1',code:'PRO',chapter:15},
    {id:'c10',cat:'conflict',title:'My part',prompt:'Sa isang recent conflict, ano ang part ko na kaya kong akuin kahit may part ka rin?',follow:'Ano ang sincere repair na mas meaningful kaysa simpleng “sorry”?',practice:'Own one specific action without adding “pero ikaw kasi…”.',ref:'Matthew 7:3–5',code:'MAT',chapter:7},
    {id:'c11',cat:'conflict',title:'Forgiveness and trust',prompt:'May bagay ba na napatawad na natin in principle pero kailangan pa rin ng rebuilding ng trust?',follow:'Anong consistent action—not promise—ang makakatulong?',practice:'Choose one observable trust-building behavior for 7 days.',ref:'Colossians 3:13',code:'COL',chapter:3},
    {id:'c12',cat:'conflict',title:'When to pause',prompt:'Ano ang signs na hindi na productive ang usapan natin at kailangan muna nating huminto?',follow:'Paano tayo magpa-pause nang hindi mukhang abandonment o silent treatment?',practice:'Agree on a pause phrase and a concrete return time.',ref:'Proverbs 17:14',code:'PRO',chapter:17},

    {id:'c13',cat:'gratitude',title:'I noticed this',prompt:'Anong effort ko recently ang napansin mo pero baka hindi mo pa nasasabi?',follow:'Bakit meaningful iyon sa iyo?',practice:'Give one specific appreciation today—behavior, impact, gratitude.',ref:'1 Thessalonians 5:11',code:'1TH',chapter:5},
    {id:'c14',cat:'gratitude',title:'Still my friend',prompt:'Ano ang bagay na nami-miss mong gawin natin as friends—not just as spouses/parents/workers?',follow:'Ano ang cheapest, simplest version na puwede nating gawin this month?',practice:'Schedule one low-pressure shared activity.',ref:'Ecclesiastes 4:9–10',code:'ECC',chapter:4},
    {id:'c15',cat:'gratitude',title:'What I admire now',prompt:'Ano ang quality ko na mas naa-appreciate mo ngayon kaysa noong bago pa tayo?',follow:'Saan mo nakikita na nag-grow ako?',practice:'Say one admiration without joking it away.',ref:'Philippians 4:8',code:'PHP',chapter:4},
    {id:'c16',cat:'gratitude',title:'Best small memory',prompt:'Anong maliit at ordinaryong memory natin ang unexpectedly precious sa iyo?',follow:'Ano ang sinasabi nito tungkol sa klase ng life na gusto nating buuin?',practice:'Recreate one simple thing you both enjoyed before.',ref:'Psalm 90:12',code:'PSA',chapter:90},

    {id:'c17',cat:'stewardship',title:'Money means what?',prompt:'Kapag pinag-uusapan natin ang money, ano ang pinaka-malakas na emotion mo: security, freedom, fear, responsibility, generosity, status, o iba?',follow:'Saan kaya galing ang meaning na iyon sa family history mo?',practice:'Discuss one money decision by values first, numbers second.',ref:'Luke 14:28',code:'LUK',chapter:14},
    {id:'c18',cat:'stewardship',title:'Invisible work',prompt:'Anong responsibility sa bahay/family ang tingin mo hindi masyadong nakikita o naa-appreciate?',follow:'May task ba na kailangang i-redistribute, simplify, or stop?',practice:'Transfer or simplify one recurring burden this week.',ref:'Galatians 6:2',code:'GAL',chapter:6},
    {id:'c19',cat:'stewardship',title:'Enough',prompt:'Ano ang ibig sabihin ng “enough” para sa family natin—money, house, possessions, work hours?',follow:'Ano ang ayaw nating isakripisyo para lang kumita o umangat?',practice:'Write one family boundary around work, spending, or time.',ref:'1 Timothy 6:6–8',code:'1TI',chapter:6},
    {id:'c20',cat:'stewardship',title:'Generosity together',prompt:'Saan tayo gustong maging generous bilang couple—family, church, neighbors, strangers, time, skills?',follow:'Paano tayo magiging generous nang hindi irresponsible sa sariling household?',practice:'Choose one planned act of generosity together.',ref:'2 Corinthians 9:7',code:'2CO',chapter:9},

    {id:'c21',cat:'intimacy',title:'Loved in ordinary days',prompt:'Anong ordinary action ang pinaka-nagpaparamdam sa iyo na loved ka?',follow:'Ano ang ginagawa kong sincere pero hindi ganoon ka-meaningful sa iyo?',practice:'Do one small affection your spouse actually values.',ref:'1 Corinthians 13:4–7',code:'1CO',chapter:13},
    {id:'c22',cat:'intimacy',title:'Closeness needs safety',prompt:'Ano ang nagpapadali para maging emotionally open at affectionate ka sa akin?',follow:'Ano ang behavior na mabilis magsara ng loob mo?',practice:'Create one distraction-free 15-minute connection window.',ref:'1 Peter 3:7',code:'1PE',chapter:3},
    {id:'c23',cat:'intimacy',title:'Ask, don’t assume',prompt:'May need ba sa closeness, affection, rest, or attention na ina-assume nating obvious pero hindi pala napag-uusapan?',follow:'Paano natin ito mapag-uusapan nang walang pressure o entitlement?',practice:'Ask clearly for one form of connection and accept an honest answer.',ref:'Philippians 2:3–4',code:'PHP',chapter:2},
    {id:'c24',cat:'intimacy',title:'Protect our us-time',prompt:'Ano ang pinakamalaking kumakain ng couple connection natin ngayon?',follow:'Ano ang realistic protection—not ideal fantasy—na kaya nating gawin?',practice:'Protect one small recurring couple window this week.',ref:'Genesis 2:24',code:'GEN',chapter:2},

    {id:'c25',cat:'family',title:'What are we teaching?',prompt:'Anong value ang gusto nating makita ng mga anak/family sa paraan ng pakikitungo natin sa isa’t isa?',follow:'Ano ang nakikita nila ngayon na gusto nating baguhin?',practice:'Model one respectful repair in front of family when appropriate.',ref:'Deuteronomy 6:6–7',code:'DEU',chapter:6},
    {id:'c26',cat:'family',title:'Same team parenting',prompt:'Saan tayo pinaka-aligned sa parenting at saan tayo madalas magkaiba?',follow:'Ano ang rule o principle na kailangan nating pag-usapan privately bago harapin ang bata?',practice:'Agree on one consistent parenting response.',ref:'Ephesians 6:4',code:'EPH',chapter:6},
    {id:'c27',cat:'family',title:'Family pressure',prompt:'May pressure ba mula sa extended family, culture, church, or expectations na nakakaapekto sa marriage natin?',follow:'Anong boundary ang dapat nating hawakan together?',practice:'Use “we decided” rather than leaving one spouse alone to defend the boundary.',ref:'Genesis 2:24',code:'GEN',chapter:2},
    {id:'c28',cat:'family',title:'Home atmosphere',prompt:'Kung may isang word na gusto nating maramdaman sa bahay—peaceful, joyful, safe, disciplined, welcoming—ano iyon?',follow:'Anong habit ang pinaka-supportive at ano ang pinaka-sumasabotahe dito?',practice:'Pick one home atmosphere habit for seven days.',ref:'Colossians 3:15',code:'COL',chapter:3},

    {id:'c29',cat:'mission',title:'What are we building?',prompt:'Kung titingnan natin ang marriage natin 10 years from now, anong klaseng couple ang gusto nating maging—not just anong meron tayo?',follow:'Anong trait ang kailangan nating simulan ngayon?',practice:'Write one sentence describing the couple you want to become.',ref:'Joshua 24:15',code:'JOS',chapter:24},
    {id:'c30',cat:'mission',title:'Serve together',prompt:'Anong need sa paligid natin ang pareho nating napapansin at may realistic tayong maitutulong?',follow:'Paano ito magiging shared mission at hindi dagdag na burden sa isang spouse?',practice:'Choose one small act of service you can do together.',ref:'Galatians 5:13',code:'GAL',chapter:5},
    {id:'c31',cat:'mission',title:'Dream without pressure',prompt:'Anong dream mo na gusto mong marinig ko nang hindi ko agad kino-correct, kino-cost, o kino-convert into plan?',follow:'Ano ang part ng dream na pinaka-importanteng maintindihan ko?',practice:'Give your spouse five uninterrupted minutes to describe a dream.',ref:'Proverbs 16:3',code:'PRO',chapter:16},
    {id:'c32',cat:'mission',title:'Next faithful step',prompt:'Sa biggest decision natin ngayon, ano ang alam na nating tamang next step kahit hindi pa malinaw ang buong future?',follow:'Ano ang fear na nagpapa-delay sa atin?',practice:'Choose one reversible next step and a date to revisit it.',ref:'James 1:5',code:'JAS',chapter:1}
  ];

  const checkItems=[
    ['heard','Naramdaman kong pinakinggan at inintindi ako.'],
    ['affection','Naramdaman ko ang affection, warmth, at closeness natin.'],
    ['team','Pakiramdam ko magkakampi tayo sa responsibilities at decisions.'],
    ['faith','May meaningful space tayo para kay Christ, prayer, o Scripture.'],
    ['appreciation','Naramdaman kong naa-appreciate ang effort ko.'],
    ['safety','Safe akong magsabi ng concern nang hindi agad natatakot sa reaction.']
  ];

  let session=null;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const read=()=>{try{return {favorites:[],history:[],commitments:[],checkins:[],listenCount:0,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {favorites:[],history:[],commitments:[],checkins:[],listenCount:0}}};
  const write=s=>localStorage.setItem(KEY,JSON.stringify(s));
  const pick=a=>a[Math.floor(Math.random()*a.length)];

  function layer(){let x=document.getElementById('bqCouplesLayer');if(!x){x=document.createElement('div');x.id='bqCouplesLayer';x.className='couples-layer hidden';document.body.appendChild(x)}return x;}
  function show(html){const x=layer();x.innerHTML=`<main class="couples-app">${html}</main>`;x.classList.remove('hidden');document.body.classList.add('couples-open');bind();x.scrollTop=0;}
  function close(){layer().classList.add('hidden');document.body.classList.remove('couples-open');session=null;}

  function injectHome(){
    if(document.querySelector('[data-couples-open]'))return;
    const titles=[...document.querySelectorAll('.section-title h2')];
    const group=titles.find(x=>/Group study/i.test(x.textContent));
    const anchor=group?.closest('.section-title'); if(!anchor)return;
    anchor.insertAdjacentHTML('beforebegin',`<div class="section-title couples-section-title"><h2>Grow Together</h2><small>Couples · Christ-centered conversations</small></div><button class="couples-home-card" data-couples-open><div class="couples-home-icon">💞</div><div><span>COUPLES GROWTH</span><h3>Love deeper. Listen better. Follow Christ together.</h3><p>Deep question cards, listening drills, check-ins, repair conversations, date-night prompts, at shared spiritual practices.</p></div><b>›</b></button>`);
  }

  function dashboard(){
    const s=read(), active=(s.commitments||[]).filter(x=>!x.done).slice(-1)[0];
    show(`<header class="couples-top"><button data-couples-close>← BibleQuest</button><b>Grow Together</b><span>💞</span></header><section class="couples-panel">
      <div class="couples-hero"><div class="eyebrow">COUPLES GROWTH</div><h1>Hindi contest ang marriage.</h1><p>Goal: mas makilala ang isa’t isa, mas maayos makinig, mas mabilis mag-repair, at mas sabay lumago kay Christ.</p></div>
      ${active?`<button class="couples-active" data-couples-commitment><small>ACTIVE 7-DAY PRACTICE</small><b>${esc(active.text)}</b><span>Tap to complete →</span></button>`:''}
      <div class="couples-mode-grid">
        <button data-couples-mode="card"><span>💬</span><b>One Card Tonight</b><small>Isang deep question, then switch.</small></button>
        <button data-couples-mode="listen"><span>👂</span><b>Listen First</b><small>Practice understanding bago advice.</small></button>
        <button data-couples-mode="checkin"><span>🌡️</span><b>Couple Check-in</b><small>Pass-the-phone, then compare gently.</small></button>
        <button data-couples-mode="repair"><span>🕊️</span><b>Repair Room</b><small>For ordinary conflict, not blame.</small></button>
        <button data-couples-mode="god"><span>✝️</span><b>Us & God</b><small>Faith, prayer, grace, shared direction.</small></button>
        <button data-couples-mode="date"><span>✨</span><b>Date Night Deck</b><small>Friendship, gratitude, dreams, closeness.</small></button>
      </div>
      <div class="couples-categories">${Object.entries(CATS).map(([k,[icon,label]])=>`<button data-couples-cat="${k}"><span>${icon}</span><b>${label}</b></button>`).join('')}</div>
      <div class="couples-principles"><b>Conversation rules</b><p>Makinig para maintindihan, hindi para manalo. Huwag gumamit ng Bible verse bilang weapon. Be curious before defensive. Specific behavior > character attack.</p></div>
      <div class="couples-stats"><div><b>${(s.history||[]).length}</b><span>cards discussed</span></div><div><b>${(s.checkins||[]).length}</b><span>check-ins</span></div><div><b>${(s.commitments||[]).filter(x=>x.done).length}</b><span>practices done</span></div></div>
    </section>`);
  }

  function cardView(card=pick(cards),label='DEEP QUESTION CARD'){
    session={type:'card',card}; const fav=read().favorites.includes(card.id),[icon,cat]=CATS[card.cat];
    show(`<header class="couples-top"><button data-couples-home>← Couples</button><b>${cat}</b><button data-couples-close>×</button></header><section class="couples-panel"><article class="couples-card">
      <div class="couples-card-head"><span>${icon}</span><div><small>${label}</small><h1>${esc(card.title)}</h1></div></div>
      <div class="couples-question"><small>PARTNER 1</small><p>${esc(card.prompt)}</p></div>
      <div class="couples-listen-note">Partner 2: huwag muna sumagot. I-paraphrase muna: <b>“Ang narinig ko ay…”</b> Then ask: <b>“Tama ba pagkaintindi ko?”</b></div>
      <div class="couples-question follow"><small>THEN SWITCH</small><p>${esc(card.follow)}</p></div>
      <div class="couples-scripture"><div><small>READ TOGETHER</small><b>📖 ${esc(card.ref)}</b><span>Open in BibleQuest Reader · BSB</span></div><button data-couples-scripture>Read BSB</button></div>
      <div class="couples-practice"><small>ONE SMALL PRACTICE</small><p>${esc(card.practice)}</p></div>
      <div class="couples-actions"><button data-couples-fav>${fav?'★ Saved':'☆ Save card'}</button><button data-couples-practice>7-day practice</button><button class="primary" data-couples-discussed>✓ Discussed</button></div>
      <button class="couples-next" data-couples-next>Another card →</button>
    </article></section>`);
  }

  function listenView(step=0){
    if(!session||session.type!=='listen')session={type:'listen',card:pick(cards.filter(x=>x.cat==='communication'||x.cat==='conflict')),step:0};
    session.step=step;const c=session.card;
    const steps=[
      `<small>SPEAKER</small><h2>Share for 2 minutes.</h2><p>${esc(c.prompt)}</p><div class="listen-rule">No cross-examination. Describe your experience, not your spouse’s character.</div>`,
      `<small>LISTENER</small><h2>Mirror before response.</h2><p><b>“Ang narinig ko ay…”</b></p><p><b>“Parang mahalaga sa’yo ito dahil…”</b></p><p>Then ask: <b>“Tama ba pagkaintindi ko?”</b></p>`,
      `<small>SPEAKER</small><h2>Did you feel understood?</h2><div class="understood-row"><button data-understood="yes">Yes</button><button data-understood="almost">Almost</button><button data-understood="no">Not yet</button></div><p class="listen-rule">If not yet: clarify the missing part. Listener mirrors again—no defending yet.</p>`,
      `<small>SWITCH</small><h2>Palit ng role.</h2><p>${esc(c.follow)}</p><div class="listen-rule">Same rule: understanding first, response second.</div>`,
      `<small>FINISH</small><h2>One useful sentence each.</h2><p>“Isang bagay na mas naiintindihan ko tungkol sa’yo ngayon ay…”</p><p>“Isang bagay na kaya kong gawin differently ay…”</p>`
    ];
    show(`<header class="couples-top"><button data-couples-home>← Couples</button><b>Listen First</b><button data-couples-close>×</button></header><section class="couples-panel"><div class="listen-progress"><i style="width:${(step+1)/steps.length*100}%"></i></div><article class="listen-card">${steps[step]}<div class="couples-scripture mini"><div><small>ANCHOR</small><b>📖 James 1:19</b><span>Quick to listen, slow to speak · read in BSB Reader</span></div></div><div class="couples-actions">${step?'<button data-listen-prev>← Back</button>':''}<button class="primary" data-listen-next>${step===steps.length-1?'Complete':'Next →'}</button></div></article></section>`);
  }

  function startCheck(){session={type:'check',partner:1,a:{},b:{}};renderCheck();}
  function renderCheck(){
    if(session.partner===3)return checkResults();
    if(session.partner==='pass')return show(`<header class="couples-top"><button data-couples-home>← Couples</button><b>Couple Check-in</b><button data-couples-close>×</button></header><section class="couples-panel"><div class="pass-phone"><span>📱</span><h1>Pass the phone.</h1><p>Partner 1 done. Ibigay muna sa Partner 2 bago pindutin ang continue. Huwag munang i-discuss ang sagot.</p><button class="primary" data-check-pass>Partner 2 ready</button></div></section>`);
    const who=session.partner===1?'PARTNER 1':'PARTNER 2', answers=session.partner===1?session.a:session.b;
    show(`<header class="couples-top"><button data-couples-home>← Couples</button><b>Couple Check-in</b><button data-couples-close>×</button></header><section class="couples-panel"><div class="check-head"><div class="eyebrow">${who}</div><h1>How did this week feel?</h1><p>1 = hindi ko halos naramdaman · 5 = strongly felt. Walang “correct” score.</p></div><div class="check-list">${checkItems.map(([id,label])=>`<label><span>${esc(label)}</span><div><input type="range" min="1" max="5" value="${answers[id]||3}" data-check="${id}"><b data-check-value="${id}">${answers[id]||3}</b></div></label>`).join('')}</div><button class="couples-check-submit" data-check-submit>Save ${who} →</button></section>`);
  }

  function checkResults(){
    const rows=checkItems.map(([id,label])=>({id,label,a:+session.a[id]||3,b:+session.b[id]||3}));
    const gap=[...rows].sort((x,y)=>Math.abs(y.a-y.b)-Math.abs(x.a-x.b))[0];
    const strong=[...rows].sort((x,y)=>(y.a+y.b)-(x.a+x.b))[0];
    const s=read();s.checkins.push({at:new Date().toISOString(),a:session.a,b:session.b});s.checkins=s.checkins.slice(-30);write(s);
    show(`<header class="couples-top"><button data-couples-home>← Couples</button><b>Check-in Result</b><button data-couples-close>×</button></header><section class="couples-panel"><div class="check-result"><div class="eyebrow">NO WINNER · NO LOSER</div><h1>Compare with curiosity.</h1><p>Ang difference ng rating ay invitation para magtanong, hindi proof na mali ang isa.</p><div class="check-highlight good"><small>SHARED STRENGTH</small><b>${esc(strong.label)}</b><span>${strong.a} / ${strong.b}</span></div><div class="check-highlight"><small>BIGGEST PERCEPTION GAP</small><b>${esc(gap.label)}</b><span>${gap.a} / ${gap.b}</span></div><div class="check-table">${rows.map(r=>`<div><span>${esc(r.label)}</span><b>${r.a}</b><b>${r.b}</b></div>`).join('')}</div><div class="couples-principles"><b>Start here:</b><p>Partner with the lower rating explains first. Other partner asks: “Ano ang isang specific moment this week na nakaapekto sa rating mo?” Then summarize before responding.</p></div><button class="primary" data-couples-home>Done</button></div></section>`);
  }

  function repairView(step=0){
    const steps=[
      ['1 · PAUSE','Name one issue only','“Ang issue na gusto kong ayusin ay…” Keep it specific. No history dump.'],
      ['2 · IMPACT','Describe impact without attack','“Kapag nangyayari ang ___, nararamdaman ko ___, at ang kailangan kong maintindihan mo ay ___.”'],
      ['3 · MIRROR','Prove understanding first','Listener: “Ang narinig ko ay…” Speaker corrects gently until accurate.'],
      ['4 · OWN','Own your part','Each person names one thing they did, failed to do, or assumed—without adding a counterattack.'],
      ['5 · REPAIR','Choose one next behavior','Agree on one observable action, one boundary if needed, and when you will revisit the issue.']
    ];
    session={type:'repair',step};const [k,t,p]=steps[step];
    show(`<header class="couples-top"><button data-couples-home>← Couples</button><b>Repair Room</b><button data-couples-close>×</button></header><section class="couples-panel"><div class="repair-safety"><b>Safety boundary</b><p>For ordinary relationship conflict only. If there is fear, threats, coercion, stalking, or violence, huwag i-frame ito as “pareho lang may kasalanan.” Prioritize safety and trusted/professional support.</p></div><article class="repair-card"><small>${k}</small><h1>${t}</h1><p>${p}</p><div class="couples-scripture mini"><div><small>REFLECT</small><b>📖 Ephesians 4:26–32</b><span>Read together in BSB; don’t use the passage to win the argument.</span></div></div><div class="couples-actions">${step?`<button data-repair="${step-1}">← Back</button>`:''}<button class="primary" data-repair="${step+1}">${step===steps.length-1?'Finish':'Next →'}</button></div></article></section>`);
  }

  function chooseMode(mode){
    if(mode==='card')return cardView();
    if(mode==='listen'){session=null;return listenView(0)}
    if(mode==='checkin')return startCheck();
    if(mode==='repair')return repairView(0);
    if(mode==='god')return cardView(pick(cards.filter(x=>x.cat==='christ'||x.cat==='mission')),'US & GOD');
    if(mode==='date')return cardView(pick(cards.filter(x=>['gratitude','intimacy','mission'].includes(x.cat))),'DATE NIGHT CARD');
  }

  function openScripture(){
    const c=session?.card;if(!c)return;
    close();setTimeout(()=>{
      const open=document.querySelector('[data-reader-open]');if(!open)return;open.click();
      const start=Date.now(),timer=setInterval(()=>{
        const book=document.querySelector(`[data-reader-book="${CSS.escape(c.code)}"]`);
        if(book){clearInterval(timer);book.setAttribute('data-reader-chapter',String(c.chapter));book.click();}
        else if(Date.now()-start>6000)clearInterval(timer);
      },120);
    },80);
  }

  function saveDiscussed(){const c=session?.card;if(!c)return;const s=read();s.history.push({id:c.id,at:new Date().toISOString()});s.history=s.history.slice(-100);write(s);cardView(pick(cards.filter(x=>x.id!==c.id)));}
  function toggleFav(){const c=session?.card;if(!c)return;const s=read();s.favorites=s.favorites.includes(c.id)?s.favorites.filter(x=>x!==c.id):[...s.favorites,c.id];write(s);cardView(c);}
  function savePractice(){const c=session?.card;if(!c)return;const s=read();s.commitments.push({id:`${c.id}-${Date.now()}`,text:c.practice,created:new Date().toISOString(),done:false});s.commitments=s.commitments.slice(-30);write(s);dashboard();}
  function completeCommit(){const s=read(),x=[...(s.commitments||[])].reverse().find(x=>!x.done);if(x)x.done=true;write(s);dashboard();}

  function bind(){
    const x=layer();
    x.querySelectorAll('[data-couples-close]').forEach(b=>b.onclick=close);x.querySelectorAll('[data-couples-home]').forEach(b=>b.onclick=dashboard);
    x.querySelectorAll('[data-couples-mode]').forEach(b=>b.onclick=()=>chooseMode(b.dataset.couplesMode));
    x.querySelectorAll('[data-couples-cat]').forEach(b=>b.onclick=()=>cardView(pick(cards.filter(x=>x.cat===b.dataset.couplesCat)),CATS[b.dataset.couplesCat][1].toUpperCase()));
    const n=x.querySelector('[data-couples-next]');if(n)n.onclick=()=>cardView(pick(cards.filter(y=>y.id!==session.card.id)));
    const f=x.querySelector('[data-couples-fav]');if(f)f.onclick=toggleFav;const p=x.querySelector('[data-couples-practice]');if(p)p.onclick=savePractice;const d=x.querySelector('[data-couples-discussed]');if(d)d.onclick=saveDiscussed;const sr=x.querySelector('[data-couples-scripture]');if(sr)sr.onclick=openScripture;
    const ln=x.querySelector('[data-listen-next]');if(ln)ln.onclick=()=>{if(session.step>=4){const s=read();s.listenCount=(s.listenCount||0)+1;write(s);dashboard()}else listenView(session.step+1)};const lp=x.querySelector('[data-listen-prev]');if(lp)lp.onclick=()=>listenView(Math.max(0,session.step-1));
    x.querySelectorAll('[data-understood]').forEach(b=>b.onclick=()=>{b.parentElement.querySelectorAll('button').forEach(q=>q.classList.remove('selected'));b.classList.add('selected')});
    x.querySelectorAll('[data-check]').forEach(r=>r.oninput=e=>{const target=x.querySelector(`[data-check-value="${e.target.dataset.check}"]`);if(target)target.textContent=e.target.value;const bag=session.partner===1?session.a:session.b;bag[e.target.dataset.check]=+e.target.value;});
    const cs=x.querySelector('[data-check-submit]');if(cs)cs.onclick=()=>{const bag=session.partner===1?session.a:session.b;checkItems.forEach(([id])=>{if(!bag[id])bag[id]=+(x.querySelector(`[data-check="${id}"]`)?.value||3)});if(session.partner===1){session.partner='pass';renderCheck()}else{session.partner=3;renderCheck()}};
    const cp=x.querySelector('[data-check-pass]');if(cp)cp.onclick=()=>{session.partner=2;renderCheck()};
    x.querySelectorAll('[data-repair]').forEach(b=>b.onclick=()=>{const n=+b.dataset.repair;if(n>=5)dashboard();else repairView(Math.max(0,n))});
    const cm=x.querySelector('[data-couples-commitment]');if(cm)cm.onclick=completeCommit;
  }

  document.addEventListener('click',e=>{const b=e.target.closest?.('[data-couples-open]');if(b){e.preventDefault();dashboard();}});
  const obs=new MutationObserver(injectHome);obs.observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('DOMContentLoaded',injectHome);setTimeout(injectHome,120);
})();