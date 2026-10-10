import test from 'node:test';
import assert from 'node:assert/strict';
import { V7_MOTION_API_VERSION, V7_MOTION_TOKENS, motionEnabled,
  cleanupMotion, pageTransition, pressFeedback, cardReveal, deckSpring } from '../../src/ui/motion.js';

const normal = { document: { documentElement: { dataset: {} } },
  matchMedia: () => ({ matches: false }) };
const reduced = { document: { documentElement: { dataset: { bqEffectiveMotion: 'reduce' } } },
  matchMedia: () => ({ matches: false }) };
function elementFixture() {
  const records = [];
  return { records, element: {
    animate(frames, options) {
      const animation = { frames, options, cancelled: 0, cancel() { this.cancelled++; },
        finished: new Promise(() => {}) };
      records.push(animation);
      return animation;
    }
  } };
}
test('P0 versioned motion durations stay within the V7 bounds', () => {
  assert.equal(V7_MOTION_API_VERSION, 1);
  assert.ok(V7_MOTION_TOKENS.micro >= 120 && V7_MOTION_TOKENS.micro <= 180);
  assert.ok(V7_MOTION_TOKENS.standard >= 180 && V7_MOTION_TOKENS.standard <= 260);
  assert.ok(V7_MOTION_TOKENS.page >= 260 && V7_MOTION_TOKENS.page <= 400);
  assert.ok(V7_MOTION_TOKENS.card >= 260 && V7_MOTION_TOKENS.card <= 400);
});
test('reduced-motion and media preference disable all nonessential animation', () => {
  assert.equal(motionEnabled(normal), true);
  assert.equal(motionEnabled(reduced), false);
  assert.equal(motionEnabled({ ...normal, matchMedia: () => ({ matches: true }) }), false);
  const f=elementFixture();
  for(const play of [pageTransition, pressFeedback, cardReveal]) play(f.element,{environment:reduced})();
  deckSpring(f.element,{ delta: 20, environment: reduced })();
  assert.equal(f.records.length,0);
});
test('reduced/off motion preference cancels an in-flight effect without replay', () => {
  const f = elementFixture();
  const previous = cardReveal(f.element, { environment: normal });
  assert.equal(f.records.length, 1);
  pressFeedback(f.element, { environment: reduced })();
  assert.equal(f.records[0].cancelled, 1);
  assert.equal(f.records.length, 1, 'no new animation may run in reduced mode');
  previous();
  assert.equal(f.records[0].cancelled, 1, 'stale disposer cannot double-cancel');

  pageTransition(f.element, { environment: normal });
  const off = { ...normal, document: { documentElement: { dataset: { bqMotion: 'off' } } } };
  deckSpring(f.element, { delta: 30, environment: off })();
  assert.equal(f.records[1].cancelled, 1);
  assert.equal(f.records.length, 2, 'off mode must not enqueue effects');
});

test('loss of animation support still cancels the previous effect', () => {
  const f = elementFixture();
  pageTransition(f.element, { environment: normal });
  delete f.element.animate;
  cardReveal(f.element, { environment: normal })();
  assert.equal(f.records[0].cancelled, 1);
});

test('fast interaction cancels stale motion while never delaying state changes', () => {
  const f=elementFixture();
  const old=pageTransition(f.element,{environment:normal});
  const current=pressFeedback(f.element,{environment:normal});
  assert.equal(f.records[0].cancelled,1);
  old();
  assert.equal(f.records[1].cancelled,0);
  current();
  current();
  assert.equal(f.records[1].cancelled,1);
});
test('Home/card and deck effects transform or fade only, with bounded displacement',()=>{
  const f=elementFixture();
  cardReveal(f.element,{environment:normal});
  deckSpring(f.element,{delta:300,environment:normal});
  assert.equal(f.records[0].cancelled,1);
  assert.match(f.records[1].frames[0].transform,/48px/);
  for(const animation of f.records)
    for(const frame of animation.frames)
      assert.ok(Object.keys(frame).every(k=>['transform','opacity'].includes(k)));
  cleanupMotion(f.element);
  assert.equal(f.records[1].cancelled,1);
});
test('lack of WAAPI is a safe immediately-visible no-op',()=>{
  assert.doesNotThrow(()=>pageTransition({}, {environment:normal})());
});

