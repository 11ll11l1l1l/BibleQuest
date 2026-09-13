import assert from 'node:assert/strict';
import { createViewMount } from '../src/v5/ui/view-mount.mjs';

function makeRoot() {
  const listeners = new Map();
  return {
    innerHTML: '',
    added: [],
    removed: [],
    addEventListener(type, handler) {
      this.added.push(type);
      listeners.set(type, handler);
    },
    removeEventListener(type, handler) {
      this.removed.push(type);
      if (listeners.get(type) === handler) listeners.delete(type);
    },
    contains(element) {
      return element?.inside !== false;
    },
    fire(type, event) {
      listeners.get(type)?.(event);
    },
    listenerCount() {
      return listeners.size;
    },
  };
}

function makeAction({ action = 'retry-reader', disabled = false, ariaDisabled = null, inside = true } = {}) {
  return {
    dataset: { bqAction: action },
    disabled,
    inside,
    getAttribute(name) {
      return name === 'aria-disabled' ? ariaDisabled : null;
    },
    closest(selector) {
      assert.equal(selector, '[data-bq-action]');
      return this;
    },
  };
}

{
  const root = makeRoot();
  const actions = [];
  const mount = createViewMount({ root, onAction: payload => actions.push(payload) });

  assert.deepEqual(root.added, ['click'], 'one delegated click listener should own actions');
  assert.equal(root.listenerCount(), 1);
  assert.equal(root.added.includes('keydown'), false, 'native controls should keep native keyboard activation');

  mount.render('<button data-bq-action="retry-reader">Retry</button>');
  assert.match(root.innerHTML, /retry-reader/);

  const button = makeAction();
  root.fire('click', { target: button, detail: 0 });
  assert.equal(actions.length, 1);
  assert.equal(actions[0].action, 'retry-reader');
  assert.equal(actions[0].source, button);

  const child = { closest: () => button };
  root.fire('click', { target: child });
  assert.equal(actions.length, 2, 'nested content should resolve to the owning action element');

  root.fire('click', { target: makeAction({ disabled: true }) });
  root.fire('click', { target: makeAction({ ariaDisabled: 'true' }) });
  root.fire('click', { target: makeAction({ inside: false }) });
  assert.equal(actions.length, 2, 'disabled or out-of-root actions must not dispatch');

  mount.clear();
  assert.equal(root.innerHTML, '');

  mount.dispose();
  assert.equal(mount.disposed, true);
  assert.deepEqual(root.removed, ['click']);
  assert.equal(root.listenerCount(), 0);

  root.fire('click', { target: makeAction() });
  assert.equal(actions.length, 2, 'disposed mounts must not dispatch');
  assert.throws(() => mount.render('late'), /disposed/);

  mount.dispose();
  assert.deepEqual(root.removed, ['click'], 'dispose should be idempotent');
}

assert.throws(() => createViewMount({ root: {}, onAction() {} }), /DOM-like root/);
assert.throws(() => createViewMount({ root: makeRoot(), onAction: null }), /onAction/);

console.log('v5 view mount characterization: PASS');
