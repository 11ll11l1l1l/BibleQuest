import { localization } from '../../app/localization.js';
import { recordingsDictionaries } from '../../content/locales/recordings.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const normalizeSearch = value => String(value ?? '').trim().toLocaleLowerCase();

export function filterRecordingRows(rows, { query = '', featuredOnly = false } = {}) {
  const needle = normalizeSearch(query);
  return (Array.isArray(rows) ? rows : []).filter(row => {
    if (featuredOnly && !row?.featured) return false;
    if (!needle) return true;
    return normalizeSearch(`${row?.title || ''} ${row?.description || ''}`).includes(needle);
  });
}

// BibleQuest V4: Live Recordings and Media Library are now one Videos page.
// Iframe/player creation stays entirely inside the Audio owner (recordings.select
// -> audio.mount) - this file only asks for a video by id, it never touches
// document/iframe/postMessage itself. YouTube's own iframe controls are the
// only playback controls shown; the old custom play/pause/stop/seek buttons
// are removed since they duplicated what the player already provides.
// Curation (adding/correcting/hiding a video) is shown to everyone, but the real
// authorization is server-side RLS (private.bible_can_review_content:
// leader/pastor/admin congregation roles, or platform owner/admin) - this
// page never assumes the controls being visible mean a mutation will succeed.
function videoCard(row, isSelected, tr) {
  return `<button type="button" class="bq-video-card${isSelected ? ' is-selected' : ''}" data-video-select="${escapeHtml(row.id)}">
    ${row.featured ? `<span class="bq-status-badge bq-status-badge--info">${escapeHtml(tr('recordings.featured'))}</span>` : ''}
    <b>${escapeHtml(row.title)}</b>${row.description ? `<small>${escapeHtml(row.description)}</small>` : ''}
  </button>`;
}

function correctionControls(row, tr) {
  if (!row) return '';
  return `<section class="bq-recording-correction" data-video-correction>
    <p><small>${escapeHtml(tr('recordings.curator.correctionDescription'))}</small></p>
    <div class="bq-recording-actions">
      <button type="button" class="bq-secondary-button" data-video-feature-toggle="${escapeHtml(row.id)}" data-video-feature-next="${row.featured ? '0' : '1'}">${escapeHtml(tr(row.featured ? 'recordings.curator.removeLatest' : 'recordings.curator.markLatest'))}</button>
      <button type="button" class="bq-secondary-button" data-video-archive="${escapeHtml(row.id)}">${escapeHtml(tr('recordings.curator.archive'))}</button>
    </div>
  </section>`;
}

