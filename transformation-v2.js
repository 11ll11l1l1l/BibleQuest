(() => {
  'use strict';

  const STORE='biblequest_transform_v2';
  const VERSION=2;
  const FACTORS={
    E:{name:'Extraversion',icon:'🗣️',low:'You tend to recharge inwardly and may prefer depth over frequent social stimulation.',high:'You tend to gain energy from interaction and may initiate readily.',lowPractice:'Choose one intentional conversation instead of waiting for the perfect moment.',highPractice:'Practice listening long enough to understand before taking the lead.'},
    A:{name:'Agreeableness',icon:'🤝',low:'You may be direct, questioning, and comfortable challenging ideas.',high:'You may be compassionate, cooperative, and strongly attentive to harmony.',lowPractice:'Ask one curious question before stating your disagreement.',highPractice:'Pair kindness with a clear boundary when something needs to be addressed.'},
    C:{name:'Conscientiousness',icon:'🧭',low:'You may prefer flexibility and can resist rigid structure.',high:'You may naturally plan, organize, and persist toward goals.',lowPractice:'Define one small next action and a time to do it.',highPractice:'Leave room for grace, people, and changing circumstances instead of over-controlling the plan.'},
    S:{name:'Emotional Stability',icon:'🌊',low:'Stress and uncertainty may affect you quickly or intensely.',high:'You may stay relatively even-tempered under pressure.',lowPractice:'Name the emotion, pause, pray, then decide after the first wave passes.',highPractice:'Notice when other people need reassurance even if the situation feels manageable to you.'},
    O:{name:'Openness / Intellect',icon:'💡',low:'You may prefer concrete, familiar, and practical approaches.',high:'You may enjoy ideas, imagination, reflection, and complexity.',lowPractice:'Explore one unfamiliar viewpoint or passage context before deciding.',highPractice:'Turn one idea into one concrete act of obedience instead of collecting more ideas.'}
  };

  const ITEMS=[
    ['E1','E','I am the life of the party.',1],['A1','A','I sympathize with other people’s feelings.',1],['C1','C','I am always prepared.',1],['S1','S','I am relaxed most of the time.',1],['O1','O','I have a vivid imagination.',1],
    ['E2','E','I do not talk a lot.',-1],['A2','A','I sometimes insult people.',-1],['C2','C','I leave my belongings around.',-1],['S2','S','I get stressed out easily.',-1],['O2','O','I have difficulty understanding abstract ideas.',-1],
    ['E3','E','I feel comfortable around people.',1],['A3','A','I have a soft heart.',1],['C3','C','I pay attention to details.',1],['S3','S','I seldom feel blue.',1],['O3','O','I have excellent ideas.',1],
    ['E4','E','I keep in the background.',-1],['A4','A','I feel little concern for others.',-1],['C4','C','I make a mess of things.',-1],['S4','S','I worry about things.',-1],['O4','O','I am not interested in abstract ideas.',-1]
  ].map(([id,factor,text,key])=>({id,factor,text,key}));

  const BIAS_TASKS=[
    {id:'sunk',title:'Past cost vs. future value',scenario:'You paid for a course that is clearly not useful. Finishing it would consume time needed for an important responsibility. What should matter most now?',options:['Finish mainly because the money was already spent.','Compare the future cost and benefit from today forward.','Continue mainly because stopping would feel embarrassing.'],best:1,signal:'Sunk-cost thinking',practice:'When a past cost cannot be recovered, ask: “If I had not already paid or invested, what would I choose now?”'},
    {id:'base',title:'Use the base rate',scenario:'A rare defect affects about 1 in 100 devices. A scanner catches most defects but also creates false alarms. Your device is flagged. What is the best first response?',options:['Assume the scanner means the device is almost certainly defective.','Combine the scanner result with how rare the defect is before concluding.','Ignore the scanner because false alarms exist.'],best:1,signal:'Base-rate neglect',practice:'Before reacting to a dramatic signal, ask how common the event was before the new evidence appeared.'},
    {id:'confirm',title:'Challenge your own belief',scenario:'Your group believes a new Bible-study format improves retention. Which check is most useful?',options:['Ask people who already love it for testimonials.','Compare later recall and actively look for cases where the format did not help.','Collect more positive comments about how engaging it feels.'],best:1,signal:'Confirmation bias',practice:'Write one piece of evidence that would change your mind before you search for more support.'},
    {id:'outcome',title:'Process vs. outcome',scenario:'Two leaders use the same careful process. One gets unlucky and the result is bad; the other gets lucky and the result is good. How should decision quality be judged?',options:['Mostly by the final outcome.','Mostly by the process and information available at the time.','The leader with the good result necessarily made the better decision.'],best:1,signal:'Outcome bias',practice:'Review whether the process was sound before using the final result as proof that the decision was wise or foolish.'},
    {id:'frame',title:'Reframe the choice',scenario:'A choice sounds attractive when described as “90% success.” What is the most useful check?',options:['Accept the positive framing because 90% sounds strong.','Also restate it as “10% failure” and see whether your judgment changes.','Ignore percentages and go with intuition.'],best:1,signal:'Framing effect',practice:'Restate important choices in both gain and loss language before deciding.'}
  ];

  const SCALE=['Very inaccurate','Moderately inaccurate','Neither','Moderately accurate','Very accurate'];
  const defaultState=()=>({version:VERSION,personality:{answers:{},result:null},bias:{answers:{},result:null},reflection:{noticed:'',action:'',prayer:'',practice:''},history:[]});

  function isObject(v){return Boolean(v&&typeof v==='object'&&!Array.isArray(v))}
  function load(){
    const base=defaultState();
    try{
      const raw=JSON.parse(localStorage.getItem(STORE)||'{}');
      if(!isObject(raw)||raw.version!==VERSION)return base;
      const p=isObject(raw.personality)?raw.personality:{};
      const b=isObject(raw.bias)?raw.bias:{};
      const r=isObject(raw.reflection)?raw.reflection:{};
      const answers={};
      for(const item of ITEMS){const v=Number(p.answers?.[item.id]);if(v>=1&&v<=5)answers[item.id]=v}
      const biasAnswers={};
      for(const task of BIAS_TASKS){const v=Number(b.answers?.[task.id]);if(Number.isInteger(v)&&v>=0&&v<task.options.length)biasAnswers[task.id]=v}
      return {
        version:VERSION,
        personality:{answers,result:isObject(p.result)?p.result:null},
        bias:{answers:biasAnswers,result:isObject(b.result)?b.result:null},
        reflection:{noticed:String(r.noticed||'').slice(0,1200),action:String(r.action||'').slice(0,1200),prayer:String(r.prayer||'').slice(0,1200),practice:String(r.practice||'').slice(0,500)},
        history:Array.isArray(raw.history)?raw.history.slice(-10):[]
      };
    }catch{return base}
  }
  function save(){try{localStorage.setItem(STORE,JSON.stringify(state));return true}catch{return false}}
  function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function todayLabel(){return new Date().toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}

  let state=load();
  let root=null;
  let personalityPage=0;
  let biasStep=0;

  function shell(title,subtitle,body){
    return `<div class="bq-t2-shell"><header class="bq-t2-top"><button type="button" class="bq-t2-brand" data-t2-home><span>🪞</span><div><b>Transform</b><small>Personal development & reflection</small></div></button><button type="button" class="bq-t2-close" data-t2-close aria-label="Close Transform">×</button></header><main class="bq-t2-main"><div class="bq-t2-heading"><small>PRIVATE · STORED ON THIS DEVICE</small><h1>${esc(title)}</h1>${subtitle?`<p>${esc(subtitle)}</p>`:''}</div>${body}</main></div>`;
  }

  function setView(html){if(!root)return;root.innerHTML=html;root.scrollTop=0;requestAnimationFrame(()=>root?.focus())}

  function renderHub(){
    const pDone=Boolean(state.personality.result);
    const bDone=Boolean(state.bias.result);
    setView(shell('Know your patterns. Practice what matters.','Personality describes tendencies; Scripture guides faithfulness. These tools are for reflection, not diagnosis.',`
      <section class="bq-t2-warning"><b>Important boundary</b><p>A high or low personality score is not a moral ranking and does not measure faith. Use results as a mirror for habits, blind spots, strengths, and concrete growth.</p></section>
      <section class="bq-t2-grid">
        <button type="button" class="bq-t2-card" data-t2-personality><span>🧬</span><div><small>20 ITEMS · ~4 MIN</small><h2>Personality Foundations</h2><p>A short IPIP-based Big Five self-reflection: Extraversion, Agreeableness, Conscientiousness, Emotional Stability, and Openness / Intellect.</p><em>${pDone?'View results or retake':'Start assessment'}</em></div><i>›</i></button>
        <button type="button" class="bq-t2-card" data-t2-bias><span>🧠</span><div><small>5 SCENARIOS · ~3 MIN</small><h2>Thinking Patterns Check</h2><p>Practice noticing sunk-cost thinking, base-rate neglect, confirmation bias, outcome bias, and framing effects.</p><em>${bDone?'View results or retake':'Start check'}</em></div><i>›</i></button>
        <button type="button" class="bq-t2-card" data-t2-plan><span>🧭</span><div><small>PERSONAL GROWTH</small><h2>Reflection & Action Plan</h2><p>Turn your assessment signals into one practical experiment and one Scripture-centered reflection.</p><em>${state.reflection.practice?'Continue my plan':'Build my plan'}</em></div><i>›</i></button>
        <button type="button" class="bq-t2-card" data-t2-journal><span>✍️</span><div><small>PRIVATE JOURNAL</small><h2>Reflection Journal</h2><p>Record what you noticed, your next action, and a short prayer or reflection.</p><em>${state.reflection.noticed||state.reflection.action?'Continue reflection':'Start reflection'}</em></div><i>›</i></button>
      </section>
      <section class="bq-t2-scripture"><small>REFLECTION REFERENCES</small><b>Psalm 139:23–24 · Romans 12:2 · James 1:22</b><p>Use these passages for reflection in the Bible Reader. BibleQuest keeps the psychological description separate from Scripture itself.</p><button type="button" data-t2-reader>Open Bible Reader</button></section>
    `));
  }

  function renderPersonalityIntro(){
    const answered=Object.keys(state.personality.answers).length;
    setView(shell('Personality Foundations','Answer as you usually are over time, not as you wish you were today.',`
      <section class="bq-t2-panel"><div class="bq-t2-icon">🧬</div><h2>20-item Big Five reflection</h2><p>This uses public-domain IPIP-style items and reverse-key scoring. It is intentionally shorter than a full personality inventory and should be treated as a self-reflection snapshot, not a clinical or employment assessment.</p><ul><li>4 items per factor</li><li>1–5 response scale</li><li>No “good” or “bad” trait score</li><li>You can retake it later and compare your own reflections</li></ul><div class="bq-t2-actions"><button type="button" class="primary" data-t2-personality-begin>${answered?`Continue (${answered}/20 answered)`:'Begin assessment'}</button>${answered?'<button type="button" data-t2-personality-reset>Start over</button>':''}</div></section>
    `));
  }

  function renderPersonalityPage(page=personalityPage){
    personalityPage=Math.max(0,Math.min(3,page));
    const chunk=ITEMS.slice(personalityPage*5,personalityPage*5+5);
    const complete=chunk.every(x=>state.personality.answers[x.id]);
    setView(shell(`Personality · Page ${personalityPage+1} of 4`,'Choose the answer that best describes your usual pattern.',`
      <div class="bq-t2-progress"><i style="width:${Object.keys(state.personality.answers).length/20*100}%"></i></div>
      <section class="bq-t2-question-stack">${chunk.map(item=>{
        const chosen=state.personality.answers[item.id];
        return `<article class="bq-t2-question"><h2>${esc(item.text)}</h2><div class="bq-t2-scale">${[1,2,3,4,5].map(v=>`<button type="button" class="${chosen===v?'selected':''}" data-t2-rate="${item.id}" data-value="${v}" aria-label="${esc(SCALE[v-1])}">${v}</button>`).join('')}</div><div class="bq-t2-scale-labels"><span>Very inaccurate</span><span>Very accurate</span></div></article>`
      }).join('')}</section>
      <div class="bq-t2-nav"><button type="button" data-t2-personality-prev ${personalityPage===0?'disabled':''}>← Previous</button><button type="button" class="primary" data-t2-personality-next ${complete?'':'disabled'}>${personalityPage===3?'Calculate results':'Next →'}</button></div>
    `));
  }

  function scorePersonality(){
    const scores={};
    for(const key of Object.keys(FACTORS)){
      const factorItems=ITEMS.filter(x=>x.factor===key);
      const values=factorItems.map(x=>{const v=state.personality.answers[x.id];return x.key===1?v:6-v});
      const mean=values.reduce((a,b)=>a+b,0)/values.length;
      scores[key]={mean:Number(mean.toFixed(2)),band:mean<2.8?'Lower expression':mean>3.6?'Higher expression':'Midrange / mixed'};
    }
    state.personality.result={date:new Date().toISOString(),scores};
    state.history.push({type:'personality',date:state.personality.result.date,scores});
    state.history=state.history.slice(-10);
    save();
    renderPersonalityResults();
  }

  function renderPersonalityResults(){
    const r=state.personality.result;
    if(!r?.scores)return renderPersonalityIntro();
    const rows=Object.entries(r.scores).map(([key,s])=>{
      const f=FACTORS[key];
      const pct=Math.max(0,Math.min(100,((s.mean-1)/4)*100));
      const description=s.band==='Higher expression'?f.high:s.band==='Lower expression'?f.low:`Your responses are relatively mixed or moderate on ${f.name.toLowerCase()}, so context may matter more than a single strong tendency.`;
      return `<article class="bq-t2-trait"><div class="bq-t2-trait-head"><span>${f.icon}</span><div><h2>${esc(f.name)}</h2><small>${esc(s.band)} · ${s.mean.toFixed(2)}/5</small></div></div><div class="bq-t2-meter"><i style="width:${pct}%"></i></div><p>${esc(description)}</p><div class="bq-t2-practice"><b>Growth experiment</b><span>${esc(s.band==='Higher expression'?f.highPractice:s.band==='Lower expression'?f.lowPractice:'Notice when this trait helps and when the situation asks for a different response.') )}</span></div></article>`
    }).join('');
    setView(shell('Your personality snapshot',`Completed ${todayLabel()}. Scores describe this questionnaire response pattern, not population percentiles.`,`
      <section class="bq-t2-results">${rows}</section>
      <section class="bq-t2-warning"><b>Use this carefully</b><p>Introversion is not a defect. Emotional sensitivity is not a sin. High conscientiousness is not automatically wisdom. Every tendency can help in one context and create a blind spot in another.</p></section>
      <div class="bq-t2-actions"><button type="button" class="primary" data-t2-plan>Build reflection plan</button><button type="button" data-t2-bias>Check thinking patterns</button><button type="button" data-t2-personality-reset>Retake assessment</button></div>
    `));
  }

  function renderBiasIntro(){
    if(state.bias.result)return renderBiasResults();
    const answered=Object.keys(state.bias.answers).length;
    setView(shell('Thinking Patterns Check','Choose the response that best matches how you would reason on first reading.',`
      <section class="bq-t2-panel"><div class="bq-t2-icon">🧠</div><h2>Five short reasoning scenarios</h2><p>This is not a diagnosis of “which biases you have.” Each task is only a prompt to practice catching a common reasoning mistake.</p><div class="bq-t2-actions"><button type="button" class="primary" data-t2-bias-begin>${answered?`Continue (${answered}/5)`:'Begin check'}</button>${answered?'<button type="button" data-t2-bias-reset>Start over</button>':''}</div></section>
    `));
  }

  function renderBiasTask(index=biasStep){
    biasStep=Math.max(0,Math.min(BIAS_TASKS.length-1,index));
    const task=BIAS_TASKS[biasStep];
    const chosen=state.bias.answers[task.id];
    setView(shell(`Thinking pattern · ${biasStep+1} of ${BIAS_TASKS.length}`,task.title,`
      <div class="bq-t2-progress"><i style="width:${biasStep/BIAS_TASKS.length*100}%"></i></div>
      <section class="bq-t2-bias"><p>${esc(task.scenario)}</p><div class="bq-t2-options">${task.options.map((o,i)=>`<button type="button" class="${chosen===i?'selected':''}" data-t2-bias-choice="${i}">${esc(o)}</button>`).join('')}</div></section>
      <div class="bq-t2-nav"><button type="button" data-t2-bias-prev ${biasStep===0?'disabled':''}>← Previous</button><button type="button" class="primary" data-t2-bias-next ${chosen===undefined?'disabled':''}>${biasStep===BIAS_TASKS.length-1?'See results':'Next →'}</button></div>
    `));
  }

  function scoreBias(){
    const signals=BIAS_TASKS.map(task=>({id:task.id,title:task.signal,helpful:state.bias.answers[task.id]===task.best,practice:task.practice}));
    const helpful=signals.filter(x=>x.helpful).length;
    state.bias.result={date:new Date().toISOString(),helpful,total:BIAS_TASKS.length,signals};
    state.history.push({type:'bias',date:state.bias.result.date,helpful,total:BIAS_TASKS.length});
    state.history=state.history.slice(-10);
    save();
    renderBiasResults();
  }

  function renderBiasResults(){
    const r=state.bias.result;
    if(!r?.signals)return renderBiasIntro();
    setView(shell('Your thinking-pattern snapshot',`${r.helpful}/${r.total} responses used the more bias-resistant reasoning move on these specific scenarios.`,`
      <section class="bq-t2-results">${r.signals.map(x=>`<article class="bq-t2-signal ${x.helpful?'ok':'watch'}"><span>${x.helpful?'✓':'!'}</span><div><h2>${esc(x.title)}</h2><p>${x.helpful?'You used the stronger reasoning move on this scenario.':esc(x.practice)}</p></div></article>`).join('')}</section>
      <section class="bq-t2-warning"><b>Do not turn this into a label</b><p>People can recognize a bias in one task and still fall for it later. The useful outcome is a repeatable checking habit, not a score to defend.</p></section>
      <div class="bq-t2-actions"><button type="button" class="primary" data-t2-plan>Build reflection plan</button><button type="button" data-t2-bias-reset>Retake check</button></div>
    `));
  }

  function recommendations(){
    const out=[];
    const scores=state.personality.result?.scores;
    if(scores){
      Object.entries(scores).sort((a,b)=>Math.abs(b[1].mean-3)-Math.abs(a[1].mean-3)).slice(0,2).forEach(([key,s])=>{
        const f=FACTORS[key];
        out.push({title:`${f.name}: ${s.band}`,body:s.band==='Higher expression'?f.highPractice:s.band==='Lower expression'?f.lowPractice:'Notice one context where this tendency helps and one where a different response would serve better.'});
      });
    }
    state.bias.result?.signals?.filter(x=>!x.helpful).slice(0,2).forEach(x=>out.push({title:x.title,body:x.practice}));
    if(!out.length)out.push({title:'Start with observation',body:'For one week, pause once a day and ask: “What pattern in me is shaping this choice, and what response would be faithful and wise?”'});
    return out.slice(0,4);
  }

  function renderPlan(){
    const recs=recommendations();
    const current=state.reflection.practice;
    setView(shell('Reflection & Action Plan','Choose one experiment. Personal development works better when the next step is small enough to practice.',`
      <section class="bq-t2-plan-list">${recs.map((r,i)=>`<button type="button" class="bq-t2-plan ${current===r.body?'selected':''}" data-t2-practice="${i}"><span>${i+1}</span><div><h2>${esc(r.title)}</h2><p>${esc(r.body)}</p></div></button>`).join('')}</section>
      <section class="bq-t2-scripture"><small>KEEP THE ORDER CLEAR</small><b>Observe → examine → practice → reflect</b><p>Psychology can help describe a tendency. Scripture, prayer, wisdom, and community are separate sources for evaluating motives, character, and faithfulness.</p></section>
      <div class="bq-t2-actions"><button type="button" class="primary" data-t2-journal>Write my reflection</button><button type="button" data-t2-wisdom>Open Situations & Wisdom</button></div>
    `));
  }

  function renderJournal(status=''){
    const r=state.reflection;
    setView(shell('Private Reflection Journal','Keep this concrete. One honest observation and one faithful next step are enough.',`
      <section class="bq-t2-journal">
        ${r.practice?`<div class="bq-t2-selected-practice"><small>MY CURRENT EXPERIMENT</small><b>${esc(r.practice)}</b></div>`:''}
        <label><b>What pattern did I notice?</b><span>Describe behavior or thinking without condemning yourself.</span><textarea data-t2-noticed maxlength="1200" placeholder="I noticed that…">${esc(r.noticed)}</textarea></label>
        <label><b>What is one concrete next action?</b><span>Make it observable and small enough to practice.</span><textarea data-t2-action maxlength="1200" placeholder="This week I will…">${esc(r.action)}</textarea></label>
        <label><b>Prayer / Scripture reflection</b><span>Keep Scripture interpretation separate from the personality score itself.</span><textarea data-t2-prayer maxlength="1200" placeholder="Prayer, passage reference, or reflection…">${esc(r.prayer)}</textarea></label>
        <button type="button" class="primary bq-t2-save" data-t2-save>Save privately on this device</button><p class="bq-t2-status" data-t2-status>${esc(status)}</p>
      </section>
      <section class="bq-t2-scripture"><small>OPTIONAL NEXT STEP</small><b>Read before concluding</b><p>Open the Bible Reader and examine a relevant passage in context before turning a feeling or personality tendency into a spiritual conclusion.</p><button type="button" data-t2-reader>Open Bible Reader</button></section>
    `));
  }

  function resetPersonality(){
    if(!window.confirm('Clear the current personality answers and results? Your private journal will remain.'))return;
    state.personality={answers:{},result:null};save();personalityPage=0;renderPersonalityIntro();
  }
  function resetBias(){
    if(!window.confirm('Clear the current thinking-pattern answers and results? Your private journal will remain.'))return;
    state.bias={answers:{},result:null};save();biasStep=0;renderBiasIntro();
  }

  function open(){
    if(root){root.focus();return}
    root=document.createElement('section');
    root.className='bq-transform-v2';
    root.tabIndex=-1;
    root.setAttribute('role','dialog');
    root.setAttribute('aria-modal','true');
    root.setAttribute('aria-label','Transform personal development and reflection');
    root.setAttribute('data-bq-english','1');
    root.addEventListener('click',onClick);
    root.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
    document.body.appendChild(root);
    document.body.classList.add('bq-transform-v2-open');
    renderHub();
  }

  function close(){
    if(!root)return;
    root.remove();root=null;
    document.body.classList.remove('bq-transform-v2-open');
  }

  function launch(selector){close();requestAnimationFrame(()=>document.querySelector(selector)?.click())}

  function onClick(e){
    const t=e.target instanceof Element?e.target:null;if(!t)return;
    if(t.closest('[data-t2-close]'))return close();
    if(t.closest('[data-t2-home]'))return renderHub();
    if(t.closest('[data-t2-personality]'))return state.personality.result?renderPersonalityResults():renderPersonalityIntro();
    if(t.closest('[data-t2-personality-begin]')){personalityPage=Math.min(3,Math.floor(Object.keys(state.personality.answers).length/5));return renderPersonalityPage()}
    if(t.closest('[data-t2-personality-reset]'))return resetPersonality();
    const rate=t.closest('[data-t2-rate]');if(rate){state.personality.answers[rate.dataset.t2Rate]=Number(rate.dataset.value);save();return renderPersonalityPage()}
    if(t.closest('[data-t2-personality-prev]'))return renderPersonalityPage(personalityPage-1);
    if(t.closest('[data-t2-personality-next]'))return personalityPage===3?scorePersonality():renderPersonalityPage(personalityPage+1);
    if(t.closest('[data-t2-bias]'))return renderBiasIntro();
    if(t.closest('[data-t2-bias-begin]')){biasStep=Math.min(BIAS_TASKS.length-1,Object.keys(state.bias.answers).length);return renderBiasTask()}
    if(t.closest('[data-t2-bias-reset]'))return resetBias();
    const bias=t.closest('[data-t2-bias-choice]');if(bias){state.bias.answers[BIAS_TASKS[biasStep].id]=Number(bias.dataset.t2BiasChoice);save();return renderBiasTask()}
    if(t.closest('[data-t2-bias-prev]'))return renderBiasTask(biasStep-1);
    if(t.closest('[data-t2-bias-next]'))return biasStep===BIAS_TASKS.length-1?scoreBias():renderBiasTask(biasStep+1);
    if(t.closest('[data-t2-plan]'))return renderPlan();
    const practice=t.closest('[data-t2-practice]');if(practice){const r=recommendations()[Number(practice.dataset.t2Practice)];if(r){state.reflection.practice=r.body;save();renderPlan()}return}
    if(t.closest('[data-t2-journal]'))return renderJournal();
    if(t.closest('[data-t2-save]')){
      state.reflection.noticed=root.querySelector('[data-t2-noticed]')?.value.trim().slice(0,1200)||'';
      state.reflection.action=root.querySelector('[data-t2-action]')?.value.trim().slice(0,1200)||'';
      state.reflection.prayer=root.querySelector('[data-t2-prayer]')?.value.trim().slice(0,1200)||'';
      const ok=save();
      state.history.push({type:'reflection',date:new Date().toISOString(),action:state.reflection.action.slice(0,160)});state.history=state.history.slice(-10);save();
      return renderJournal(ok?'Saved privately on this device.':'Could not save on this device. You can still copy your reflection before closing.');
    }
    if(t.closest('[data-t2-reader]'))return launch('[data-reader-open]');
    if(t.closest('[data-t2-wisdom]'))return launch('[data-action="situation"]');
  }

  window.BQ_TRANSFORMATION={open,close,mode:'rebuilt-v2',version:VERSION,getState:()=>JSON.parse(JSON.stringify(state))};
})();