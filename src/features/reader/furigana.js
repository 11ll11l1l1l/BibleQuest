const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function japaneseFuriganaControl(state={mode:'support'}){
  const mode=state?.mode||'support';
  const option=(value,label)=>`<option value="${escapeHtml(value)}" ${mode===value?'selected':''}>${escapeHtml(label)}</option>`;
  return `<label data-jp-furigana-control>ふりがな<select data-reader-furigana aria-label="Japanese furigana mode">${option('off','OFF')}${option('support','難しい語だけ')}${option('all','すべて')}</select></label>`;
}
