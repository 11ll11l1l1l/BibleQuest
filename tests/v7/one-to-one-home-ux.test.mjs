import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { oneToOnePage } from '../../src/features/one-to-one/index.js';

const tick = () => new Promise(resolve => setImmediate(resolve));

test('ONE 2 ONE overview makes invitation primary and groups mentor/context actions below relationships', () => {
  const view = oneToOnePage({
    service: { async listPairs() { return []; } },
    subscribeContext() { return () => {}; },
    onAccount() {}, onCongregation() {}, onBack() {},
  });
  const html = view.html;
  assert.match(html, /class="bq-panel bq-one2one-home"/);
  assert.match(html, /class="bq-primary-button" data-pair-invite/);
  assert.equal((html.match(/class="bq-primary-button"/g) || []).length, 1);
  const relationship = html.indexOf('data-pair-results');
  const tools = html.indexOf('bq-one2one-home__tools');
  const context = html.indexOf('bq-one2one-home__context');
  assert.ok(relationship > 0 && tools > relationship && context > tools);
  for (const key of ['retry', 'account', 'congregation', 'back', 'authoring', 'assignments', 'invite']) {
    assert.match(html, new RegExp('data-pair-' + key));
  }
});

test('ONE 2 ONE overview clears relationships on account/congregation switch', async () => {
  let ready = true;
  let contextListener;
  const status = { textContent: '' };
  const listeners = new Map();
  const results = {
    innerHTML: '',
    addEventListener(name, fn) { listeners.set(name, fn); },
    removeEventListener(name) { listeners.delete(name); },
  };
  const controls = new Map();
  const root = {
    querySelector(selector) {
      if (selector === '[data-pair-status]') return status;
      if (selector === '[data-pair-results]') return results;
      if (!controls.has(selector)) controls.set(selector, { addEventListener() {}, removeEventListener() {} });
      return controls.get(selector);
    },
  };
  const view = oneToOnePage({
    service: { async listPairs() { return [{ id: 'pair-1', state: 'active' }]; } },
    subscribeContext(fn) { contextListener = fn; return () => { contextListener = null; }; },
    isContextReady: () => ready,
    onAccount() {}, onCongregation() {}, onBack() {},
  });
  const dispose = view.mount(root);
  await tick();
  assert.match(results.innerHTML, /data-open-pair="pair-1"/);
  ready = false;
  contextListener();
  assert.equal(results.innerHTML, '');
  assert.notEqual(status.textContent, '');
  dispose();
  assert.equal(listeners.size, 0);
  assert.equal(contextListener, null);
});

test('ONE 2 ONE hero keeps live text, one primary action and a complete static no-image state', () => {
  const view = oneToOnePage({
    service: { async listPairs() { return []; } },
    subscribeContext() { return () => {}; },
    onAccount() {}, onCongregation() {}, onBack() {},
  });
  assert.match(view.html, /data-one-to-one-hero data-cover-state="fallback"/);
  assert.match(view.html, /data-one-to-one-art aria-hidden="true"/);
  assert.match(view.html, /bq-one2one-home__hero-copy/);
  assert.match(view.html, /<h1>ONE 2 ONE<\/h1>/);
  assert.match(view.html, /data-pair-invite/);
  assert.equal((view.html.match(/class="bq-primary-button"/g)||[]).length, 1);
  const css = readFileSync(new URL('../../src/ui/v7-one-to-one-lesson.css', import.meta.url), 'utf8');
  assert.match(css, /\.bq-one2one-home__hero::after/);
  assert.match(css, /\.bq-one2one-home__cover-image/);
  assert.match(css, /\.bq-one2one-home__hero-copy/);
  assert.match(css, /rgba\(12, 27, 35, \.88\)/, 'Contrast scrim must remain even over new artwork.');
});

test('ONE 2 ONE accepts only a local audited resolver result, never an arbitrary remote or file URL', async () => {
  let submitted = 0;
  let imageCount = 0;
  const hero = {
    dataset: { coverState: 'fallback' },
    querySelector(selector) { return selector === '[data-one-to-one-art]' ? art : null; },
  };
  const art = {
    ownerDocument: {
      createElement(tag) {
        assert.equal(tag, 'img');
        const listeners = new Map();
        const img = {
          isConnected: true, src: '', alt: '', decoding: '', loading: '',
          addEventListener(name, fn) { listeners.set(name, fn); },
          setAttribute() {},
          remove() { this.isConnected = false; },
          fire(name) { listeners.get(name)?.(); },
        };
        return img;
      },
    },
    prepend(img) { imageCount += 1; this.image = img; },
  };
  const results = { innerHTML: '', addEventListener() {}, removeEventListener() {} };
  const status = { textContent: '' };
  const root = {
    querySelector(selector) {
      if (selector === '[data-one-to-one-hero]') return hero;
      if (selector === '[data-pair-results]') return results;
      if (selector === '[data-pair-status]') return status;
      return { addEventListener() {}, removeEventListener() {} };
    },
  };
  const makeView = coverProvider => oneToOnePage({
    service: { async listPairs() { return []; } },
    subscribeContext() { return () => {}; },
    isContextReady() { return false; },
    coverProvider,
    onAccount() {}, onCongregation() {}, onBack() {},
  });

  const bad = makeView(() => ({ assetId: 'bqv7-unsafe', src: 'https://untrusted.example.org/user-art.webp' }));
  const badCleanup = bad.mount(root);
  await tick(); await tick();
  assert.equal(imageCount, 0);
  assert.equal(hero.dataset.coverState, 'fallback');
  badCleanup();

  const good = makeView(key => {
    submitted += 1;
    assert.equal(key, 'one-to-one:overview');
    return { assetId: 'bqv7-one2one-first-01', src: '/v7/images/one2one/bqv7-one2one-first-01.webp' };
  });
  const dispose = good.mount(root);
  await tick(); await tick();
  assert.equal(submitted, 1);
  assert.equal(imageCount, 1);
  assert.equal(art.image.alt, '');
  assert.equal(art.image.src, '/v7/images/one2one/bqv7-one2one-first-01.webp');
  art.image.fire('load');
  assert.equal(hero.dataset.coverState, 'ready');
  art.image.fire('error');
  assert.equal(hero.dataset.coverState, 'fallback', 'Missing image must restore intentional art.');
  assert.equal(art.image.isConnected, false);
  dispose();
});
