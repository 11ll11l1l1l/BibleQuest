const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function japaneseFuriganaControl(state={mode:'support'}){
  const mode=state?.mode||'support';
  const option=(value,label)=>`<option value="${escapeHtml(value)}" ${mode===value?'selected':''}>${escapeHtml(label)}</option>`;
  return `<label data-jp-furigana-control>ふりがな<select data-reader-furigana aria-label="Japanese furigana mode">${option('off','OFF')}${option('support','難しい語だけ')}${option('all','すべて')}</select></label>`;
}


export function japaneseFuriganaRecoveryStatus({fallback=false,retrying=false}={}){
  if(retrying) return '<p class="bq-reader-note" data-jp-furigana-retrying>ふりがなを再読み込みしています…</p>';
  if(!fallback) return '';
  return '<div class="bq-reader-note" data-jp-furigana-fallback role="status"><p>すべてのふりがなを読み込めませんでした。聖書本文は保持したまま、利用できる読み方だけを表示しています。</p><button type="button" class="bq-secondary-button" data-reader-furigana-retry>ふりがなを再試行</button></div>';
}
