(() => {
  const STORE = 'biblequest_growth_v1';
  const TRANSFORM_STORE = 'biblequest_transformation_v1';
  const MAX_CHECKINS = 52;

  const CHECKIN_FIELDS = [
    ['follow', 'Follow-through', 'Natapos ko ang important commitments na pinili kong gawin.'],
    ['pause', 'Pause bago react', 'Kapag mataas ang emotion, nakakapag-pause ako bago mag-react o gumawa ng major decision.'],
    ['open', 'Open-mindedness', 'Sinasadya kong tingnan ang evidence na puwedeng kumontra sa initial opinion ko.'],
    ['connect', 'Meaningful connection', 'Nag-initiate ako ng meaningful conversation o connection, kahit hindi automatic para sa akin.'],
    ['reflect', 'Reflection', 'Naglaan ako ng oras para mag-reflect, manalangin, o magbasa ng Scripture bago sa important choices.']
  ];

  let memory = load();
  let overlay = null;

  function defaults() {
    return { checkins: [], experiments: [], decisions: [], createdAt: new Date().toISOString() };
  }
  function load() {
    try { return { ...defaults(), ...JSON.parse(localStorage.getItem(STORE) || '{}') }; }
    catch { return defaults(); }
  }
  function save() { localStorage.setItem(STORE, JSON.stringify(memory)); }
  function esc(s='') { return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function today() { return new Date().toISOString().slice(0,10); }
  function id(prefix) { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`; }
  function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }
  function daysBetween(a,b=today()) { return Math.floor((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`))/86400000); }

  function transformData() {
    try { return JSON.parse(localStorage.getItem(TRANSFORM_STORE) || '{}'); }
    catch { return {}; }
  }

  function ensureOverlay() {
    overlay = document.querySelector('.bq-transform-overlay');
    if (!overlay) {
      if (window.BQ_TRANSFORMATION?.open) window.BQ_TRANSFORMATION.open();
      overlay = document.querySelector('.bq-transform-overlay');
    }
    return overlay;
  }

  function wrap(content) {
    return `<div class="growth-app">
      <header class="growth-top">
        <button class="growth-brand" data-growth-home>BibleQuest <span>Growth Lab</span></button>
        <span class="local-chip">🔒 sa device lang</span>
      </header>${content}</div>`;
  }

  function backToTransform() {
    if (window.BQ_TRANSFORMATION?.open) window.BQ_TRANSFORMATION.open();
  }

  function injectHubCard() {
    const grid = document.querySelector('.bq-transform-overlay .transform-grid');
    if (!grid || grid.querySelector('[data-open-growth]')) return;
    const active = memory.experiments.filter(x => x.status === 'active').length;
    const card = document.createElement('button');
    card.className = 'transform-card growth-entry-card';
    card.dataset.openGrowth = '1';
    card.innerHTML = `<span class="ticon">🌱</span><span><small>ONGOING · DEVICE ONLY</small><b>Growth Lab</b><p>Weekly check-in, behavior experiments, decision review, at personal growth history.</p><em>${active ? `${active} active experiment${active>1?'s':''}` : 'Start a growth cycle'}</em></span><i>›</i>`;
    card.onclick = openGrowthHub;
    grid.appendChild(card);

    const summary = document.querySelector('.bq-transform-overlay .transform-summary');
    if (summary && !summary.querySelector('.growth-mini')) {
      const last = memory.checkins.at(-1);
      const mini = document.createElement('div');
      mini.className = 'mini-result growth-mini';
      mini.innerHTML = `<span>🌱</span><div><b>Growth practice</b><p>${last ? `Last weekly check-in: ${esc(last.date)} · ${avgCheckin(last).toFixed(1)}/5 self-rating` : 'Wala pang weekly check-in. Build a baseline this week.'}</p></div>`;
      summary.insertBefore(mini, summary.querySelector('.primary'));
    }
  }

  function openGrowthHub() {
    const root = ensureOverlay();
    if (!root) return;
    memory = load();
    const active = memory.experiments.filter(x => x.status === 'active');
    const completed = memory.experiments.filter(x => x.status === 'completed').length;
    const last = memory.checkins.at(-1);
    const pending = memory.decisions.filter(x => !x.reviewedAt).length;
    const t = transformData();

    root.innerHTML = wrap(`<button class="growth-back" data-growth-back>← Transformation</button>
      <section class="growth-hero">
        <div><div class="eyebrow">From insight to practice</div><h1>Hindi sapat na kilala mo ang pattern. I-test mo kung kaya mong baguhin ang behavior.</h1><p>Gamitin ang Growth Lab para sa small experiments, weekly self-checks, at decision reviews. Hindi ito therapy o clinical monitoring—personal practice log ito.</p></div>
        <div class="growth-seed">🌱</div>
      </section>

      <section class="growth-stats">
        <div><b>${memory.checkins.length}</b><span>weekly check-ins</span></div>
        <div><b>${active.length}</b><span>active experiments</span></div>
        <div><b>${completed}</b><span>completed</span></div>
        <div><b>${pending}</b><span>decisions to review</span></div>
      </section>

      <section class="growth-now">
        <div class="section-title"><h2>This week</h2><small>observe → test → review</small></div>
        ${last ? checkinSnapshot(last) : `<article class="growth-empty"><span>🧭</span><div><b>Build your baseline</b><p>Rate the last 7 days habang fresh pa sa memory mo. Five simple behaviors lang.</p></div><button class="primary" data-new-checkin>Weekly check-in</button></article>`}
        ${active.length ? active.map(experimentCard).join('') : `<article class="growth-empty"><span>🧪</span><div><b>Wala pang active experiment</b><p>Pumili ng isang behavior lang for 7–14 days. Small enough to repeat, specific enough to track.</p></div><button class="secondary" data-new-experiment>Choose experiment</button></article>`}
      </section>

      <section class="growth-actions">
        <button data-new-checkin><span>📅</span><b>Weekly check-in</b><small>5 behavior ratings + reflection</small></button>
        <button data-new-experiment><span>🧪</span><b>Start experiment</b><small>7–14 day behavior test</small></button>
        <button data-new-decision><span>⚖️</span><b>Decision review</b><small>Reduce hindsight & sunk-cost thinking</small></button>
        <button data-growth-history><span>📈</span><b>My growth history</b><small>See check-ins, exams, and experiments</small></button>
      </section>

      ${memory.decisions.length ? `<section class="growth-section"><div class="section-title"><h2>Decision notebook</h2><small>${pending} waiting for outcome review</small></div>${memory.decisions.slice().reverse().slice(0,3).map(decisionCard).join('')}<button class="text-btn" data-all-decisions>View all decisions →</button></section>` : ''}

      <section class="growth-section"><div class="section-title"><h2>Assessment anchors</h2><small>hindi destiny; baseline lang</small></div>
        <div class="growth-anchor-grid">
          <div><span>🧬</span><b>Personality</b><small>${t.personalityResult ? `Last test ${esc(t.personalityResult.date)}` : 'Not completed'}</small></div>
          <div><span>🧠</span><b>Bias Lab</b><small>${t.biasResult ? `Last test ${esc(t.biasResult.date)}` : 'Not completed'}</small></div>
        </div>
      </section>

      <section class="growth-privacy"><b>Local-first privacy</b><p>Check-ins, decision notes, at exam results ay nasa browser/device lang. Walang account at walang Supabase. Maaari mong i-export ang data bilang JSON backup.</p><div class="actions"><button class="secondary" data-export-growth>Export my data</button></div></section>`);
    bind();
  }

  function avgCheckin(c) {
    const vals = CHECKIN_FIELDS.map(([k]) => Number(c.ratings?.[k])).filter(Boolean);
    return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
  }

  function checkinSnapshot(c) {
    return `<article class="checkin-snapshot"><div><span>📅</span><div><b>Latest weekly check-in</b><small>${esc(c.date)} · average ${avgCheckin(c).toFixed(1)}/5</small></div></div><div class="checkin-bars">${CHECKIN_FIELDS.map(([k,label]) => `<div><span>${esc(label)}</span><i><b style="width:${clamp((c.ratings?.[k]||0)/5*100,0,100)}%"></b></i><em>${c.ratings?.[k]||'–'}</em></div>`).join('')}</div><p>${c.win ? `<b>Win:</b> ${esc(c.win)}` : 'Use this as observation, not a grade.'}</p><button class="secondary" data-new-checkin>New weekly check-in</button></article>`;
  }

  function openCheckin() {
    const root = ensureOverlay();
    if(!root) return;
    root.innerHTML = wrap(`<button class="growth-back" data-growth-home>← Growth Lab</button>
      <section class="growth-form-head"><div class="eyebrow">Weekly self-check</div><h1>Kumusta ang actual behavior mo nitong last 7 days?</h1><p>Rate what actually happened—not what you intended. 1 = bihira / mahina, 5 = consistent / malakas.</p></section>
      <form class="growth-form" id="growth-checkin-form">
        ${CHECKIN_FIELDS.map(([k,label,q]) => `<fieldset class="growth-rating"><legend><b>${esc(label)}</b><span>${esc(q)}</span></legend><div>${[1,2,3,4,5].map(v=>`<label><input type="radio" name="${k}" value="${v}" required><span>${v}</span></label>`).join('')}</div><small><i>1</i> bihira <i>5</i> consistent</small></fieldset>`).join('')}
        <label class="growth-text"><b>Pinakamagandang win this week</b><textarea name="win" maxlength="500" placeholder="Ano ang isang behavior na gusto mong ulitin?"></textarea></label>
        <label class="growth-text"><b>Saan ka pinaka-na-stuck?</b><textarea name="friction" maxlength="500" placeholder="Trigger, environment, habit, pagod, pressure, fear..."></textarea></label>
        <label class="growth-text"><b>One focus for next week</b><input name="focus" maxlength="180" placeholder="Isang specific behavior lang"></label>
        <div class="growth-note"><b>Reminder:</b> Hindi psychometric score ang weekly average. Self-monitoring signal lang ito para makita ang sariling pattern over time.</div>
        <button class="primary" type="submit">Save weekly check-in</button>
      </form>`);
    bind();
    root.querySelector('#growth-checkin-form').onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget); const ratings={};
      CHECKIN_FIELDS.forEach(([k]) => ratings[k]=Number(fd.get(k)));
      memory.checkins.push({ id:id('check'), date:today(), ratings, win:String(fd.get('win')||'').trim(), friction:String(fd.get('friction')||'').trim(), focus:String(fd.get('focus')||'').trim() });
      memory.checkins = memory.checkins.slice(-MAX_CHECKINS); save(); openGrowthHub();
    };
  }

  function recommendations() {
    const t=transformData(), out=[];
    const s=t.personalityResult?.scores || {};
    const b=t.biasResult || {};
    const add=(icon,title,practice,why)=>out.push({icon,title,practice,why});
    if(s.C?.mean < 2.6) add('🧭','One trigger, one action','Pumili ng existing trigger: “After I ___, I will ___ for 10 minutes.” Gawin daily.','Para i-test kung environmental cue + maliit na action ang mas effective kaysa motivation lang.');
    if(s.C?.mean > 3.4) add('🪶','Good-enough boundary','Bago magsimula ng low-stakes task, isulat kung ano ang “good enough” at stop kapag na-meet na.','Para i-test kung high standards minsan nagiging unnecessary perfectionism.');
    if(s.A?.mean > 3.4) add('🛡️','Pause before yes','Sa non-urgent request, mag-delay ng sagot at itanong: “Mine ba talaga itong responsibility?”','Para ma-separate ang compassion sa automatic people-pleasing.');
    if(s.A?.mean < 2.6) add('🤝','Steelman first','Bago mag-disagree, sabihin muna ang strongest version ng argument ng kausap hanggang sabihin niyang fair ang summary.','Para ma-practice ang accuracy bago challenge.');
    if(s.E?.mean < 2.6) add('🗣️','One deliberate connection','Mag-initiate ng isang meaningful conversation every 2 days, planned at predictable.','Hindi para “ayusin” ang introversion—para i-test ang intentional social behavior.');
    if(s.S?.mean < 2.6) add('🌊','20-minute decision buffer','Kapag highly activated, huwag muna gumawa ng avoidable major decision for at least 20 minutes; isulat evidence at options.','Para makita kung nag-iiba ang judgment kapag bumaba ang arousal.');
    if(s.O?.mean > 3.4) add('🧪','Prediction before excitement','Sa isang exciting idea, gumawa ng falsifiable prediction at cheap test bago mag-commit.','Para i-connect ang imagination sa evidence.');
    if(b.binary && !b.binary.confirm) add('🔎','Disconfirmation habit','Sa isang belief na important sa iyo, isulat: “Anong evidence ang magpapabago ng isip ko?” at hanapin ito.','Para i-practice ang active search for contrary evidence.');
    if(b.binary && !b.binary.sunk) add('💸','From today forward','Kapag may project/course/commitment, itago muna ang past cost at ikumpara lang future cost, future benefit, at alternatives.','Para bawasan ang sunk-cost pull.');
    if(!b.frameStable && t.biasResult) add('🖼️','Two-frame decision','Isulat ang important choice once as gains at once as losses bago pumili.','Para makita kung wording lang ang nagpapalit ng preference.');
    if(t.biasResult?.gap > 10) add('🎯','Confidence log','Sa 5 predictions this week, maglagay ng confidence %. Balikan ang outcomes pagkatapos.','Para i-calibrate ang confidence against reality.');
    if(!out.length) {
      add('🔎','Evidence against me','Once this week, pumili ng opinion mo at maghanap ng strongest evidence against it.','Universal practice for cognitive humility.');
      add('🧭','One small commitment','Pumili ng 10-minute action at gawin sa parehong cue for 7 days.','Para magkaroon ng behavior baseline without overhauling your life.');
      add('🗣️','One meaningful question','Mag-initiate ng conversation at magtanong ng isang sincere follow-up bago magbigay ng sariling advice.','Para i-practice ang attentive connection.');
    }
    return out.slice(0,6);
  }

  function openExperimentPicker() {
    const root=ensureOverlay(); if(!root)return;
    const recs=recommendations();
    root.innerHTML=wrap(`<button class="growth-back" data-growth-home>← Growth Lab</button><section class="growth-form-head"><div class="eyebrow">Behavior experiment</div><h1>Isang pattern lang muna.</h1><p>Pumili ng experiment na specific, observable, at maliit enough para maulit. Missed days are data—not moral failure.</p></section><section class="experiment-picker">${recs.map((r,i)=>`<button data-pick-experiment="${i}"><span>${r.icon}</span><div><h3>${esc(r.title)}</h3><p>${esc(r.practice)}</p><small>${esc(r.why)}</small></div><i>›</i></button>`).join('')}</section><button class="text-btn" data-custom-experiment>+ Gumawa ng custom experiment</button>`);
    root._growthRecs=recs; bind();
  }

  function openExperimentForm(seed={}) {
    const root=ensureOverlay(); if(!root)return;
    root.innerHTML=wrap(`<button class="growth-back" data-new-experiment>← Choose experiment</button><section class="growth-form-head"><div class="eyebrow">Set the test</div><h1>Gawing measurable ang intention.</h1></section><form class="growth-form" id="experiment-form">
      <label class="growth-text"><b>Experiment</b><input name="title" required maxlength="120" value="${esc(seed.title||'')}" placeholder="e.g. Pause before yes"></label>
      <label class="growth-text"><b>Exact behavior</b><textarea name="practice" required maxlength="600">${esc(seed.practice||'')}</textarea></label>
      <label class="growth-text"><b>Bakit ito worth testing?</b><textarea name="why" maxlength="400">${esc(seed.why||'')}</textarea></label>
      <label class="growth-text"><b>Verse / reflection anchor (optional)</b><input name="anchor" maxlength="160" placeholder="e.g. James 1:19"></label>
      <label class="growth-text"><b>Duration</b><select name="days"><option value="7">7 days</option><option value="14" selected>14 days</option></select></label>
      <button class="primary" type="submit">Start experiment</button></form>`);
    bind();
    root.querySelector('#experiment-form').onsubmit=e=>{
      e.preventDefault(); const fd=new FormData(e.currentTarget);
      memory.experiments.push({id:id('exp'),title:String(fd.get('title')),practice:String(fd.get('practice')),why:String(fd.get('why')||''),anchor:String(fd.get('anchor')||''),days:Number(fd.get('days')),start:today(),logs:{},status:'active'}); save(); openGrowthHub();
    };
  }

  function experimentCard(x) {
    const elapsed=clamp(daysBetween(x.start)+1,1,x.days); const done=Object.keys(x.logs||{}).length;
    const didToday=!!x.logs?.[today()];
    return `<article class="experiment-card"><div class="experiment-head"><span>🧪</span><div><b>${esc(x.title)}</b><small>Day ${elapsed}/${x.days} · ${done} check-ins</small></div></div><p>${esc(x.practice)}</p>${x.anchor?`<small class="verse-anchor">📖 ${esc(x.anchor)}</small>`:''}<div class="experiment-progress"><i style="width:${done/x.days*100}%"></i></div><div class="experiment-actions"><button class="${didToday?'secondary':'primary'}" data-log-exp="${x.id}" ${didToday?'disabled':''}>${didToday?'✓ Done today':'Mark today done'}</button><button class="text-btn" data-review-exp="${x.id}">Review</button></div></article>`;
  }

  function logExperiment(expId) {
    const x=memory.experiments.find(e=>e.id===expId); if(!x)return;
    x.logs ||= {}; x.logs[today()]={done:true,at:new Date().toISOString()}; save(); openGrowthHub();
  }

  function reviewExperiment(expId) {
    const x=memory.experiments.find(e=>e.id===expId); if(!x)return;
    const root=ensureOverlay(); if(!root)return;
    const done=Object.keys(x.logs||{}).length;
    root.innerHTML=wrap(`<button class="growth-back" data-growth-home>← Growth Lab</button><section class="growth-form-head"><div class="eyebrow">Experiment review</div><h1>${esc(x.title)}</h1><p>${esc(x.practice)}</p></section><section class="experiment-review-summary"><b>${done}/${x.days}</b><span>days logged</span><div class="experiment-progress"><i style="width:${done/x.days*100}%"></i></div></section><form class="growth-form" id="review-exp-form"><label class="growth-text"><b>Ano ang napansin mo?</b><textarea name="note" maxlength="600" placeholder="Triggers, easier days, harder days, unexpected effects...">${esc(x.review||'')}</textarea></label><div class="growth-note">Completion rate is not a character grade. Ang tanong: anong setup ang tumulong, at anong friction ang paulit-ulit?</div><div class="actions"><button class="secondary" type="submit" value="save">Save note</button><button class="primary" type="submit" name="finish" value="1">Finish experiment</button></div></form>`);
    bind();
    root.querySelector('#review-exp-form').onsubmit=e=>{e.preventDefault(); const fd=new FormData(e.currentTarget); x.review=String(fd.get('note')||''); if(e.submitter?.name==='finish'){x.status='completed';x.completedAt=today();} save(); openGrowthHub();};
  }

  function openDecisionForm() {
    const root=ensureOverlay(); if(!root)return;
    root.innerHTML=wrap(`<button class="growth-back" data-growth-home>← Growth Lab</button><section class="growth-form-head"><div class="eyebrow">Decision notebook</div><h1>I-freeze ang reasoning bago mo malaman ang outcome.</h1><p>Useful ito laban sa hindsight bias: later, makikita mo kung ano talaga ang alam at iniisip mo at the time.</p></section><form class="growth-form" id="decision-form">
      <label class="growth-text"><b>Decision / question</b><input name="title" required maxlength="180" placeholder="Ano ang kailangan mong pagdesisyunan?"></label>
      <label class="growth-text"><b>Options na seryoso mong kino-consider</b><textarea name="options" required maxlength="700" placeholder="A / B / C..."></textarea></label>
      <label class="growth-text"><b>Current leaning</b><input name="leaning" maxlength="180" placeholder="Ano ang pipiliin mo ngayon?"></label>
      <label class="growth-text"><b>Confidence sa current leaning</b><select name="confidence"><option>50</option><option>60</option><option>70</option><option>80</option><option>90</option><option>100</option></select></label>
      <label class="growth-text"><b>Strongest evidence FOR</b><textarea name="for" maxlength="600"></textarea></label>
      <label class="growth-text"><b>Strongest evidence AGAINST</b><textarea name="against" maxlength="600"></textarea></label>
      <label class="growth-text"><b>Anong evidence ang magpapabago ng isip mo?</b><textarea name="change" maxlength="500"></textarea></label>
      <label class="growth-text"><b>Ano dito ang sunk cost na hindi na mababawi?</b><textarea name="sunk" maxlength="400" placeholder="Money/time/status already spent—if none, leave blank."></textarea></label>
      <label class="growth-text"><b>Process check</b><textarea name="process" maxlength="500" placeholder="Kung maging bad ang outcome dahil sa bad luck, sensible pa rin ba ang process na ito based sa information today?"></textarea></label>
      <button class="primary" type="submit">Freeze this decision snapshot</button></form>`);
    bind();
    root.querySelector('#decision-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);memory.decisions.push({id:id('dec'),date:today(),title:String(f.get('title')),options:String(f.get('options')),leaning:String(f.get('leaning')||''),confidence:Number(f.get('confidence')),evidenceFor:String(f.get('for')||''),evidenceAgainst:String(f.get('against')||''),changeMind:String(f.get('change')||''),sunk:String(f.get('sunk')||''),process:String(f.get('process')||'')});save();openGrowthHub();};
  }

  function decisionCard(d) {
    return `<article class="decision-card"><div><span>${d.reviewedAt?'✓':'⚖️'}</span><div><b>${esc(d.title)}</b><small>${esc(d.date)} · confidence ${d.confidence}%${d.reviewedAt?' · reviewed':''}</small></div></div><p>${d.leaning?`Leaning: ${esc(d.leaning)}`:'No leaning recorded.'}</p><button class="secondary" data-open-decision="${d.id}">${d.reviewedAt?'View review':'Review outcome'}</button></article>`;
  }

  function openAllDecisions() {
    const root=ensureOverlay(); if(!root)return;
    root.innerHTML=wrap(`<button class="growth-back" data-growth-home>← Growth Lab</button><section class="growth-form-head"><div class="eyebrow">Decision notebook</div><h1>${memory.decisions.length} frozen decision${memory.decisions.length===1?'':'s'}</h1></section><section class="decision-list">${memory.decisions.slice().reverse().map(decisionCard).join('')||'<div class="growth-empty"><p>Wala pa.</p></div>'}</section><button class="primary" data-new-decision>+ New decision</button>`); bind();
  }

  function openDecisionReview(decId) {
    const d=memory.decisions.find(x=>x.id===decId); if(!d)return;
    const root=ensureOverlay(); if(!root)return;
    root.innerHTML=wrap(`<button class="growth-back" data-all-decisions>← Decisions</button><section class="growth-form-head"><div class="eyebrow">Frozen ${esc(d.date)}</div><h1>${esc(d.title)}</h1><p><b>Original leaning:</b> ${esc(d.leaning||'none')} · ${d.confidence}% confidence</p></section><section class="frozen-reasoning"><div><b>Options</b><p>${esc(d.options)}</p></div><div><b>Evidence for</b><p>${esc(d.evidenceFor||'—')}</p></div><div><b>Evidence against</b><p>${esc(d.evidenceAgainst||'—')}</p></div><div><b>Would change my mind</b><p>${esc(d.changeMind||'—')}</p></div><div><b>Sunk cost noted</b><p>${esc(d.sunk||'—')}</p></div></section>
      ${d.reviewedAt ? `<section class="decision-outcome"><div class="eyebrow">Outcome review · ${esc(d.reviewedAt)}</div><p><b>What happened:</b> ${esc(d.outcome||'')}</p><p><b>Process quality:</b> ${d.processQuality}/5 · <b>Outcome quality:</b> ${d.outcomeQuality}/5</p><p><b>Luck / uncertainty:</b> ${esc(d.luck||'—')}</p><p><b>Lesson:</b> ${esc(d.lesson||'—')}</p></section>` : `<form class="growth-form" id="decision-review-form"><label class="growth-text"><b>Ano ang nangyari?</b><textarea name="outcome" required maxlength="700"></textarea></label><label class="growth-text"><b>Quality ng decision PROCESS (1–5)</b><select name="processQuality">${[1,2,3,4,5].map(v=>`<option>${v}</option>`).join('')}</select></label><label class="growth-text"><b>Quality ng OUTCOME (1–5)</b><select name="outcomeQuality">${[1,2,3,4,5].map(v=>`<option>${v}</option>`).join('')}</select></label><label class="growth-text"><b>Ano ang role ng luck / uncertainty?</b><textarea name="luck" maxlength="500"></textarea></label><label class="growth-text"><b>Ano ang matututunan mo without pretending na obvious ang outcome noon?</b><textarea name="lesson" maxlength="600"></textarea></label><button class="primary" type="submit">Save outcome review</button></form>`}`);
    bind();
    const form=root.querySelector('#decision-review-form'); if(form) form.onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);d.reviewedAt=today();d.outcome=String(f.get('outcome'));d.processQuality=Number(f.get('processQuality'));d.outcomeQuality=Number(f.get('outcomeQuality'));d.luck=String(f.get('luck')||'');d.lesson=String(f.get('lesson')||'');save();openDecisionReview(decId);};
  }

  function openHistory() {
    const root=ensureOverlay(); if(!root)return;
    const t=transformData(), checks=memory.checkins.slice(-8);
    const histories=t.history||[];
    root.innerHTML=wrap(`<button class="growth-back" data-growth-home>← Growth Lab</button><section class="growth-form-head"><div class="eyebrow">Longitudinal view</div><h1>Progress = repeated observations, hindi isang dramatic score.</h1><p>Mas useful ang trend kapag maraming points over time. Weekly self-ratings are not standardized psychometric scores.</p></section>
      <section class="growth-section"><div class="section-title"><h2>Recent weekly check-ins</h2><small>${checks.length}/8 shown</small></div>${checks.length?`<div class="history-bars">${checks.map(c=>{const a=avgCheckin(c);return `<div><span>${esc(c.date.slice(5))}</span><i><b style="height:${a/5*100}%"></b></i><em>${a.toFixed(1)}</em></div>`}).join('')}</div>`:'<div class="growth-empty"><p>Need at least one weekly check-in.</p></div>'}</section>
      <section class="growth-section"><div class="section-title"><h2>Assessment history</h2><small>IPIP / Bias Lab</small></div>${histories.length?`<div class="assessment-history">${histories.slice().reverse().map(h=>`<div><span>${h.type==='personality'?'🧬':'🧠'}</span><div><b>${h.type==='personality'?'Big Five':'Bias Lab'}</b><small>${esc(h.date)}${h.type==='bias'?` · resistance ${h.resistance}% · confidence gap ${h.gap>0?'+':''}${h.gap}`:''}</small></div></div>`).join('')}</div>`:'<div class="growth-empty"><p>Wala pang assessment history.</p></div>'}</section>
      <section class="growth-section"><div class="section-title"><h2>Experiments</h2><small>${memory.experiments.length} total</small></div>${memory.experiments.length?`<div class="assessment-history">${memory.experiments.slice().reverse().map(x=>`<div><span>${x.status==='completed'?'✓':'🧪'}</span><div><b>${esc(x.title)}</b><small>${esc(x.start)} · ${Object.keys(x.logs||{}).length}/${x.days} days logged · ${x.status}</small></div></div>`).join('')}</div>`:'<div class="growth-empty"><p>Wala pang experiments.</p></div>'}</section>`); bind();
  }

  function exportData() {
    const payload={exportedAt:new Date().toISOString(),growth:memory,transformation:transformData(),note:'BibleQuest local backup. Contains self-assessment and reflection data.'};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`biblequest-growth-${today()}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function bind() {
    if(!overlay) overlay=document.querySelector('.bq-transform-overlay'); if(!overlay)return;
    overlay.querySelectorAll('[data-growth-back]').forEach(b=>b.onclick=backToTransform);
    overlay.querySelectorAll('[data-growth-home]').forEach(b=>b.onclick=openGrowthHub);
    overlay.querySelectorAll('[data-new-checkin]').forEach(b=>b.onclick=openCheckin);
    overlay.querySelectorAll('[data-new-experiment]').forEach(b=>b.onclick=openExperimentPicker);
    overlay.querySelectorAll('[data-new-decision]').forEach(b=>b.onclick=openDecisionForm);
    overlay.querySelectorAll('[data-growth-history]').forEach(b=>b.onclick=openHistory);
    overlay.querySelectorAll('[data-export-growth]').forEach(b=>b.onclick=exportData);
    overlay.querySelectorAll('[data-all-decisions]').forEach(b=>b.onclick=openAllDecisions);
    overlay.querySelectorAll('[data-open-decision]').forEach(b=>b.onclick=()=>openDecisionReview(b.dataset.openDecision));
    overlay.querySelectorAll('[data-log-exp]').forEach(b=>b.onclick=()=>logExperiment(b.dataset.logExp));
    overlay.querySelectorAll('[data-review-exp]').forEach(b=>b.onclick=()=>reviewExperiment(b.dataset.reviewExp));
    overlay.querySelectorAll('[data-pick-experiment]').forEach(b=>b.onclick=()=>openExperimentForm(overlay._growthRecs?.[Number(b.dataset.pickExperiment)]||{}));
    overlay.querySelectorAll('[data-custom-experiment]').forEach(b=>b.onclick=()=>openExperimentForm({}));
  }

  const observer=new MutationObserver(()=>injectHubCard());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  injectHubCard();
  window.BQ_GROWTH={open:openGrowthHub};
})();
