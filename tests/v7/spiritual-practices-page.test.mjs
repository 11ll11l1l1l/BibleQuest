import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
// Node has no CSS loader. Execute the unchanged page code with its stylesheet import
// omitted; this is a controller test, not browser/layout evidence.
const source = (await readFile(new URL('../../src/features/spiritual-practices/index.js', import.meta.url), 'utf8'))
  .replace("import './practice.css';", '')
  .replace("'./copy.js'", JSON.stringify(new URL('../../src/features/spiritual-practices/copy.js', import.meta.url).href))
  .replace("'./content.js'", JSON.stringify(new URL('../../src/features/spiritual-practices/content.js', import.meta.url).href))
  .replace("'./offline.js'", JSON.stringify(new URL('../../src/features/spiritual-practices/offline.js', import.meta.url).href))
  .replace("'./cue.js'", JSON.stringify(new URL('../../src/features/spiritual-practices/cue.js', import.meta.url).href))
  .replace("'./wake-lock.js'", JSON.stringify(new URL('../../src/features/spiritual-practices/wake-lock.js', import.meta.url).href))
  .replace("'./timer.js'", JSON.stringify(new URL('../../src/features/spiritual-practices/timer.js', import.meta.url).href));
const { spiritualPracticesPage } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
function fixture(initial = null, passages = null, reminders = null, locale = 'en', initialPractice = '') {
  let owner = 'guest', notify, tick, now = 1000, body = '', reflection = '';
  const listeners = new Map(), saved = new Map();
  if (initial) saved.set('spiritual-practices.v1.guest', initial);
  const host = { innerHTML: '', contains: () => true, querySelector: () => null, addEventListener: (type, fn) => listeners.set(type, fn), removeEventListener: type => listeners.delete(type) };
  const originals = { document: globalThis.document, setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval, FormData: globalThis.FormData, now: Date.now };
  globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {} };
  globalThis.setInterval = fn => { tick = fn; return 1; };
  globalThis.clearInterval = () => {};
  globalThis.FormData = class { getAll(key) { return reflection && typeof reflection === 'object' && Array.isArray(reflection[key]) ? reflection[key] : key === 'days' ? ['0','1','2','3','4','5','6'] : []; } get(key) { return reflection && typeof reflection === 'object' ? reflection[key] : reflection; } };
  Date.now = () => now;
  const storage = { read: (key, fallback) => saved.get(key) || fallback, write: (key, value) => saved.set(key, structuredClone(value)) };
  const page = spiritualPracticesPage({ initialPractice, storage, passages, reminders, getLocale: () => locale, getOwner: () => owner, subscribeOwner: fn => { notify = fn; return () => {}; }, onLibrary: () => { body = 'library'; }, onReader: () => { body = 'reader'; } });
  const dispose = page.mount({ querySelector: () => host });
  return {
    host, saved, storage, get body() { return body; },
    click(dataset) { const target = { dataset }; target.closest = () => target; listeners.get('click')({ target }); },
    reminder(value) { reflection = value; listeners.get('submit')({ preventDefault() {}, target: { matches: selector => selector === '[data-practice-reminder-form]' } }); },
    editSubmit(id, value) { reflection = value; listeners.get('submit')({ preventDefault() {}, target: { dataset: {practiceHistoryEdit: id}, matches: selector => selector === '[data-practice-history-edit]' } }); },
    input(id, name, value) { listeners.get('input')({target: {name, value, closest: () => ({dataset: {practiceSession: id}})}}); },
    custom(value) { reflection = value; listeners.get('submit')({ preventDefault() {}, target: { matches: selector => selector === '[data-practice-custom]' } }); },
    switch(value, emit = true) { owner = value; if (emit) notify(); },
    time(value) { now = value; tick(); },
    submit(value) { reflection = value; listeners.get('submit')({ preventDefault() {}, target: { matches: selector => selector === '[data-practice-reflection]' } }); },
    close() { dispose(); globalThis.document = originals.document; globalThis.setInterval = originals.setInterval; globalThis.clearInterval = originals.clearInterval; globalThis.FormData = originals.FormData; Date.now = originals.now; },
  };
}
test('real page controller starts, ends, saves one escaped reflection and deletes it', () => {
  const f = fixture();
  try {
    f.click({ practiceStart: 'presence-30' });
    assert.match(f.host.innerHTML, /data-practice-clock>0:30/);
    f.time(30000);
    // 29 seconds elapsed, correctly formatted at the minute boundary.
    assert.match(f.host.innerHTML, /Daytime pause/);
    f.click({ practiceAction: 'end' });
    f.submit('<script>private</script>');
    f.submit('updated private thought');
    const state = f.saved.get('spiritual-practices.v1.guest');
    assert.equal(state.history.length, 1);
    assert.equal(state.history[0].reflection, 'updated private thought');
    assert.equal(state.current.state, 'ended');
    f.submit('<script>private</script>');
    assert.doesNotMatch(f.host.innerHTML, /<script>private/);
    assert.match(f.host.innerHTML, /&lt;script&gt;private/);
    f.click({ practiceDelete: state.current.id });
    assert.equal(f.saved.get('spiritual-practices.v1.guest').history.length, 0);
  } finally { f.close(); }
});
test('account switch clears visible private data and rejects stale controls before notification', () => {
  const f = fixture();
  try {
    f.click({ practiceStart: 'presence-30' });
    f.click({ practiceAction: 'end' });
    f.submit('guest secret');
    f.switch('account:alice');
    assert.doesNotMatch(f.host.innerHTML, /guest secret/);
    assert.match(f.host.innerHTML, /Choose a practice/);
    f.click({ practiceStart: 'silencio-10' });
    f.switch('account:bob', false);
    f.click({ practiceAction: 'end' });
    assert.match(f.host.innerHTML, /Choose a practice/);
    assert.equal(f.saved.has('spiritual-practices.v1.account:bob'), false);
    f.switch('guest');
    assert.match(f.host.innerHTML, /guest secret/);
  } finally { f.close(); }
});
test('storage denial is visible and does not claim reflection saved', () => {
  const f = fixture();
  try {
    f.storage.write = () => { throw new Error('quota'); };
    f.click({ practiceStart: 'presence-30' });
    assert.match(f.host.innerHTML, /Device storage is unavailable/);
    f.click({ practiceAction: 'end' });
    f.submit('private');
    assert.doesNotMatch(f.host.innerHTML, /Reflection saved on this device/);
    assert.match(f.host.innerHTML, /may be lost/);
  } finally { f.close(); }
});


