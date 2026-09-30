import assert from 'node:assert/strict';
import test from 'node:test';

import { accessibilityPage } from '../../src/features/accessibility/index.js';
import {
  uiButtonHtml,
  uiCardHtml,
  uiDialogHtml,
  uiPrimitiveContract,
  uiSelectFieldHtml,
  uiStatusHtml,
} from '../../src/v6/ui/primitives.ts';

test('shared UI primitives escape text and emit bounded semantic contracts', () => {
  const button = uiButtonHtml({
    label: '<Save>',
    variant: 'primary',
    ariaLabel: 'Save "now"',
    disabled: true,
    data: { action: 'save', busy: true },
  });
  assert.match(button, /class="bq-primary-button"/);
  assert.match(button, /&lt;Save&gt;/);
  assert.match(button, /aria-label="Save &quot;now&quot;"/);
  assert.match(button, / disabled/);
  assert.match(button, /data-action="save"/);
  assert.match(button, /data-busy/);

  assert.throws(
    () => uiButtonHtml({ label: 'Unsafe', data: { 'bad key': 'x' } }),
    /Invalid UI primitive data attribute/,
  );

  const select = uiSelectFieldHtml({
    id: 'sample-select',
    label: 'Choose <one>',
    value: 'b',
    data: { setting: 'sample' },
    options: [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta & beyond' },
    ],
  });
  assert.match(select, /for="sample-select">Choose &lt;one&gt;/);
  assert.match(select, /data-setting="sample"/);
  assert.match(select, /value="b" selected>Beta &amp; beyond/);

  const status = uiStatusHtml({ message: '<Problem>', role: 'alert', data: { result: true } });
  assert.match(status, /role="alert"/);
  assert.match(status, /aria-live="assertive"/);
  assert.match(status, /&lt;Problem&gt;/);

  const card = uiCardHtml({
    eyebrow: 'SECTION',
    heading: 'Safe <card>',
    description: 'Plain & escaped',
    actions: [{ label: 'Continue', variant: 'primary', data: { continue: true } }],
  });
  assert.match(card, /class="bq-panel"/);
  assert.match(card, /Safe &lt;card&gt;/);
  assert.match(card, /Plain &amp; escaped/);
  assert.match(card, /data-continue/);

  const dialog = uiDialogHtml({
    id: 'sample-dialog',
    title: 'Confirm action',
    description: 'This is modal.',
    actions: [{ label: 'Cancel' }, { label: 'Confirm', variant: 'primary' }],
  });
  assert.match(dialog, /role="dialog"/);
  assert.match(dialog, /aria-modal="true"/);
  assert.match(dialog, /aria-labelledby="sample-dialog-title"/);

  assert.deepEqual(uiPrimitiveContract.buttons, ['primary', 'secondary']);
  assert.deepEqual(uiPrimitiveContract.forms, ['select-field']);
  assert.deepEqual(uiPrimitiveContract.cards, ['panel']);
  assert.deepEqual(uiPrimitiveContract.status, ['status', 'alert']);
  assert.deepEqual(uiPrimitiveContract.dialogs, ['modal-dialog']);
  assert.equal(uiPrimitiveContract.textEscapedByDefault, true);
});

test('Accessibility settings adopt shared card, form, button and status primitives', () => {
  const page = accessibilityPage({
    accessibility: {
      subscribe() {
        return () => {};
      },
    },
  });

  assert.match(page.html, /data-accessibility-page/);
  assert.match(page.html, /data-accessibility-setting="text"/);
  assert.match(page.html, /data-accessibility-setting="motion"/);
  assert.match(page.html, /data-accessibility-setting="contrast"/);
  assert.match(page.html, /data-accessibility-reset/);
  assert.match(page.html, /data-accessibility-status/);
  assert.match(page.html, /role="status"/);
});
