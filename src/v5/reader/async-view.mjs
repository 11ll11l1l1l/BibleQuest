import { errorState, loadingState } from '../ui/primitives.mjs';

const shell = body => `<section class="bq-panel bq-reader-async" data-reader-async><p class="bq-eyebrow">BIBLE READER</p><h1>Bible Reader</h1>${body}</section>`;

export function renderReaderLoading(message = 'Loading chapter…') {
  return shell(loadingState({ title: 'Loading Scripture', message }));
}

export function renderReaderError(error, { japanese = false } = {}) {
  const message = error?.message || 'Could not load Scripture.';
  const status = errorState({ title: 'Scripture unavailable', message });
  const japaneseNotice = japanese ? '<p data-jko-failure>口語訳はライブの章データです。本文を推測したり別の訳で置き換えたりしません。接続を確認して再試行するか、明示的にBSBへ切り替えてください。</p>' : '';
  const bsb = japanese ? '<button type="button" class="bq-secondary-button" data-reader-use-bsb>Use BSB</button>' : '';
  return shell(`${status}${japaneseNotice}<div class="bq-reader-nav"><button type="button" class="bq-secondary-button" data-reader-retry>Retry</button>${bsb}</div>`);
}
