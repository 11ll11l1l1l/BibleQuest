import { localization } from '../../app/localization.js';
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const COPY = Object.freeze({
  en: Object.freeze({
    title: 'Lesson', progress: 'Lesson progress', back: 'Back', previous: 'Previous', next: 'Save and continue', previewNext: 'Next step',
    complete: 'Complete lesson', reload: 'Reload lesson', loading: 'Loading lesson…', saving: 'Saving…',
    completed: 'Lesson completed', readonly: 'Mentor preview — progress is read only.', scripture: 'Open Scripture',
    unavailable: 'No lesson text is available for this step.', idle: 'Reload this lesson after selecting your account and congregation.',
    response: 'Your private response', responseHint: 'Private to you unless you explicitly share it with your mentor.',
    responseLoading: 'Restoring lesson responses…', responseRetry: 'Retry response loading', shareConfirm: 'Share this response with my paired mentor',
    shareConfirmRequired: 'Confirm the named mentor share before continuing.', share: 'Share with mentor',
    unshare: 'Make private again', shared: 'Shared with your paired mentor.', private: 'Private to you.',
    mentorShared: 'Shared by your mentee', shareSaving: 'Updating response sharing…',
  }),
  tl: Object.freeze({
    title: 'Aralin', progress: 'Pag-usad sa aralin', back: 'Bumalik', previous: 'Nakaraan', next: 'I-save at magpatuloy', previewNext: 'Susunod na hakbang',
    complete: 'Tapusin ang aralin', reload: 'I-load muli ang aralin', loading: 'Naglo-load ang aralin…', saving: 'Sine-save…',
    completed: 'Tapos na ang aralin', readonly: 'Preview ng mentor — read only ang progreso.', scripture: 'Buksan ang Kasulatan',
    unavailable: 'Walang teksto ng aralin para sa hakbang na ito.', idle: 'I-load muli ang aralin pagkatapos pumili ng account at kongregasyon.',
    response: 'Pribado mong sagot', responseHint: 'Pribado ito sa iyo maliban kung malinaw mo itong ibabahagi sa mentor mo.',
    responseLoading: 'Ibinabalik ang mga sagot sa aralin…', responseRetry: 'Subukang i-load muli ang mga sagot', shareConfirm: 'Ibahagi ang sagot na ito sa nakaparis kong mentor',
    shareConfirmRequired: 'Kumpirmahin muna ang pagbabahagi sa nakapangalan na mentor.', share: 'Ibahagi sa mentor',
    unshare: 'Gawing pribado muli', shared: 'Ibinahagi sa nakaparis mong mentor.', private: 'Pribado sa iyo.',
    mentorShared: 'Ibinahagi ng mentee mo', shareSaving: 'Ina-update ang pagbabahagi ng sagot…',
  }),
  ceb: Object.freeze({
    title: 'Leksiyon', progress: 'Pag-uswag sa leksiyon', back: 'Balik', previous: 'Miaging lakang', next: 'Tipigi ug padayon', previewNext: 'Sunod nga lakang',
    complete: 'Kompletoha ang leksiyon', reload: 'Ikarga pag-usab ang leksiyon', loading: 'Gikarga ang leksiyon…', saving: 'Gitipigan…',
    completed: 'Kompleto na ang leksiyon', readonly: 'Preview sa mentor — read only ang progreso.', scripture: 'Ablihi ang Kasulatan',
    unavailable: 'Walay teksto sa leksiyon alang niini nga lakang.', idle: 'Ikarga pag-usab human pagpili sa account ug kongregasyon.',
    response: 'Pribado nimong tubag', responseHint: 'Pribado kini kanimo gawas kon tin-aw nimo kining ipaambit sa imong mentor.',
    responseLoading: 'Gipahiuli ang mga tubag sa leksiyon…', responseRetry: 'Sulayi pag-usab ang pagkarga sa mga tubag', shareConfirm: 'Ipaambit kini nga tubag sa akong kaparis nga mentor',
    shareConfirmRequired: 'Kumpirmaha una ang pagpaambit ngadto sa ginganlang mentor.', share: 'Ipaambit sa mentor',
    unshare: 'Himoang pribado pag-usab', shared: 'Gipaambit sa imong kaparis nga mentor.', private: 'Pribado kanimo.',
    mentorShared: 'Gipaambit sa imong mentee', shareSaving: 'Gi-update ang pagpaambit sa tubag…',
  }),
});
function stepText(content) {
  if (typeof content === 'string') return content;
  if (typeof content?.text === 'string') return content.text;
  if (typeof content?.body === 'string') return content.body;
  return '';
}
function responseText(response) {
  return stepText(response?.response ?? response);
}
function responseEditor(state, step, t) {
  if (!state.writable || step.type === 'scripture') return '';
  const value = state.responseDrafts?.[step.id] ?? '';
  const saved = state.responses?.[step.id];
  const shared = saved?.visibility === 'shared';
  const hasResponse = Boolean(saved?.id || String(value).trim());
  const sharingBusy = state.shareStatus === 'saving' || ['saving', 'saving-response'].includes(state.status);
  const sharingDisabled = sharingBusy || state.responseStatus !== 'ready';
  const sharing = shared
    ? `<p data-lesson-share-state="shared">${t('shared')}</p><button type="button" class="bq-secondary-button" data-lesson-unshare="${escape(step.id)}"${sharingDisabled ? ' disabled' : ''}>${t('unshare')}</button>`
    : `<p data-lesson-share-state="private">${t('private')}</p><label class="bq-lesson-share-consent"><input type="checkbox" data-lesson-share-confirm="${escape(step.id)}"${sharingDisabled ? ' disabled' : ''}> ${t('shareConfirm')}</label><button type="button" class="bq-secondary-button" data-lesson-share="${escape(step.id)}"${hasResponse && !sharingDisabled ? '' : ' disabled'}>${t('share')}</button>`;
  return `<div class="bq-lesson-response-editor"><label for="lesson-response-${escape(step.id)}">${t('response')}</label>
    <textarea id="lesson-response-${escape(step.id)}" data-lesson-response="${escape(step.id)}" rows="5">${escape(value)}</textarea>
    <p class="bq-help">${t('responseHint')}</p><div class="bq-lesson-sharing"${sharingBusy ? ' aria-busy="true"' : ''}>${sharing}</div></div>`;
}
function mentorSharedResponse(state, step, t) {
  if (state.writable || step.type === 'scripture') return '';
  const response = state.responses?.[step.id];
  if (!response || response.visibility !== 'shared') return '';
  return `<section class="bq-lesson-mentor-response" data-lesson-shared-response="${escape(step.id)}"><h2>${t('mentorShared')}</h2><p>${escape(responseText(response)).replace(/\n/g, '<br>')}</p></section>`;
}
// Draft keystrokes are local edits, not a reason to replace an active textarea.
// Other state changes (save, step, authorization, share status) still redraw.
export function canPatchVisibleResponseDraft(previous, next) {
  if (!previous?.lesson || !next?.lesson || previous.responseDrafts === next.responseDrafts) return false;
  return ['lesson','stepIndex','status','writable','progress','error','responses',
    'responseStatus','responseError','shareStatus','shareError','mentorId']
    .every(key => previous[key] === next[key]);
}

