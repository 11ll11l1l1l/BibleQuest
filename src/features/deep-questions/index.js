import { getContentProvenance } from '../../core/content-provenance.js';
import { sourceLabel } from '../../ui/source-labels.js';
import { doctrinalNotice } from '../../ui/doctrinal-safety.js';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));
const DEEP_SOURCE=sourceLabel(getContentProvenance('bq-study'),{compact:true});

export function deepQuestionsPage({deepQuestions,onReader,onLearn}){
  return{
    title:'Deep Questions',
    html:'<section data-deep-page></section>',
    mount(root){
      const host=root.querySelector('[data-deep-page]');
      let disposed=false;

      const referenceButtons=item=>`<div class="bq-deep-references" aria-label="Scripture references">${item.references.map((reference,index)=>`<button type="button" class="bq-secondary-button" data-deep-reader="${index}">📖 ${escapeHtml(reference.label)}</button>`).join('')}</div>`;
      const feedbackHtml=feedback=>feedback?`<div class="bq-deep-feedback" role="status"><strong>Response saved</strong>${feedback.message?`<p>${escapeHtml(feedback.message)}</p>`:''}</div>`:'';

      const renderLibrary=()=>{
        if(disposed)return;
        const items=deepQuestions.library(),daily=deepQuestions.daily();
        host.innerHTML=`<section class="bq-panel bq-deep-head"><p class="bq-eyebrow">DEEP QUESTIONS</p><h1>Questions worth examining slowly</h1><p>Choose a Scripture-centered question, record your initial response, then examine the reflection and passages before writing a private note. No answer is scored as spiritual quality.</p></section><section class="bq-panel bq-deep-featured"><p class="bq-eyebrow">TODAY'S ROTATING QUESTION</p><h2>${escapeHtml(daily.prompt)}</h2><p>${escapeHtml(daily.references.map(item=>item.label).join(' · '))}</p><button type="button" class="bq-primary-button" data-deep-open="${escapeHtml(daily.id)}">Open today’s question</button></section><section class="bq-deep-library" aria-label="Deep Questions">${items.map(item=>`<article class="bq-panel bq-deep-card"><span>${escapeHtml(item.references[0]?.label||'Scripture reflection')}</span><h2>${escapeHtml(item.prompt)}</h2><button type="button" class="bq-secondary-button" data-deep-open="${escapeHtml(item.id)}">Open question</button></article>`).join('')}</section><div class="bq-deep-footer"><button type="button" class="bq-secondary-button" data-deep-learn>Back to Learn</button></div>`;
      };

      const renderActive=result=>{
        if(disposed)return;
        const {question:item,state,percent}=result;
        const safetyNotice=doctrinalNotice(item.safety,{compact:true});
        if(state.status==='complete'){
          const selected=state.responses.response,answer=Number.isSafeInteger(selected)?item.options[selected]:'';
          const note=state.responses.note||'';
          host.innerHTML=`<section class="bq-game-topline"><button type="button" class="bq-secondary-button" data-deep-library>All questions</button></section><section class="bq-panel bq-deep-session" data-deep-complete="${escapeHtml(item.id)}"><p class="bq-eyebrow">REFLECTION SAVED</p><h1>${escapeHtml(item.prompt)}</h1><p>Your response and private note remain in the shared Lesson session on this device. Deep Questions awards no XP and does not score spiritual quality.</p>${answer?`<div class="bq-deep-saved"><small>YOUR INITIAL RESPONSE</small><p>${escapeHtml(answer)}</p></div>`:''}${note?`<div class="bq-deep-saved"><small>YOUR PRIVATE NOTE</small><p>${escapeHtml(note)}</p></div>`:''}${referenceButtons(item)}${safetyNotice}${DEEP_SOURCE}<div class="bq-deep-actions"><button type="button" class="bq-primary-button" data-deep-restart>Reflect again</button><button type="button" class="bq-secondary-button" data-deep-library>Choose another question</button><button type="button" class="bq-secondary-button" data-deep-learn>Back to Learn</button></div></section>`;return;
        }

        const step=state.currentStep,response=state.responses[step.id],answered=Object.prototype.hasOwnProperty.call(state.responses,step.id),feedback=state.feedback[step.id]||null;
        let body='';
        if(step.type==='choice')body=`<div class="bq-deep-question"><p>${escapeHtml(step.prompt)}</p></div><div class="bq-study-choices">${step.choices.map((choice,index)=>`<button type="button" class="bq-game-choice${answered&&response===index?' is-selected':''}" data-deep-choice="${index}" ${answered?'disabled':''}><span aria-hidden="true">${String.fromCharCode(65+index)}</span><b>${escapeHtml(choice)}</b></button>`).join('')}</div>${feedbackHtml(feedback)}${answered?'<div class="bq-deep-actions"><button type="button" class="bq-primary-button" data-deep-advance>Open reflection</button></div>':''}`;
        if(step.type==='content')body=`<div class="bq-deep-reflection"><p class="bq-eyebrow">OPEN REFLECTION</p><p>${escapeHtml(step.prompt)}</p></div>${referenceButtons(item)}<div class="bq-deep-actions"><button type="button" class="bq-primary-button" data-deep-advance>Write private note</button></div>`;
        if(step.type==='text')body=answered?`<div class="bq-deep-saved"><small>YOUR SAVED PRIVATE NOTE</small><p>${escapeHtml(response)}</p></div>${feedbackHtml(feedback)}${referenceButtons(item)}<div class="bq-deep-actions"><button type="button" class="bq-primary-button" data-deep-advance>Finish reflection</button></div>`:`<form class="bq-deep-note" data-deep-note-form><label><span>Private note</span><textarea required maxlength="${step.maxLength}" rows="7" data-deep-note placeholder="Write what you notice, what remains difficult, or what you want to examine…"></textarea></label><button type="submit" class="bq-primary-button">Save note</button></form>${referenceButtons(item)}`;
        host.innerHTML=`<section class="bq-game-topline"><button type="button" class="bq-secondary-button" data-deep-library>All questions</button>${state.index>0?'<button type="button" class="bq-secondary-button" data-deep-reader="0">Open first passage</button>':''}</section><section class="bq-panel bq-deep-session" data-deep-session="${escapeHtml(item.id)}"><div class="bq-game-meta"><span>Deep Question</span><span>Step ${state.index+1} of ${state.totalSteps}</span></div><div class="bq-game-progress" aria-label="${percent}% complete"><i style="width:${percent}%"></i></div>${body}${safetyNotice}${DEEP_SOURCE}</section>`;
      };

      const showError=error=>{if(disposed)return;host.innerHTML=`<section class="bq-panel" role="alert"><p class="bq-eyebrow">DEEP QUESTIONS</p><h1>Reflection could not continue</h1><p>${escapeHtml(error?.message||'Unknown Deep Questions error.')}</p><button type="button" class="bq-secondary-button" data-deep-library>Back to questions</button></section>`};
      const onClick=event=>{
        const target=event.target instanceof Element?event.target:null;if(!target)return;
        try{
          if(target.closest('[data-deep-learn]')){deepQuestions.close();onLearn?.();return}
          if(target.closest('[data-deep-library]')){deepQuestions.close();renderLibrary();return}
          if(target.closest('[data-deep-restart]')){renderActive(deepQuestions.restart());return}
          if(target.closest('[data-deep-advance]')){renderActive(deepQuestions.advance());return}
          const reader=target.closest('[data-deep-reader]');if(reader){deepQuestions.prepareReader(Number(reader.dataset.deepReader));onReader?.();return}
          const choice=target.closest('[data-deep-choice]');if(choice){renderActive(deepQuestions.respond(Number(choice.dataset.deepChoice)));return}
          const open=target.closest('[data-deep-open]');if(open){renderActive(deepQuestions.open(open.dataset.deepOpen));return}
        }catch(error){showError(error)}
      };
      const onSubmit=event=>{
        const form=event.target instanceof HTMLFormElement?event.target:null;if(!form?.matches('[data-deep-note-form]'))return;
        event.preventDefault();
        try{const field=form.querySelector('[data-deep-note]');renderActive(deepQuestions.respond(field?.value||''))}catch(error){showError(error)}
      };

      host.addEventListener('click',onClick);host.addEventListener('submit',onSubmit);renderLibrary();
      return()=>{disposed=true;host.removeEventListener('click',onClick);host.removeEventListener('submit',onSubmit);deepQuestions.close()};
    }
  };
}
