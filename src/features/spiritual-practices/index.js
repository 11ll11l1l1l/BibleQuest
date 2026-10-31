import { PRACTICES, getPractice } from './content.js';
import { advance, createSession, validSession } from './timer.js';
import './practice.css';
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const clock = ms => { const seconds = Math.ceil(ms / 1000); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; };
export function spiritualPracticesPage({ storage, getOwner, subscribeOwner, onLibrary, onReader, passages = null }) {
  return {
    title: 'Spiritual Practices',
    html: '<main class="bq-panel bq-practice" lang="en" data-practice></main>',
    mount(root) {
      const host = root.querySelector('[data-practice]');
      let owner = getOwner(), current = null, history = [], message = '', alive = true, passageOperation = 0;
      const key = () => `spiritual-practices.v1.${owner}`;
      function load() {
        const saved = storage.read(key(), null);
        current = validSession(saved?.current) ? saved.current : null;
        history = Array.isArray(saved?.history) ? saved.history.filter(row => validSession(row?.session) && ['completed', 'ended'].includes(row.session.state) && typeof row.reflection === 'string' && row.reflection.length <= 6000).slice(0, 50) : [];
        message = saved?.current && !current ? 'The saved timer could not be restored. Your saved reflections have been kept.' : '';
      }
      function save() {
        if (getOwner() !== owner) return false;
        try { storage.write(key(), { current, history }); return true; }
        catch { message = 'Device storage is unavailable. This session and reflection may be lost when you leave.'; return false; }
      }
      function sync() {
        if (getOwner() !== owner) { owner = getOwner(); load(); return; }
        if (!current) return;
        const before = `${current.stage}:${current.state}`;
        current = advance(current);
        if (before !== `${current.stage}:${current.state}`) save();
      }
      const button = (action, text) => `<button type="button" class="bq-secondary-button" data-practice-action="${action}">${text}</button>`;
      async function renderPassage() {
        const id = ++passageOperation, expectedOwner = owner;
        const ref = current?.passage || (!current ? passages?.selection() : null);
        const node = host.querySelector('[data-practice-scripture]');
        if (!node || !ref || !passages) return;
        node.textContent = 'Loading selected Scripture…';
        try {
          const result = await passages.resolve(ref);
          if (!alive || id !== passageOperation || expectedOwner !== getOwner() || !node.isConnected) return;
          node.textContent = `${result.reference} · ${result.translation}\n${result.text}\n${result.attribution}`;
        } catch (error) {
          if (alive && id === passageOperation && expectedOwner === getOwner() && node.isConnected) node.textContent = error?.message || 'Passage unavailable. Open the Bible Reader and retry.';
        }
      }
      function render() {
        if (!alive) return;
        sync();
        const practice = current && getPractice(current.templateId);
        const running = current && ['running', 'paused'].includes(current.state);
        host.innerHTML = `<header><p class="bq-eyebrow">PRIVATE · THIS DEVICE</p><h1>Spiritual Practices</h1><p>Make space for God, reflection and a loving response.</p><p>Guides are currently in English. No cloud sync. On a shared device, anyone using the same account or guest profile may access saved reflections.</p></header><p role="status" data-practice-message>${esc(message)}</p><section aria-label="Selected Scripture"><p class="bq-practice-note" data-practice-scripture></p></section><div class="bq-practice-actions">${button('library', 'Library')}${!running ? button('reader', 'Read a passage first') : ''}</div>${current ? `<section class="bq-practice-player"><h2>${esc(practice.title)}</h2><p>${practice.adapted ? 'Adapted app routine' : 'Original two-hour stage sequence'}</p><h3 data-stage-title>${esc(practice.stages[current.stage].title)}</h3><output class="bq-practice-clock" aria-label="Remaining in this stage" aria-live="off" data-practice-clock>${clock(current.remaining)}</output><p role="status" aria-live="polite" data-practice-state>${esc(current.state)} · stage ${current.stage + 1} of ${practice.stages.length}</p><details><summary>Stage guide</summary><p>${esc(practice.stages[current.stage].guide)}</p></details>${running ? `<div class="bq-practice-actions">${button(current.state === 'paused' ? 'resume' : 'pause', current.state === 'paused' ? 'Resume' : 'Pause')}${button('skip', 'Skip stage')}${button('end', 'End early')}</div><p>Put your phone aside if helpful. Background alerts are not guaranteed. Return here to see elapsed time.</p>` : `<p>${current.state === 'completed' ? 'The scheduled time has elapsed. Reflect on what you practiced.' : 'Session ended early. You can still reflect.'}</p><form data-practice-reflection><label>Optional private reflection<textarea name="reflection" maxlength="6000" rows="5">${esc(history.find(row => row.session.id === current.id)?.reflection || '')}</textarea></label><button class="bq-primary-button" type="submit">Save reflection on this device</button></form>${button('new', 'Choose another practice')}`}</section>` : `<section><h2>Choose a practice</h2><div class="bq-practice-list">${PRACTICES.map(item => `<button class="bq-secondary-button" type="button" data-practice-start="${esc(item.id)}">${esc(item.title)}</button>`).join('')}</div><p>Silence is an invitation to relationship with God. Minutes are not a measure of spiritual worth.</p></section>`}<section><h2>Recent reflections</h2>${history.length ? history.map(row => `<details><summary>${esc(getPractice(row.session.templateId).title)} · ${esc(row.session.state)}</summary><p class="bq-practice-note">${esc(row.reflection || 'No written reflection.')}</p><button type="button" class="bq-secondary-button" data-practice-delete="${esc(row.session.id)}">Delete saved reflection</button></details>`).join('') : '<p>No saved reflections yet.</p>'}</section>`;
        void renderPassage();
      }
      function act(event) {
        const target = event.target.closest('button');
        if (!target || !host.contains(target)) return;
        // Never apply a stale visible action to another account after hydration/switch.
        if (getOwner() !== owner) { owner = getOwner(); load(); render(); return; }
        const action = target.dataset.practiceAction;
        if (action === 'library') return onLibrary();
        if (action === 'reader') return onReader();
        if (target.dataset.practiceStart) {
          const ref = passages?.selection();
          if (target.dataset.practiceStart === 'meditation-10' && !ref) { message = 'Read a passage first, tap a verse, then choose Meditate on this verse.'; render(); return; }
          current = createSession(target.dataset.practiceStart);
          if (target.dataset.practiceStart === 'meditation-10') current.passage = ref;
          message = ''; save();
        }
        else if (target.dataset.practiceDelete) { history = history.filter(row => row.session.id !== target.dataset.practiceDelete); save(); }
        else if (action === 'new') { current = null; save(); }
        else if (current && ['pause', 'resume', 'skip', 'end'].includes(action)) { current = advance(current, action); save(); }
        render();
      }
      function submit(event) {
        if (!event.target.matches('[data-practice-reflection]')) return;
        event.preventDefault();
        if (getOwner() !== owner) { owner = getOwner(); load(); render(); return; }
        if (!current || !['completed', 'ended'].includes(current.state)) return;
        const reflection = String(new FormData(event.target).get('reflection') || '').slice(0, 6000);
        history = [{ session: current, reflection }, ...history.filter(row => row.session.id !== current.id)].slice(0, 50);
        message = save() ? 'Reflection saved on this device.' : message;
        render();
      }
      function tick() {
        if (!alive) return;
        const before = current && `${current.id}:${current.stage}:${current.state}`;
        const oldOwner = owner;
        sync();
        if (oldOwner !== owner || before !== (current && `${current.id}:${current.stage}:${current.state}`)) return render();
        const output = host.querySelector('[data-practice-clock]');
        if (output && current) output.textContent = clock(current.remaining);
      }
      const visibility = () => { if (!document.hidden) tick(); else save(); };
      load(); render();
      host.addEventListener('click', act);
      host.addEventListener('submit', submit);
      document.addEventListener('visibilitychange', visibility);
      const interval = setInterval(tick, 1000);
      const unsubscribe = subscribeOwner(() => { if (getOwner() !== owner) { owner = getOwner(); load(); render(); } });
      return () => { alive = false; passageOperation++; save(); clearInterval(interval); unsubscribe(); document.removeEventListener('visibilitychange', visibility); host.removeEventListener('click', act); host.removeEventListener('submit', submit); };
    },
  };
}
