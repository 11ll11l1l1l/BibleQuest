export type UiButtonVariant = 'primary' | 'secondary';
export type UiButtonType = 'button' | 'submit' | 'reset';
export type UiStatusRole = 'status' | 'alert';
export type UiHeadingLevel = 1 | 2 | 3;

type DataValue = string | number | boolean;

export interface UiButtonOptions {
  readonly label: string;
  readonly variant?: UiButtonVariant;
  readonly type?: UiButtonType;
  readonly ariaLabel?: string;
  readonly disabled?: boolean;
  readonly data?: Readonly<Record<string, DataValue>>;
}

export interface UiSelectOption {
  readonly value: string;
  readonly label: string;
}

export interface UiSelectFieldOptions {
  readonly id: string;
  readonly label: string;
  readonly options: readonly UiSelectOption[];
  readonly value?: string;
  readonly data?: Readonly<Record<string, DataValue>>;
}

export interface UiStatusOptions {
  readonly message?: string;
  readonly role?: UiStatusRole;
  readonly live?: 'polite' | 'assertive' | 'off';
  readonly className?: string;
  readonly data?: Readonly<Record<string, DataValue>>;
}

export interface UiCardOptions {
  readonly heading: string;
  readonly headingLevel?: UiHeadingLevel;
  readonly eyebrow?: string;
  readonly description?: string;
  readonly className?: string;
  readonly data?: Readonly<Record<string, DataValue>>;
  readonly actions?: readonly UiButtonOptions[];
}

export interface UiDialogOptions {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly actions?: readonly UiButtonOptions[];
  readonly data?: Readonly<Record<string, DataValue>>;
}

const DATA_KEY = /^[a-z][a-z0-9-]*$/;
const CLASS_TOKEN = /^[a-zA-Z0-9_-]+$/;

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char] ?? char);
}

function classList(base: string, extra = ''): string {
  const tokens = String(extra || '').trim().split(/\s+/).filter(Boolean);
  if (tokens.some((token) => !CLASS_TOKEN.test(token))) {
    throw new Error('UI primitive className contains an unsafe token.');
  }
  return [base, ...tokens].join(' ');
}

function dataAttributes(data: Readonly<Record<string, DataValue>> = {}): string {
  return Object.entries(data).map(([rawKey, rawValue]) => {
    const key = String(rawKey || '').trim().toLowerCase();
    if (!DATA_KEY.test(key)) throw new Error(`Invalid UI primitive data attribute: ${rawKey}`);
    if (rawValue === true) return ` data-${key}`;
    if (rawValue === false) return '';
    return ` data-${key}="${escapeHtml(rawValue)}"`;
  }).join('');
}

export function uiButtonHtml({
  label,
  variant = 'secondary',
  type = 'button',
  ariaLabel,
  disabled = false,
  data = {},
}: UiButtonOptions): string {
  const className = variant === 'primary' ? 'bq-primary-button' : 'bq-secondary-button';
  const aria = ariaLabel ? ` aria-label="${escapeHtml(ariaLabel)}"` : '';
  return `<button type="${type}" class="${className}"${aria}${disabled ? ' disabled' : ''}${dataAttributes(data)}>${escapeHtml(label)}</button>`;
}

export function uiSelectFieldHtml({
  id,
  label,
  options,
  value = '',
  data = {},
}: UiSelectFieldOptions): string {
  const safeId = String(id || '').trim();
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(safeId)) throw new Error('UI select field requires a safe id.');
  if (!options.length) throw new Error('UI select field requires at least one option.');
  const optionHtml = options.map((option) => (
    `<option value="${escapeHtml(option.value)}"${String(option.value) === String(value) ? ' selected' : ''}>${escapeHtml(option.label)}</option>`
  )).join('');
  return `<label for="${safeId}">${escapeHtml(label)}</label><select id="${safeId}"${dataAttributes(data)}>${optionHtml}</select>`;
}

export function uiStatusHtml({
  message = '',
  role = 'status',
  live = role === 'alert' ? 'assertive' : 'polite',
  className = '',
  data = {},
}: UiStatusOptions = {}): string {
  return `<p class="${classList('bq-form-message', className)}" role="${role}" aria-live="${live}"${dataAttributes(data)}>${escapeHtml(message)}</p>`;
}

export function uiCardHtml({
  heading,
  headingLevel = 2,
  eyebrow,
  description,
  className = '',
  data = {},
  actions = [],
}: UiCardOptions): string {
  const headingTag = `h${headingLevel}`;
  const eyebrowHtml = eyebrow ? `<p class="bq-eyebrow">${escapeHtml(eyebrow)}</p>` : '';
  const descriptionHtml = description ? `<p>${escapeHtml(description)}</p>` : '';
  const actionsHtml = actions.length
    ? `<div class="bq-recording-actions">${actions.map((action) => uiButtonHtml(action)).join('')}</div>`
    : '';
  return `<section class="${classList('bq-panel', className)}"${dataAttributes(data)}>${eyebrowHtml}<${headingTag}>${escapeHtml(heading)}</${headingTag}>${descriptionHtml}${actionsHtml}</section>`;
}

export function uiDialogHtml({
  id,
  title,
  description,
  actions = [],
  data = {},
}: UiDialogOptions): string {
  const safeId = String(id || '').trim();
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(safeId)) throw new Error('UI dialog requires a safe id.');
  const titleId = `${safeId}-title`;
  const descriptionHtml = description ? `<p>${escapeHtml(description)}</p>` : '';
  const actionsHtml = actions.length
    ? `<div class="bq-recording-actions">${actions.map((action) => uiButtonHtml(action)).join('')}</div>`
    : '';
  return `<section id="${safeId}" class="bq-panel bq-dialog" role="dialog" aria-modal="true" aria-labelledby="${titleId}"${dataAttributes(data)}><h2 id="${titleId}">${escapeHtml(title)}</h2>${descriptionHtml}${actionsHtml}</section>`;
}

export const uiPrimitiveContract = Object.freeze({
  buttons: Object.freeze(['primary', 'secondary']),
  forms: Object.freeze(['select-field']),
  cards: Object.freeze(['panel']),
  status: Object.freeze(['status', 'alert']),
  dialogs: Object.freeze(['modal-dialog']),
  textEscapedByDefault: true,
});
