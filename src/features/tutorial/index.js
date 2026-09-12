import { trainerStateClass, trainerStateForStep } from './trainer.js';
import { STEPS } from './steps.js';

function template(state) {
  const step = STEPS[state.step] || STEPS[0];
  const trainerState = trainerStateForStep(state.step);
  const progress = STEPS.map((_, index) => `<i class="${index <= state.step ? 'is-on' : ''}" aria-hidden="true"></i>`).join('');
  return `<section class="bq-tutorial-dialog" role="dialog" aria-modal="true" aria-labelledby="bq-tutorial-title" data-bq-english>
    <header class="bq-tutorial-header">
      <div><span aria-hidden="true">✦</span><b>BibleQuest Guide</b></div>
      <button type="button" class="bq-tutorial-close" data-tutorial-skip aria-label="Close tutorial">Close guide</button>
    </header>
    <div class="bq-tutorial-stage">
      <aside class="bq-tutorial-trainer" aria-label="BibleQuest trainer" data-trainer-state="${trainerState}">
        <span class="bq-tutorial-trainer-visual ${trainerStateClass(state.step)}" aria-hidden="true"></span>
        <b>BibleQuest Trainer</b>
        <small>Step ${state.step + 1} of ${state.totalSteps}</small>
      </aside>
      <article class="bq-tutorial-card">
        <p class="bq-eyebrow">${step.eyebrow}</p>
        <h1 id="bq-tutorial-title">${step.title}</h1>
        <p>${step.body}</p>
        <button type="button" class="bq-secondary-button bq-tutorial-try" data-tutorial-action="${step.action.route}">${step.action.label}</button>
      </article>
    </div>
    <footer class="bq-tutorial-footer">
      <div class="bq-tutorial-progress" aria-label="Tutorial progress">${progress}</div>
      <div class="bq-tutorial-actions">
        <button type="button" class="bq-secondary-button" data-tutorial-back ${state.canBack ? '' : 'disabled'}>Back</button>
        <button type="button" class="bq-primary-button" data-tutorial-next>${state.isLast ? 'Finish guide' : 'Next'}</button>
      </div>
    </footer>
  </section>`;
}

export function mountTutorialOverlay({ tutorial, onNavigate, documentRef = document } = {}) {
  if (!tutorial?.subscribe || !documentRef?.body) throw new Error('Tutorial overlay requires the tutorial service and a document body.');
  if (documentRef.querySelector('[data-bq-tutorial-layer]')) throw new Error('Tutorial overlay is already mounted.');

  const layer = documentRef.createElement('div');
  layer.className = 'bq-tutorial-layer';
  layer.dataset.bqTutorialLayer = '1';
  layer.hidden = true;
  documentRef.body.appendChild(layer);

  let current = tutorial.getState();

  const render = state => {
    current = state;
    layer.hidden = !state.active;
    documentRef.body.classList.toggle('bq-tutorial-open', state.active);
    if (!state.active) {
      layer.innerHTML = '';
      return;
    }
    layer.innerHTML = template(state);
    queueMicrotask(() => layer.querySelector('[data-tutorial-next]')?.focus?.({ preventScroll: true }));
  };

  const onClick = event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest('[data-tutorial-skip]')) return void tutorial.skip();
    if (target.closest('[data-tutorial-back]')) return void tutorial.back();
    const action = target.closest('[data-tutorial-action]');
    if (action) {
      const route = action.dataset.tutorialAction;
      tutorial.skip();
      onNavigate?.(route);
      return;
    }
    if (target.closest('[data-tutorial-next]')) {
      if (current.isLast) {
        tutorial.finish();
        onNavigate?.('home');
      } else tutorial.next();
    }
  };

  const onKeyDown = event => {
    if (event.key === 'Escape' && current.active) tutorial.skip();
  };

  layer.addEventListener('click', onClick);
  documentRef.addEventListener('keydown', onKeyDown);
  const unsubscribe = tutorial.subscribe(render);

  return Object.freeze({
    element: layer,
    dispose() {
      unsubscribe();
      layer.removeEventListener('click', onClick);
      documentRef.removeEventListener('keydown', onKeyDown);
      documentRef.body.classList.remove('bq-tutorial-open');
      layer.remove();
    }
  });
}
