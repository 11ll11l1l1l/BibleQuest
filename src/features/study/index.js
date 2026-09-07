import { getContentProvenance } from '../../core/content-provenance.js';
import { sourceLabel } from '../../ui/source-labels.js';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));
const STUDY_SOURCE=sourceLabel(getContentProvenance('bq-study'),{compact:true});

export function guidedStudyPage({study,onReader,onLearn}){
  return{
    title:'Guided Study',
    html:'<section data-study-page></section>',
    mount(root){
      const host=root.querySelector('[data-study-page]');
      let disposed=false;

      const renderLibrary=()=>{
        if(disposed)return;
        const items=study.library();
        host.innerHTML=`<section class="bq-panel bq-study-head"><p class="bq-eyebrow">GUIDED STUDY</p><h1>Study Scripture in context</h1><p>Move from the passage and its context to observation, meaning, private reflection, and one concrete response. Personal reflection is not graded as spiritual quality.</p></section><section class="bq-study-library" aria-label="Guided studies">${items.map(item=>`<article class="bq-panel bq-study-card"><span>${escapeHtml(item.kicker)}</span><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.description)}</p><div class="bq-study-card-meta"><b>📖 ${escapeHtml(item.passage.label)}</b><small>${escapeHtml(item.duration)}</small></div><button type="button" class="bq-primary-button" data-study-open="${escapeHtml(item.id)}">Start or resume</button></article>`).join('')}</section><div class="bq-study-footer"><button type="button" class="bq-secondary-button" data-study-learn>Back to Learn</button></div>`;
      };

      const feedbackHtml=(feedback)=>feedback?`<div class="bq-study-feedback" role="status"><strong>${feedback.correct===true?'Correct':feedback.correct===false?'Review this':'Saved'}</strong>${feedback.message?`<p>${escapeHtml(feedback.message)}</p>`:''}${feedback.reference?`<span>📖 ${escapeHtml(feedback.reference)}</span>`:''}</div>`:'';

      const renderActive=result=>{
        if(disposed)return;
        const {study:item,state,percent}=result;
        if(state.status==='complete'){
          host.innerHTML=`<section class="bq-game-topline"><button type="button" class="bq-secondary-button" data-study-library>All studies</button><button type="button" class="bq-secondary-button" data-study-reader>Open ${escapeHtml(item.passage.label)}</button></section><section class="bq-panel bq-study-complete" data-study-complete><p class="bq-eyebrow">STUDY COMPLETE</p><div aria-hidden="true" class="bq-study-complete-mark">📖</div><h1>${escapeHtml(item.title)}</h1><p>Your study responses remain in the local lesson session so you can reopen and review them. Reflection is recorded as an activity, not a spiritual score.</p><div class="bq-study-summary"><div><b>${state.score.answered}</b><span>responses</span></div><div><b>${state.score.correct}/${state.score.evaluated}</b><span>checked questions</span></div><div><b>100%</b><span>complete</span></div></div><div class="bq-game-actions"><button type="button" class="bq-primary-button" data-study-restart>Study again</button><button type="button" class="bq-secondary-button" data-study-library>Choose another study</button><button type="button" class="bq-secondary-button" data-study-learn>Back to Learn</button></div></section>`;return;
        }
        const step=state.currentStep,response=state.responses[step.id],answered=Object.prototype.hasOwnProperty.call(state.responses,step.id),feedback=state.feedback[step.id]||null;
        let interaction='';
        if(step.type==='content')interaction=`<div class="bq-study-actions"><button type="button" class="bq-primary-button" data-study-advance>Continue</button></div>`;
        if(step.type==='choice')interaction=`<div class="bq-study-choices">${step.choices.map((choice,index)=>`<button type="button" class="bq-game-choice${answered&&response===index?(feedback?.correct===true?' is-correct':feedback?.correct===false?' is-wrong':''):''}" data-study-choice="${index}" ${answered?'disabled':''}><span aria-hidden="true">${String.fromCharCode(65+index)}</span><b>${escapeHtml(choice)}</b></button>`).join('')}</div>${feedbackHtml(feedback)}${answered?'<div class="bq-study-actions"><button type="button" class="bq-primary-button" data-study-advance>Continue</button></div>':''}`;
        if(step.type==='confirm')interaction=answered?`${feedbackHtml(feedback)}<div class="bq-study-actions"><button type="button" class="bq-primary-button" data-study-advance>Complete study</button></div>`:`<div class="bq-study-actions"><button type="button" class="bq-primary-button" data-study-confirm>I reviewed this</button></div>`;
        if(step.type==='text')interaction=answered?`<div class="bq-study-saved-response"><small>YOUR SAVED RESPONSE</small><p>${escapeHtml(response)}</p></div>${feedbackHtml(feedback)}<div class="bq-study-actions"><button type="button" class="bq-primary-button" data-study-advance>Continue</button></div>`:`<form class="bq-study-response" data-study-response-form><label><span>Your private reflection / response</span><textarea required maxlength="${step.maxLength}" rows="6" data-study-response placeholder="Write your response here…"></textarea></label><button type="submit" class="bq-primary-button">Save response</button></form>`;
        host.innerHTML=`<section class="bq-game-topline"><button type="button" class="bq-secondary-button" data-study-library>All studies</button><button type="button" class="bq-secondary-button" data-study-reader>Open passage</button></section><section class="bq-panel bq-study-session" data-study-session="${escapeHtml(item.id)}"><div class="bq-game-meta"><span>${escapeHtml(item.passage.label)} · ${escapeHtml(item.duration)}</span><span>Step ${state.index+1} of ${state.totalSteps}</span></div><div class="bq-game-progress" aria-label="${percent}% complete"><i style="width:${percent}%"></i></div><p class="bq-eyebrow">${escapeHtml(item.kicker)}</p><h1>${escapeHtml(item.title)}</h1><div class="bq-study-prompt"><p>${escapeHtml(step.prompt)}</p>${step.reference?`<span>📖 ${escapeHtml(step.reference)}</span>`:''}</div>${interaction}${STUDY_SOURCE}</section>`;
      };

      const showError=error=>{if(disposed)return;host.innerHTML=`<section class="bq-panel" role="alert"><p class="bq-eyebrow">GUIDED STUDY</p><h1>Study could not continue</h1><p>${escapeHtml(error?.message||'Unknown study error.')}</p><button type="button" class="bq-secondary-button" data-study-library>Back to studies</button></section>`};

      const onClick=event=>{
        const target=event.target instanceof Element?event.target:null;if(!target)return;
        try{
          if(target.closest('[data-study-learn]')){study.close();onLearn?.();return}
          if(target.closest('[data-study-library]')){study.close();renderLibrary();return}
          if(target.closest('[data-study-reader]')){study.prepareReader();onReader?.();return}
          if(target.closest('[data-study-restart]')){renderActive(study.restart());return}
          if(target.closest('[data-study-advance]')){renderActive(study.advance());return}
          if(target.closest('[data-study-confirm]')){renderActive(study.respond(true));return}
          const choice=target.closest('[data-study-choice]');if(choice){renderActive(study.respond(Number(choice.dataset.studyChoice)));return}
          const open=target.closest('[data-study-open]');if(open){renderActive(study.open(open.dataset.studyOpen));return}
        }catch(error){showError(error)}
      };

      const onSubmit=event=>{
        const form=event.target instanceof HTMLFormElement?event.target:null;if(!form?.matches('[data-study-response-form]'))return;
        event.preventDefault();
        try{const field=form.querySelector('[data-study-response]');renderActive(study.respond(field?.value||''))}catch(error){showError(error)}
      };

      host.addEventListener('click',onClick);host.addEventListener('submit',onSubmit);renderLibrary();
      return()=>{disposed=true;host.removeEventListener('click',onClick);host.removeEventListener('submit',onSubmit);study.close()};
    }
  };
}
