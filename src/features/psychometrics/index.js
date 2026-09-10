import { PSYCHOMETRICS_SOURCES, PSYCHOMETRICS_SAFETY } from './content.js';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const formatDate=value=>{try{return new Date(value).toLocaleString()}catch{return String(value||'')}};
const bandClass=band=>String(band||'').startsWith('Higher')?'higher':String(band||'').startsWith('Lower')?'lower':'mid';
const qualityHtml=quality=>`<div class="bq-transform-focus" data-psych-quality>${(quality?.flags||[]).map(flag=>`<article><b>${escapeHtml(flag.code==='clear'?'Response-quality check':'Review response pattern')}</b><p>${escapeHtml(flag.message)}</p></article>`).join('')}</div>`;

export function psychometricsPage({psychometrics,onBack,onQuickTransform}){
  return{
    title:'Psychometrics Lab',
    html:'<section data-psychometrics-page><div class="bq-panel"><p>Opening Psychometrics Lab…</p></div></section>',
    mount(root){
      const host=root.querySelector('[data-psychometrics-page]');
      let view='home',page=0,message='';

      const state=()=>psychometrics.open();
      const definition=type=>psychometrics.definitions[type];
      const answered=(type,current=state())=>Object.keys(current[type]?.answers||{}).length;
      const pageCount=type=>Math.ceil(definition(type).total/definition(type).pageSize);
      const currentChunk=(type,current=state())=>{
        const def=definition(type),start=page*def.pageSize;
        return def.items.slice(start,start+def.pageSize).map((item,index)=>({item,index:absoluteIndex(start,index),value:current[type].answers[item.id]}));
      };
      const absoluteIndex=(start,index)=>start+index;
      const pageIsComplete=(type,current)=>currentChunk(type,current).every(row=>row.value!==undefined);

      const header=(eyebrow,title,body)=>`<section class="bq-panel bq-transform-head"><p class="bq-eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(body)}</p></section>`;
      const sourceBlock=()=>`<section class="bq-panel"><p class="bq-eyebrow">SOURCES & BOUNDARIES</p><p>${escapeHtml(PSYCHOMETRICS_SAFETY.general)}</p><ul>${PSYCHOMETRICS_SOURCES.map(source=>`<li>${escapeHtml(source)}</li>`).join('')}</ul></section>`;
      const messageBlock=()=>message?`<p class="bq-form-message" role="status" aria-live="polite">${escapeHtml(message)}</p>`:'';

      function renderHome(){
        const current=state();
        host.innerHTML=`${header('PSYCHOMETRICS LAB','Choose the depth you need.','Research-based self-report measures kept separate from Quick Transform, Scripture, doctrine, and clinical diagnosis.')}
        <section class="bq-panel"><div class="bq-progress-title"><div><p class="bq-eyebrow">DEEP PERSONALITY</p><h2>IPIP-NEO-120</h2></div><small>${answered('neo',current)}/120</small></div><p>Five broad domains and 30 facets with reverse-key scoring and response-quality checks.</p><button type="button" class="bq-primary-button" data-psych-open="neo">${current.neo.result?'View profile or retake':answered('neo',current)?'Continue assessment':'Start 120-item assessment'}</button></section>
        <section class="bq-panel"><div class="bq-progress-title"><div><p class="bq-eyebrow">CHARACTER STRENGTHS</p><h2>IPIP-VIA-R</h2></div><small>${answered('via',current)}/96</small></div><p>Twenty-four psychological strength constructs ranked within your own response profile.</p><button type="button" class="bq-primary-button" data-psych-open="via">${current.via.result?'View strengths or retake':answered('via',current)?'Continue assessment':'Start 96-item assessment'}</button></section>
        <section class="bq-panel"><div class="bq-progress-title"><div><p class="bq-eyebrow">SELF-ESTEEM</p><h2>Rosenberg Scale</h2></div><small>${answered('rse',current)}/10</small></div><p>Ten-item global self-esteem measure, scored 0–30 without invented universal cutoffs.</p><button type="button" class="bq-primary-button" data-psych-open="rse">${current.rse.result?'View score or retake':answered('rse',current)?'Continue scale':'Start 10-item scale'}</button></section>
        <section class="bq-panel"><p class="bq-eyebrow">IMPORTANT INTERPRETATION LIMITS</p><p>${escapeHtml(PSYCHOMETRICS_SAFETY.values)}</p><p>${escapeHtml(PSYCHOMETRICS_SAFETY.spirituality)}</p><p>${escapeHtml(PSYCHOMETRICS_SAFETY.depression)}</p></section>
        ${sourceBlock()}<section class="bq-panel bq-transform-actions"><div>${messageBlock()}</div><div><button type="button" class="bq-secondary-button" data-psych-quick>Quick Transform</button><button type="button" class="bq-secondary-button" data-psych-back>Back to Grow</button></div></section>`;
      }

      const typeCopy=type=>type==='neo'?{
        eyebrow:'DEEP PERSONALITY · IPIP-NEO-120',title:'Five domains · 30 facets',body:'Answer as you usually are over time. Higher and lower scores are descriptive, not better or worse.',intro:'120 public-domain IPIP items. Raw means are shown; BibleQuest does not manufacture population percentiles.'
      }:type==='via'?{
        eyebrow:'CHARACTER STRENGTHS · IPIP-VIA-R',title:'Twenty-four measured tendencies',body:'Rankings are within your own response profile and are not a virtue, faith, calling, or worth score.',intro:'96 items with balanced positive and negative keys in the retained item bank.'
      }:{eyebrow:'ROSENBERG SELF-ESTEEM',title:'Global self-esteem self-report',body:'This is not a diagnosis and does not measure your worth before God.',intro:'10 items scored 0–3, total range 0–30, with no universal low/normal/high category imposed.'};

      function renderIntro(type){
        const current=state(),copy=typeCopy(type),count=answered(type,current);
        host.innerHTML=`${header(copy.eyebrow,copy.title,copy.body)}<section class="bq-panel"><h2>Before you begin</h2><p>${escapeHtml(copy.intro)}</p><ul><li>Your answers and results stay in this device's private owner-scoped storage.</li><li>Guest and signed-in account states remain separate.</li><li>Changing an answer after a result invalidates that assessment result until recalculated.</li></ul>${type==='neo'?`<p><b>Historical item caution:</b> ${escapeHtml(PSYCHOMETRICS_SAFETY.values)}</p>`:''}${type==='via'?`<p><b>Spirituality scale caution:</b> ${escapeHtml(PSYCHOMETRICS_SAFETY.spirituality)}</p>`:''}<div class="bq-transform-actions"><div><b>${count}/${definition(type).total} answered</b>${messageBlock()}</div><div><button type="button" class="bq-secondary-button" data-psych-home>Back to Lab</button>${count?'<button type="button" class="bq-secondary-button" data-psych-reset>Start over</button>':''}<button type="button" class="bq-primary-button" data-psych-begin>${count?'Continue':'Begin'}</button></div></div></section>${sourceBlock()}`;
      }

      function renderQuestions(type){
        const current=state(),def=definition(type),copy=typeCopy(type),pages=pageCount(type),chunk=currentChunk(type,current),count=answered(type,current),complete=pageIsComplete(type,current);
        const options=type==='rse'?[0,1,2,3]:[1,2,3,4,5];
        const low=type==='rse'?'Strongly agree':'Very inaccurate',high=type==='rse'?'Strongly disagree':'Very accurate';
        host.innerHTML=`${header(copy.eyebrow,`${copy.title} · Page ${page+1} of ${pages}`,`${count} of ${def.total} answered.`)}<div class="bq-transform-list">${chunk.map(({item,index,value})=>`<article class="bq-panel bq-transform-item" data-psych-item="${escapeHtml(item.id)}"><div><small>${type==='neo'?escapeHtml(item.facetName):type==='via'?escapeHtml(item.name):`Item ${index+1} of 10`}</small><p><b>${escapeHtml(item.text)}</b></p></div><div class="bq-transform-scale" role="group" aria-label="${escapeHtml(item.id)} response">${options.map(option=>`<button type="button" data-psych-answer="${escapeHtml(item.id)}" data-value="${option}" class="${value===option?'is-selected':''}" aria-pressed="${value===option}">${type==='rse'?option+1:option}</button>`).join('')}</div><div class="bq-transform-scale-note"><span>${escapeHtml(low)}</span> · <span>${escapeHtml(high)}</span></div></article>`).join('')}</div><section class="bq-panel bq-transform-actions"><div><b>${count}/${def.total} answered</b>${messageBlock()}</div><div><button type="button" class="bq-secondary-button" data-psych-home>Lab</button><button type="button" class="bq-secondary-button" data-psych-prev ${page===0?'disabled':''}>← Previous</button><button type="button" class="bq-primary-button" data-psych-next ${complete?'':'disabled'}>${page===pages-1?'Calculate result':'Next →'}</button></div></section>`;
      }

      function renderNeoResult(result){
        const domains=Object.entries(result.domains),facets=Object.entries(result.facets);
        host.innerHTML=`${header('IPIP-NEO-120 RESULT','Your deep personality profile','Five domains and 30 facets. Raw 1–5 means describe this response pattern; higher is not automatically better.')}
        <section class="bq-panel"><p class="bq-eyebrow">FIVE DOMAINS</p><div class="bq-transform-focus">${domains.map(([code,row])=>`<article data-psych-domain="${escapeHtml(code)}" class="${bandClass(row.band)}"><b>${escapeHtml(row.name)}</b><p>${escapeHtml(row.band)} · ${row.mean.toFixed(3)}/5</p></article>`).join('')}</div></section>
        <section class="bq-panel"><p class="bq-eyebrow">30 FACETS</p><div class="bq-transform-focus">${facets.map(([code,row])=>`<article data-psych-facet="${escapeHtml(code)}"><b>${escapeHtml(row.name)}</b><p>${escapeHtml(row.band)} · ${row.mean.toFixed(3)}/5</p>${code==='O6'?`<small>${escapeHtml(PSYCHOMETRICS_SAFETY.values)}</small>`:''}${code==='N3'?`<small>${escapeHtml(PSYCHOMETRICS_SAFETY.depression)}</small>`:''}</article>`).join('')}</div></section>
        <section class="bq-panel"><p class="bq-eyebrow">RESPONSE QUALITY</p>${qualityHtml(result.quality)}<p><small>These checks describe response patterns only; they are not honesty or diagnosis scores.</small></p></section>${resultActions('neo',result.date)}`;
      }

      function renderViaResult(result){
        const rows=Object.entries(result.scores).sort((a,b)=>b[1].mean-a[1].mean||a[0].localeCompare(b[0]));
        host.innerHTML=`${header('IPIP-VIA-R RESULT','Your character-strengths profile','Twenty-four constructs ranked within your own response profile. This ordering is not moral or spiritual worth.')}
        <section class="bq-panel"><p class="bq-eyebrow">TOP SIX WITHIN YOUR PROFILE</p><div class="bq-transform-focus">${rows.slice(0,6).map(([code,row],index)=>`<article><b>${index+1}. ${escapeHtml(row.name)}</b><p>${escapeHtml(row.band)} · ${row.mean.toFixed(3)}/5</p></article>`).join('')}</div></section>
        <section class="bq-panel"><p class="bq-eyebrow">ALL 24 CONSTRUCTS</p><div class="bq-transform-focus">${rows.map(([code,row])=>`<article data-psych-strength="${escapeHtml(code)}"><b>${escapeHtml(row.name)}</b><p>${escapeHtml(row.band)} · ${row.mean.toFixed(3)}/5</p>${code==='SPI'?`<small>${escapeHtml(PSYCHOMETRICS_SAFETY.spirituality)}</small>`:''}</article>`).join('')}</div></section>
        <section class="bq-panel"><p class="bq-eyebrow">RESPONSE QUALITY</p>${qualityHtml(result.quality)}<p><small>Small differences between four-item scales should not be overinterpreted.</small></p></section>${resultActions('via',result.date)}`;
      }

      function renderRseResult(result){
        const pct=clamp(result.score/30*100,0,100);
        host.innerHTML=`${header('ROSENBERG RESULT','Your self-esteem score',`${result.score} / 30`)}<section class="bq-panel"><h2 data-psych-rse-score>${result.score} / 30</h2><div class="bq-transform-bars"><div><b>Raw total</b><span><i style="width:${pct}%"></i></span><strong>${result.score}</strong></div></div><p>Higher scores indicate more positive global self-regard on this questionnaire. BibleQuest does not label the result low, normal, or high because there are no discrete universal cutoffs for every population and context.</p></section><section class="bq-panel"><p><b>Important:</b> This score is not a mental-health diagnosis and does not measure your human worth or worth before God.</p></section>${resultActions('rse',result.date)}`;
      }

      function resultActions(type,date){return `<section class="bq-panel bq-transform-actions"><div><small>Completed ${escapeHtml(formatDate(date))}</small>${messageBlock()}</div><div><button type="button" class="bq-secondary-button" data-psych-home>Back to Lab</button><button type="button" class="bq-secondary-button" data-psych-reset>Retake assessment</button></div></section>${sourceBlock()}`}
      function renderResult(type){const result=state()[type].result;if(!result){renderIntro(type);return}if(type==='neo')renderNeoResult(result);else if(type==='via')renderViaResult(result);else renderRseResult(result)}
      function openType(type){view=type;page=0;message='';const current=state();current[type].result?renderResult(type):renderIntro(type)}
      function beginType(){const current=psychometrics.begin(view),def=definition(view),count=answered(view,current);page=Math.min(pageCount(view)-1,Math.floor(count/def.pageSize));renderQuestions(view)}
      function resetType(){if(!window.confirm('Clear this assessment’s answers and result?'))return;psychometrics.reset(view);page=0;message='Assessment cleared.';renderIntro(view)}

      const onClick=event=>{
        const target=event.target instanceof Element?event.target:null;if(!target)return;
        const open=target.closest('[data-psych-open]');if(open){openType(open.dataset.psychOpen);return}
        if(target.closest('[data-psych-home]')){view='home';page=0;message='';renderHome();return}
        if(target.closest('[data-psych-back]')){onBack?.();return}
        if(target.closest('[data-psych-quick]')){onQuickTransform?.();return}
        if(target.closest('[data-psych-begin]')){try{message='';beginType()}catch(error){message=error.message;renderIntro(view)}return}
        if(target.closest('[data-psych-reset]')){try{resetType()}catch(error){message=error.message;renderResult(view)}return}
        const answerButton=target.closest('[data-psych-answer]');if(answerButton){try{message='';psychometrics.answer(view,answerButton.dataset.psychAnswer,Number(answerButton.dataset.value));renderQuestions(view)}catch(error){message=error.message;renderQuestions(view)}return}
        if(target.closest('[data-psych-prev]')){if(page>0){page-=1;renderQuestions(view)}return}
        if(target.closest('[data-psych-next]')){try{const pages=pageCount(view),current=state();if(!pageIsComplete(view,current))return;if(page<pages-1){page+=1;renderQuestions(view)}else{psychometrics.calculate(view);message='Assessment result saved privately on this device.';renderResult(view)}}catch(error){message=error.message;renderQuestions(view)}return}
      };

      host.addEventListener('click',onClick);renderHome();
      return()=>host.removeEventListener('click',onClick);
    }
  };
}
