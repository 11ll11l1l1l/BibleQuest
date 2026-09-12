const ESCAPE_TABLE = Object.freeze({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' });
const VALID_VARIANTS = new Set(['primary', 'secondary', 'quiet', 'danger']);
const VALID_STATES = new Set(['idle', 'loading', 'ready', 'empty', 'offline', 'error', 'unauthorized']);

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ESCAPE_TABLE[char]);
}

function assertAction(action) {
  if (!action || !/^[a-z][a-z0-9-]*$/.test(action)) {
    throw new TypeError(`Invalid component action: ${String(action)}`);
  }
  return action;
}

export function actionButton({ label, action, variant = 'secondary', disabled = false, ariaLabel = '', icon = '' }) {
  if (!VALID_VARIANTS.has(variant)) throw new TypeError(`Unsupported button variant: ${variant}`);
  const safeAction = assertAction(action);
  const visibleLabel = escapeHtml(label);
  const accessibleLabel = ariaLabel ? ` aria-label="${escapeHtml(ariaLabel)}"` : '';
  const disabledAttr = disabled ? ' disabled aria-disabled="true"' : '';
  const iconHtml = icon ? `<span class="bq-icon" aria-hidden="true">${escapeHtml(icon)}</span>` : '';
  return `<button type="button" class="bq-v5-button bq-v5-button--${variant}" data-bq-action="${safeAction}"${accessibleLabel}${disabledAttr}>${iconHtml}<span>${visibleLabel}</span></button>`;
}

export function statusPanel({ state, title, message = '', action = null }) {
  if (!VALID_STATES.has(state)) throw new TypeError(`Unsupported view state: ${state}`);
  const live = state === 'error' ? 'assertive' : (state === 'loading' ? 'polite' : 'off');
  const role = state === 'error' ? 'alert' : 'status';
  const actionHtml = action ? `<div class="bq-v5-status__actions">${actionButton(action)}</div>` : '';
  return `<section class="bq-v5-status bq-v5-status--${state}" data-bq-view-state="${state}" role="${role}" aria-live="${live}"><h2>${escapeHtml(title)}</h2>${message ? `<p>${escapeHtml(message)}</p>` : ''}${actionHtml}</section>`;
}

export function emptyState({ title, message, action = null }) {
  return statusPanel({ state: 'empty', title, message, action });
}

export function loadingState({ title = 'Loading', message = '' } = {}) {
  return statusPanel({ state: 'loading', title, message });
}

export function errorState({ title = 'Something went wrong', message = '', retryAction = null } = {}) {
  return statusPanel({ state: 'error', title, message, action: retryAction });
}

export function dialogFrame({ id, title, bodyHtml, closeAction = 'close-dialog', describedBy = '' }) {
  if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new TypeError(`Invalid dialog id: ${String(id)}`);
  const titleId = `${id}-title`;
  const descriptionAttr = describedBy ? ` aria-describedby="${escapeHtml(describedBy)}"` : '';
  return `<dialog class="bq-v5-dialog" data-bq-dialog="${escapeHtml(id)}" aria-labelledby="${titleId}"${descriptionAttr}><div class="bq-v5-dialog__surface"><header><h2 id="${titleId}">${escapeHtml(title)}</h2>${actionButton({ label: 'Close', action: closeAction, variant: 'quiet', ariaLabel: `Close ${title}` })}</header><div class="bq-v5-dialog__body">${bodyHtml}</div></div></dialog>`;
}

export function viewState(value = 'idle') {
  if (!VALID_STATES.has(value)) throw new TypeError(`Unsupported view state: ${value}`);
  return Object.freeze({ kind: value });
}
