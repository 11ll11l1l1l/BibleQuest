// Bounded V5 runtime guards for defects confirmed by the 2026-09-14 Luna live-user pass.
// These are intentionally local presentation/session protections; V6 owns broader state architecture.

const DAILY_FORM = '[data-daily-text-form]';
const DAILY_TEXTAREA = 'textarea[name="response"]';
const DAILY_SAVE = '[data-daily-save]';
const DAILY_MESSAGE = '[data-daily-message]';
const DAILY_ERROR_ID = 'bq-daily-response-required';
const DAILY_ERROR_TEXT = 'Please enter a response before saving this step.';
const ACTIVE_GAME_QUESTION = '[data-games-page] [data-game-question]';

function dailyTextareaFromForm(form) {
  return form?.querySelector?.(DAILY_TEXTAREA) || null;
}

function dailyFormFromNode(node) {
  return node?.closest?.(DAILY_FORM) || null;
}

function dailyMessageFor(form) {
  return form?.closest?.('[data-daily-step]')?.querySelector?.(DAILY_MESSAGE)
    || form?.parentElement?.querySelector?.(DAILY_MESSAGE)
    || null;
}

function describeWith(textarea, id) {
  const current = String(textarea.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
  if (!current.includes(id)) current.push(id);
  textarea.setAttribute('aria-describedby', current.join(' '));
}

function showDailyRequiredError(textarea) {
  const form = dailyFormFromNode(textarea);
  if (!form) return false;
  const message = dailyMessageFor(form);
  if (message) {
    message.id = DAILY_ERROR_ID;
    message.setAttribute('role', 'alert');
    message.textContent = DAILY_ERROR_TEXT;
    describeWith(textarea, DAILY_ERROR_ID);
  }
  textarea.setAttribute('aria-invalid', 'true');
  textarea.focus();
  return true;
}

function clearDailyRequiredError(textarea) {
  const form = dailyFormFromNode(textarea);
  if (!form) return;
  textarea.removeAttribute('aria-invalid');
  const message = dailyMessageFor(form);
  if (message?.id === DAILY_ERROR_ID && message.textContent === DAILY_ERROR_TEXT) {
    message.textContent = '';
    message.removeAttribute('role');
  }
}

function emptyDailyResponse(textarea) {
  return Boolean(textarea && !textarea.disabled && !String(textarea.value || '').trim());
}

function blockEmptyDailySubmit(event, form) {
  const textarea = dailyTextareaFromForm(form);
  if (!emptyDailyResponse(textarea)) return false;
  event.preventDefault();
  event.stopImmediatePropagation();
  showDailyRequiredError(textarea);
  return true;
}

function installDailyJourneyValidation() {
  // Click capture runs before native constraint validation, ensuring an in-app
  // explanation is visible even when the browser suppresses its own tooltip.
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const save = target?.closest?.(DAILY_SAVE);
    if (!save) return;
    blockEmptyDailySubmit(event, dailyFormFromNode(save));
  }, true);

  // Keyboard/programmatic submit fallback.
  document.addEventListener('submit', event => {
    const form = event.target instanceof HTMLFormElement ? event.target : null;
    if (!form?.matches(DAILY_FORM)) return;
    blockEmptyDailySubmit(event, form);
  }, true);

  // Native invalid is non-bubbling, so capture it and replace opaque browser
  // behavior with the same visible, accessible field guidance.
  document.addEventListener('invalid', event => {
    const textarea = event.target instanceof HTMLTextAreaElement ? event.target : null;
    if (!textarea?.matches(DAILY_TEXTAREA) || !dailyFormFromNode(textarea)) return;
    event.preventDefault();
    showDailyRequiredError(textarea);
  }, true);

  document.addEventListener('input', event => {
    const textarea = event.target instanceof HTMLTextAreaElement ? event.target : null;
    if (!textarea?.matches(DAILY_TEXTAREA) || !dailyFormFromNode(textarea)) return;
    if (String(textarea.value || '').trim()) clearDailyRequiredError(textarea);
  });
}

function hasActiveQuizRound() {
  return Boolean(document.querySelector(ACTIVE_GAME_QUESTION));
}

function installQuizRefreshWarning() {
  window.addEventListener('beforeunload', event => {
    if (!hasActiveQuizRound()) return;
    // Browsers deliberately ignore custom beforeunload text, but setting
    // returnValue requests the standard leave/reload confirmation dialog.
    event.preventDefault();
    event.returnValue = '';
  });
}

export function installV5LunaRegressionGuards() {
  installDailyJourneyValidation();
  installQuizRefreshWarning();
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  installV5LunaRegressionGuards();
}
