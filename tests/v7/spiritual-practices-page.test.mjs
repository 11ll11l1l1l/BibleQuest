import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
// Node has no CSS loader. Execute the unchanged page code with its stylesheet import
// omitted; this is a controller test, not browser/layout evidence.
const source = (await readFile(new URL('../../src/features/spiritual-practices/index.js', import.meta.url), 'utf8'))
  .replace("import './practice.css';", '')
  .replace("'./content.js'", JSON.stringify(new URL('../../src/features/spiritual-practices/content.js', import.meta.url).href))
  .replace("'./wake-lock.js'", JSON.stringify(new URL('../../src/features/spiritual-practices/wake-lock.js', import.meta.url).href))
  .replace("'./timer.js'", JSON.stringify(new URL('../../src/features/spiritual-practices/timer.js', import.meta.url).href));
const { spiritualPracticesPage } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
function fixture(initial = null, passages = null) {
  let owner = 'guest', notify, tick, now = 1000, body = '', reflection = '';
  const listeners = new Map(), saved = new Map();
  if (initial) saved.set('spiritual-practices.v1.guest', initial);
  const host = { innerHTML: '', contains: () => true, querySelector: () => null, addEventListener: (type, fn) => listeners.set(type, fn), removeEventListener: type => listeners.delete(type) };
  const originals = { document: globalThis.document, setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval, FormData: globalThis.FormData, now: Date.now };
  globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {} };
  globalThis.setInterval = fn => { tick = fn; return 1; };
  globalThis.clearInterval = () => {};
  globalThis.FormData = class { get() { return reflection; } };
  Date.now = () => now;
  const storage = { read: (key, fallback) => saved.get(key) || fallback, write: (key, value) => saved.set(key, structuredClone(value)) };
  const page = spiritualPracticesPage({ storage, passages, getOwner: () => owner, subscribeOwner: fn => { notify = fn; return () => {}; }, onLibrary: () => { body = 'library'; }, onReader: () => { body = 'reader'; } });
  const dispose = page.mount({ querySelector: () => host });
  return {
    host, saved, storage, get body() { return body; },
    click(dataset) { const target = { dataset }; target.closest = () => target; listeners.get('click')({ target }); },
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
