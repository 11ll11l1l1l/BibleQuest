const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const scale=[1,2,3,4,5];

export function transformPage({transform,onGrow}){
  return{
    title:'Transformation',
    html:'<section data-transform-page><div class="bq-panel"><p>Opening Transformation…</p></div></section>',
    mount(root){
      const host=root.querySelector('[data-transform-page]');
      let mode='basic';
      let message='';

      const modeButtons=active=>`<section class="bq-panel bq-transform-actions" aria-label="Transformation mode"><div><b>Choose a reflection mode</b><p>Basic focuses on faith and practice. Full adds personality tendencies, thinking-pattern scenarios, recommendations, and a private journal.</p></div><div><button type="button" class="${active==='basic'?'bq-primary-button':'bq-secondary-button'}" data-transform-mode-basic>Basic</button><button type="button" class="${active==='full'?'bq-primary-button':'bq-secondary-button'}" data-transform-mode-full>Full Transform</button></div></section>`;

      const renderBasic=state=>{
        const answers=state.spiritual.answers||{};
        const result=state.spiritual.result;
        const items=transform.definitions.spiritual;
        const answered=items.filter(item=>answers[item.id]).length;
        const resultHtml=result?`<section class="bq-panel bq-transform-result" data-transform-result><p class="bq-eyebrow">PRIVATE REFLECTION</p><h2>Your reflection</h2><p>This is a snapshot of your own answers, not a spiritual grade. Lower ratings simply identify areas you may want to practice deliberately.</p><div class="bq-transform-bars">${result.scores.map(row=>`<div><b>${escapeHtml(row.dimension)}</b><span><i style="width:${row.score*20}%"></i></span><strong>${row.score}/5</strong></div>`).join('')}</div><div class="bq-transform-focus"><h3>Suggested next focus</h3>${result.focus.map(row=>`<article><b>${escapeHtml(row.dimension)}</b><p>${escapeHtml(row.guide)}</p></article>`).join('')}</div></section>`:'';
        host.innerHTML=`<section class="bq-panel bq-transform-head"><p class="bq-eyebrow">TRANSFORMATION</p><h1>Faith & practice reflection</h1><p><b>Important:</b> this is private self-reflection, not a spiritual score, diagnosis, moral ranking, or measure of God’s approval. Use it to notice patterns and choose concrete practices.</p><p class="bq-transform-scale-note">1 = rarely true · 5 = consistently true</p></section>${modeButtons('basic')}<section class="bq-transform-list">${items.map(item=>`<article class="bq-panel bq-transform-item" data-transform-item="${escapeHtml(item.id)}"><div><b>${escapeHtml(item.dimension)}</b><p>${escapeHtml(item.text)}</p></div><div class="bq-transform-scale" role="group" aria-label="${escapeHtml(item.dimension)} rating">${scale.map(value=>`<button type="button" data-transform-rating="${escapeHtml(item.id)}" data-value="${value}" class="${answers[item.id]===value?'is-selected':''}" aria-pressed="${answers[item.id]===value}">${value}</button>`).join('')}</div></article>`).join('')}</section><section class="bq-panel bq-transform-actions"><div><b>${answered}/${items.length} answered</b><p class="bq-form-message" data-transform-message aria-live="polite">${escapeHtml(message)}</p></div><div><button type="button" class="bq-secondary-button" data-transform-back>Back to Grow</button><button type="button" class="bq-secondary-button" data-transform-reset ${answered?'':'disabled'}>Reset</button><button type="button" class="bq-primary-button" data-transform-calculate ${answered===items.length?'':'disabled'}>${result?'Reflection saved':'View reflection'}</button></div></section>${resultHtml}`;
      };

      const personalityResultHtml=result=>{
        if(!result)return'';
        return `<section class="bq-panel" data-transform-personality-result><p class="bq-eyebrow">PERSONALITY TENDENCIES</p><h3>Your current pattern</h3><p>These tendencies describe preferences, not fixed identity or spiritual maturity.</p><div class="bq-transform-focus">${Object.values(result.scores).map(row=>`<article><b>${escapeHtml(row.name)}</b><p>${escapeHtml(row.band)} · ${escapeHtml(row.mean)}/5</p></article>`).join('')}</div></section>`;
      };

      const biasResultHtml=result=>{
        if(!result)return'';
        return `<section class="bq-panel" data-transform-bias-result><p class="bq-eyebrow">THINKING PATTERNS</p><h3>${result.helpful}/${result.total} bias-resistant responses</h3><p>This is practice in decision quality, not an intelligence score.</p><div class="bq-transform-focus">${result.signals.map(row=>`<article><b>${escapeHtml(row.title)} · ${row.helpful?'Helpful response':'Review this pattern'}</b><p>${escapeHtml(row.practice)}</p></article>`).join('')}</div></section>`;
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

        host.innerHTML=`<section class="bq-panel bq-transform-head"><p class="bq-eyebrow">FULL TRANSFORM</p><h1>Understand patterns, then practice change</h1><p><b>Important:</b> these tools are for private self-reflection and decision practice. They are not diagnosis, intelligence testing, spiritual ranking, or a substitute for pastoral or professional care.</p><p class="bq-transform-scale-note">Personality ratings: 1 = strongly disagree · 5 = strongly agree</p></section>${modeButtons('full')}
        <section class="bq-panel"><p class="bq-eyebrow">1 · PERSONALITY</p><h2>Notice your tendencies</h2><p>Answer all 20 prompts. Results describe tendencies and include balancing practices rather than labels.</p><div class="bq-transform-list">${personalityItems.map(item=>`<article class="bq-panel bq-transform-item" data-transform-personality-item="${escapeHtml(item.id)}"><div><b>${escapeHtml(transform.definitions.factors[item.factor]?.name||item.factor)}</b><p>${escapeHtml(item.text)}</p></div><div class="bq-transform-scale" role="group" aria-label="${escapeHtml(item.id)} rating">${scale.map(value=>`<button type="button" data-transform-personality-rating="${escapeHtml(item.id)}" data-value="${value}" class="${personalityAnswers[item.id]===value?'is-selected':''}" aria-pressed="${personalityAnswers[item.id]===value}">${value}</button>`).join('')}</div></article>`).join('')}</div><div class="bq-transform-actions"><div><b>${personalityAnswered}/${personalityItems.length} answered</b></div><div><button type="button" class="bq-secondary-button" data-transform-personality-reset ${personalityAnswered?'':'disabled'}>Reset personality</button><button type="button" class="bq-primary-button" data-transform-personality-calculate ${personalityAnswered===personalityItems.length?'':'disabled'}>${state.personality.result?'Personality saved':'View personality pattern'}</button></div></div></section>
        ${personalityResultHtml(state.personality.result)}
        <section class="bq-panel"><p class="bq-eyebrow">2 · THINKING PATTERNS</p><h2>Practice better judgment</h2><p>Choose the response that best protects decision quality in each scenario.</p><div class="bq-transform-list">${biasItems.map(task=>`<article class="bq-panel bq-transform-item" data-transform-bias-item="${escapeHtml(task.id)}"><div><b>${escapeHtml(task.title)}</b><p>${escapeHtml(task.scenario)}</p></div><div role="group" aria-label="${escapeHtml(task.title)} responses">${task.options.map((option,index)=>`<button type="button" class="bq-secondary-button ${biasAnswers[task.id]===index?'is-selected':''}" data-transform-bias-answer="${escapeHtml(task.id)}" data-value="${index}" aria-pressed="${biasAnswers[task.id]===index}">${escapeHtml(option)}</button>`).join('')}</div></article>`).join('')}</div><div class="bq-transform-actions"><div><b>${biasAnswered}/${biasItems.length} answered</b></div><div><button type="button" class="bq-secondary-button" data-transform-bias-reset ${biasAnswered?'':'disabled'}>Reset thinking patterns</button><button type="button" class="bq-primary-button" data-transform-bias-calculate ${biasAnswered===biasItems.length?'':'disabled'}>${state.bias.result?'Thinking review saved':'Review thinking patterns'}</button></div></div></section>
        ${biasResultHtml(state.bias.result)}
        <section class="bq-panel" data-transform-recommendations><p class="bq-eyebrow">3 · PRACTICE</p><h2>Recommended next practices</h2>${fullComplete?'<p>Your Full Transform assessment is complete. Recommendations combine the patterns available in your saved results.</p>':'<p>Complete both assessments above to finish Full Transform. Recommendations update as results become available.</p>'}<div class="bq-transform-focus">${recommendations.map(row=>`<article><b>${escapeHtml(row.title)}</b><p>${escapeHtml(row.body)}</p></article>`).join('')}</div></section>
        <section class="bq-panel" data-transform-reflection><p class="bq-eyebrow">4 · PRIVATE JOURNAL</p><h2>Turn insight into practice</h2><p>Your journal stays in the Transform persistence boundary used by this app.</p><label class="bq-field"><span>Practice I am working on</span><textarea rows="2" maxlength="500" data-transform-reflection-practice>${escapeHtml(reflection.practice)}</textarea></label><label class="bq-field"><span>What I noticed</span><textarea rows="3" maxlength="1200" data-transform-reflection-noticed>${escapeHtml(reflection.noticed)}</textarea></label><label class="bq-field"><span>Next action</span><textarea rows="3" maxlength="1200" data-transform-reflection-action>${escapeHtml(reflection.action)}</textarea></label><label class="bq-field"><span>Prayer / reflection</span><textarea rows="3" maxlength="1200" data-transform-reflection-prayer>${escapeHtml(reflection.prayer)}</textarea></label><div class="bq-transform-actions"><div><p class="bq-form-message" data-transform-message aria-live="polite">${escapeHtml(message)}</p></div><div><button type="button" class="bq-secondary-button" data-transform-reflection-reset>Clear journal</button><button type="button" class="bq-primary-button" data-transform-reflection-save>Save reflection</button></div></div></section>
        <section class="bq-panel" data-transform-history><p class="bq-eyebrow">RECENT HISTORY</p><h2>Saved Transform activity</h2>${history.length?`<div class="bq-transform-focus">${history.map(row=>`<article data-transform-history-item><b>${escapeHtml(row.type)}</b><p>${escapeHtml(row.summary)}</p><small>${escapeHtml(new Date(row.date).toLocaleString())}</small></article>`).join('')}</div>`:'<p>No saved Transform activity yet.</p>'}</section>
        <section class="bq-panel bq-transform-actions"><div><b>${fullComplete?'Full Transform complete':'Full Transform in progress'}</b><p>${fullComplete?'Your results remain editable; changing an answer invalidates only that section until recalculated.':'Complete personality and thinking-pattern reviews to finish this milestone.'}</p></div><div><button type="button" class="bq-secondary-button" data-transform-back>Back to Grow</button></div></section>`;
      };

      const render=state=>mode==='full'?renderFull(state):renderBasic(state);
      const refresh=()=>render(transform.getState());
      const openFull=()=>{mode='full';message='';const opened=transform.openFull();if(opened.progressResult?.awardedXp)message=`Recovered completed Full Transform · +${opened.progressResult.awardedXp} XP`;render(opened.state)};
      const openBasic=()=>{mode='basic';message='';const opened=transform.openBasic();if(opened.progressResult?.awardedXp)message=`Recovered saved reflection · +${opened.progressResult.awardedXp} XP`;render(opened.state)};

      const onClick=event=>{
        const target=event.target instanceof Element?event.target:null;
        if(!target)return;
        if(target.closest('[data-transform-mode-full]')){try{openFull()}catch(error){message=error.message;refresh()}return}
        if(target.closest('[data-transform-mode-basic]')){try{openBasic()}catch(error){message=error.message;refresh()}return}

        const rating=target.closest('[data-transform-rating]');
        if(rating){try{message='';transform.setSpiritualAnswer(rating.dataset.transformRating,Number(rating.dataset.value));refresh()}catch(error){message=error.message;refresh()}return}
        if(target.closest('[data-transform-calculate]')){try{const output=transform.completeBasicAssessment();message=output.progressResult?.awardedXp?`Reflection saved · +${output.progressResult.awardedXp} XP`:'Reflection saved';render(output.state);queueMicrotask(()=>host.querySelector('[data-transform-result]')?.scrollIntoView({block:'start'}))}catch(error){message=error.message;refresh()}return}
        if(target.closest('[data-transform-reset]')){if(!window.confirm('Clear all 12 Transformation answers and the current result?'))return;try{message='Assessment cleared.';transform.resetSpiritual();refresh()}catch(error){message=error.message;refresh()}return}

        const personalityRating=target.closest('[data-transform-personality-rating]');
        if(personalityRating){try{message='';transform.setPersonalityAnswer(personalityRating.dataset.transformPersonalityRating,Number(personalityRating.dataset.value));refresh()}catch(error){message=error.message;refresh()}return}
        if(target.closest('[data-transform-personality-calculate]')){try{const output=transform.completePersonalityAssessment();message=output.progressResult?.awardedXp?`Full Transform complete · +${output.progressResult.awardedXp} XP`:'Personality pattern saved.';render(output.state);queueMicrotask(()=>host.querySelector('[data-transform-personality-result]')?.scrollIntoView({block:'start'}))}catch(error){message=error.message;refresh()}return}
        if(target.closest('[data-transform-personality-reset]')){if(!window.confirm('Clear the personality answers and current personality result?'))return;try{message='Personality assessment cleared.';transform.resetPersonality();refresh()}catch(error){message=error.message;refresh()}return}

        const biasAnswer=target.closest('[data-transform-bias-answer]');
        if(biasAnswer){try{message='';transform.setBiasAnswer(biasAnswer.dataset.transformBiasAnswer,Number(biasAnswer.dataset.value));refresh()}catch(error){message=error.message;refresh()}return}
        if(target.closest('[data-transform-bias-calculate]')){try{const output=transform.completeBiasAssessment();message=output.progressResult?.awardedXp?`Full Transform complete · +${output.progressResult.awardedXp} XP`:'Thinking-pattern review saved.';render(output.state);queueMicrotask(()=>host.querySelector('[data-transform-bias-result]')?.scrollIntoView({block:'start'}))}catch(error){message=error.message;refresh()}return}
        if(target.closest('[data-transform-bias-reset]')){if(!window.confirm('Clear the thinking-pattern answers and current result?'))return;try{message='Thinking-pattern review cleared.';transform.resetBias();refresh()}catch(error){message=error.message;refresh()}return}

        if(target.closest('[data-transform-reflection-save]')){try{const input={practice:host.querySelector('[data-transform-reflection-practice]')?.value||'',noticed:host.querySelector('[data-transform-reflection-noticed]')?.value||'',action:host.querySelector('[data-transform-reflection-action]')?.value||'',prayer:host.querySelector('[data-transform-reflection-prayer]')?.value||''};const output=transform.saveReflection(input);message=output.applied?'Private reflection saved.':'No reflection changes to save.';render(output.state)}catch(error){message=error.message;refresh()}return}
        if(target.closest('[data-transform-reflection-reset]')){if(!window.confirm('Clear the private Transform journal fields?'))return;try{message='Private journal cleared.';transform.resetReflection();refresh()}catch(error){message=error.message;refresh()}return}
        if(target.closest('[data-transform-back]'))onGrow();
      };

      host.addEventListener('click',onClick);
      try{openBasic()}catch(error){host.innerHTML=`<section class="bq-panel"><h1>Transformation unavailable</h1><p class="bq-form-message">${escapeHtml(error?.message||'Could not open Transformation.')}</p></section>`}
      return()=>host.removeEventListener('click',onClick);
    }
  };
}
