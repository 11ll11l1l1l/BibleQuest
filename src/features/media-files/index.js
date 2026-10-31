import {localization} from '../../app/localization.js';
import {prepareMediaUpload} from './prepare-upload.js';
import {mediaCopy} from './copy.js';
import './media-files.css';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function mediaFilesPage({api, session, congregation, subscribeContext = () => () => {}, onBack, onAccount, onCongregation}) {
  const locale = localization.getLocale();
  const t = mediaCopy[locale] || mediaCopy.en;
  return {title: t.title, html: '<main class="bq-panel bq-media-files" data-media-files></main>', mount(root) {
    const view = root.querySelector('[data-media-files]');
    let disposed = false, generation = 0, busy = false, rows = [], canReview = false, quota = null, message = '', cursor = null;
    let chosen = null, prepared = null, uploadKey = '', controller = new AbortController();
    const context = () => {
      const state = session.getState();
      const active = congregation.getActive();
      return state.authenticated && state.user?.id && active?.congregationId && (!active.userId || active.userId === state.user.id)
        ? {userId: state.user.id, congregationId: active.congregationId} : null;
    };
    const signature = () => { const c = context(); return c ? `${c.userId}:${c.congregationId}` : ''; };
    const button = (action, label, id = '', disabled = false) => `<button type="button" class="bq-secondary-button" data-action="${action}" data-id="${esc(id)}" ${busy || disabled ? 'disabled' : ''}>${esc(label)}</button>`;
    function render() {
      if (disposed) return;
      const c = context();
      const ready = Boolean(c);
      view.innerHTML = `<header><h1>${esc(t.title)}</h1>${button('back', t.back)}</header>${!mediaCopy[locale] ? `<p lang="en">${esc(t.fallback)}</p>` : ''}
        <p role="status" aria-live="polite">${esc(busy ? t.working : message)}</p>
        ${!ready ? `<p>${esc(t.choose)}</p>${button('account', t.account)}${button('congregation', t.select)}` : `
        <p>${esc(t.note)}</p>${quota && !quota.enabled ? `<p>${esc(t.disabled)}</p>` : ''}${quota?.capacityBytes && (quota.usedBytes + quota.reservedBytes) / quota.capacityBytes >= 0.7 ? `<p>${esc(t.near)}</p>` : ''}
        <form data-upload><label>${esc(t.file)}<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" data-file ${busy ? 'disabled' : ''}></label>${chosen ? `<p>${esc(chosen.name)}</p>` : ''}<button class="bq-primary-button" type="submit" ${busy || !chosen || !quota?.enabled ? 'disabled' : ''}>${esc(t.upload)}</button></form>
        ${button('refresh', t.refresh)}<h2>${esc(t.recent)}</h2><ul>${rows.map(row => `<li><h3>${esc(row.name)}</h3><p>${esc(t[row.state] || row.state)} · ${(row.byteSize / 1024).toFixed(0)} KiB</p>
          ${!['removed','uploading','upload_failed'].includes(row.state) ? button('download', t.download, row.id) : ''}
          ${canReview && row.state === 'pending_review' ? `<form data-review="${esc(row.id)}"><label>${esc(t.reason)}<textarea name="reason" maxlength="2000" required ${busy ? 'disabled' : ''}></textarea></label>${!row.own ? `<label><input type="checkbox" name="rights" ${row.rightsVerified ? 'checked' : ''} ${busy ? 'disabled' : ''}>${esc(t.rights)}</label><label><input type="checkbox" name="safety" ${row.safetyVerified ? 'checked' : ''} ${busy ? 'disabled' : ''}>${esc(t.safety)}</label>${button('attest',t.attest,row.id)}` : `<p>${esc(t.noReview)}</p>`}${button('approve',t.approve,row.id,!row.rightsVerified || !row.safetyVerified)}${button('request_changes',t.request_changes,row.id)}${button('reject',t.reject,row.id)}</form>` : ''}
          ${canReview && row.state === 'published' ? `<form data-review="${esc(row.id)}"><label>${esc(t.reason)}<textarea name="reason" maxlength="2000" required></textarea></label>${button('remove',t.remove,row.id)}</form>` : ''}
          ${canReview && ['uploading','upload_failed'].includes(row.state) ? button('reconcile',t.recover,row.id) : ''}${canReview && row.state === 'removed' ? button('cleanup_removed',t.cleanup,row.id) : ''}
          ${row.own && ['changes_requested','rejected'].includes(row.state) ? button('resubmit',t.resubmit,row.id) : ''}</li>`).join('')}</ul>${!rows.length && !busy ? `<p>${esc(t.empty)}</p>` : ''}${cursor ? button('more',t.more) : ''}`}`;
    }
    const explain = error => {
      const code = String(error?.message || '');
      if (/FILE_SIZE|FILE_TYPE|PREPARATION/.test(code)) return t.fileError;
      if (/REVISION|CONFLICT/.test(code)) return t.conflict;
      if (/RECONCILIATION|IN_PROGRESS/.test(code)) return t.recovery;
      if (/DISABLED|QUOTA/.test(code)) return t.disabled;
      if (/CONFIG|METADATA|not found|Failed to send/.test(code)) return t.unavailable;
      return t.error;
    };
    async function run(operation) {
      if (busy || disposed || !context()) return;
      if (navigator.onLine === false) {message = t.offline; render(); return;}
      const mine = ++generation, identity = signature();
      busy = true; message = ''; render();
      try { await operation(() => !disposed && mine === generation && identity === signature()); }
      catch (error) {if (!disposed && mine === generation && identity === signature()) message = explain(error);}
      finally {if (!disposed && mine === generation && identity === signature()) {busy = false; render();}}
    }
    async function list(current, append = false) {
      const result = await api.centralMedia.request({action:'list', congregationId: context().congregationId, ...(append && cursor ? {cursor} : {})}, controller.signal);
      if (!current()) return;
      rows = append ? [...rows, ...result.assets.filter(row => !rows.some(old => old.id === row.id))] : result.assets;
      canReview = result.canReview === true; quota = result.quota; cursor = result.cursor || null;
    }
    async function onClick(event) {
      const target = event.target.closest('[data-action]');
      if (!target || !view.contains(target)) return;
      const action = target.dataset.action;
      if (action === 'back') return onBack?.();
      if (action === 'account') return onAccount?.();
      if (action === 'congregation') return onCongregation?.();
      if (action === 'refresh' || action === 'more') return run(current => list(current, action === 'more'));
      const row = rows.find(item => item.id === target.dataset.id);
      if (!row) return;
      // Capture review input before run() redraws and disables the form.
      const form = target.closest('form');
      const fd = form ? new FormData(form) : null;
      if (['attest','reject','request_changes','remove'].includes(action) && !form?.reportValidity()) return;
      await run(async current => {
        const payload = {congregationId: context().congregationId, assetId: row.id, expectedRevision: row.revision};
        if (action === 'download') {
          const blob = await api.centralMedia.request({...payload, action:'download'}, controller.signal);
          if (!current()) return;
          if (!(blob instanceof Blob)) throw new Error('MEDIA_DOWNLOAD_FAILED');
          const url = URL.createObjectURL(blob), link = document.createElement('a');
          link.href = url; link.download = row.name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
          return;
        }
        await api.centralMedia.request({...payload, action: ['attest','reconcile','cleanup_removed'].includes(action) ? action : 'moderate', decision: action, reason: String(fd?.get('reason') || ''), rightsVerified: fd?.get('rights') === 'on', safetyVerified: fd?.get('safety') === 'on'}, controller.signal);
        if (!current()) return;
        message = t.done; await list(current);
      });
    }
    async function onSubmit(event) {
      if (!event.target.matches('[data-upload]')) {event.preventDefault(); return;}
      event.preventDefault();
      if (!chosen) return;
      await run(async current => {
        prepared ||= await prepareMediaUpload(chosen);
        if (!current()) return;
        const data = new FormData();
        data.set('action','upload'); data.set('congregationId',context().congregationId); data.set('idempotencyKey',uploadKey); data.set('file',prepared);
        await api.centralMedia.request(data, controller.signal);
        if (!current()) return;
        chosen = null; prepared = null; uploadKey = ''; message = t.done; await list(current);
      });
    }
    const onChange = event => {if (event.target.matches('[data-file]')) {chosen = event.target.files?.[0] || null; prepared = null; uploadKey = crypto.randomUUID(); render();}};
    view.addEventListener('click', onClick); view.addEventListener('submit', onSubmit); view.addEventListener('change', onChange);
    const unsubscribe = subscribeContext(() => {
      generation++; controller.abort(); controller = new AbortController(); busy = false;
      rows = []; quota = null; cursor = null; canReview = false; chosen = null; prepared = null; uploadKey = ''; message = '';
      render(); if (context()) void run(current => list(current));
    });
    render(); if (context()) void run(current => list(current));
    return () => {disposed = true; generation++; controller.abort(); unsubscribe(); view.removeEventListener('click',onClick); view.removeEventListener('submit',onSubmit); view.removeEventListener('change',onChange); chosen = null; prepared = null;};
  }};
}
