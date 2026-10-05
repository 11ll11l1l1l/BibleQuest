import { curriculumAuthoringPage } from './index.js';

function requestKey(readiness) {
  const request = readiness?.ready === true ? readiness.request : null;
  if (!request) return '';
  return [
    request.trackId,
    request.moduleId,
    request.lessonId,
    request.lessonRevisionId,
    request.expectedTrackRevisionId,
    request.expectedModuleRevisionId,
    request.expectedLessonRevisionId,
    ...(Array.isArray(request.libraryRevisionIds) ? request.libraryRevisionIds : []),
  ].map(value => String(value ?? '')).join('|');
}

// Feature-local composition only. The global router/session/congregation owner decides
// where this page is mounted and whether the publication handoff receives a real backend
// authority. Without that authority the embedded handoff remains preparation-only.
export function curriculumAuthoringPublicationPage({
  controller,
  publicationHandoff,
  subscribeContext = () => () => {},
  onBack = () => {},
  onAccount = () => {},
  onCongregation = () => {},
} = {}) {
  if (!controller?.getState || !controller?.subscribe || !controller?.load) {
    throw new TypeError('Curriculum authoring publication page requires the feature-local controller.');
  }
  if (!publicationHandoff?.render || !publicationHandoff?.prepare) {
    throw new TypeError('Curriculum authoring publication page requires the feature-local publication handoff.');
  }
  if (publicationHandoff.publish !== undefined && typeof publicationHandoff.publish !== 'function') {
    throw new TypeError('Publication handoff publish authority must be a function when supplied.');
  }

  const base = curriculumAuthoringPage({ controller, subscribeContext, onBack, onAccount, onCongregation });
  return Object.freeze({
    title: base.title,
    html: base.html.replace('</main>', '</main><section data-authoring-publication></section>'),
    mount(root) {
      const host = root.querySelector('[data-authoring-publication]');
      if (!host) throw new TypeError('Curriculum authoring publication page requires its publication host.');

      let disposed = false;
      let identity = requestKey(controller.getState().readiness);
      const renderPublication = state => {
        if (!disposed) host.innerHTML = publicationHandoff.render(state?.status === 'ready' ? state.readiness : null);
      };
      const sync = state => {
        const nextIdentity = requestKey(state?.readiness);
        if (nextIdentity !== identity) {
          identity = nextIdentity;
          publicationHandoff.reset?.();
        }
        renderPublication(state);
      };
      const runPublication = async method => {
        const action = publicationHandoff?.[method];
        if (typeof action !== 'function' || disposed || controller.getState().status !== 'ready') return;
        let pending;
        try {
          pending = action.call(publicationHandoff);
          renderPublication(controller.getState());
          await pending;
        } catch {
          // The handoff retains only a bounded localized error state; backend details stay hidden.
        } finally {
          renderPublication(controller.getState());
        }
      };
      const click = event => {
        const button = event.target?.closest?.('button[data-publication-handoff-action]');
        if (!button || button.disabled) return;
        const action = button.getAttribute('data-publication-handoff-action');
        if (action === 'prepare') void runPublication('prepare');
        if (action === 'publish') void runPublication('publish');
      };

      const unsubscribe = controller.subscribe(sync);
      root.addEventListener('click', click);
      renderPublication(controller.getState());
      const cleanupBase = base.mount(root);

      return () => {
        disposed = true;
        unsubscribe();
        root.removeEventListener('click', click);
        publicationHandoff.dispose?.();
        cleanupBase();
      };
    },
  });
}