test('malformed saved history does not prevent opening and countdown is not announced every second', () => {
  const f = fixture({ current: {}, history: [null, {}, { session: null }] });
  try {
    assert.match(f.host.innerHTML, /saved timer could not be restored/);
    f.click({ practiceStart: 'silencio-10' });
    assert.match(f.host.innerHTML, /aria-live="off" data-practice-clock/);
    assert.match(f.host.innerHTML, /role="status" aria-live="polite" data-practice-state/);
  } finally { f.close(); }
});


test('meditation requires a selected passage and persists its reference without replacing an active session', () => {
  const empty = fixture();
  try {
    empty.click({ practiceStart: 'meditation-10' });
    assert.match(empty.host.innerHTML, /Read a passage first, tap a verse/);
    assert.equal(empty.saved.size, 0);
  } finally { empty.close(); }
  let selected = { translation: 'bsb', book: 'PSA', chapter: 46, verse: 10 };
  const f = fixture(null, { selection: () => selected });
  try {
    f.click({ practiceStart: 'meditation-10' });
    assert.deepEqual(f.saved.get('spiritual-practices.v1.guest').current.passage, selected);
    selected = { translation: 'bsb', book: 'JHN', chapter: 1, verse: 1 };
    f.click({ practiceAction: 'pause' });
    assert.equal(f.saved.get('spiritual-practices.v1.guest').current.passage.book, 'PSA');
  } finally { f.close(); }
});


test('custom duration is validated by the controller and survives stored-session restoration', () => {
  const f = fixture();
  let snapshot;
  try {
    f.custom('1.5');
    assert.match(f.host.innerHTML, /whole number from 1 to 120/);
    assert.equal(f.saved.size, 0);
    f.custom('17');
    snapshot = f.saved.get('spiritual-practices.v1.guest');
    assert.equal(snapshot.current.durationMinutes, 17);
    assert.match(f.host.innerHTML, /Silencio · 17 minutes/);
    assert.match(f.host.innerHTML, /Adapted app routine/);
  } finally { f.close(); }
  const restored = fixture(snapshot);
  try { assert.match(restored.host.innerHTML, /Silencio · 17 minutes/); }
  finally { restored.close(); }
});


