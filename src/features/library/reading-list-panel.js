import {readingListCopy} from './reading-list.js';
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountReadingListPanel({host, readingList, locale, navigate}) {
  if (!host) return {refresh() {}, focus() {return false;}, dispose() {}};
  const copy = readingListCopy(locale);
  let owner = readingList.owner(), disposed = false;
  function refresh(message = '') {
    if (disposed) return;
    owner = readingList.owner();
    try {
      const rows = readingList.list(owner);
      host.innerHTML = `<p>${esc(copy.note)}</p><p role="status">${esc(message)}</p>${rows.length ? `<ul>${rows.map(row => `<li><button type="button" class="bq-secondary-button" data-reading-list-action="open" data-id="${esc(row.id)}">${esc(row.title)}</button><button type="button" class="bq-secondary-button" data-reading-list-action="remove" data-id="${esc(row.id)}" aria-label="${esc(copy.remove)} · ${esc(row.title)}">${esc(copy.remove)}</button></li>`).join('')}</ul>` : `<p>${esc(copy.empty)}</p>`}<button type="button" class="bq-secondary-button" data-reading-list-action="refresh">${esc(copy.refresh)}</button>`;
    } catch { host.innerHTML = `<p role="status">${esc(copy.error)}</p><button type="button" class="bq-secondary-button" data-reading-list-action="refresh">${esc(copy.retry)}</button>`; }
  }
  function click(event) {
    const button = event.target.closest?.('[data-reading-list-action]');
    if (disposed || !button || !host.contains(button)) return;
    if (owner !== readingList.owner()) { refresh(); return; }
    try {
      const row = readingList.list(owner).find(item => item.id === button.dataset.id);
      if (button.dataset.readingListAction === 'open' && row) navigate({routeKey:'library-item',resourceId:row.id});
      else if (button.dataset.readingListAction === 'remove' && row) { readingList.remove(row.id, owner); refresh(copy.removed); }
      else if (button.dataset.readingListAction === 'refresh') refresh();
    } catch { refresh(copy.error); }
  }
  host.addEventListener('click', click); refresh();
  return {refresh: () => refresh(), focus(id) { const node = Array.from(host.querySelectorAll?.('[data-reading-list-action="open"]') || []).find(button => button.dataset.id === id); if (!node) return false; const details = host.closest?.('details'); if (details) details.open = true; node.focus?.({preventScroll:true}); return true; }, dispose() {disposed = true; host.removeEventListener('click', click);}};
}