function changingPreferencesFixture() {
  const f = elementFixture();
  let observer;
  const listeners = new Map();
  const media = {
    matches:false, callbacks:new Set(),
    addEventListener(name,fn) { if(name==='change')this.callbacks.add(fn); },
    removeEventListener(name,fn) { if(name==='change')this.callbacks.delete(fn); },
    fire() { for(const fn of this.callbacks)fn(); }
  };
  const document = {
    hidden:false, documentElement:{ dataset:{} },
    addEventListener(name,fn) { listeners.set(name,fn); },
    removeEventListener(name,fn) { if(listeners.get(name)===fn)listeners.delete(name); }
  };
  class Observer {
    constructor(callback) { this.callback=callback;this.active=false;observer=this; }
    observe(node,opts) {
      assert.equal(node,document.documentElement);
      assert.deepEqual(opts.attributeFilter,['data-bq-effective-motion','data-bq-motion']);
      this.active=true;
    }
    disconnect() {this.active=false;}
    fire() {if(this.active)this.callback();}
  }
  return { ...f, media, document, listeners, get observer(){return observer;},
    environment:{document,matchMedia:()=>media,MutationObserver:Observer} };
}

test('switching OS preference to reduced motion cancels an in-flight animation immediately',()=>{
  const f=changingPreferencesFixture();
  pageTransition(f.element,{environment:f.environment});
  assert.equal(f.records.length,1);
  assert.equal(f.media.callbacks.size,1);
  assert.equal(f.observer.active,true);
  f.media.matches=true;
  f.media.fire();
  assert.equal(f.records[0].cancelled,1);
  assert.equal(f.media.callbacks.size,0,'cancel detaches media listener');
  assert.equal(f.observer.active,false,'cancel disconnects DOM observer');
  assert.equal(f.listeners.size,0,'cancel detaches visibility listener');
  f.media.fire();
  assert.equal(f.records[0].cancelled,1,'stale preference event never double-cancels');
});

test('changing in-app reduce/off preference cancels current effect without another tap',()=>{
  const f=changingPreferencesFixture();
  cardReveal(f.element,{environment:f.environment});
  f.document.documentElement.dataset.bqEffectiveMotion='reduce';
  f.observer.fire();
  assert.equal(f.records[0].cancelled,1);
  f.document.documentElement.dataset.bqEffectiveMotion='';
  deckSpring(f.element,{delta:10,environment:f.environment});
  assert.equal(f.records.length,2);
  f.document.documentElement.dataset.bqMotion='off';
  f.observer.fire();
  assert.equal(f.records[1].cancelled,1);
});

test('backgrounding app cancels motion and detaches visibility observer',()=>{
  const f=changingPreferencesFixture();
  const stop=pressFeedback(f.element,{environment:f.environment});
  assert.equal(f.listeners.has('visibilitychange'),true);
  f.document.hidden=true;
  f.listeners.get('visibilitychange')();
  assert.equal(f.records[0].cancelled,1);
  stop();
  assert.equal(f.records[0].cancelled,1);
  assert.equal(f.listeners.size,0);
});

test('finishing current WAAPI animation removes listeners without cancelling completed effect',async()=>{
  const f=changingPreferencesFixture();
  let resolveFinished;
  f.element.animate=(frames,options)=>{
    const item={frames,options,cancelled:0,cancel(){this.cancelled++;},
      finished:new Promise(resolve=>{resolveFinished=resolve;})};
    f.records.push(item);return item;
  };
  const stop=pageTransition(f.element,{environment:f.environment});
  assert.equal(f.media.callbacks.size,1);
  resolveFinished();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(f.media.callbacks.size,0,'completed effect detaches media listener');
  assert.equal(f.observer.active,false,'completed effect disconnects observer');
  assert.equal(f.listeners.size,0);
  stop();
  assert.equal(f.records[0].cancelled,1,'returned cleanup remains idempotent');
});
