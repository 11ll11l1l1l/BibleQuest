import { toSafeFailure } from '../../../v6/kernel/errors.ts';

export function renderGamesLoadingView({text,escapeHtml}) {
  return `<section class="bq-panel" role="status"><p class="bq-eyebrow">PLAY</p><h1>${escapeHtml(text)}</h1><p>Loading only the content this activity needs.</p></section>`;
}

export function renderGamesErrorView({error,escapeHtml}) {
  const failure=toSafeFailure(error);
  return `<section class="bq-panel" role="alert" data-game-error="${escapeHtml(failure.kind)}"><h1>Game could not continue</h1><p>${escapeHtml(failure.message)}</p><button type="button" class="bq-secondary-button" data-game-launcher>Back to games</button></section>`;
}