export function recordingsPage({ recordings, onHome, onAccount }) {
  const locale = localization.getLocale();
  const tr = (key, values) => localization.t(key, key.startsWith('recordings.')
    ? { locale, values, dictionaries: recordingsDictionaries }
    : { locale, values });
  return {
    title: tr('recordings.pageTitle'),
    html: `<section data-recordings-page><section class="bq-panel"><p>${escapeHtml(tr('recordings.loading'))}</p></section></section>`,
    mount(root) {
      const host = root.querySelector('[data-recordings-page]');
      let disposed = false;
      let curatorOpen = false;
      let correctionBusy = false;
      let searchQuery = '';
      let featuredOnly = false;

      const message = text => { const node = host.querySelector('[data-video-message]'); if (node) node.textContent = text || ''; };

      const curatorHtml = () => `<section class="bq-panel bq-video-curator">
        <button type="button" class="bq-secondary-button" data-video-curator-toggle aria-expanded="${curatorOpen}">${escapeHtml(tr(curatorOpen ? 'common.close' : 'recordings.curator.open'))}</button>
        <p><small>${escapeHtml(tr('recordings.curator.description'))}</small></p>
        ${curatorOpen ? `<form data-video-add-form>
          <label>${escapeHtml(tr('recordings.curator.title'))}<input type="text" name="title" maxlength="160" required></label>
          <label>${escapeHtml(tr('recordings.curator.youtubeLink'))}<input type="url" name="youtubeUrl" placeholder="https://www.youtube.com/watch?v=... or /live/..." required></label>
          <label>${escapeHtml(tr('recordings.curator.descriptionLabel'))}<textarea name="description" maxlength="2500" rows="2"></textarea></label>
          <label><input type="checkbox" name="featured"> ${escapeHtml(tr('recordings.curator.feature'))}</label>
          <button type="submit" class="bq-primary-button">${escapeHtml(tr('recordings.curator.submit'))}</button>
        </form>` : ''}
        <p class="bq-form-message" data-video-message role="status"></p>
      </section>`;

      const filteredRows = rows => filterRecordingRows(rows, { query: searchQuery, featuredOnly });
      const filterStatus = rows => tr('recordings.filter.results', { count: filteredRows(rows).length });
      const listHtml = (rows, selectedId) => {
        const visibleRows = filteredRows(rows);
        if (visibleRows.length) return visibleRows.map(row => videoCard(row, row.id === selectedId, tr)).join('');
        return `<section class="bq-panel bq-recordings-empty"><h2>${escapeHtml(tr('recordings.filter.empty.heading'))}</h2><p>${escapeHtml(tr('recordings.filter.empty.description'))}</p></section>`;
      };
      const filterHtml = rows => `<section class="bq-panel bq-recordings-filter" aria-labelledby="recordings-filter-heading">
        <h2 id="recordings-filter-heading">${escapeHtml(tr('recordings.filter.heading'))}</h2>
        <div class="bq-account-form">
          <label>${escapeHtml(tr('recordings.filter.searchLabel'))}<input type="search" maxlength="120" value="${escapeHtml(searchQuery)}" placeholder="${escapeHtml(tr('recordings.filter.searchPlaceholder'))}" data-recordings-search></label>
          <label>${escapeHtml(tr('recordings.filter.scopeLabel'))}<select data-recordings-feature-filter><option value="all"${featuredOnly ? '' : ' selected'}>${escapeHtml(tr('recordings.filter.all'))}</option><option value="featured"${featuredOnly ? ' selected' : ''}>${escapeHtml(tr('recordings.filter.featured'))}</option></select></label>
        </div>
        <p data-recordings-filter-status role="status" aria-live="polite">${escapeHtml(filterStatus(rows))}</p>
      </section>`;

      const refreshFilteredList = state => {
        const list = host.querySelector('[data-recordings-list]');
        if (list) list.innerHTML = listHtml(state.rows || [], state.selectedId);
        const status = host.querySelector('[data-recordings-filter-status]');
        if (status) status.textContent = filterStatus(state.rows || []);
      };

      const render = state => {
        if (disposed) return;
        if (state.status === 'locked') {
          host.innerHTML = `<section class="bq-panel bq-recordings-head"><p class="bq-eyebrow">${escapeHtml(tr('recordings.eyebrow'))}</p><h1>${escapeHtml(tr('recordings.locked.heading'))}</h1><p>${escapeHtml(tr('recordings.locked.description'))}</p><div class="bq-recording-actions"><button type="button" class="bq-primary-button" data-recordings-account>${escapeHtml(tr('recordings.locked.signIn'))}</button><button type="button" class="bq-secondary-button" data-recordings-home>${escapeHtml(tr('recordings.backHome'))}</button></div></section>`;
          return;
        }
        if (state.status === 'error') {
          host.innerHTML = `<section class="bq-panel bq-recordings-head" role="alert"><p class="bq-eyebrow">${escapeHtml(tr('recordings.eyebrow'))}</p><h1>${escapeHtml(tr('recordings.error.heading'))}</h1><p>${escapeHtml(state.error)}</p><div class="bq-recording-actions"><button type="button" class="bq-primary-button" data-recordings-retry>${escapeHtml(tr('common.retry'))}</button><button type="button" class="bq-secondary-button" data-recordings-home>${escapeHtml(tr('recordings.backHome'))}</button></div></section>`;
          return;
        }
        if (state.status === 'loading') {
          host.innerHTML = `<section class="bq-panel bq-recordings-head" role="status"><p class="bq-eyebrow">${escapeHtml(tr('recordings.eyebrow'))}</p><h1>${escapeHtml(tr('recordings.loading'))}</h1><p>${escapeHtml(tr('recordings.loading.description'))}</p></section>`;
          return;
        }
        const rows = state.rows || [];
        const selectedRow = rows.find(item => item.id === state.selectedId);
        host.innerHTML = `<section class="bq-panel bq-recordings-head"><p class="bq-eyebrow">${escapeHtml(tr('recordings.eyebrow'))}</p><h1>${escapeHtml(tr('recordings.heading'))}</h1><p>${escapeHtml(tr('recordings.description'))}</p></section>
        ${curatorHtml()}
        ${rows.length ? filterHtml(rows) : ''}
        <section class="bq-recordings-layout">
          <div class="bq-recordings-list" data-recordings-list>${rows.length ? listHtml(rows, state.selectedId) : `<section class="bq-panel bq-recordings-empty"><h2>${escapeHtml(tr('recordings.empty.heading'))}</h2><p>${escapeHtml(tr('recordings.empty.description'))}</p></section>`}</div>
          <section class="bq-panel bq-recording-player-shell">
            <div data-recording-now>${selectedRow ? `<p class="bq-eyebrow">${escapeHtml(tr('recordings.nowPlaying.eyebrow'))}</p><h2>${escapeHtml(selectedRow.title || tr('recordings.videoFallback'))}</h2>${selectedRow.description ? `<p>${escapeHtml(selectedRow.description)}</p>` : ''}${correctionControls(selectedRow, tr)}` : `<p class="bq-eyebrow">${escapeHtml(tr('recordings.nowPlaying.eyebrow'))}</p><h2>${escapeHtml(tr('recordings.nowPlaying.choose'))}</h2><p>${escapeHtml(tr('recordings.nowPlaying.chooseDescription'))}</p>`}</div>
            <div class="bq-recording-frame" data-recording-frame></div>
          </section>
        </section>
        <div class="bq-recording-actions"><button type="button" class="bq-secondary-button" data-recordings-home>${escapeHtml(tr('recordings.backHome'))}</button></div>`;
      };

      const load = async () => { render({ status: 'loading', rows: [] }); const state = await recordings.load(); render(state); };

      const runCorrection = async operation => {
        if (correctionBusy) return;
        correctionBusy = true;
        try {
          const success = await operation();
          render(recordings.getState());
          message(success);
        } catch {
          message(tr('recordings.correctError'));
        } finally {
          correctionBusy = false;
        }
      };

      const onClick = async event => {
        const target = event.target instanceof Element ? event.target : null; if (!target) return;
        if (target.closest('[data-recordings-home]')) { recordings.leave(); onHome(); return; }
        if (target.closest('[data-recordings-account]')) { recordings.leave(); onAccount(); return; }
        if (target.closest('[data-recordings-retry]')) { await load(); return; }
        if (target.closest('[data-video-curator-toggle]')) { curatorOpen = !curatorOpen; render(recordings.getState()); return; }
        const featureToggle = target.closest('[data-video-feature-toggle]');
        if (featureToggle) {
          const id = featureToggle.dataset.videoFeatureToggle;
          const featured = featureToggle.dataset.videoFeatureNext === '1';
          await runCorrection(async () => { await recordings.setFeatured(id, featured); return tr('recordings.corrected'); });
          return;
        }
        const archiveButton = target.closest('[data-video-archive]');
        if (archiveButton) {
          const id = archiveButton.dataset.videoArchive;
          await runCorrection(async () => { await recordings.archive(id); return tr('recordings.archived'); });
          return;
        }
        const select = target.closest('[data-video-select]');
        if (select) {
          try {
            const frameHost = host.querySelector('[data-recording-frame]');
            recordings.select(select.dataset.videoSelect, frameHost);
            const state = recordings.getState(), row = state.rows.find(item => item.id === state.selectedId);
            host.querySelector('[data-recording-now]').innerHTML = `<p class="bq-eyebrow">${escapeHtml(tr('recordings.nowPlaying.eyebrow'))}</p><h2>${escapeHtml(row?.title || tr('recordings.videoFallback'))}</h2>${row?.description ? `<p>${escapeHtml(row.description)}</p>` : ''}${correctionControls(row, tr)}`;
            for (const card of host.querySelectorAll('[data-video-select]')) card.classList.toggle('is-selected', card.dataset.videoSelect === select.dataset.videoSelect);
          } catch (error) { message(error?.message || tr('recordings.openError')); }
          return;
        }
      };

      const onSubmit = async event => {
        const form = event.target.closest?.('[data-video-add-form]');
        if (!form) return;
        event.preventDefault();
        const data = new FormData(form);
        try {
          await recordings.addVideo({
            title: data.get('title'),
            youtubeUrl: data.get('youtubeUrl'),
            description: data.get('description'),
            featured: data.get('featured') === 'on'
          });
          curatorOpen = false;
          render(recordings.getState());
          message(tr('recordings.added'));
        } catch (error) {
          const raw = String(error?.message || '');
          const isOwnValidation = /title|YouTube|congregation|Sign in/i.test(raw) && !/policy|violates|relation|column|syntax/i.test(raw);
          message(isOwnValidation ? raw : tr('recordings.addError'));
        }
      };

      const onFilter = event => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        if (target.matches('[data-recordings-search]')) searchQuery = target.value;
        else if (target.matches('[data-recordings-feature-filter]')) featuredOnly = target.value === 'featured';
        else return;
        refreshFilteredList(recordings.getState());
      };

      host.addEventListener('click', onClick);
      host.addEventListener('submit', onSubmit);
      host.addEventListener('input', onFilter);
      host.addEventListener('change', onFilter);
      load().catch(error => render({ status: 'error', rows: [], error: error?.message || tr('recordings.loadError') }));
      return () => { disposed = true; host.removeEventListener('click', onClick); host.removeEventListener('submit', onSubmit); host.removeEventListener('input', onFilter); host.removeEventListener('change', onFilter); recordings.leave(); };
    }
  };
}
