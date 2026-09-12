const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

// BibleQuest V4: Live Recordings and Media Library are now one Videos page.
// Iframe/player creation stays entirely inside the Audio owner (recordings.select
// -> audio.mount) - this file only asks for a video by id, it never touches
// document/iframe/postMessage itself. YouTube's own iframe controls are the
// only playback controls shown; the old custom play/pause/stop/seek buttons
// are removed since they duplicated what the player already provides.
// Curation (adding a new video) is shown to everyone, but the real
// authorization is server-side RLS (private.bible_can_review_content:
// leader/pastor/admin congregation roles, or platform owner/admin) - this
// page never assumes the form being visible means the insert will succeed.
function videoCard(row, isSelected) {
  return `<button type="button" class="bq-video-card${isSelected ? ' is-selected' : ''}" data-video-select="${escapeHtml(row.id)}">
    ${row.featured ? '<span class="bq-status-badge bq-status-badge--info">Featured</span>' : ''}
    <b>${escapeHtml(row.title)}</b>${row.description ? `<small>${escapeHtml(row.description)}</small>` : ''}
  </button>`;
}

export function recordingsPage({ recordings, onHome, onAccount }) {
  return {
    title: 'Videos',
    html: '<section data-recordings-page><section class="bq-panel"><p>Loading videos…</p></section></section>',
    mount(root) {
      const host = root.querySelector('[data-recordings-page]');
      let disposed = false;
      let curatorOpen = false;

      const message = text => { const node = host.querySelector('[data-video-message]'); if (node) node.textContent = text || ''; };

      const curatorHtml = () => `<section class="bq-panel bq-video-curator">
        <button type="button" class="bq-secondary-button" data-video-curator-toggle aria-expanded="${curatorOpen}">${curatorOpen ? 'Close' : 'Add a video'}</button>
        <p><small>Leaders, pastors, and admins can add a video here. Anyone else who tries will get a clear message instead of a silent failure - this button being visible is not itself the permission check.</small></p>
        ${curatorOpen ? `<form data-video-add-form>
          <label>Title<input type="text" name="title" maxlength="160" required></label>
          <label>YouTube link<input type="url" name="youtubeUrl" placeholder="https://www.youtube.com/watch?v=... or /live/..." required></label>
          <label>Description (optional)<textarea name="description" maxlength="2500" rows="2"></textarea></label>
          <label><input type="checkbox" name="featured"> Feature this video at the top</label>
          <button type="submit" class="bq-primary-button">Add video</button>
        </form>` : ''}
        <p class="bq-form-message" data-video-message role="status"></p>
      </section>`;

      const render = state => {
        if (disposed) return;
        if (state.status === 'locked') {
          host.innerHTML = '<section class="bq-panel bq-recordings-head"><p class="bq-eyebrow">VIDEOS</p><h1>Sign in to view congregation videos</h1><p>Videos are account-backed content. Guest mode does not contact the cloud.</p><div class="bq-recording-actions"><button type="button" class="bq-primary-button" data-recordings-account>Sign in</button><button type="button" class="bq-secondary-button" data-recordings-home>Back home</button></div></section>';
          return;
        }
        if (state.status === 'error') {
          host.innerHTML = `<section class="bq-panel bq-recordings-head" role="alert"><p class="bq-eyebrow">VIDEOS</p><h1>Videos could not load</h1><p>${escapeHtml(state.error)}</p><div class="bq-recording-actions"><button type="button" class="bq-primary-button" data-recordings-retry>Try again</button><button type="button" class="bq-secondary-button" data-recordings-home>Back home</button></div></section>`;
          return;
        }
        if (state.status === 'loading') {
          host.innerHTML = '<section class="bq-panel bq-recordings-head" role="status"><p class="bq-eyebrow">VIDEOS</p><h1>Loading videos…</h1><p>This request is bounded so a failed connection cannot leave BibleQuest frozen.</p></section>';
          return;
        }
        const rows = state.rows || [];
        host.innerHTML = `<section class="bq-panel bq-recordings-head"><p class="bq-eyebrow">VIDEOS</p><h1>Worship and Bible study videos</h1><p>Choose a video below. Playback uses YouTube's own controls - there is no separate play/pause/seek panel to learn.</p></section>
        ${curatorHtml()}
        <section class="bq-recordings-layout">
          <div class="bq-recordings-list" data-recordings-list>${rows.length ? rows.map(row => videoCard(row, row.id === state.selectedId)).join('') : '<section class="bq-panel bq-recordings-empty"><h2>No videos yet</h2><p>No published videos are currently available to this congregation.</p></section>'}</div>
          <section class="bq-panel bq-recording-player-shell">
            <div data-recording-now><p class="bq-eyebrow">NOW PLAYING</p><h2>Choose a video</h2><p>Tap any video on the left to start it here.</p></div>
            <div class="bq-recording-frame" data-recording-frame></div>
          </section>
        </section>
        <div class="bq-recording-actions"><button type="button" class="bq-secondary-button" data-recordings-home>Back home</button></div>`;
      };

      const load = async () => { render({ status: 'loading', rows: [] }); const state = await recordings.load(); render(state); };

      const onClick = async event => {
        const target = event.target instanceof Element ? event.target : null; if (!target) return;
        if (target.closest('[data-recordings-home]')) { recordings.leave(); onHome(); return; }
        if (target.closest('[data-recordings-account]')) { recordings.leave(); onAccount(); return; }
        if (target.closest('[data-recordings-retry]')) { await load(); return; }
        if (target.closest('[data-video-curator-toggle]')) { curatorOpen = !curatorOpen; render(recordings.getState()); return; }
        const select = target.closest('[data-video-select]');
        if (select) {
          try {
            const frameHost = host.querySelector('[data-recording-frame]');
            recordings.select(select.dataset.videoSelect, frameHost);
            const state = recordings.getState(), row = state.rows.find(item => item.id === state.selectedId);
            host.querySelector('[data-recording-now]').innerHTML = `<p class="bq-eyebrow">NOW PLAYING</p><h2>${escapeHtml(row?.title || 'Video')}</h2>${row?.description ? `<p>${escapeHtml(row.description)}</p>` : ''}`;
            for (const card of host.querySelectorAll('[data-video-select]')) card.classList.toggle('is-selected', card.dataset.videoSelect === select.dataset.videoSelect);
          } catch (error) { message(error?.message || 'Could not open that video.'); }
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
          message('Video added.');
        } catch (error) {
          // Raw database/RLS error text (e.g. "new row violates row-level
          // security policy...") must never reach the user directly - only
          // this feature's own validation messages (title/link/congregation
          // checks in recordings.addVideo) are shown as-is.
          const raw = String(error?.message || '');
          const isOwnValidation = /title|YouTube|congregation|Sign in/i.test(raw) && !/policy|violates|relation|column|syntax/i.test(raw);
          message(isOwnValidation ? raw : 'Could not add that video. Only leaders, pastors, and admins can add videos.');
        }
      };

      host.addEventListener('click', onClick);
      host.addEventListener('submit', onSubmit);
      load().catch(error => render({ status: 'error', rows: [], error: error?.message || 'Could not load videos.' }));
      return () => { disposed = true; host.removeEventListener('click', onClick); host.removeEventListener('submit', onSubmit); recordings.leave(); };
    }
  };
}
