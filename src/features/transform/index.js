import { localization } from '../../app/localization.js';
import { createTransformLocalizer } from './localization.js';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const scale=[1,2,3,4,5];

export function transformPage({transform,onGrow}){
  const locale=localization.getLocale();
  const text=(key,values)=>localization.t(key,{locale,values});
  const local=createTransformLocalizer(locale);
  const copy=local.text;
  return{
    title:text('nav.transformation'),
    html:`<section data-transform-page><div class="bq-panel"><p>${escapeHtml(text('transform.opening'))}</p></div></section>`,
    mount(root){
      const host=root.querySelector('[data-transform-page]');
      let mode='basic';
      let message='';

      const modeButtons=active=>`<section class="bq-panel bq-transform-actions" aria-label="${escapeHtml(text('transform.mode.label'))}"><div><b>${escapeHtml(text('transform.mode.prompt'))}</b><p>${escapeHtml(text('transform.mode.description'))}</p></div><div><button type="button" class="${active==='basic'?'bq-primary-button':'bq-secondary-button'}" data-transform-mode-basic>${escapeHtml(text('transform.mode.basic'))}</button><button type="button" class="${active==='full'?'bq-primary-button':'bq-secondary-button'}" data-transform-mode-full>${escapeHtml(text('transform.mode.full'))}</button></div></section>`;

      const renderBasic=state=>{
        const answers=state.spiritual.answers||{};
        const result=state.spiritual.result;
        const items=transform.definitions.spiritual;
        const answered=items.filter(item=>answers[item.id]).length;
        const resultHtml=result?`<section class="bq-panel bq-transform-result" data-transform-result><p class="bq-eyebrow">${escapeHtml(text('transform.basic.privateReflection'))}</p><h2>${escapeHtml(text('transform.basic.yourReflection'))}</h2><p>${escapeHtml(text('transform.basic.resultDisclaimer'))}</p><div class="bq-transform-bars">${result.scores.map(row=>{const shown=local.spiritualResult(row);return `<div><b>${escapeHtml(shown.dimension)}</b><span><i style="width:${row.score*20}%"></i></span><strong>${row.score}/5</strong></div>`}).join('')}</div><div class="bq-transform-focus"><h3>${escapeHtml(text('transform.basic.nextFocus'))}</h3>${result.focus.map(row=>{const shown=local.spiritualResult(row);return `<article><b>${escapeHtml(shown.dimension)}</b><p>${escapeHtml(shown.guide||row.guide)}</p></article>`}).join('')}</div></section>`:'';
        const reflection=state.reflection||{};
        const scriptureFlow=`<section class="bq-panel" data-transform-scripture-flow><p class="bq-eyebrow">${escapeHtml(copy('scriptureEyebrow'))}</p><h2>${escapeHtml(copy('scriptureHeading'))}</h2><p>${escapeHtml(copy('scriptureDescription'))}</p><label class="bq-field"><span>${escapeHtml(copy('scriptureField'))}</span><textarea rows="2" maxlength="500" data-transform-flow-scripture>${escapeHtml(reflection.scripture)}</textarea></label><label class="bq-field"><span>${escapeHtml(copy('understandField'))}</span><textarea rows="3" maxlength="1200" data-transform-flow-understand>${escapeHtml(reflection.understand)}</textarea></label><label class="bq-field"><span>${escapeHtml(copy('reflectField'))}</span><textarea rows="3" maxlength="1200" data-transform-flow-reflect>${escapeHtml(reflection.reflect)}</textarea></label><label class="bq-field"><span>${escapeHtml(copy('applyField'))}</span><textarea rows="3" maxlength="1200" data-transform-flow-apply>${escapeHtml(reflection.apply)}</textarea></label><label class="bq-field"><span>${escapeHtml(copy('prayField'))}</span><textarea rows="3" maxlength="1200" data-transform-flow-pray>${escapeHtml(reflection.pray)}</textarea></label><div class="bq-transform-actions"><p class="bq-form-message" data-transform-flow-message aria-live="polite">${escapeHtml(message)}</p><button type="button" class="bq-primary-button" data-transform-flow-save>${escapeHtml(copy('saveScripture'))}</button></div></section>`;
        host.innerHTML=`<section class="bq-panel bq-transform-head"><p class="bq-eyebrow">${escapeHtml(text('transform.basic.eyebrow'))}</p><h1>${escapeHtml(text('transform.basic.heading'))}</h1><p><b>${escapeHtml(text('transform.basic.disclaimerLead'))}</b> ${escapeHtml(text('transform.basic.disclaimer'))}</p><p class="bq-transform-scale-note">${escapeHtml(text('transform.basic.scale'))}</p></section>${modeButtons('basic')}${scriptureFlow}<section class="bq-transform-list">${items.map(item=>{const shown=local.spiritual(item);return `<article class="bq-panel bq-transform-item" data-transform-item="${escapeHtml(item.id)}"><div><b>${escapeHtml(shown.dimension)}</b><p>${escapeHtml(shown.text)}</p></div><div class="bq-transform-scale" role="group" aria-label="${escapeHtml(text('transform.basic.ratingLabel',{dimension:shown.dimension}))}">${scale.map(value=>`<button type="button" data-transform-rating="${escapeHtml(item.id)}" data-value="${value}" class="${answers[item.id]===value?'is-selected':''}" aria-pressed="${answers[item.id]===value}">${value}</button>`).join('')}</div></article>`}).join('')}</section><section class="bq-panel bq-transform-actions"><div><b>${escapeHtml(text('transform.basic.answered',{answered,total:items.length}))}</b><p class="bq-form-message" data-transform-message aria-live="polite">${escapeHtml(message)}</p></div><div><button type="button" class="bq-secondary-button" data-transform-back>${escapeHtml(text('transform.basic.backGrow'))}</button><button type="button" class="bq-secondary-button" data-transform-reset ${answered?'':'disabled'}>${escapeHtml(text('transform.basic.reset'))}</button><button type="button" class="bq-primary-button" data-transform-calculate ${answered===items.length?'':'disabled'}>${escapeHtml(text(result?'transform.basic.reflectionSaved':'transform.basic.viewReflection'))}</button></div></section>${resultHtml}`;
      };

      const personalityResultHtml=result=>{
        if(!result)return'';
        return `<section class="bq-panel" data-transform-personality-result><p class="bq-eyebrow">${escapeHtml(copy('personalityEyebrow'))}</p><h3>${escapeHtml(copy('currentPattern'))}</h3><p>${escapeHtml(copy('personalityDisclaimer'))}</p><div class="bq-transform-focus">${Object.entries(result.scores).map(([factor,row])=>`<article><b>${escapeHtml(local.factorName(factor,row.name))}</b><p>${escapeHtml(local.band(row.band))} · ${escapeHtml(row.mean)}/5</p></article>`).join('')}</div></section>`;
      };

      const biasResultHtml=result=>{
        if(!result)return'';
        return `<section class="bq-panel" data-transform-bias-result><p class="bq-eyebrow">${escapeHtml(copy('thinkingEyebrow'))}</p><h3>${escapeHtml(copy('biasResult',{helpful:result.helpful,total:result.total}))}</h3><p>${escapeHtml(copy('thinkingDisclaimer'))}</p><div class="bq-transform-focus">${result.signals.map(row=>{const shown=local.biasSignal(row);return `<article><b>${escapeHtml(shown.title)} · ${escapeHtml(copy(row.helpful?'helpful':'reviewPattern'))}</b><p>${escapeHtml(shown.practice)}</p></article>`}).join('')}</div></section>`;
      };

      const renderFull=state=>{
        const personalityItems=transform.definitions.personality;
        const biasItems=transform.definitions.bias;
        const personalityAnswers=state.personality.answers||{};
        const biasAnswers=state.bias.answers||{};
        const personalityAnswered=personalityItems.filter(item=>personalityAnswers[item.id]).length;
        const biasAnswered=biasItems.filter(item=>Object.prototype.hasOwnProperty.call(biasAnswers,item.id)).length;
        const recommendations=transform.recommendations();
        const reflection=state.reflection||{};
        const history=(state.history||[]).slice().reverse();
        const fullComplete=Boolean(state.personality.result&&state.bias.result);

        host.innerHTML=`<section class="bq-panel bq-transform-head"><p class="bq-eyebrow">${escapeHtml(copy('fullEyebrow'))}</p><h1>${escapeHtml(copy('fullHeading'))}</h1><p><b>${escapeHtml(copy('fullDisclaimerLead'))}</b> ${escapeHtml(copy('fullDisclaimer'))}</p><p class="bq-transform-scale-note">${escapeHtml(copy('personalityScale'))}</p></section>${modeButtons('full')}
        <section class="bq-panel"><p class="bq-eyebrow">${escapeHtml(copy('personalitySection'))}</p><h2>${escapeHtml(copy('noticeTendencies'))}</h2><p>${escapeHtml(copy('personalityInstructions'))}</p><div class="bq-transform-list">${personalityItems.map(item=>`<article class="bq-panel bq-transform-item" data-transform-personality-item="${escapeHtml(item.id)}"><div><b>${escapeHtml(local.factorName(item.factor,transform.definitions.factors[item.factor]?.name||item.factor))}</b><p>${escapeHtml(local.personalityText(item))}</p></div><div class="bq-transform-scale" role="group" aria-label="${escapeHtml(copy('rating',{item:local.factorName(item.factor,item.factor)}))}">${scale.map(value=>`<button type="button" data-transform-personality-rating="${escapeHtml(item.id)}" data-value="${value}" class="${personalityAnswers[item.id]===value?'is-selected':''}" aria-pressed="${personalityAnswers[item.id]===value}">${value}</button>`).join('')}</div></article>`).join('')}</div><div class="bq-transform-actions"><div><b>${escapeHtml(copy('answered',{answered:personalityAnswered,total:personalityItems.length}))}</b></div><div><button type="button" class="bq-secondary-button" data-transform-personality-reset ${personalityAnswered?'':'disabled'}>${escapeHtml(copy('resetPersonality'))}</button><button type="button" class="bq-primary-button" data-transform-personality-calculate ${personalityAnswered===personalityItems.length?'':'disabled'}>${escapeHtml(copy(state.personality.result?'personalitySaved':'viewPersonality'))}</button></div></div></section>
        ${personalityResultHtml(state.personality.result)}
        <section class="bq-panel"><p class="bq-eyebrow">${escapeHtml(copy('thinkingSection'))}</p><h2>${escapeHtml(copy('betterJudgment'))}</h2><p>${escapeHtml(copy('thinkingInstructions'))}</p><div class="bq-transform-list">${biasItems.map(task=>{const shown=local.bias(task);return `<article class="bq-panel bq-transform-item" data-transform-bias-item="${escapeHtml(task.id)}"><div><b>${escapeHtml(shown.title)}</b><p>${escapeHtml(shown.scenario)}</p></div><div role="group" aria-label="${escapeHtml(copy('responses',{title:shown.title}))}">${shown.options.map((option,index)=>`<button type="button" class="bq-secondary-button ${biasAnswers[task.id]===index?'is-selected':''}" data-transform-bias-answer="${escapeHtml(task.id)}" data-value="${index}" aria-pressed="${biasAnswers[task.id]===index}">${escapeHtml(option)}</button>`).join('')}</div></article>`}).join('')}</div><div class="bq-transform-actions"><div><b>${escapeHtml(copy('answered',{answered:biasAnswered,total:biasItems.length}))}</b></div><div><button type="button" class="bq-secondary-button" data-transform-bias-reset ${biasAnswered?'':'disabled'}>${escapeHtml(copy('resetThinking'))}</button><button type="button" class="bq-primary-button" data-transform-bias-calculate ${biasAnswered===biasItems.length?'':'disabled'}>${escapeHtml(copy(state.bias.result?'thinkingSaved':'reviewThinking'))}</button></div></div></section>
        ${biasResultHtml(state.bias.result)}
        <section class="bq-panel" data-transform-recommendations><p class="bq-eyebrow">${escapeHtml(copy('practiceSection'))}</p><h2>${escapeHtml(copy('recommendedPractices'))}</h2>${`<p>${escapeHtml(copy(fullComplete?'practiceComplete':'practiceIncomplete'))}</p>`}<div class="bq-transform-focus">${recommendations.map(row=>{const shown=local.recommendation(row);return `<article><b>${escapeHtml(shown.title)}</b><p>${escapeHtml(shown.body)}</p></article>`}).join('')}</div></section>
        <section class="bq-panel" data-transform-reflection><p class="bq-eyebrow">${escapeHtml(copy('journalSection'))}</p><h2>${escapeHtml(copy('journalHeading'))}</h2><p>${escapeHtml(copy('journalDescription'))}</p><label class="bq-field"><span>${escapeHtml(copy('practiceField'))}</span><textarea rows="2" maxlength="500" data-transform-reflection-practice>${escapeHtml(reflection.practice)}</textarea></label><label class="bq-field"><span>${escapeHtml(copy('noticedField'))}</span><textarea rows="3" maxlength="1200" data-transform-reflection-noticed>${escapeHtml(reflection.noticed)}</textarea></label><label class="bq-field"><span>${escapeHtml(copy('actionField'))}</span><textarea rows="3" maxlength="1200" data-transform-reflection-action>${escapeHtml(reflection.action)}</textarea></label><label class="bq-field"><span>${escapeHtml(copy('prayerField'))}</span><textarea rows="3" maxlength="1200" data-transform-reflection-prayer>${escapeHtml(reflection.prayer)}</textarea></label><div class="bq-transform-actions"><div><p class="bq-form-message" data-transform-message aria-live="polite">${escapeHtml(message)}</p></div><div><button type="button" class="bq-secondary-button" data-transform-reflection-reset>${escapeHtml(copy('clearJournal'))}</button><button type="button" class="bq-primary-button" data-transform-reflection-save>${escapeHtml(copy('saveReflection'))}</button></div></div></section>
        <section class="bq-panel" data-transform-history><p class="bq-eyebrow">${escapeHtml(copy('historyEyebrow'))}</p><h2>${escapeHtml(copy('historyHeading'))}</h2>${history.length?`<div class="bq-transform-focus">${history.map(row=>`<article data-transform-history-item><b>${escapeHtml(local.historyType(row.type))}</b><p>${escapeHtml(row.summary)}</p><small>${escapeHtml(new Date(row.date).toLocaleString(locale==='en'?'en':locale==='tl'?'fil-PH':'ceb-PH'))}</small></article>`).join('')}</div>`:`<p>${escapeHtml(copy('historyEmpty'))}</p>`}</section>
        <section class="bq-panel bq-transform-actions"><div><b>${escapeHtml(copy(fullComplete?'fullComplete':'fullProgress'))}</b><p>${escapeHtml(copy(fullComplete?'fullCompleteDescription':'fullProgressDescription'))}</p></div><div><button type="button" class="bq-secondary-button" data-transform-back>${escapeHtml(copy('backGrow'))}</button></div></section>`;
      };

      const render=state=>mode==='full'?renderFull(state):renderBasic(state);
      const refresh=()=>render(transform.getState());
      const openFull=()=>{mode='full';message='';const opened=transform.openFull();if(opened.progressResult?.awardedXp)message=copy('recoveredFull',{xp:opened.progressResult.awardedXp});render(opened.state)};
      const openBasic=()=>{mode='basic';message='';const opened=transform.openBasic();if(opened.progressResult?.awardedXp)message=text('transform.basic.recovered',{xp:opened.progressResult.awardedXp});render(opened.state)};

      const onClick=event=>{
        const target=event.target instanceof Element?event.target:null;
        if(!target)return;
        if(target.closest('[data-transform-mode-full]')){try{openFull()}catch(error){message=error.message;refresh()}return}
        if(target.closest('[data-transform-mode-basic]')){try{openBasic()}catch(error){message=error.message;refresh()}return}

        const rating=target.closest('[data-transform-rating]');
        if(rating){try{message='';transform.setSpiritualAnswer(rating.dataset.transformRating,Number(rating.dataset.value));refresh()}catch(error){message=error.message;refresh()}return}
        if(target.closest('[data-transform-calculate]')){try{const output=transform.completeBasicAssessment();message=output.progressResult?.awardedXp?text('transform.basic.savedXp',{xp:output.progressResult.awardedXp}):text('transform.basic.reflectionSaved');render(output.state);queueMicrotask(()=>host.querySelector('[data-transform-result]')?.scrollIntoView({block:'start'}))}catch(error){message=error.message;refresh()}return}
        if(target.closest('[data-transform-reset]')){if(!window.confirm(text('transform.basic.confirmReset')))return;try{message=text('transform.basic.cleared');transform.resetSpiritual();refresh()}catch(error){message=error.message;refresh()}return}
        if(target.closest('[data-transform-flow-save]')){try{const input={scripture:host.querySelector('[data-transform-flow-scripture]')?.value||'',understand:host.querySelector('[data-transform-flow-understand]')?.value||'',reflect:host.querySelector('[data-transform-flow-reflect]')?.value||'',apply:host.querySelector('[data-transform-flow-apply]')?.value||'',pray:host.querySelector('[data-transform-flow-pray]')?.value||''};if(!input.scripture||!input.understand||!input.reflect||!input.apply||!input.pray)throw new Error(copy('completeScripture'));const output=transform.saveReflection(input);message=output.applied?copy('scriptureSaved'):copy('noReflectionChanges');render(output.state)}catch(error){message=error.message;refresh()}return}

        const personalityRating=target.closest('[data-transform-personality-rating]');
        if(personalityRating){try{message='';transform.setPersonalityAnswer(personalityRating.dataset.transformPersonalityRating,Number(personalityRating.dataset.value));refresh()}catch(error){message=error.message;refresh()}return}
        if(target.closest('[data-transform-personality-calculate]')){try{const output=transform.completePersonalityAssessment();message=output.progressResult?.awardedXp?copy('completedXp',{xp:output.progressResult.awardedXp}):copy('personalityPatternSaved');render(output.state);queueMicrotask(()=>host.querySelector('[data-transform-personality-result]')?.scrollIntoView({block:'start'}))}catch(error){message=error.message;refresh()}return}
        if(target.closest('[data-transform-personality-reset]')){if(!window.confirm(copy('clearPersonalityConfirm')))return;try{message=copy('personalityCleared');transform.resetPersonality();refresh()}catch(error){message=error.message;refresh()}return}

        const biasAnswer=target.closest('[data-transform-bias-answer]');
        if(biasAnswer){try{message='';transform.setBiasAnswer(biasAnswer.dataset.transformBiasAnswer,Number(biasAnswer.dataset.value));refresh()}catch(error){message=error.message;refresh()}return}
        if(target.closest('[data-transform-bias-calculate]')){try{const output=transform.completeBiasAssessment();message=output.progressResult?.awardedXp?copy('completedXp',{xp:output.progressResult.awardedXp}):copy('thinkingPatternSaved');render(output.state);queueMicrotask(()=>host.querySelector('[data-transform-bias-result]')?.scrollIntoView({block:'start'}))}catch(error){message=error.message;refresh()}return}
        if(target.closest('[data-transform-bias-reset]')){if(!window.confirm(copy('clearThinkingConfirm')))return;try{message=copy('thinkingCleared');transform.resetBias();refresh()}catch(error){message=error.message;refresh()}return}

        if(target.closest('[data-transform-reflection-save]')){try{const input={practice:host.querySelector('[data-transform-reflection-practice]')?.value||'',noticed:host.querySelector('[data-transform-reflection-noticed]')?.value||'',action:host.querySelector('[data-transform-reflection-action]')?.value||'',prayer:host.querySelector('[data-transform-reflection-prayer]')?.value||''};const output=transform.saveReflection(input);message=output.applied?copy('privateSaved'):copy('noReflectionChanges');render(output.state)}catch(error){message=error.message;refresh()}return}
        if(target.closest('[data-transform-reflection-reset]')){if(!window.confirm(copy('clearJournalConfirm')))return;try{message=copy('journalCleared');transform.resetReflection();refresh()}catch(error){message=error.message;refresh()}return}
        if(target.closest('[data-transform-back]'))onGrow();
      };

      host.addEventListener('click',onClick);
      try{openBasic()}catch(error){host.innerHTML=`<section class="bq-panel"><h1>${escapeHtml(text('transform.unavailable'))}</h1><p class="bq-form-message">${escapeHtml(error?.message||text('transform.unavailableMessage'))}</p></section>`}
      return()=>host.removeEventListener('click',onClick);
    }
  };
}
