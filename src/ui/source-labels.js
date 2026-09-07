const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function sourceLabel(source,{compact=false}={}){
  if(!source?.label||!source?.detail)throw new Error('Source label requires label and detail.');
  return `<aside class="bq-source-notice${compact?' is-compact':''}" data-source-kind="${escapeHtml(source.kind||'source')}"><span class="bq-source-badge">${escapeHtml(source.label)}</span><p>${escapeHtml(source.detail)}</p></aside>`;
}

export function sourceGuide({translations=[],recall=null,custom=[]}={}){
  const translationRows=translations.map(item=>`<article><span class="bq-source-badge">${escapeHtml(item.label)}</span><p><b>${escapeHtml(item.source)}</b> · ${escapeHtml(item.license)}</p><small>${escapeHtml(item.attribution)}</small></article>`).join('');
  const recallRow=recall?`<article><span class="bq-source-badge">Open recall questions</span><p><b>${escapeHtml(recall.source)}</b> · ${escapeHtml(recall.license)}</p><small>Reference answers are study-resource content; Scripture references identify where to examine the biblical text.</small></article>`:'';
  const customRows=custom.map(item=>`<article><span class="bq-source-badge">${escapeHtml(item.label)}</span><p>${escapeHtml(item.detail)}</p></article>`).join('');
  return `<section class="bq-panel bq-source-guide" data-source-guide><p class="bq-eyebrow">SOURCES &amp; CONTENT TYPES</p><h2>Know what kind of text you are reading</h2><p>Actual Scripture, open study-resource answers, Bible retellings, and BibleQuest-authored study/application prose are labeled differently. A Scripture reference is not presented as though it were a quotation.</p><div class="bq-source-guide-grid">${translationRows}${recallRow}${customRows}</div></section>`;
}
