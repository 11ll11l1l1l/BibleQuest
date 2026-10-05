import { localization } from '../../app/localization.js';
import { createPairingController } from './controller.js';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const t = key => escape(localization.t(`v7.pairing.${key}`));
export function renderPairing(state) {
  const busy = ['loading','saving'].includes(state.status), disabled = busy ? ' disabled' : '';
  const pair = state.pair;
  let body = '';
  if (pair) {
    const accepted = state.actorId === pair.mentorId ? pair.mentorAcceptedAt : pair.menteeAcceptedAt;
    body = `<h2>${t(pair.state)}</h2>`;
    if (pair.state === 'invited') body += `${accepted ? `<p>${t('waiting')}</p>` : `<button type="button" data-pair-action="accept"${disabled}>${t('accept')}</button>`}<button type="button" data-pair-action="decline"${disabled}>${t('decline')}</button>`;
    if (pair.state === 'active') body += `<button type="button" data-pair-action="lessons"${disabled}>${t('lessons')}</button>`;
    if (['active','suspended'].includes(pair.state)) body += `<label><input type="checkbox" data-pair-end-confirm${disabled}> ${t('confirm')}</label><button type="button" data-pair-action="end"${disabled}>${t('end')}</button>`;
  } else if (['ready','error'].includes(state.status) && state.candidates?.length) {
    body = state.candidates.length ? `<form data-pair-invite><label>${t('member')} <select name="otherUserId" required><option value="">${t('choose')}</option>${state.candidates.map(row => `<option value="${escape(row.userId)}"${state.invitationDraft?.otherUserId === row.userId ? ' selected' : ''}>${escape(row.displayName || localization.t('v7.pairing.member'))}</option>`).join('')}</select></label><label>${t('role')} <select name="role"><option value="mentor"${state.invitationDraft?.role !== 'mentee' ? ' selected' : ''}>${t('mentor')}</option><option value="mentee"${state.invitationDraft?.role === 'mentee' ? ' selected' : ''}>${t('mentee')}</option></select></label><button type="submit">${t('send')}</button></form>` : `<p>${t('empty')}</p>`;
  } else if (state.status === 'ready') {
    body = `<p>${t('empty')}</p>`;
  }
  return `<section class="bq-panel" aria-busy="${busy}"><h1>${t('title')}</h1><p>${t('intro')}</p><p role="status" aria-live="polite">${state.error ? escape(localization.t(state.error)) : busy ? t(state.status) : state.status === 'idle' ? t('changed') : ''}</p><fieldset${disabled}>${body}</fieldset><button type="button" data-pair-action="reload"${disabled}>${t('reload')}</button></section>`;
}
export function pairingPage({ service, session, pairId, isContextReady = () => false, subscribeContext, onBack, onAccount, onCongregation, onLessons }) {
  const controller = createPairingController({ service, pairId, getActorId: () => session.getState()?.user?.id || '' });
  return { title: localization.t('v7.pairing.title'), html: `<main data-pairing></main><nav><button type="button" data-pair-nav="back">${t('back')}</button><button type="button" data-pair-nav="account">${t('account')}</button><button type="button" data-pair-nav="congregation">${t('congregation')}</button></nav>`, mount(root) {
    const host = root.querySelector('[data-pairing]');
    const render = state => { host.innerHTML = renderPairing(state); };
    const click = event => {
      const button = event.target.closest?.('button'); if (!button || button.disabled) return;
      const action = button.getAttribute('data-pair-action'), nav = button.getAttribute('data-pair-nav');
      if (action === 'reload') void controller.load();
      if (['accept','decline','end'].includes(action)) void controller.act(action, { confirmed: root.querySelector('[data-pair-end-confirm]')?.checked === true });
      if (action === 'lessons' && controller.getState().pair?.state === 'active') onLessons(controller.getState().pair.id);
      if (nav === 'back') onBack(); if (nav === 'account') onAccount(); if (nav === 'congregation') onCongregation();
    };
    const submit = event => {
      const form = event.target.closest?.('[data-pair-invite]'); if (!form) return; event.preventDefault();
      void controller.invite({ otherUserId: form.elements.namedItem('otherUserId').value, role: form.elements.namedItem('role').value });
    };
    root.addEventListener('click',click); root.addEventListener('submit',submit);
    const unsubscribe = controller.subscribe(render), contextCleanup = subscribeContext(() => { controller.invalidate(); if (isContextReady()) void controller.load(); });
    render(controller.getState()); void controller.load();
    return () => { unsubscribe(); contextCleanup(); root.removeEventListener('click',click); root.removeEventListener('submit',submit); controller.dispose(); };
  }};
}