export function createLessonRunnerPage({ runner, onBack, onScripture, isContextReady = () => false, subscribeContext }) {
  if (typeof subscribeContext !== 'function') throw new TypeError('Lesson page requires account/congregation invalidation wiring.');
  const t = key => escape(localization.t(key, { dictionaries: COPY }));
  const stepLabel = type => escape(localization.t(`v7.authoring.step.${type}`));
  return {
    title: localization.t('title', { dictionaries: COPY }),
    html: `<section class="bq-panel bq-one2one-lesson" data-lesson-runner><div class="bq-lesson-toolbar"><button type="button" class="bq-secondary-button" data-lesson-back>${t('back')}</button></div><div data-lesson-content></div></section>`,
    mount(root) {
      const page = root.querySelector('[data-lesson-runner]'), host = page.querySelector('[data-lesson-content]');
      let disposed = false;
      let lastVisibleStepId = '';
      let displayedState = null;
      const loadWhenReady = () => { if (!disposed && isContextReady()) void runner.load(); };
      const render = state => {
        if (disposed) return;
        if (canPatchVisibleResponseDraft(displayedState, state)) {
          const stepId = state.lesson.steps?.[state.stepIndex]?.id;
          const editor = host.querySelector?.('[data-lesson-response]');
          if (editor && editor.getAttribute('data-lesson-response') === stepId) {
            // Preserve the actual focused DOM node, selection and composition
            // session. The share control alone depends on whether a draft exists.
            const shareButton = host.querySelector?.('[data-lesson-share]');
            if (shareButton) shareButton.disabled = state.responseStatus !== 'ready'
              || !(state.responses?.[stepId]?.id || String(state.responseDrafts?.[stepId] ?? '').trim());
            displayedState = state;
            return;
          }
        }
        displayedState = state;
        if (!state.lesson) {
          lastVisibleStepId = '';
          host.innerHTML = `<div class="bq-lesson-empty"><p role="status">${state.error ? escape(state.error) : t(state.status === 'loading' ? 'loading' : 'idle')}</p><button type="button" class="bq-secondary-button" data-lesson-reload ${state.status === 'loading' ? 'disabled' : ''}>${t('reload')}</button></div>`;
          return;
        }
        const step = state.lesson.steps[state.stepIndex];
        const stepArriving = lastVisibleStepId !== step.id;
        lastVisibleStepId = step.id;
        const busy = ['saving','saving-response'].includes(state.status) || state.shareStatus === 'saving';
        const responseStatus = state.shareError ? escape(state.shareError)
          : state.shareStatus === 'saving' ? t('shareSaving')
          : state.responseError ? escape(state.responseError)
          : state.responseStatus === 'loading' ? t('responseLoading') : '';
        host.innerHTML = `<header class="bq-lesson-header"${stepArriving ? ' data-step-arriving' : ''}><p class="bq-lesson-overline">${t('title')}</p><h1 tabindex="-1" data-lesson-heading data-step-type="${escape(step.type)}">${stepLabel(step.type)}</h1><p class="bq-lesson-counter">${state.stepIndex + 1} / ${state.lesson.steps.length}</p><progress class="bq-lesson-progress" aria-label="${t('progress')}" max="${state.lesson.steps.length}" value="${state.stepIndex + 1}"></progress></header><article class="bq-lesson-reading">
          <p class="bq-lesson-copy">${escape(stepText(step.content) || localization.t('unavailable', { dictionaries: COPY })).replace(/\n/g, '<br>')}</p></article>
          ${responseEditor(state, step, t)}
          ${mentorSharedResponse(state, step, t)}
          ${state.writable ? '' : `<p class="bq-lesson-readonly">${t('readonly')}</p>`}<p class="bq-lesson-live" role="status" aria-live="polite">${state.error ? escape(state.error) : busy ? t('saving') : state.status === 'completed' ? t('completed') : responseStatus}</p>
          ${state.responseStatus === 'error' ? `<button type="button" class="bq-secondary-button" data-lesson-response-retry>${t('responseRetry')}</button>` : ''}
          <div class="bq-lesson-references">${(step.scriptureRefs ?? []).map((ref, index) => `<button type="button" class="bq-secondary-button" data-lesson-scripture="${index}">${t('scripture')} ${escape(typeof ref === 'string' ? ref : ref.label || `${ref.book || ''} ${ref.chapter || ''}`)}</button>`).join('')}</div>
          <footer class="bq-lesson-footer"><div class="bq-lesson-actions"><button type="button" class="bq-secondary-button" data-lesson-previous ${busy || state.stepIndex === 0 ? 'disabled' : ''}>${t('previous')}</button>
          ${state.stepIndex < state.lesson.steps.length - 1 ? `<button type="button" class="bq-primary-button" data-lesson-next ${busy ? 'disabled' : ''}>${t(state.writable && state.progress?.status !== 'completed' ? 'next' : 'previewNext')}</button>` : state.writable && state.progress?.status !== 'completed' ? `<button type="button" class="bq-primary-button" data-lesson-complete ${busy ? 'disabled' : ''}>${t('complete')}</button>` : ''}</div></footer>`;
      };
      const click = event => {
        const target = event.target.closest?.('button');
        if (!target || target.disabled || disposed) return;
        if (target.hasAttribute('data-lesson-back')) { onBack(); return; }
        if (target.hasAttribute('data-lesson-reload')) { loadWhenReady(); return; }
        if (target.hasAttribute('data-lesson-response-retry')) {
          const action = runner.retryResponses?.();
          if (action) void Promise.resolve(action).catch(error => {
            const status = host.querySelector('[role="status"]');
            if (status) status.textContent = error?.message || String(error);
          });
          return;
        }
        const shareStep = target.hasAttribute('data-lesson-share') ? target.getAttribute('data-lesson-share') : null;
        if (shareStep) {
          const confirmation = page.querySelector('[data-lesson-share-confirm]');
          if (!confirmation?.checked) {
            const status = host.querySelector('[role="status"]');
            if (status) status.textContent = localization.t('shareConfirmRequired', { dictionaries: COPY });
            return;
          }
          const action = runner.shareResponse?.(shareStep, { confirmed: true });
          if (action) void Promise.resolve(action).then(() => { if (!disposed) host.querySelector('[data-lesson-heading]')?.focus(); })
            .catch(error => { const status = host.querySelector('[role="status"]'); if (status) status.textContent = error?.message || String(error); });
          return;
        }
        const unshareStep = target.hasAttribute('data-lesson-unshare') ? target.getAttribute('data-lesson-unshare') : null;
        if (unshareStep) {
          const action = runner.revokeResponseShare?.(unshareStep);
          if (action) void Promise.resolve(action).then(() => { if (!disposed) host.querySelector('[data-lesson-heading]')?.focus(); })
            .catch(error => { const status = host.querySelector('[role="status"]'); if (status) status.textContent = error?.message || String(error); });
          return;
        }
        if (target.hasAttribute('data-lesson-scripture')) {
          const state = runner.getState(), step = state.lesson?.steps[state.stepIndex];
          const ref = step?.scriptureRefs?.[Number(target.getAttribute('data-lesson-scripture'))];
          if (ref && onScripture) try { onScripture(ref, { routeKey: 'one-to-one-lesson', ...runner.getIdentity(), stepId: step.id }); } catch { const status = host.querySelector('[role="status"]'); if (status) status.textContent = localization.t('unavailable', { dictionaries: COPY }); }
          return;
        }
        const action = target.hasAttribute('data-lesson-complete') ? runner.complete()
          : target.hasAttribute('data-lesson-next') ? runner.move(1) : target.hasAttribute('data-lesson-previous') ? runner.move(-1) : null;
        if (action) void action.then(() => { if (!disposed) host.querySelector('[data-lesson-heading]')?.focus(); });
      };
      const input = event => {
        const target = event.target.closest?.('[data-lesson-response]');
        if (!target || disposed || typeof runner.updateResponse !== 'function') return;
        runner.updateResponse(target.value, target.getAttribute('data-lesson-response'));
      };
      page.addEventListener('click', click);
      page.addEventListener('input', input);
      const unsubscribe = runner.subscribe(render);
      const unsubscribeContext = subscribeContext(() => { if (disposed) return; runner.invalidate(); loadWhenReady(); });
      render(runner.getState()); loadWhenReady();
      return () => { disposed = true; unsubscribe(); unsubscribeContext(); page.removeEventListener('click', click); page.removeEventListener('input', input); runner.dispose(); };
    },
  };
}
