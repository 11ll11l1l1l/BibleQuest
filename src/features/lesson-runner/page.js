import { localization } from '../../app/localization.js';
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const COPY = { en: { title: 'Lesson', back: 'Back', previous: 'Previous', next: 'Save and continue', previewNext: 'Next step', complete: 'Complete lesson', reload: 'Reload lesson', loading: 'Loading lesson…', saving: 'Saving…', completed: 'Lesson completed', readonly: 'Mentor preview — progress is read only.', scripture: 'Open Scripture', unavailable: 'No lesson text is available for this step.', idle: 'Reload this lesson after selecting your account and congregation.' } };
function stepText(content) {
  if (typeof content === 'string') return content;
  if (typeof content?.text === 'string') return content.text;
  if (typeof content?.body === 'string') return content.body;
  return '';
}
export function createLessonRunnerPage({ runner, onBack, onScripture, subscribeContext }) {
  if (typeof subscribeContext !== 'function') throw new TypeError('Lesson page requires account/congregation invalidation wiring.');
  const t = key => escape(localization.t(key, { dictionaries: COPY }));
  return {
    title: 'Lesson',
    html: `<section class="bq-panel" data-lesson-runner><button type="button" data-lesson-back>${t('back')}</button><div data-lesson-content></div></section>`,
    mount(root) {
      const page = root.querySelector('[data-lesson-runner]'), host = page.querySelector('[data-lesson-content]');
      let disposed = false;
      const render = state => {
        if (disposed) return;
        if (!state.lesson) {
          host.innerHTML = `<p role="status">${state.error ? escape(state.error) : t(state.status === 'loading' ? 'loading' : 'idle')}</p><button type="button" data-lesson-reload ${state.status === 'loading' ? 'disabled' : ''}>${t('reload')}</button>`;
          return;
        }
        const step = state.lesson.steps[state.stepIndex], busy = state.status === 'saving';
        host.innerHTML = `<h1 tabindex="-1" data-lesson-heading>${escape(step.type)}</h1><p>${state.stepIndex + 1} / ${state.lesson.steps.length}</p>
          <p>${escape(stepText(step.content) || localization.t('unavailable', { dictionaries: COPY })).replace(/\n/g, '<br>')}</p>
          ${state.writable ? '' : `<p>${t('readonly')}</p>`}<p role="status">${state.error ? escape(state.error) : busy ? t('saving') : state.status === 'completed' ? t('completed') : ''}</p>
          ${(step.scriptureRefs ?? []).map((ref, index) => `<button type="button" data-lesson-scripture="${index}">${t('scripture')} ${escape(typeof ref === 'string' ? ref : ref.label || `${ref.book || ''} ${ref.chapter || ''}`)}</button>`).join('')}
          <button type="button" data-lesson-previous ${busy || state.stepIndex === 0 ? 'disabled' : ''}>${t('previous')}</button>
          ${state.stepIndex < state.lesson.steps.length - 1 ? `<button type="button" data-lesson-next ${busy ? 'disabled' : ''}>${t(state.writable && state.progress?.status !== 'completed' ? 'next' : 'previewNext')}</button>` : state.writable && state.progress?.status !== 'completed' ? `<button type="button" data-lesson-complete ${busy ? 'disabled' : ''}>${t('complete')}</button>` : ''}`;
      };
      const click = event => {
        const target = event.target.closest?.('button');
        if (!target || target.disabled || disposed) return;
        if (target.hasAttribute('data-lesson-back')) { onBack(); return; }
        if (target.hasAttribute('data-lesson-reload')) { void runner.load(); return; }
        if (target.hasAttribute('data-lesson-scripture')) {
          const state = runner.getState(), step = state.lesson?.steps[state.stepIndex];
          const ref = step?.scriptureRefs?.[Number(target.getAttribute('data-lesson-scripture'))];
          if (ref && onScripture) onScripture(ref, { routeKey: 'one-to-one-lesson', ...runner.getIdentity(), stepId: step.id });
          return;
        }
        const action = target.hasAttribute('data-lesson-complete') ? runner.complete()
          : target.hasAttribute('data-lesson-next') ? runner.move(1) : target.hasAttribute('data-lesson-previous') ? runner.move(-1) : null;
        if (action) void action.then(() => { if (!disposed) host.querySelector('[data-lesson-heading]')?.focus(); });
      };
      page.addEventListener('click', click);
      const unsubscribe = runner.subscribe(render);
      const unsubscribeContext = subscribeContext(() => runner.invalidate());
      render(runner.getState()); void runner.load();
      return () => { disposed = true; unsubscribe(); unsubscribeContext(); page.removeEventListener('click', click); runner.dispose(); };
    },
  };
}
