import { getContentProvenance } from '../../core/content-provenance.js';
import { sourceLabel } from '../../ui/source-labels.js';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));
const ADAPTIVE_SOURCE=sourceLabel(getContentProvenance('bq-recall'),{compact:true});

export function adaptiveLearningPage({adaptive,onLearn}){
  return{
    title:'Adaptive Learning',
    html:'<section data-adaptive-page></section>',
    mount(root){
      const host=root.querySelector('[data-adaptive-page]');let disposed=false;
      const renderOverview=()=>{
        if(disposed)return;const view=adaptive.overview();
        host.innerHTML=`<section class="bq-panel bq-adaptive-head"><p class="bq-eyebrow">ADAPTIVE LEARNING</p><h1>Smart Review</h1><p>BibleQuest uses your retrieval history to bring missed and due questions back sooner. It reuses the verified Bible question bank; it does not create AI-generated doctrine or spiritual scores.</p><div class="bq-adaptive-metrics"><article><b>${view.due}</b><span>due now</span></article><article><b>${view.accuracy}%</b><span>tracked accuracy</span></article><article><b>${escapeHtml(view.weakest||'—')}</b><span>weakest explored area</span></article></div><div class="bq-adaptive-actions"><button type="button" class="bq-primary-button" data-adaptive-start>Start 7-question review</button>${view.hasActive?'<button type="button" class="bq-secondary-button" data-adaptive-resume>Resume current review</button>':''}<button type="button" class="bq-secondary-button" data-adaptive-learn>Back to Learn</button></div></section><section class="bq-panel bq-adaptive-explain"><h2>How it adapts</h2><div class="bq-adaptive-rules"><span>1</span><p><b>Missed or due questions rise first.</b><br>Previously weak evidence receives more review weight.</p><span>2</span><p><b>Correct answers spread out.</b><br>Review spacing grows roughly 1 → 3 → 7 → 14 → 30 days.</p><span>3</span><p><b>One area cannot take over the whole round.</b><br>The seven-question mix limits concentration to at most three questions from one Bible category when possible.</p></div></section>`;
      };
      const renderSession=result=>{
        if(disposed)return;const {state,question,kind,overview}=result;
        if(state.status==='complete'){
          host.innerHTML=`<section class="bq-game-topline"><button type="button" class="bq-secondary-button" data-adaptive-overview>Review overview</button></section><section class="bq-panel bq-adaptive-session" data-adaptive-complete><p class="bq-eyebrow">ADAPTIVE SESSION COMPLETE</p><div class="bq-adaptive-orb">${state.score.correct/state.totalSteps>=.85?'🧠':'🌱'}</div><h1>${state.score.correct}/${state.totalSteps}</h1><p>${state.score.correct/state.totalSteps>=.85?'Strong retrieval today. Correct items will return after a longer interval.':'Useful misses were captured. Weak items will come back sooner instead of being forgotten.'}</p><div class="bq-adaptive-metrics"><article><b>${overview.accuracy}%</b><span>tracked accuracy</span></article><article><b>${overview.due}</b><span>due now</span></article><article><b>${escapeHtml(overview.weakest||'—')}</b><span>weakest explored area</span></article></div><div class="bq-adaptive-actions"><button type="button" class="bq-primary-button" data-adaptive-another>Another smart review</button><button type="button" class="bq-secondary-button" data-adaptive-overview>Review overview</button><button type="button" class="bq-secondary-button" data-adaptive-learn>Back to Learn</button></div></section>`;return;
        }
        const selected=question&&Object.prototype.hasOwnProperty.call(state.responses,question.id)?state.responses[question.id]:null,answered=selected!==null&&selected!==undefined,feedback=question?state.feedback[question.id]:null;
        host.innerHTML=`<section class="bq-game-topline"><button type="button" class="bq-secondary-button" data-adaptive-overview>Review overview</button><span>${state.index+1}/${state.totalSteps}</span></section><section class="bq-panel bq-adaptive-session" data-adaptive-session data-adaptive-question="${escapeHtml(question?.id||'')}"><div class="bq-game-meta"><span>${escapeHtml(kind)} · ${escapeHtml(question?adaptive.categories.includes(question.book)?question.book:'Bible review':'')}</span><span>${state.index+1} of ${state.totalSteps}</span></div><div class="bq-game-progress" aria-label="${Math.round(state.index/state.totalSteps*100)}% complete"><i style="width:${Math.round(state.index/state.totalSteps*100)}%"></i></div><p class="bq-adaptive-category">${escapeHtml(question?.book||'')} · ${escapeHtml(question?.mode||'review')}</p><h1>${escapeHtml(question?.q||state.currentStep?.prompt||'')}</h1><div class="bq-study-choices">${(question?.choices||[]).map((choice,index)=>`<button type="button" class="bq-game-choice ${answered&&index===question.answer?'is-correct':''} ${answered&&index===selected&&index!==question.answer?'is-wrong':''}" data-adaptive-choice="${index}" ${answered?'disabled':''}><span aria-hidden="true">${String.fromCharCode(65+index)}</span><b>${escapeHtml(choice)}</b></button>`).join('')}</div>${answered?`<section class="bq-adaptive-feedback ${feedback?.correct?'is-correct':'is-review'}"><b>${feedback?.correct?'Remembered · +10 XP':'Review target added · +3 XP'}</b><p>${escapeHtml(question?.why||'')}</p><span>📖 ${escapeHtml(question?.ref||'')}</span></section><button type="button" class="bq-primary-button bq-adaptive-next" data-adaptive-next>${state.index+1===state.totalSteps?'See learning result':'Next question'}</button>`:''}${ADAPTIVE_SOURCE}</section>`;
      };
      const showError=error=>{if(disposed)return;host.innerHTML=`<section class="bq-panel" role="alert"><p class="bq-eyebrow">ADAPTIVE LEARNING</p><h1>Smart Review could not continue</h1><p>${escapeHtml(error?.message||'Unknown Adaptive Learning error.')}</p><div class="bq-adaptive-actions"><button type="button" class="bq-secondary-button" data-adaptive-overview>Review overview</button><button type="button" class="bq-secondary-button" data-adaptive-learn>Back to Learn</button></div></section>`};
      const act=fn=>{try{renderSession(fn())}catch(error){showError(error)}};
      const onClick=event=>{
        const target=event.target instanceof Element?event.target:null;if(!target)return;
        if(target.closest('[data-adaptive-learn]')){adaptive.close();onLearn?.();return}
        if(target.closest('[data-adaptive-overview]')){adaptive.close();renderOverview();return}
        if(target.closest('[data-adaptive-start]')){act(()=>adaptive.start());return}
        if(target.closest('[data-adaptive-resume]')){act(()=>adaptive.resume());return}
        if(target.closest('[data-adaptive-another]')){act(()=>adaptive.another());return}
        if(target.closest('[data-adaptive-next]')){act(()=>adaptive.next());return}
        const choice=target.closest('[data-adaptive-choice]');if(choice){act(()=>adaptive.answer(Number(choice.dataset.adaptiveChoice)))}
      };
      host.addEventListener('click',onClick);renderOverview();
      return()=>{disposed=true;host.removeEventListener('click',onClick);adaptive.close()};
    }
  };
}
