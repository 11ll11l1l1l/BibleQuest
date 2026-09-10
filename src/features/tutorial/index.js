import { trainerStateClass, trainerStateForStep } from './trainer.js';

const STEPS = Object.freeze([
  Object.freeze({
    eyebrow: 'WELCOME TO BIBLEQUEST',
    title: 'A short guide to the app',
    body: 'BibleQuest has many tools, but you do not need to learn them all at once. This guide shows the main path and where to go when you want something more specific.',
    action: Object.freeze({ route: 'home', label: 'Show Home' })
  }),
  Object.freeze({
    eyebrow: 'BEST DAILY START',
    title: 'Continue My Journey',
    body: 'The Daily Journey is the simplest everyday path: retrieve, understand context, learn, apply, and reflect. One meaningful Bible activity can protect your streak; completing the full journey gives stronger progress evidence.',
    action: Object.freeze({ route: 'mission', label: 'Open Daily Journey' })
  }),
  Object.freeze({
    eyebrow: 'READ AND UNDERSTAND',
    title: 'Use Learn for Scripture and study tools',
    body: 'Open Learn when you want the Bible Reader, Guided Study, Story Journey, Smart Review, private notes, or deeper context instead of another general activity.',
    action: Object.freeze({ route: 'learn', label: 'Open Learn' })
  }),
  Object.freeze({
    eyebrow: 'GROW WITH PURPOSE',
    title: 'Progress should point somewhere',
    body: 'Grow holds progress, Transformation, Personality Profile, Psychometrics, Avatar Vault, and other tools that help you see what to review or practice next. Scores describe app evidence; they are not a measure of faith.',
    action: Object.freeze({ route: 'grow', label: 'Open Grow' })
  }),
  Object.freeze({
    eyebrow: 'PEOPLE AND PRACTICE',
    title: 'More connects the wider BibleQuest tools',
    body: 'Use More for community, ministry, assignments, couples and family tools, congregation features, notifications, backups, and your focused Personal Mission.',
    action: Object.freeze({ route: 'more', label: 'Open More' })
  }),
  Object.freeze({
    eyebrow: 'YOU ARE READY',
    title: 'Start simple and come back anytime',
    body: 'Most days, start on Home and continue the next useful step. When you need a specific tool, use the main navigation. The Show tutorial button on Home will always reopen this guide even after you finish it.',
    action: Object.freeze({ route: 'home', label: 'Go to Home' })
  })
]);

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