test('reminder form labels app-open scope and reports saves or storage errors truthfully', () => {
  let saved;
  const reminders = { config: () => ({ enabled: false, time: '08:00', timeZone: 'Asia/Tokyo' }), save: value => { saved = value; } };
  const f = fixture(null, null, reminders);
  try {
    assert.match(f.host.innerHTML, /no closed-app alert/);
    f.reminder({ enabled: 'on', time: '20:00', timeZone: 'Asia/Tokyo' });
    assert.deepEqual(saved, { enabled: true, time: '20:00', timeZone: 'Asia/Tokyo', days: [0,1,2,3,4,5,6] });
    assert.match(f.host.innerHTML, /reminder plan saved/);
    reminders.save = () => { throw new Error('Storage unavailable'); };
    f.reminder({ enabled: 'on', time: '20:00', timeZone: 'Asia/Tokyo' });
    assert.match(f.host.innerHTML, /Storage unavailable/);
    assert.doesNotMatch(f.host.innerHTML, /reminder plan saved/);
  } finally { f.close(); }
});

test('page plays opted-in foreground transitions but never replays missed background intervals', async () => {
  const previous = globalThis.AudioContext;
  let tones = 0;
  globalThis.AudioContext = class {
    state = 'running'; currentTime = 0; destination = {};
    async resume() {} async close() {}
    createOscillator() { tones++; return { frequency: { setValueAtTime() {} }, connect() {}, disconnect() {}, start() {}, stop() {} }; }
    createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
  };
  const f = fixture();
  try {
    f.click({ practiceStart: 'silencio-10' });
    f.click({ practiceAction: 'cue' });
    await Promise.resolve(); await Promise.resolve();
    f.time(58000);
    assert.equal(tones, 0);
    f.time(61000);
    assert.equal(tones, 1);
    f.time(400000);
    assert.equal(tones, 1, 'a long suspended interval must not replay missed transitions');
  } finally { f.close(); globalThis.AudioContext = previous; }
});


test('TL and CEB pages localize controls and guides while session identity and private prose stay unchanged', () => {
  let snapshot;
  const tl = fixture(null, null, null, 'tl');
  try {
    assert.match(tl.host.innerHTML, /Mga Espirituwal na Pagsasanay/);
    assert.match(tl.host.innerHTML, /Pagsasanay sa araw-araw/);
    tl.click({ practiceStart: 'silencio-10' });
    assert.match(tl.host.innerHTML, /Maghanda/);
    assert.match(tl.host.innerHTML, /Ihinto sandali/);
    tl.click({ practiceAction: 'end' });
    tl.submit('My private <b>English</b> thought');
    assert.match(tl.host.innerHTML, /Na-save ang pagninilay/);
    assert.match(tl.host.innerHTML, /My private &lt;b&gt;English&lt;\/b&gt; thought/);
    snapshot = tl.saved.get('spiritual-practices.v1.guest');
    assert.equal(snapshot.current.templateId, 'silencio-10');
  } finally { tl.close(); }
  const ceb = fixture(snapshot, null, null, 'ceb');
  try {
    assert.match(ceb.host.innerHTML, /Mga Espirituhanong Pagbansay/);
    assert.match(ceb.host.innerHTML, /My private &lt;b&gt;English&lt;\/b&gt; thought/);
    assert.equal(snapshot.history[0].reflection, 'My private <b>English</b> thought');
  } finally { ceb.close(); }
});
test('unsupported practice language is explicitly identified as English fallback', () => {
  const f = fixture(null, null, null, 'ilo');
  try { assert.match(f.host.innerHTML, /English fallback/); assert.match(f.host.innerHTML, /Choose a practice/); }
  finally { f.close(); }
});


test('practice deep link previews canonical routine and starts only by explicit choice', () => {
  const f = fixture(null, null, null, 'en', 'morning-10');
  try {
    assert.match(f.host.innerHTML, /data-practice-suggestion/);
    assert.match(f.host.innerHTML, /Morning surrender/);
    assert.doesNotMatch(f.host.innerHTML, /data-practice-clock/);
    assert.equal(f.saved.size, 0);
    f.click({ practiceStart: 'morning-10' });
    const current = f.saved.get('spiritual-practices.v1.guest').current;
    assert.equal(current.templateId, 'morning-10');
    f.click({ practiceStart: 'silencio-10' });
    f.custom('17');
    assert.equal(f.saved.get('spiritual-practices.v1.guest').current.id, current.id);
  } finally { f.close(); }
});

