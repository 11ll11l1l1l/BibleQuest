const FOCUSABLE = 'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

const visible = element => Boolean(
  element &&
  !element.closest('[hidden]') &&
  element.getAttribute('aria-hidden') !== 'true' &&
  element.getClientRects().length
);

export function keepFocusInDialog(event, dialog) {
  if (event?.key !== 'Tab' || !dialog) return false;
  const items = [...dialog.querySelectorAll(FOCUSABLE)].filter(visible);
  if (!items.length) return false;
  const active = dialog.ownerDocument?.activeElement;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && (active === first || !dialog.contains(active))) {
    event.preventDefault();
    last.focus({ preventScroll: true });
    return true;
  }
  if (!event.shiftKey && (active === last || !dialog.contains(active))) {
    event.preventDefault();
    first.focus({ preventScroll: true });
    return true;
  }
  return false;
}

export function mountAccessibilityRuntime({ accessibility, documentRef = document } = {}) {
  if (!accessibility?.subscribe || !documentRef?.documentElement) throw new Error('Accessibility runtime requires the accessibility service and document.');
  const root = documentRef.documentElement;
  const render = state => {
    root.dataset.bqText = state.text;
    root.dataset.bqMotion = state.motion;
    root.dataset.bqContrast = state.contrast;
    root.dataset.bqEffectiveMotion = state.effectiveMotion;
  };
  const onKeyDown = event => {
    if (event.key !== 'Tab') return;
    const dialogs = [...documentRef.querySelectorAll('[role="dialog"][aria-modal="true"]')].filter(visible);
    const dialog = dialogs.at(-1);
    if (dialog) keepFocusInDialog(event, dialog);
  };
  documentRef.addEventListener('keydown', onKeyDown, true);
  const unsubscribe = accessibility.subscribe(render);
  return Object.freeze({
    dispose() {
      unsubscribe();
      documentRef.removeEventListener('keydown', onKeyDown, true);
    }
  });
}
