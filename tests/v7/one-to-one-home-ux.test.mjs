import test from 'node:test';
import assert from 'node:assert/strict';
import { oneToOnePage } from '../../src/features/one-to-one/index.js';

const tick = () => new Promise(resolve => setImmediate(resolve));

test('ONE 2 ONE overview makes invitation primary and groups mentor/context actions below relationships', () => {
  const view = oneToOnePage({
    service: { async listPairs() { return []; } },
    subscribeContext() { return () => {}; },
    onAccount() {}, onCongregation() {}, onBack() {},
  });
  const html = view.html;
  assert.match(html, /class="bq-one2one-home"/);
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
