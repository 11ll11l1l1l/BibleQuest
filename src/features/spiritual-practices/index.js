import { practiceLocale, practiceText, practiceTitle, localizePractice } from './copy.js';
import { createPracticeOffline } from './offline.js';
import { createPracticeCue } from './cue.js';
import { createPracticeWakeLock } from './wake-lock.js';
import { PRACTICES, SILENCIO_PRESETS, DISCIPLINE_GUIDES, getPractice } from './content.js';
import { advance, createSession, validSession } from './timer.js';
import './practice.css';
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const clock = ms => { const seconds = Math.ceil(ms / 1000); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; };
export function spiritualPracticesPage({ storage, getOwner, subscribeOwner, onLibrary, onReader, passages = null, reminders = null, books = [], offlineShell = null, getLocale = () => 'en' }) {
  const locale = practiceLocale(getLocale());
  const t = text => practiceText(locale, text);
  const h = text => esc(t(text));
  return {
    title: t('Spiritual Practices'),
    html: `<main class="bq-panel bq-practice" lang="${locale}" data-practice></main>`,
    mount(root) {
      const host = root.querySelector('[data-practice]');
      const wakeLock = createPracticeWakeLock();
      const cue = createPracticeCue();
      const offline = offlineShell ? createPracticeOffline({ books, shell: offlineShell, getOwner }) : null;
      let offlineOperation = 0, offlineTask = 0, offlineBusy = false;
      let awake = false;
      let owner = getOwner(), current = null, history = [], message = '', alive = true, passageOperation = 0;
      const key = () => `spiritual-practices.v1.${owner}`;
      function load() {
        awake = false; void wakeLock.release(); cue.disable(); offline?.cancel(); offlineBusy = false; offlineTask++; offlineOperation++;
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
      function sync(playCue = false) {
        if (getOwner() !== owner) { owner = getOwner(); load(); return; }
        if (!current) return;
        const before = `${current.stage}:${current.state}`, recent = Date.now() - current.updatedAt <= 5000, wasRunning = current.state === 'running';
        current = advance(current);
        if (playCue && recent && wasRunning && !document.hidden && before !== `${current.stage}:${current.state}`) { try { cue.play(); } catch { message = 'Transition sound could not play.'; } }
        if (before !== `${current.stage}:${current.state}`) { if (current.state === 'completed') { awake = false; void wakeLock.release(); } save(); }
      }
      const button = (action, text) => `<button type="button" class="bq-secondary-button" data-practice-action="${action}">${h(text)}</button>`;
      async function renderPassage() {
        const id = ++passageOperation, expectedOwner = owner;
        const ref = current?.passage || (!current ? passages?.selection() : null);
        const node = host.querySelector('[data-practice-scripture]');
        if (!node || !ref || !passages) return;
        node.textContent = t('Loading selected Scripture…');
        try {
          const result = await passages.resolve(ref);
          if (!alive || id !== passageOperation || expectedOwner !== getOwner() || !node.isConnected) return;
          node.textContent = `${result.reference} · ${result.translation}\n${result.text}\n${result.attribution}`;
        } catch (error) {
          if (alive && id === passageOperation && expectedOwner === getOwner() && node.isConnected) node.textContent = t(error?.message || 'Passage unavailable. Open the Bible Reader and retry.');
        }
      }
      async function renderOffline() {
        const node = host.querySelector('[data-practice-offline]');
        if (!node || !offline) return;
        const token = ++offlineOperation, expectedOwner = owner, ref = current?.passage || (!current ? passages?.selection() : null);
        node.textContent = t('Checking offline availability…');
        try {
          const result = await offline.status(ref);
          if (!alive || token !== offlineOperation || expectedOwner !== getOwner() || !node.isConnected) return;
          const shellText = result.guidesReady ? 'Practice guide code is prepared in the existing offline shell.' : 'Offline shell is not ready. Open the app online and try again; offline launch is not guaranteed.';
          const book = result.book;
          node.innerHTML = `<p>${h(shellText)}</p>${book ? `<p>${book.installed ? h(book.updateAvailable ? 'Saved Bible book has an update available.' : 'Selected Bible book is saved in managed offline storage.') : h(book.reason || 'Selected Bible book is not downloaded.')}</p>${offlineBusy ? button('offline-cancel', 'Cancel preparation') : `${book.downloadable ? button('offline-prepare', book.installed ? 'Refresh selected Bible book' : 'Prepare selected Bible book') : ''}${book.installed ? button('offline-remove', 'Remove selected offline Bible book') : ''}`}<p>${h('Uses the Bible Reader’s verified book downloads. Removing a book affects the Bible Reader too. Browser storage can be cleared by the device.')}</p>` : `<p>${h('Choose a verse in the Bible Reader to prepare its book for meditation offline.')}</p>`}`;
        } catch (error) { if (alive && token === offlineOperation && expectedOwner === getOwner() && node.isConnected) node.textContent = t(error?.message || 'Offline status unavailable. Retry after opening the passage online.'); }
      }
      function render() {
        if (!alive) return;
        sync();
        const practice = current && localizePractice(getPractice(current.templateId, current.durationMinutes), locale);
        const reminder = reminders?.config();
        const running = current && ['running', 'paused'].includes(current.state);
        host.innerHTML = `<header>
          <p class="bq-eyebrow">${h('PRIVATE · THIS DEVICE')}</p><h1>${h('Spiritual Practices')}</h1>
          <p>${h('Make space for God, reflection and a loving response.')}</p>
          <p>${h('No cloud sync. On a shared device, anyone using the same account or guest profile may access saved reflections.')}</p>
          <p>${h('Some provider details remain in their source language.')}${practiceLocale(getLocale()) !== getLocale() ? ` · ${h('English fallback')}` : ''}</p>
        </header>
        <p role="status" data-practice-message lang="${locale !== 'en' && t(message) === message ? 'en' : locale}">${h(message)}</p>
        <section aria-label="${h('Selected Scripture')}"><p class="bq-practice-note" data-practice-scripture></p></section>
        <div class="bq-practice-actions">${button('library', 'Library')}${!running ? button('reader', 'Read a passage first') : ''}</div>
        ${current ? `<section class="bq-practice-player"><h2>${esc(practice.title)}</h2>
          <p>${h(practice.adapted ? 'Adapted app routine' : 'Original two-hour stage sequence')}</p>
          <h3 data-stage-title>${esc(practice.stages[current.stage].title)}</h3>
          <output class="bq-practice-clock" aria-label="${h('Remaining in this stage')}" aria-live="off" data-practice-clock>${clock(current.remaining)}</output>
          <p role="status" aria-live="polite" data-practice-state>${h(current.state)} · ${h('stage')} ${current.stage + 1} ${h('of')} ${practice.stages.length}</p>
          <details><summary>${h('Stage guide')}</summary><p>${esc(practice.stages[current.stage].guide)}</p></details>
          ${running ? `<div class="bq-practice-actions">${button(current.state === 'paused' ? 'resume' : 'pause', current.state === 'paused' ? 'Resume' : 'Pause')}${button('skip', 'Skip stage')}${button('end', 'End early')}${button('cue', cue.isEnabled() ? 'Turn transition sound off' : 'Enable transition sound')}${button('awake', awake ? 'Allow screen sleep' : 'Keep screen awake')}</div>
            <p>${h('Put your phone aside if helpful. Background alerts are not guaranteed. Return here to see elapsed time.')}</p>` : `<p>${h(current.state === 'completed' ? 'The scheduled time has elapsed. Reflect on what you practiced.' : 'Session ended early. You can still reflect.')}</p>
            <form data-practice-reflection><label>${h('Optional private reflection')}<textarea name="reflection" maxlength="6000" rows="5">${esc(history.find(row => row.session.id === current.id)?.reflection || '')}</textarea></label><button class="bq-primary-button" type="submit">${h('Save reflection on this device')}</button></form>${button('new', 'Choose another practice')}`}
        </section>` : `<section><h2>${h('Choose a practice')}</h2><div class="bq-practice-list">${[...PRACTICES, ...SILENCIO_PRESETS].map(item => `<button class="bq-secondary-button" type="button" data-practice-start="${esc(item.id)}">${esc(practiceTitle(locale, item.title))}</button>`).join('')}</div>
          <form data-practice-custom><label>${h('Custom Silencio minutes (adapted)')}<input name="minutes" type="number" min="1" max="120" step="1" required value="10"></label><button type="submit" class="bq-secondary-button">${h('Start custom silence')}</button></form>
          <p>${h('Silence is an invitation to relationship with God. Minutes are not a measure of spiritual worth.')}</p></section>`}
        ${reminder ? `<section><h2>${h('Daily app-open reminder')}</h2><p>${h('Shown on Home while BibleQuest is open. This device only; no closed-app alert. Uses your notification master switch, Bible reading category and device-local quiet hours.')}</p>
          <form data-practice-reminder-form><label><input name="enabled" type="checkbox" ${reminder.enabled ? 'checked' : ''}> ${h('Enable daily reminder')}</label><label>${h('Time')}<input name="time" type="time" required value="${esc(reminder.time)}"></label><label>${h('Time zone')}<input name="timeZone" required maxlength="100" value="${esc(reminder.timeZone)}"></label><button type="submit" class="bq-secondary-button">${h('Save reminder')}</button></form></section>` : ''}
        ${offline ? `<section><h2>${h('Offline practice')}</h2><div data-practice-offline></div>${button('offline-status', 'Refresh offline status')}</section>` : ''}
        <section><h2>${h('Practice in daily life')}</h2>${DISCIPLINE_GUIDES.map(guide => `<details><summary>${h(guide.title)}</summary><ol>${guide.steps.map(step => `<li>${h(step)}</li>`).join('')}</ol></details>`).join('')}</section>
        <section><h2>${h('Recent reflections')}</h2>${history.length ? history.map(row => `<details><summary>${esc(practiceTitle(locale, getPractice(row.session.templateId, row.session.durationMinutes).title))} · ${h(row.session.state)}</summary><p class="bq-practice-note">${row.reflection ? esc(row.reflection) : h('No written reflection.')}</p><button type="button" class="bq-secondary-button" data-practice-delete="${esc(row.session.id)}">${h('Delete saved reflection')}</button></details>`).join('') : `<p>${h('No saved reflections yet.')}</p>`}</section>`;
        void renderPassage(); void renderOffline();
      }
      function act(event) {
        const target = event.target.closest('button');
        if (!target || !host.contains(target)) return;
        // Never apply a stale visible action to another account after hydration/switch.
        if (getOwner() !== owner) { owner = getOwner(); load(); render(); return; }
        const action = target.dataset.practiceAction;
        if (action === 'cue') {
          if (cue.isEnabled()) { cue.disable(); render(); return; }
          const expectedOwner = owner;
          void cue.enable().then(enabled => { if (!alive || expectedOwner !== getOwner()) { cue.disable(); return; } message = enabled ? 'Transition sound enabled for this visit. Missed background cues are not replayed.' : ''; render(); }).catch(error => { if (alive && expectedOwner === getOwner()) { message = error?.message || 'Could not enable transition sound.'; render(); } });
          return;
        }
        if (action?.startsWith('offline-') && offline) {
          if (action === 'offline-status') { void renderOffline(); return; }
          if (action === 'offline-cancel') { offlineTask++; offline.cancel(); offlineBusy = false; message = 'Offline preparation cancelled.'; render(); return; }
          const ref = current?.passage || (!current ? passages?.selection() : null), expectedOwner = owner;
          if (!ref || offlineBusy) return;
          const task = ++offlineTask;
          offlineBusy = true; render();
          const operation = action === 'offline-remove' ? offline.remove(ref) : offline.prepare(ref);
          void operation.then(() => { if (alive && task === offlineTask && expectedOwner === getOwner()) message = action === 'offline-remove' ? 'Offline Bible book removed.' : 'Selected Bible book verified in managed offline storage.'; }).catch(error => { if (alive && task === offlineTask && expectedOwner === getOwner()) message = error?.message || 'Offline preparation failed.'; }).finally(() => { if (alive && task === offlineTask && expectedOwner === getOwner()) { offlineBusy = false; render(); } });
          return;
        }
        if (action === 'awake') {
          if (awake) { awake = false; void wakeLock.release(); render(); return; }
          const expectedOwner = owner;
          void wakeLock.acquire().then(acquired => {
            if (!alive || expectedOwner !== getOwner()) { void wakeLock.release(); return; }
            awake = acquired; message = acquired ? 'Screen awake while this page remains visible. Your browser may release it.' : ''; render();
          }).catch(error => { if (alive && expectedOwner === getOwner()) { message = error?.message || 'Could not keep the screen awake.'; render(); } });
          return;
        }
        if (action === 'library') return onLibrary();
        if (action === 'reader') return onReader();
        if (target.dataset.practiceStart) {
          const ref = passages?.selection();
          if (target.dataset.practiceStart === 'meditation-10' && !ref) { message = 'Read a passage first, tap a verse, then choose Meditate on this verse.'; render(); return; }
          current = createSession(target.dataset.practiceStart);
          if (target.dataset.practiceStart === 'meditation-10') current.passage = ref;
          message = ''; try { reminders?.dismiss(owner); } catch { message = 'Could not dismiss the reminder on this device.'; } save();
        }
        else if (target.dataset.practiceDelete) { history = history.filter(row => row.session.id !== target.dataset.practiceDelete); save(); }
        else if (action === 'new') { current = null; save(); }
        else if (current && ['pause', 'resume', 'skip', 'end'].includes(action)) { current = advance(current, action); if (['paused', 'ended', 'completed'].includes(current.state)) { cue.stop(); awake = false; void wakeLock.release(); } save(); }
        render();
      }
      function submit(event) {
        if (event.target.matches('[data-practice-reminder-form]') && reminders) {
          event.preventDefault();
          if (getOwner() !== owner) { owner = getOwner(); load(); render(); return; }
          const data = new FormData(event.target);
          try { reminders.save({ enabled: data.get('enabled') === 'on', time: String(data.get('time') || ''), timeZone: String(data.get('timeZone') || '') }); message = 'Daily app-open reminder saved on this device.'; }
          catch (error) { message = error?.message || 'Could not save reminder.'; }
          render(); return;
        }
        if (event.target.matches('[data-practice-custom]')) {
          event.preventDefault();
          if (getOwner() !== owner) { owner = getOwner(); load(); render(); return; }
          const minutes = Number(new FormData(event.target).get('minutes'));
          if (!Number.isInteger(minutes) || minutes < 1 || minutes > 120) { message = 'Choose a whole number from 1 to 120 minutes.'; render(); return; }
          current = createSession('silencio-custom', undefined, undefined, minutes); message = ''; try { reminders?.dismiss(owner); } catch { message = 'Could not dismiss the reminder on this device.'; } save(); render(); return;
        }
        if (!event.target.matches('[data-practice-reflection]')) return;
        event.preventDefault();
        if (getOwner() !== owner) { owner = getOwner(); load(); render(); return; }
        if (!current || !['completed', 'ended'].includes(current.state)) return;
        const reflection = String(new FormData(event.target).get('reflection') || '').slice(0, 6000);
        history = [{ session: current, reflection }, ...history.filter(row => row.session.id !== current.id)].slice(0, 50);
        message = save() ? 'Reflection saved on this device.' : message;
        render();
      }
      function tick(playCue = true) {
        if (!alive) return;
        if (awake && !wakeLock.isActive()) { awake = false; render(); return; }
        const before = current && `${current.id}:${current.stage}:${current.state}`;
        const oldOwner = owner;
        sync(playCue);
        if (oldOwner !== owner || before !== (current && `${current.id}:${current.stage}:${current.state}`)) return render();
        const output = host.querySelector('[data-practice-clock]');
        if (output && current) output.textContent = clock(current.remaining);
      }
      const visibility = () => { if (!document.hidden) { tick(false); render(); } else { cue.stop(); awake = false; void wakeLock.release(); save(); } };
      load(); render();
      host.addEventListener('click', act);
      host.addEventListener('submit', submit);
      document.addEventListener('visibilitychange', visibility);
      const interval = setInterval(tick, 1000);
      const unsubscribe = subscribeOwner(() => { if (getOwner() !== owner) { owner = getOwner(); load(); render(); } });
      return () => { alive = false; cue.dispose(); offline?.dispose(); offlineTask++; offlineOperation++; void wakeLock.release(); passageOperation++; save(); clearInterval(interval); unsubscribe(); document.removeEventListener('visibilitychange', visibility); host.removeEventListener('click', act); host.removeEventListener('submit', submit); };
    },
  };
}
