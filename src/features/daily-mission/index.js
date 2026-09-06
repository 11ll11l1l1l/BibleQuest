const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const LABELS = Object.freeze({ retrieve:'Retrieve', context:'Context', learn:'Learn', apply:'Apply', reflect:'Reflect' });

export function dailyMissionPage({ mission, onReader, onHome }) {
  return {
    title: 'Daily Journey',
    html: '<section data-daily-page><div class="bq-panel"><p>Opening today’s journey…</p></div></section>',
    mount(root) {
      const host = root.querySelector('[data-daily-page]');
      let snapshot;

      const showError = error => {
        const node = host.querySelector('[data-daily-message]');
        if (node) node.textContent = error?.message || 'Could not save this step. Retry the action.';
        else host.insertAdjacentHTML('afterbegin', `<p class="bq-form-message" data-daily-message>${escapeHtml(error?.message || 'Could not open Daily Journey.')}</p>`);
      };

      const stepList = state => ['retrieve','context','learn','apply','reflect'].map((id, index) => {
        const done = id in (state.responses || {});
        const current = state.currentStep?.id === id;
        return `<li class="${done ? 'is-done' : ''} ${current ? 'is-current' : ''}"><span>${done ? '✓' : index + 1}</span><b>${LABELS[id]}</b></li>`;
      }).join('');

      const feedbackBlock = (state, step) => {
        const item = state.feedback?.[step.id];
        if (!item) return '';
        const tone = item.correct === true ? 'is-correct' : item.correct === false ? 'is-review' : '';
        return `<div class="bq-daily-feedback ${tone}" data-daily-feedback><b>${item.correct === true ? 'Correct' : item.correct === false ? 'Review' : 'Saved'}</b>${item.message ? `<p>${escapeHtml(item.message)}</p>` : ''}${item.reference ? `<small>${escapeHtml(item.reference)}</small>` : ''}</div>`;
      };

      const renderStep = state => {
        const step = state.currentStep;
        const answered = step.id in state.responses;
        const response = state.responses[step.id];
        if (step.type === 'choice') return `<h2>${escapeHtml(step.prompt)}</h2><div class="bq-daily-choices">${step.choices.map((choice,index) => `<button type="button" data-daily-choice="${index}" ${answered ? 'disabled' : ''} class="${answered && Number(response) === index ? 'is-selected' : ''}">${escapeHtml(choice)}</button>`).join('')}</div>${feedbackBlock(state, step)}${answered ? '<button type="button" class="bq-primary-button" data-daily-next>Continue</button>' : ''}`;
        if (step.type === 'confirm') return `<h2>${escapeHtml(step.prompt)}</h2>${step.id === 'context' ? '<button type="button" class="bq-secondary-button" data-daily-open-reader>Open Bible passage</button>' : ''}${feedbackBlock(state, step)}${answered ? '<button type="button" class="bq-primary-button" data-daily-next>Continue</button>' : `<button type="button" class="bq-primary-button" data-daily-confirm>${step.id === 'context' ? 'I read the passage' : 'I reviewed this connection'}</button>`}`;
        if (step.type === 'text') return `<h2>${escapeHtml(step.prompt)}</h2><form data-daily-text-form><textarea name="response" rows="5" maxlength="${step.maxLength}" ${answered ? 'disabled' : ''} required>${escapeHtml(answered ? response : '')}</textarea>${feedbackBlock(state, step)}${answered ? `<button type="button" class="bq-primary-button" data-daily-next>${step.id === 'reflect' ? 'Complete journey' : 'Continue'}</button>` : `<button type="submit" class="bq-primary-button" data-daily-save>${step.id === 'reflect' ? 'Save reflection' : 'Save action'}</button>`}</form>`;
        return '<p>This Daily Journey step is unavailable.</p>';
      };

      const render = next => {
        snapshot = next;
        const { state, passage, dateKey } = snapshot;
        const reference = `${passage.book} ${passage.chapter}:${passage.from}–${passage.to}`;
        if (state.status === 'complete') {
          host.innerHTML = `<section class="bq-panel bq-daily-complete" data-daily-complete><p class="bq-eyebrow">DAILY JOURNEY · ${escapeHtml(dateKey)}</p><h1>Journey complete</h1><p><b>${escapeHtml(passage.title)}</b> · ${escapeHtml(reference)}</p><p>You completed Retrieve → Context → Learn → Apply → Reflect. The completion bonus is idempotent, so reopening today cannot award it twice.</p><div class="bq-daily-actions"><button type="button" class="bq-primary-button" data-daily-reader>Read passage</button><button type="button" class="bq-secondary-button" data-daily-home>Home</button></div></section>`;
          return;
        }
        const step = state.currentStep;
        host.innerHTML = `<section class="bq-panel bq-daily-head"><p class="bq-eyebrow">DAILY JOURNEY · ${escapeHtml(dateKey)}</p><h1>${escapeHtml(passage.title)}</h1><p>${escapeHtml(reference)} · Step ${state.index + 1} of ${state.totalSteps}</p><div class="bq-daily-progress" aria-label="${snapshot.percent}% complete"><span style="width:${snapshot.percent}%"></span></div><ol class="bq-daily-steps">${stepList(state)}</ol></section><section class="bq-panel bq-daily-card" data-daily-step="${escapeHtml(step.id)}"><p class="bq-eyebrow">${escapeHtml(LABELS[step.id] || step.id)}</p>${renderStep(state)}<p class="bq-form-message" data-daily-message aria-live="polite"></p></section>`;
      };

      const answer = value => {
        try { render(mission.respond(value)); }
        catch (error) { showError(error); }
      };
      const next = () => {
        try { render(mission.advance()); }
        catch (error) { showError(error); }
      };
      const openReader = () => {
        try { mission.prepareReader(); onReader(); }
        catch (error) { showError(error); }
      };
      const onClick = event => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        const choice = target.closest('[data-daily-choice]');
        if (choice) return answer(Number(choice.dataset.dailyChoice));
        if (target.closest('[data-daily-confirm]')) return answer(true);
        if (target.closest('[data-daily-next]')) return next();
        if (target.closest('[data-daily-open-reader]') || target.closest('[data-daily-reader]')) return openReader();
        if (target.closest('[data-daily-home]')) return onHome();
      };
      const onSubmit = event => {
        const form = event.target instanceof HTMLFormElement ? event.target : null;
        if (!form?.matches('[data-daily-text-form]')) return;
        event.preventDefault();
        answer(String(new FormData(form).get('response') || '').trim());
      };

      host.addEventListener('click', onClick);
      host.addEventListener('submit', onSubmit);
      try { render(mission.open()); }
      catch (error) { host.innerHTML = `<section class="bq-panel"><h1>Daily Journey unavailable</h1><p class="bq-form-message">${escapeHtml(error?.message || 'Could not open today’s journey.')}</p></section>`; }
      return () => {
        host.removeEventListener('click', onClick);
        host.removeEventListener('submit', onSubmit);
        mission.close();
      };
    }
  };
}
