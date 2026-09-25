import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canRestoreFocus,
  createFocusReturn,
  isKeyboardActivationKey,
  resolveRovingFocus,
  resolveTabFocus,
  restoreFocus,
  type FocusReturnTarget,
} from '../../src/v6/ui/index.ts';

test('keyboard activation accepts only Enter and Space', () => {
  assert.equal(isKeyboardActivationKey('Enter'), true);
  assert.equal(isKeyboardActivationKey(' '), true);
  assert.equal(isKeyboardActivationKey('Spacebar'), false);
  assert.equal(isKeyboardActivationKey('ArrowDown'), false);
});

test('roving focus supports horizontal LTR/RTL navigation, wrapping, Home, and End', () => {
  assert.deepEqual(
    resolveRovingFocus({ key: 'ArrowRight', currentIndex: 1, itemCount: 3, orientation: 'horizontal' }),
    { handled: true, index: 2 },
  );
  assert.deepEqual(
    resolveRovingFocus({ key: 'ArrowRight', currentIndex: 2, itemCount: 3, orientation: 'horizontal' }),
    { handled: true, index: 0 },
  );
  assert.deepEqual(
    resolveRovingFocus({
      key: 'ArrowRight',
      currentIndex: 1,
      itemCount: 3,
      orientation: 'horizontal',
      direction: 'rtl',
    }),
    { handled: true, index: 0 },
  );
  assert.deepEqual(
    resolveRovingFocus({ key: 'Home', currentIndex: 2, itemCount: 3, orientation: 'horizontal' }),
    { handled: true, index: 0 },
  );
  assert.deepEqual(
    resolveRovingFocus({ key: 'End', currentIndex: 0, itemCount: 3, orientation: 'horizontal' }),
    { handled: true, index: 2 },
  );
});

test('roving focus skips disabled items and can stop at an edge', () => {
  assert.deepEqual(
    resolveRovingFocus({
      key: 'ArrowDown',
      currentIndex: 0,
      itemCount: 5,
      orientation: 'vertical',
      disabledIndices: [1, 3],
    }),
    { handled: true, index: 2 },
  );
  assert.deepEqual(
    resolveRovingFocus({
      key: 'ArrowDown',
      currentIndex: 4,
      itemCount: 5,
      orientation: 'vertical',
      disabledIndices: [1, 3],
      wrap: false,
    }),
    { handled: true, index: 4 },
  );
  assert.deepEqual(
    resolveRovingFocus({
      key: 'End',
      currentIndex: 0,
      itemCount: 5,
      orientation: 'vertical',
      disabledIndices: [4],
    }),
    { handled: true, index: 3 },
  );
});

test('roving focus fails closed for malformed state or unsupported keys', () => {
  assert.deepEqual(
    resolveRovingFocus({ key: 'ArrowRight', currentIndex: 0, itemCount: 0, orientation: 'horizontal' }),
    { handled: false, index: 0 },
  );
  assert.deepEqual(
    resolveRovingFocus({
      key: 'ArrowRight',
      currentIndex: 1,
      itemCount: 3,
      orientation: 'horizontal',
      disabledIndices: [1],
    }),
    { handled: false, index: 1 },
  );
  assert.deepEqual(
    resolveRovingFocus({ key: 'PageDown', currentIndex: 1, itemCount: 3, orientation: 'both' }),
    { handled: false, index: 1 },
  );
});

function target(overrides: Partial<FocusReturnTarget> = {}) {
  const calls: FocusOptions[] = [];
  const value: FocusReturnTarget = {
    isConnected: true,
    disabled: false,
    hidden: false,
    getAttribute: () => null,
    focus: (options) => calls.push(options ?? {}),
    ...overrides,
  };
  return { value, calls };
}

test('focus return restores a valid target once with scroll protection', () => {
  const item = target();
  assert.equal(canRestoreFocus(item.value), true);
  assert.equal(restoreFocus(item.value), true);
  assert.equal(item.calls.length, 1);
  assert.deepEqual(item.calls[0], { preventScroll: true });

  const once = createFocusReturn(item.value, { preventScroll: false });
  assert.equal(once(), true);
  assert.equal(once(), false);
  assert.deepEqual(item.calls[1], { preventScroll: false });
});

test('focus return rejects disconnected, disabled, hidden, inert, or aria-hidden targets', () => {
  assert.equal(restoreFocus(target({ isConnected: false }).value), false);
  assert.equal(restoreFocus(target({ disabled: true }).value), false);
  assert.equal(restoreFocus(target({ hidden: true }).value), false);
  assert.equal(restoreFocus(target({ getAttribute: (name) => (name === 'inert' ? '' : null) }).value), false);
  assert.equal(
    restoreFocus(target({ getAttribute: (name) => (name === 'aria-hidden' ? 'true' : null) }).value),
    false,
  );
});

test('focus return contains focus exceptions instead of breaking close/navigation flows', () => {
  const throwing = target({
    focus: () => {
      throw new Error('detached during teardown');
    },
  });

  assert.equal(restoreFocus(throwing.value), false);
});


test('Tab focus resolver contains forward and reverse focus inside a bounded dialog', () => {
  assert.deepEqual(resolveTabFocus({ key: 'Tab', currentIndex: 0, itemCount: 4 }), {
    handled: true,
    index: 1,
  });
  assert.deepEqual(resolveTabFocus({ key: 'Tab', currentIndex: 3, itemCount: 4 }), {
    handled: true,
    index: 0,
  });
  assert.deepEqual(resolveTabFocus({ key: 'Tab', shiftKey: true, currentIndex: 0, itemCount: 4 }), {
    handled: true,
    index: 3,
  });
  assert.deepEqual(resolveTabFocus({ key: 'Tab', shiftKey: true, currentIndex: 2, itemCount: 4 }), {
    handled: true,
    index: 1,
  });
});

test('Tab focus resolver recovers missing focus and fails closed for invalid state', () => {
  assert.deepEqual(resolveTabFocus({ key: 'Tab', currentIndex: -1, itemCount: 3 }), {
    handled: true,
    index: 0,
  });
  assert.deepEqual(resolveTabFocus({ key: 'Tab', shiftKey: true, currentIndex: -1, itemCount: 3 }), {
    handled: true,
    index: 2,
  });
  assert.deepEqual(resolveTabFocus({ key: 'Escape', currentIndex: 0, itemCount: 3 }), {
    handled: false,
    index: 0,
  });
  assert.deepEqual(resolveTabFocus({ key: 'Tab', currentIndex: 0, itemCount: 0 }), {
    handled: false,
    index: 0,
  });
});