test('suggestion preserves restored session and reflections; guide opens without any saved mutation', () => {
  const original = fixture();
  let snapshot;
  try {
    original.click({ practiceStart: 'presence-30' });
    original.click({ practiceAction: 'end' });
    original.submit('PRIVATE_REFLECTION');
    snapshot = structuredClone(original.saved.get('spiritual-practices.v1.guest'));
  } finally { original.close(); }
  const resumed = fixture(snapshot, null, null, 'en', 'silencio-10');
  try {
    assert.match(resumed.host.innerHTML, /Your current session is kept/);
    assert.match(resumed.host.innerHTML, /PRIVATE_REFLECTION/);
    resumed.click({ practiceStart: 'silencio-10' });
    assert.equal(resumed.saved.get('spiritual-practices.v1.guest').current.id, snapshot.current.id);
    assert.deepEqual(resumed.saved.get('spiritual-practices.v1.guest').history, snapshot.history);
  } finally { resumed.close(); }
  const guide = fixture(null, null, null, 'tl', 'fellowship');
  try {
    assert.match(guide.host.innerHTML, /data-practice-guide="fellowship" open/);
    assert.match(guide.host.innerHTML, /Iminungkahing pagsasanay/);
    assert.doesNotMatch(guide.host.innerHTML, /data-practice-clock/);
    assert.equal(guide.saved.size, 0);
  } finally { guide.close(); }
});

test('untrusted or incomplete deep links do not become practice content', () => {
  for (const id of ['__proto__', '<script>bad</script>', 'https://evil.test', 'silencio-custom', 'missing']) {
    const f = fixture(null, null, null, 'en', id);
    try {
      assert.doesNotMatch(f.host.innerHTML, /data-practice-suggestion|<script>bad|evil.test/);
      f.click({ practiceStart: id });
      assert.equal(f.saved.size, 0);
    } finally { f.close(); }
  }
});


test('both longer morning routines are available through the real player and restore unchanged', () => {
  for (const minutes of [15, 20]) {
    const f = fixture(); let snapshot;
    try {
      assert.match(f.host.innerHTML, new RegExp(`data-practice-start="morning-${minutes}"`));
      f.click({ practiceStart: `morning-${minutes}` });
      f.click({ practiceAction: 'pause' });
      snapshot = structuredClone(f.saved.get('spiritual-practices.v1.guest'));
    } finally { f.close(); }
    const reload = fixture(snapshot);
    try { assert.match(reload.host.innerHTML, new RegExp(`Morning surrender · ${minutes} minutes`)); assert.match(reload.host.innerHTML, /Resume/); }
    finally { reload.close(); }
  }
});

