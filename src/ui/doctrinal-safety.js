const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function doctrinalNotice(safety,{compact=false}={}){
  if(!safety||!['context','neutral'].includes(safety.action))return'';
  const label=safety.action==='context'?'PASSAGE CONTEXT':'INTERPRETIVE / WISDOM';
  const detail=String(safety.contextNote||safety.reason||'').trim();
  if(!detail)return'';
  return `<aside class="bq-doctrinal-notice${compact?' is-compact':''}" data-doctrinal-action="${esc(safety.action)}"><b>${label}</b><p>${esc(detail)}</p></aside>`;
}
