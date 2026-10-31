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
function fixture(initial = null, passages = null, reminders = null, locale = 'en') {
  let owner = 'guest', notify, tick, now = 1000, body = '', reflection = '';
  const listeners = new Map(), saved = new Map();
  if (initial) saved.set('spiritual-practices.v1.guest', initial);
  const host = { innerHTML: '', contains: () => true, querySelector: () => null, addEventListener: (type, fn) => listeners.set(type, fn), removeEventListener: type => listeners.delete(type) };
  const originals = { document: globalThis.document, setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval, FormData: globalThis.FormData, now: Date.now };
  globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {} };
  globalThis.setInterval = fn => { tick = fn; return 1; };
  globalThis.clearInterval = () => {};
  globalThis.FormData = class { get(key) { return reflection && typeof reflection === 'object' ? reflection[key] : reflection; } };
  Date.now = () => now;
  const storage = { read: (key, fallback) => saved.get(key) || fallback, write: (key, value) => saved.set(key, structuredClone(value)) };
  const page = spiritualPracticesPage({ storage, passages, reminders, getLocale: () => locale, getOwner: () => owner, subscribeOwner: fn => { notify = fn; return () => {}; }, onLibrary: () => { body = 'library'; }, onReader: () => { body = 'reader'; } });
  const dispose = page.mount({ querySelector: () => host });
  return {
    host, saved, storage, get body() { return body; },
    click(dataset) { const target = { dataset }; target.closest = () => target; listeners.get('click')({ target }); },
    reminder(value) { reflection = value; listeners.get('submit')({ preventDefault() {}, target: { matches: selector => selector === '[data-practice-reminder-form]' } }); },
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
    assert.deepEqual(saved, { enabled: true, time: '20:00', timeZone: 'Asia/Tokyo' });
    assert.match(f.host.innerHTML, /app-open reminder saved/);
    reminders.save = () => { throw new Error('Storage unavailable'); };
    f.reminder({ enabled: 'on', time: '20:00', timeZone: 'Asia/Tokyo' });
    assert.match(f.host.innerHTML, /Storage unavailable/);
    assert.doesNotMatch(f.host.innerHTML, /app-open reminder saved/);
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
