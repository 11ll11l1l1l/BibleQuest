(() => {
  'use strict';
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const genericTitles=new Set(['biblequest','continue my journey','daily journey','smart review','community','leaderboards','achievements','bible reader','grow together','play together','think deeper','bible world','my mission']);
  let layer=null,current=null;

  function visible(el){if(!el||!(el instanceof Element))return false;const r=el.getBoundingClientRect(),s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&r.width>1&&r.height>1&&r.bottom>0&&r.top<innerHeight}
  function activeSurface(){
    const overlays=[...document.querySelectorAll('[id$="Layer"]:not(.hidden),.modern-sheet:not(.hidden),.reader-layer:not(.hidden),.community-layer:not(.hidden)')].filter(visible).filter(x=>!x.id?.includes('Account')&&!x.classList.contains('bq-report-layer'));
    return overlays.at(-1)||document.querySelector('#app .app')||document.getElementById('app')||document.body;
  }
  function reference(surface){const text=surface?.innerText||'';return text.match(/(?:[1-3]\s*)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+\d{1,3}:\d{1,3}(?:[-–]\d{1,3})?/)?.[0]||''}
  function scoreCandidate(el){
    if(!visible(el)||el.closest('nav,header,.topbar,.bottom,.modern-footer-row,.cloud-card,.account-layer,.bq-report-layer'))return -999;
    if(el.closest('.verse-list,[data-bq-scripture]')||el.matches('.verse-text'))return -999;
    const text=(el.textContent||'').replace(/\s+/g,' ').trim();if(text.length<8||text.length>420||genericTitles.has(text.toLowerCase()))return -999;
    let score=0;if(text.includes('?'))score+=100;if(/question|prompt|scenario|situation|feedback/i.test(el.className||''))score+=70;if(/^h[1-3]$/i.test(el.tagName))score+=35;if(text.length>=20&&text.length<=240)score+=25;if(/chapter|source|version|leaderboard|congregation|account/i.test(text)&&!text.includes('?'))score-=40;return score;
  }
  function findCurrent(){
    const surface=activeSurface(),candidates=[...surface.querySelectorAll('h1,h2,h3,[class*="question"],[class*="prompt"],[class*="scenario"],[class*="situation"],article p,.learning-feedback p')];
    const ranked=candidates.map(el=>({el,score:scoreCandidate(el)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);if(!ranked.length)return null;
    const text=(ranked[0].el.textContent||'').replace(/\s+/g,' ').trim(),ref=reference(surface),resolved=window.BQContentModeration?.resolve?.(text,ref)||{key:`entry:${Date.now()}`,contentType:text.includes('?')?'question':'statement',ref,answer:'',source:'screen-entry'};
    return {...resolved,text,ref:resolved.ref||ref,surfaceTitle:surface.querySelector('h1,h2')?.textContent?.trim()||document.title};
  }
  function ensureFab(){
    let b=document.querySelector('.bq-report-fab');if(b)return b;b=document.createElement('button');b.type='button';b.className='bq-report-fab';b.textContent='⚑ Report';b.title='Report or flag the current BibleQuest entry for ministry review';b.addEventListener('click',open);document.body.appendChild(b);return b;
  }
  function ensureLayer(){
    if(layer)return layer;layer=document.createElement('div');layer.className='bq-report-layer hidden';layer.innerHTML='<div class="bq-report-scrim" data-report-close></div><section class="bq-report-card" role="dialog" aria-modal="true" aria-labelledby="bqReportTitle"><header><div><small>BIBLEQUEST CONTENT REVIEW</small><h2 id="bqReportTitle">Report this entry</h2><p>Send a specific question or statement to your congregation leaders for review.</p></div><button class="bq-report-close" type="button" data-report-close aria-label="Close">×</button></header><div data-report-body></div></section>';document.body.appendChild(layer);layer.addEventListener('click',e=>{if(e.target.closest('[data-report-close]'))close()});return layer;
  }
  function status(msg,error=false){const box=layer?.querySelector('[data-report-status]');if(!box)return;box.textContent=msg;box.className=`bq-report-status${error?' error':''}`;box.hidden=false}
  function close(){ensureLayer().classList.add('hidden');document.body.style.removeProperty('overflow')}
  function open(){
    current=findCurrent();const l=ensureLayer(),body=l.querySelector('[data-report-body]');
    if(!current){body.innerHTML='<div class="bq-report-status error">Open a BibleQuest question, explanation, scenario or learning entry first, then tap Report.</div><div class="bq-report-actions"><button class="bq-report-cancel" type="button" data-report-close>Close</button></div>';l.classList.remove('hidden');document.body.style.overflow='hidden';return}
    const existing=window.BQContentModeration?.decisionFor?.(current.key)||'';
    body.innerHTML=`<div class="bq-report-preview"><small>${esc(current.ref||current.surfaceTitle||'Current entry')}</small><b>${esc(current.text)}</b>${current.answer?`<p>${esc(current.answer)}</p>`:''}</div>${existing?`<div class="bq-report-status">This entry already has a ministry decision: <b>${esc(existing)}</b>. You may still send a report if there is a new concern.</div>`:''}<form data-report-form><label>Reason</label><select name="reason"><option value="doctrinal">Doctrinal / interpretation concern</option><option value="accuracy">Accuracy or factual concern</option><option value="wording">Confusing or misleading wording</option><option value="inappropriate">Inappropriate for the audience</option><option value="duplicate">Duplicate / repetitive</option><option value="source">Source or reference problem</option><option value="other">Other</option></select><label>Optional note</label><textarea name="note" maxlength="1200" placeholder="What should the pastor or leader check?"></textarea><div class="bq-report-actions"><button class="bq-report-submit" type="submit">Send for review</button><button class="bq-report-cancel" type="button" data-report-close>Cancel</button></div><div data-report-status hidden></div></form>`;
    body.querySelector('[data-report-form]')?.addEventListener('submit',submit);l.classList.remove('hidden');document.body.style.overflow='hidden';
  }
  async function submit(e){
    e.preventDefault();const form=e.currentTarget,button=form.querySelector('.bq-report-submit');button.disabled=true;
    try{
      const cloud=window.BQCloud?.status?.()||{},congregationId=cloud.activeCongregation?.id||window.BQContentModeration?.activeCongregationId?.()||'',session=window.BQAccount?.session?.(),client=window.BQAccount?.client?.()||window.BQ_SUPABASE_CLIENT;
      if(!session?.user||!client)throw new Error('Sign in to BibleQuest before submitting a report.');if(!congregationId)throw new Error('Join or select a congregation before submitting a report.');
      const fd=new FormData(form),row={congregation_id:congregationId,reporter_id:session.user.id,content_key:String(current.key).slice(0,180),content_type:['question','statement','answer','explanation','story','reader','other'].includes(current.contentType)?current.contentType:'other',content_source:String(current.source||'screen-entry').slice(0,120),content_ref:String(current.ref||'').slice(0,160)||null,content_text:String(current.text||'').slice(0,4000),content_payload:{answer:String(current.answer||'').slice(0,2500),screen:String(current.surfaceTitle||'').slice(0,180),path:location.pathname,key:current.key},reason:String(fd.get('reason')||'other'),note:String(fd.get('note')||'').slice(0,1200)||null};
      const r=await client.from('bible_content_reports').insert(row).select('id').single();if(r.error)throw r.error;status('Report sent. Your congregation leaders can now review this exact entry.');form.querySelectorAll('select,textarea,.bq-report-submit').forEach(x=>x.disabled=true);
    }catch(err){status(err.message||String(err),true);button.disabled=false}
  }
  ensureFab();
  window.BQContentReport={open,findCurrent};
})();
