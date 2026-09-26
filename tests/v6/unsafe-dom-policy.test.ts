import assert from 'node:assert/strict';
import test from 'node:test';

import { findForbiddenRuntimeViolations } from '../../scripts/v6-lint.mjs';

const rejects = [
  ['eval', "eval('payload')", 'eval() is forbidden in V6 client source'],
  ['Function constructor', "const fn = new Function('return 1')", 'new Function() is forbidden in V6 client source'],
  ['document.write', "document.write('<p>unsafe</p>')", 'document.write() is forbidden in V6 client source'],
  ['string timeout', "setTimeout('runUnsafe()', 1)", 'string-based setTimeout() is forbidden in V6 client source'],
  ['global string interval', 'globalThis.setInterval("runUnsafe()", 10)', 'string-based setInterval() is forbidden in V6 client source'],
  ['srcdoc property', 'frame.srcdoc = userMarkup', 'srcdoc injection is forbidden in V6 client source'],
  ['srcdoc attribute', "frame.setAttribute('srcdoc', userMarkup)", 'srcdoc injection is forbidden in V6 client source'],
  ['inline event attribute', "node.setAttribute('onclick', handlerText)", 'inline event-handler attribute injection is forbidden in V6 client source'],
] as const;

for (const [name, source, label] of rejects) {
  test(`unsafe DOM policy rejects ${name}`, () => {
    assert.ok(findForbiddenRuntimeViolations(source).includes(label));
  });
}

test('unsafe DOM policy keeps function timers and event-listener APIs available', () => {
  const source = [
    'setTimeout(() => refresh(), 100);',
    'globalThis.setInterval(poll, 1000);',
    "node.addEventListener('click', onClick);",
    'node.onclick = onClick;',
    "node.setAttribute('aria-live', 'polite');",
  ].join('\n');

  assert.deepEqual(findForbiddenRuntimeViolations(source), []);
});

test('unsafe DOM policy deliberately does not treat innerHTML as automatically unsafe', () => {
  const source = "host.innerHTML = renderTrustedTemplate(model);";
  assert.deepEqual(findForbiddenRuntimeViolations(source), []);
});
