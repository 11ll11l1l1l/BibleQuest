import { practiceLocale, practiceText, practiceTitle, localizePractice } from './copy.js';
import { createPracticeOffline } from './offline.js';
import { createPracticeCue } from './cue.js';
import { createPracticeVoice } from './voice.js';
import { createPracticeWakeLock } from './wake-lock.js';
import { PRACTICES, SILENCIO_PRESETS, MORNING_PRESETS, EVENING_QUESTIONS, REMINDER_ROUTINES, DISCIPLINE_GUIDES, getPractice } from './content.js';
import { advance, createSession, validSession } from './timer.js';
import './practice.css';
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const clock = ms => { const seconds = Math.ceil(ms / 1000); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; };
export function spiritualPracticesPage({ storage, getOwner, subscribeOwner, onLibrary, onReader, passages = null, reminders = null, books = [], offlineShell = null, getLocale = () => 'en', initialPractice = '' }) {
  const locale = practiceLocale(getLocale());
  const t = text => practiceText(locale, text);
  const h = text => esc(t(text));
  const suggested = typeof initialPractice === 'string' && (getPractice(initialPractice) || DISCIPLINE_GUIDES.find(guide => guide.id === initialPractice));
  return {
    title: t('Spiritual Practices'),
    html: `<main class="bq-panel bq-practice" lang="${locale}" data-practice></main>`,
    mount(root) {
      const host = root.querySelector('[data-practice]');
      const wakeLock = createPracticeWakeLock();
      const cue = createPracticeCue();
      const voice = createPracticeVoice();
      const offline = offlineShell ? createPracticeOffline({ books, shell: offlineShell, getOwner }) : null;
      let offlineOperation = 0, offlineTask = 0, offlineBusy = false;
      let awake = false;
      let drafts = new Map(), editingId = '';
      let owner = getOwner(), current = null, history = [], message = '', alive = true, passageOperation = 0, audioChoice = 0;
      const speechError = () => {
        if (!alive || owner !== getOwner()) return;
        message = 'Spoken guide could not play. Check your media volume and device text-to-speech settings.';
        const status = host.querySelector('[data-practice-message]');
        if (status) status.textContent = t(message);
      };
      const readStage = () => {
        if (!current || !['running', 'paused'].includes(current.state) || document.hidden || owner !== getOwner()) return false;
        const practice = localizePractice(getPractice(current.templateId, current.durationMinutes), locale);
        return voice.read(practice.stages[current.stage], locale, speechError);
      };
      const key = () => `spiritual-practices.v1.${owner}`;
      function load() {
        drafts.clear(); editingId = '';
        awake = false; void wakeLock.release(); cue.disable(); voice.disable(); audioChoice++; offline?.cancel(); offlineBusy = false; offlineTask++; offlineOperation++;
        const saved = storage.read(key(), null);
        current = validSession(saved?.current) ? saved.current : null;
        history = Array.isArray(saved?.history) ? saved.history.filter(row => validSession(row?.session) && ['completed', 'ended'].includes(row.session.state) && typeof row.reflection === 'string' && row.reflection.length <= 6000).slice(0, 50).map(row => ({session: row.session, reflection: row.reflection, answers: answersFor(row.session, row.answers)})) : [];
        message = saved?.current && !current ? 'The saved timer could not be restored. Your saved reflections have been kept.' : '';
      }
      function answersFor(session, value) {
        if (session.templateId !== 'evening-5') return {};
        return Object.fromEntries(EVENING_QUESTIONS.map(({id}) => [id, typeof value?.[id] === 'string' ? value[id].slice(0, 1200) : '']));
      }
      function draftFor(session) {
        if (!drafts.has(session.id)) {
          const saved = history.find(row => row.session.id === session.id);
          drafts.set(session.id, {reflection: saved?.reflection || '', answers: answersFor(session, saved?.answers)});
        }
        return drafts.get(session.id);
      }
      function reflectionFields(session) {
        const draft = draftFor(session);
        return `<label>${h('Optional private reflection')}<textarea name="reflection" maxlength="6000" rows="5">${esc(draft.reflection)}</textarea></label>${session.templateId === 'evening-5' ? EVENING_QUESTIONS.map(({id, question}) => `<label>${h(question)}<textarea name="answer-${id}" maxlength="1200" rows="3">${esc(draft.answers[id])}</textarea></label>`).join('') : ''}<p>${h('Answers are optional. Unsaved changes stay only on this page until you leave.')}</p>`;
      }
      function saveReflection(session, data, editing = false) {
        const answers = session.templateId === 'evening-5' ? answersFor(session, Object.fromEntries(EVENING_QUESTIONS.map(({id}) => [id, String(data.get(`answer-${id}`) || '')]))) : {};
        const reflection = String(data.get('reflection') || '').slice(0, 6000), row = {session, reflection, answers};
        const previous = history;
        history = editing ? history.map(old => old.session.id === session.id ? row : old) : [row, ...history.filter(old => old.session.id !== session.id)].slice(0, 50);
        if (save()) { drafts.delete(session.id); if (editing || editingId === session.id) editingId = ''; message = editing ? 'Saved reflection updated on this device.' : 'Reflection saved on this device.'; }
        else { history = previous; drafts.set(session.id, {reflection, answers}); }
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
        if (playCue && recent && wasRunning && !document.hidden && current.state === 'running'
            && before !== `${current.stage}:${current.state}`) {
          if (voice.isEnabled()) { if (!readStage()) speechError(); }
          else { try { cue.play(); } catch { message = 'Transition sound could not play.'; } }
        }
        if (before !== `${current.stage}:${current.state}`) { if (current.state === 'completed') { voice.stop(); cue.stop(); awake = false; void wakeLock.release(); } save(); }
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
        ${suggested ? `<section data-practice-suggestion><h2>${h('Suggested practice')}</h2>${suggested.stages ? `<h3>${esc(practiceTitle(locale, suggested.title))}</h3>` : `<details data-practice-guide="${esc(suggested.id)}" open><summary>${h(suggested.title)}</summary><ol>${suggested.steps.map(step => `<li>${h(step)}</li>`).join('')}</ol></details>`}<p>${h(current ? 'Your current session is kept. Finish it and choose another practice when ready.' : 'Opening this guide does not start a timer. Choose when you are ready.')}</p>${!current && suggested.stages ? `<button class="bq-secondary-button" type="button" data-practice-start="${esc(suggested.id)}">${h('Begin suggested practice')}</button>` : ''}</section>` : ''}
        <div class="bq-practice-actions">${button('library', 'Library')}${!running ? button('reader', 'Read a passage first') : ''}</div>
        ${current ? `<section class="bq-practice-player"><h2>${esc(practice.title)}</h2>
          <p>${h(practice.adapted ? 'Adapted app routine' : 'Original two-hour stage sequence')}</p>
          <h3 data-stage-title>${esc(practice.stages[current.stage].title)}</h3>
          <output class="bq-practice-clock" aria-label="${h('Remaining in this stage')}" aria-live="off" data-practice-clock>${clock(current.remaining)}</output>
          <p role="status" aria-live="polite" data-practice-state>${h(current.state)} · ${h('stage')} ${current.stage + 1} ${h('of')} ${practice.stages.length}</p>
          <details><summary>${h('Stage guide')}</summary><p>${esc(practice.stages[current.stage].guide)}</p></details>
          ${running ? `<div class="bq-practice-actions">${button(current.state === 'paused' ? 'resume' : 'pause', current.state === 'paused' ? 'Resume' : 'Pause')}${button('skip', 'Skip stage')}${button('end', 'End early')}${button('cue', cue.isEnabled() ? 'Turn transition sound off' : 'Enable transition sound')}${cue.isEnabled() ? button('cue-test', 'Test transition sound') : ''}${button('voice', voice.isEnabled() ? 'Turn spoken guide off' : 'Read stage guides aloud')}${voice.isEnabled() ? button('voice-repeat', 'Read current guide again') : ''}${button('awake', awake ? 'Allow screen sleep' : 'Keep screen awake')}</div>
            <p>${h('Spoken guide uses your device text-to-speech voice. It reads each new stage while this page is open and visible. Try Read current guide again to test your volume. Background narration is not guaranteed.')}</p>
            <p>${h('Put your phone aside if helpful. Background alerts are not guaranteed. Return here to see elapsed time.')}</p>` : `<p>${h(current.state === 'completed' ? 'The scheduled time has elapsed. Reflect on what you practiced.' : 'Session ended early. You can still reflect.')}</p>
            <form data-practice-reflection data-practice-session="${esc(current.id)}">${reflectionFields(current)}<button class="bq-primary-button" type="submit">${h('Save reflection on this device')}</button></form>${button('new', 'Choose another practice')}`}
        </section>` : `<section><h2>${h('Choose a practice')}</h2><div class="bq-practice-list">${[...PRACTICES, ...SILENCIO_PRESETS, ...MORNING_PRESETS].map(item => `<button class="bq-secondary-button" type="button" data-practice-start="${esc(item.id)}">${esc(practiceTitle(locale, item.title))}</button>`).join('')}</div>
          <form data-practice-custom><label>${h('Custom Silencio minutes (adapted)')}<input name="minutes" type="number" min="1" max="120" step="1" required value="10"></label><button type="submit" class="bq-secondary-button">${h('Start custom silence')}</button></form>
          <p>${h('Silence is an invitation to relationship with God. Minutes are not a measure of spiritual worth.')}</p></section>`}
        ${reminder ? `<section><h2>${h('Practice reminder plan')}</h2><p>${h('Shown on Home while BibleQuest is open. This device only; no closed-app alert. Uses your notification master switch, Bible reading category and device-local quiet hours.')}</p>
          <form data-practice-reminder-form><label><input name="enabled" type="checkbox" ${reminder.enabled ? 'checked' : ''}> ${h('Enable app-open reminder')}</label><label>${h('Reminder practice')}<select name="practiceId">${REMINDER_ROUTINES.map(row => `<option value="${row.id}" ${row.id === reminder.practiceId ? 'selected' : ''}>${esc(practiceTitle(locale, row.title))}</option>`).join('')}</select></label><fieldset data-practice-days><legend>${h('Practice days')}</legend>${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => `<label><input type="checkbox" name="days" value="${index}" ${(reminder.days || [0,1,2,3,4,5,6]).includes(index) ? 'checked' : ''}>${h(day)}</label>`).join('')}</fieldset><label>${h('Time')}<input name="time" type="time" required value="${esc(reminder.time)}"></label><label>${h('Time zone')}<input name="timeZone" required maxlength="100" value="${esc(reminder.timeZone)}"></label><button type="submit" class="bq-secondary-button">${h('Save reminder')}</button></form></section>` : ''}
        ${offline ? `<section><h2>${h('Offline practice')}</h2><div data-practice-offline></div>${button('offline-status', 'Refresh offline status')}</section>` : ''}
        <section><h2>${h('Practice in daily life')}</h2>${DISCIPLINE_GUIDES.filter(guide => guide.id !== suggested?.id).map(guide => `<details data-practice-guide="${esc(guide.id)}"><summary>${h(guide.title)}</summary><ol>${guide.steps.map(step => `<li>${h(step)}</li>`).join('')}</ol></details>`).join('')}</section>
        <section><h2>${h('Recent reflections')}</h2>${history.length ? history.map(row => `<details ${editingId === row.session.id ? 'open' : ''}><summary>${esc(practiceTitle(locale, getPractice(row.session.templateId, row.session.durationMinutes).title))} · ${h(row.session.state)}</summary>${editingId === row.session.id ? `<form data-practice-history-edit="${esc(row.session.id)}" data-practice-session="${esc(row.session.id)}">${reflectionFields(row.session)}<button class="bq-secondary-button" type="submit">${h('Save changes on this device')}</button>${button('cancel-edit', 'Cancel editing')}</form>` : `<p class="bq-practice-note">${row.reflection ? esc(row.reflection) : h('No written reflection.')}</p>${row.session.templateId === 'evening-5' ? EVENING_QUESTIONS.filter(({id}) => row.answers[id]).map(({id, question}) => `<h3>${h(question)}</h3><p class="bq-practice-note">${esc(row.answers[id])}</p>`).join('') : ''}<button type="button" class="bq-secondary-button" data-practice-edit="${esc(row.session.id)}">${h('Edit saved reflection')}</button>`}<button type="button" class="bq-secondary-button" data-practice-delete="${esc(row.session.id)}">${h('Delete saved reflection')}</button></details>`).join('') : `<p>${h('No saved reflections yet.')}</p>`}</section>`;
        void renderPassage(); void renderOffline();
      }
      function act(event) {
        const target = event.target.closest('button');
        if (!target || !host.contains(target)) return;
        // Never apply a stale visible action to another account after hydration/switch.
        if (getOwner() !== owner) { owner = getOwner(); load(); render(); return; }
        const action = target.dataset.practiceAction;
        if (action === 'cue') {
          if (cue.isEnabled()) { cue.disable(); audioChoice++; render(); return; }
          voice.disable(); const choice = ++audioChoice, expectedOwner = owner;
          void cue.enable().then(enabled => {
            if (!alive || expectedOwner !== getOwner() || choice !== audioChoice) { cue.disable(); return; }
            message = enabled ? 'Transition sound enabled for this visit. Missed background cues are not replayed.' : '';
            render();
          }).catch(error => {
            if (alive && expectedOwner === getOwner() && choice === audioChoice) { message = error?.message || 'Could not enable transition sound.'; render(); }
          });
          return;
        }
        if (action === 'cue-test') {
          if (cue.isEnabled() && !cue.play()) { message = 'Transition sound could not play. Check media volume and keep the page visible.'; render(); }
          return;
        }
        if (action === 'voice') {
          ++audioChoice;
          if (voice.isEnabled()) { voice.disable(); message = 'Spoken guide turned off.'; render(); return; }
          cue.disable();
          if (!voice.enable()) { message = 'Device text-to-speech is unavailable in this browser.'; render(); return; }
          message = 'Spoken guide enabled for this visit. Check your media volume. Background narration is not guaranteed.';
          if (current?.state === 'running' && !readStage()) speechError();
          render(); return;
        }
        if (action === 'voice-repeat') {
          if (voice.isEnabled() && !readStage()) speechError();
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
        if (target.dataset.practiceEdit) {
          const row = history.find(item => item.session.id === target.dataset.practiceEdit);
          if (row) { editingId = row.session.id; draftFor(row.session); render(); }
          return;
        }
        if (action === 'cancel-edit') { drafts.delete(editingId); editingId = ''; render(); return; }
        if (action === 'library') return onLibrary();
        if (action === 'reader') return onReader();
        if (target.dataset.practiceStart) {
          if (current || !getPractice(target.dataset.practiceStart)) return;
          const ref = passages?.selection();
          if (target.dataset.practiceStart === 'meditation-10' && !ref) { message = 'Read a passage first, tap a verse, then choose Meditate on this verse.'; render(); return; }
          current = createSession(target.dataset.practiceStart);
          if (target.dataset.practiceStart === 'meditation-10') current.passage = ref;
          message = ''; try { reminders?.dismiss(owner); } catch { message = 'Could not dismiss the reminder on this device.'; } save();
        }
        else if (target.dataset.practiceDelete) { const previous = history; history = history.filter(row => row.session.id !== target.dataset.practiceDelete); if (save()) { drafts.delete(target.dataset.practiceDelete); if (editingId === target.dataset.practiceDelete) editingId = ''; } else history = previous; }
        else if (action === 'new') { if (current) drafts.delete(current.id); voice.disable(); cue.disable(); audioChoice++; current = null; save(); }
        else if (current && ['pause', 'resume', 'skip', 'end'].includes(action)) {
          const beforeStage = current.stage;
          current = advance(current, action);
          if (['paused', 'ended', 'completed'].includes(current.state)) {
            cue.stop(); voice.stop(); awake = false; void wakeLock.release();
          } else if (current.state === 'running' && (action === 'resume' || current.stage !== beforeStage)
              && voice.isEnabled() && !document.hidden) {
            if (!readStage()) speechError();
          }
          save();
        }
        render();
      }
      function input(event) {
        if (!alive) return;
        if (getOwner() !== owner) { owner = getOwner(); load(); render(); return; }
        const form = event.target.closest?.('[data-practice-session]');
        if (!form || !host.contains(form)) return;
        const id = form.dataset.practiceSession;
        const session = current?.id === id ? current : history.find(row => row.session.id === id)?.session;
        if (!session || !['completed', 'ended'].includes(session.state)) return;
        const draft = draftFor(session), value = String(event.target.value || '');
        if (event.target.name === 'reflection') draft.reflection = value.slice(0, 6000);
        const question = EVENING_QUESTIONS.find(row => `answer-${row.id}` === event.target.name);
        if (question && session.templateId === 'evening-5') draft.answers[question.id] = value.slice(0, 1200);
      }
      function submit(event) {
        if (event.target.matches('[data-practice-history-edit]')) {
          event.preventDefault();
          if (getOwner() !== owner) { owner = getOwner(); load(); render(); return; }
          const id = event.target.dataset.practiceHistoryEdit;
          const row = history.find(item => item.session.id === id);
          if (!row || id !== editingId) return;
          saveReflection(row.session, new FormData(event.target), true); render(); return;
        }
        if (event.target.matches('[data-practice-reminder-form]') && reminders) {
          event.preventDefault();
          if (getOwner() !== owner) { owner = getOwner(); load(); render(); return; }
          const data = new FormData(event.target);
          try { reminders.save({ enabled: data.get('enabled') === 'on', time: String(data.get('time') || ''), timeZone: String(data.get('timeZone') || ''), ...(data.get('practiceId') ? {practiceId: String(data.get('practiceId'))} : {}), ...(data.getAll ? {days: data.getAll('days').map(Number)} : {}) }); message = 'App-open reminder plan saved on this device.'; }
          catch (error) { message = error?.message || 'Could not save reminder.'; }
          render(); return;
        }
        if (event.target.matches('[data-practice-custom]')) {
          event.preventDefault();
          if (current) return;
          if (getOwner() !== owner) { owner = getOwner(); load(); render(); return; }
          const minutes = Number(new FormData(event.target).get('minutes'));
          if (!Number.isInteger(minutes) || minutes < 1 || minutes > 120) { message = 'Choose a whole number from 1 to 120 minutes.'; render(); return; }
          current = createSession('silencio-custom', undefined, undefined, minutes); message = ''; try { reminders?.dismiss(owner); } catch { message = 'Could not dismiss the reminder on this device.'; } save(); render(); return;
        }
        if (!event.target.matches('[data-practice-reflection]')) return;
        event.preventDefault();
        if (getOwner() !== owner) { owner = getOwner(); load(); render(); return; }
        if (!current || !['completed', 'ended'].includes(current.state)) return;
        saveReflection(current, new FormData(event.target));
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
      const visibility = () => { if (!document.hidden) { tick(false); render(); } else { cue.stop(); voice.stop(); awake = false; void wakeLock.release(); save(); } };
      load(); render();
      host.addEventListener('click', act);
      host.addEventListener('submit', submit);
      host.addEventListener('input', input);
      document.addEventListener('visibilitychange', visibility);
      const interval = setInterval(tick, 1000);
      const unsubscribe = subscribeOwner(() => { if (getOwner() !== owner) { owner = getOwner(); load(); render(); } });
      return () => { alive = false; audioChoice++; cue.dispose(); voice.dispose(); offline?.dispose(); offlineTask++; offlineOperation++; void wakeLock.release(); passageOperation++; save(); clearInterval(interval); unsubscribe(); document.removeEventListener('visibilitychange', visibility); host.removeEventListener('click', act); host.removeEventListener('submit', submit); host.removeEventListener('input', input); drafts.clear(); };
    },
  };
}
