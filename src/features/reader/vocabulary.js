const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function japaneseVocabularyControl({enabled}){
  return `<button type="button" class="bq-secondary-button bq-jp-vocab-toggle ${enabled?'is-active':''}" data-jp-vocab-toggle aria-pressed="${enabled?'true':'false'}">日本語ポイント ${enabled?'ON':'OFF'}</button>`;
}

export function japaneseVocabularyBlock({notes}){
  const rows=Array.isArray(notes)?notes:[];
  const content=rows.length
    ? rows.map(item=>`<article class="bq-jp-word"><div><b>${escapeHtml(item.term)}</b><span>${escapeHtml(item.reading)}</span></div><p>${escapeHtml(item.simple)}</p><small>${escapeHtml(item.meaning)}${item.en?` · ${escapeHtml(item.en)}`:''}</small></article>`).join('')
    : '<p class="bq-jp-vocab-empty">この節には追加の語彙メモはありません。本文をそのまま読み進めてください。</p>';
  return `<section class="bq-jp-vocab" data-jp-vocab><div class="bq-jp-vocab-head"><span>あ</span><div><b>日本語ポイント</b><small>この節の語彙を確認</small></div></div><div class="bq-jp-vocab-list">${content}</div><p class="bq-jp-vocab-disclaimer">ここに表示される読み方・現代語の説明・英語の意味は学習補助であり、聖書本文ではありません。</p></section>`;
}