test('five evening answers are optional, bounded, escaped and restored separately from timer metadata', () => {
  const f = fixture(); let snapshot;
  try {
    f.click({ practiceStart: 'evening-5' });
    f.click({ practiceAction: 'end' });
    assert.equal((f.host.innerHTML.match(/name="answer-/g) || []).length, 5);
    f.submit({reflection: 'summary', 'answer-notice': '<script>private</script>', 'answer-confession': 'x'.repeat(1500)});
    snapshot = structuredClone(f.saved.get('spiritual-practices.v1.guest'));
    assert.equal(snapshot.history[0].answers.notice, '<script>private</script>');
    assert.equal(snapshot.history[0].answers.confession.length, 1200);
    assert.equal(snapshot.history[0].answers.learning, '');
    assert.equal(snapshot.current.answers, undefined);
    assert.doesNotMatch(f.host.innerHTML, /<script>private/);
    assert.match(f.host.innerHTML, /&lt;script&gt;private/);
  } finally { f.close(); }
  const reload = fixture(snapshot, null, null, 'ceb');
  try {
    assert.match(reload.host.innerHTML, /&lt;script&gt;private/); assert.match(reload.host.innerHTML, /I-edit ang gi-save/);
    const id = snapshot.current.id;
    reload.click({practiceEdit: id});
    reload.editSubmit(id, {reflection:'edited summary', 'answer-learning':'Private edited learning'});
    assert.equal(reload.saved.get('spiritual-practices.v1.guest').history[0].answers.learning, 'Private edited learning');
    assert.match(reload.host.innerHTML, /Na-update ang gi-save/);
  }
  finally { reload.close(); }
});

test('older reflection can be edited during another running session and draft survives timer redraw', () => {
  const f = fixture();
  try {
    f.click({ practiceStart: 'presence-30' }); f.click({ practiceAction: 'end' }); f.submit('old note');
    const id = f.saved.get('spiritual-practices.v1.guest').current.id;
    f.click({ practiceAction: 'new' }); f.click({ practiceStart: 'silencio-10' });
    const activeId = f.saved.get('spiritual-practices.v1.guest').current.id;
    f.click({ practiceEdit: id }); f.input(id, 'reflection', 'unsaved draft');
    f.time(61000);
    assert.match(f.host.innerHTML, /unsaved draft/);
    assert.equal(f.saved.get('spiritual-practices.v1.guest').history[0].reflection, 'old note');
    f.editSubmit(id, {reflection: 'updated journal'});
    const state = f.saved.get('spiritual-practices.v1.guest');
    assert.equal(state.current.id, activeId); assert.equal(state.current.state, 'running');
    assert.equal(state.history.length, 1); assert.equal(state.history[0].reflection, 'updated journal');
    assert.match(f.host.innerHTML, /Saved reflection updated/);
  } finally { f.close(); }
});

test('cancel, storage denial, deletion and stale-account editor keep saved notes safe', () => {
  const f = fixture();
  try {
    f.click({ practiceStart: 'evening-5' }); f.click({ practiceAction: 'end' }); f.submit({reflection:'original', 'answer-notice':'private answer'});
    const id = f.saved.get('spiritual-practices.v1.guest').current.id;
    f.click({ practiceEdit: id }); f.input(id, 'reflection', 'cancel this draft'); f.click({practiceAction:'cancel-edit'});
    assert.doesNotMatch(f.host.innerHTML, /cancel this draft/);
    f.click({ practiceEdit: id }); const write = f.storage.write;
    f.storage.write = () => {throw new Error('quota');};
    f.editSubmit(id, {reflection:'retry draft'});
    assert.match(f.host.innerHTML, /Device storage is unavailable/); assert.doesNotMatch(f.host.innerHTML, /Saved reflection updated/);
    assert.equal(f.saved.get('spiritual-practices.v1.guest').history[0].reflection, 'original');
    f.storage.write = write;
    f.switch('account:alice', false); f.editSubmit(id, {reflection:'do not cross accounts'});
    assert.equal(f.saved.has('spiritual-practices.v1.account:alice'), false);
    assert.doesNotMatch(f.host.innerHTML, /retry draft|private answer|original/);
    f.switch('guest'); f.click({practiceEdit:id}); f.click({practiceDelete:id});
    f.editSubmit(id, {reflection:'do not resurrect'});
    assert.equal(f.saved.get('spiritual-practices.v1.guest').history.length, 0);
  } finally { f.close(); }
});

test('current reflection draft survives redraw and malformed legacy answers do not discard valid prose', () => {
  const f = fixture(); let snapshot;
  try {
    f.click({practiceStart:'evening-5'}); f.click({practiceAction:'end'});
    const id = f.saved.get('spiritual-practices.v1.guest').current.id;
    f.input(id,'reflection','unsaved current note'); f.input(id,'answer-gratitude','unsaved thanks');
    // An unrelated journal action redraws the page without saving the draft.
    f.click({practiceAction:'cancel-edit'});
    assert.match(f.host.innerHTML,/unsaved current note/); assert.match(f.host.innerHTML,/unsaved thanks/);
    f.submit({reflection:'legacy valid prose'});
    snapshot=structuredClone(f.saved.get('spiritual-practices.v1.guest'));
    snapshot.history[0].answers={notice:123,unknown:'must not render',gratitude:'retained answer'};
  } finally { f.close(); }
  const restored=fixture(snapshot);
  try { assert.match(restored.host.innerHTML,/legacy valid prose/); assert.match(restored.host.innerHTML,/retained answer/); assert.doesNotMatch(restored.host.innerHTML,/must not render/); }
  finally { restored.close(); }
});

test('reminder form renders chosen routine/weekdays, submits bounded setup and denies stale-account changes', () => {
  let saved;
  const reminders = {config:()=>({enabled:true,time:'08:00',timeZone:'Asia/Tokyo',days:[1,3],practiceId:'morning-20'}),save:value=>{saved=value;}};
  const f=fixture(null,null,reminders,'tl');
  try {
    assert.match(f.host.innerHTML,/name="practiceId"/);
    assert.match(f.host.innerHTML,/value="morning-20" selected/);
    assert.equal((f.host.innerHTML.match(/name="days" value="[13]" checked/g)||[]).length,2);
    assert.match(f.host.innerHTML,/Mga araw ng pagsasanay/);
    f.reminder({enabled:'on',time:'21:00',timeZone:'Asia/Tokyo',days:['1','3','5'],practiceId:'evening-5'});
    assert.deepEqual(saved,{enabled:true,time:'21:00',timeZone:'Asia/Tokyo',days:[1,3,5],practiceId:'evening-5'});
    saved=null;f.switch('account:other',false);
    f.reminder({enabled:'on',time:'21:00',timeZone:'Asia/Tokyo',days:['0'],practiceId:'silencio-10'});
    assert.equal(saved,null);
  } finally {f.close();}
});
