(() => {
  'use strict';
  const cfg=window.BQ_CLOUD_CONFIG||{};
  const root=document.getElementById('reviewApp');
  const roleChip=document.getElementById('reviewRole');
  const REVIEW_ROLES=new Set(['leader','pastor','admin']);
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const now=()=>new Date().toISOString();
  let client=null,session=null,siteRole='',congregations=[],memberships=[],currentCongregation='',manifest=null,decisions=[],reports=[],members=[],quarantineRows=[];
  let tab=new URLSearchParams(location.search).get('tab')==='reports'?'reports':'quarantine';
  let selectedBook='',filter='pending',searchTerm='';

  function message(title,body){root.className='review-message';root.innerHTML=`<div class="review-loader">🛡️</div><h1>${esc(title)}</h1><p>${esc(body)}</p><p><a class="review-back" href="./">← Return to BibleQuest</a></p>`}
  function toast(text,error=false){document.querySelector('.review-toast')?.remove();const el=document.createElement('div');el.className=`review-toast${error?' error':''}`;el.textContent=text;document.body.appendChild(el);setTimeout(()=>el.remove(),3200)}
  const roleLabel=r=>({owner:'Owner',admin:'Admin',pastor:'Pastor',leader:'Leader'}[r]||r||'Reviewer');
  const currentCongregationRow=()=>congregations.find(c=>c.id===currentCongregation)||null;
  const decisionMap=()=>new Map(decisions.map(d=>[d.content_key,d]));
  const memberMap=()=>new Map(members.map(m=>[m.user_id,m]));
  const bookRows=()=>manifest?.question_books?.filter(b=>Number(b.quarantined_questions)>0)||[];
  const bookByCode=code=>manifest?.question_books?.find(b=>b.code===code)||null;

  async function createClient(){
    if(!cfg.enabled||!cfg.supabaseUrl||!cfg.publishableKey)throw new Error('Content review is available on the live BibleQuest site.');
    if(!window.supabase?.createClient)throw new Error('Supabase client did not load.');
    client=window.supabase.createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    const r=await client.auth.getSession();if(r.error)throw r.error;session=r.data.session;if(!session?.user)throw new Error('Sign in to BibleQuest before opening Content Review.');
  }

  async function loadAccess(){
    const userId=session.user.id;
    const [access,membershipRows,congRows]=await Promise.all([
      client.from('bible_app_access').select('role,active').eq('user_id',userId).maybeSingle(),
      client.from('bible_congregation_members').select('congregation_id,role,display_name,active').eq('user_id',userId).eq('active',true),
      client.from('bible_congregations').select('id,name,timezone').order('name')
    ]);
    if(access.error)throw access.error;if(membershipRows.error)throw membershipRows.error;if(congRows.error)throw congRows.error;
    siteRole=access.data?.active?String(access.data.role||''):'';memberships=membershipRows.data||[];
    const platformReviewer=['owner','admin'].includes(siteRole);
    const allowedIds=new Set(memberships.filter(m=>REVIEW_ROLES.has(m.role)).map(m=>m.congregation_id));
    congregations=(congRows.data||[]).filter(c=>platformReviewer||allowedIds.has(c.id));
    if(!congregations.length)throw new Error('This account is not a congregation Leader, Pastor or Admin.');
    const stored=localStorage.getItem('biblequest_review_congregation')||'';
    currentCongregation=congregations.some(c=>c.id===stored)?stored:congregations[0].id;
    localStorage.setItem('biblequest_review_congregation',currentCongregation);
    const ministry=memberships.find(m=>m.congregation_id===currentCongregation)?.role||'';
    roleChip.textContent=roleLabel(platformReviewer?siteRole:ministry);
  }

  async function loadManifest(){
    if(manifest)return manifest;
    const r=await fetch('data/packs/manifest.json',{cache:'no-store'});if(!r.ok)throw new Error(`Question manifest returned ${r.status}`);manifest=await r.json();
    const books=bookRows();if(!selectedBook||!books.some(b=>b.code===selectedBook))selectedBook=books[0]?.code||'';
    return manifest;
  }

  async function loadCongregationData(){
    const [decisionRows,reportRows,memberRows]=await Promise.all([
      client.from('bible_content_decisions').select('congregation_id,content_key,content_type,origin,decision,content_ref,content_snapshot,rationale,reviewed_by,reviewed_at,updated_at').eq('congregation_id',currentCongregation).order('updated_at',{ascending:false}).limit(3000),
      client.from('bible_content_reports').select('id,congregation_id,reporter_id,content_key,content_type,content_source,content_ref,content_text,content_payload,reason,note,status,reviewed_by,reviewed_at,created_at,updated_at').eq('congregation_id',currentCongregation).order('created_at',{ascending:false}).limit(500),
      client.from('bible_congregation_members').select('user_id,display_name,role,avatar,active').eq('congregation_id',currentCongregation).eq('active',true)
    ]);
    if(decisionRows.error)throw decisionRows.error;if(reportRows.error)throw reportRows.error;if(memberRows.error)throw memberRows.error;
    decisions=decisionRows.data||[];reports=reportRows.data||[];members=memberRows.data||[];
  }

  async function loadQuarantine(code=selectedBook){
    if(!code){quarantineRows=[];return}
    const r=await fetch(`data/quarantine/questions/${encodeURIComponent(code)}.json`,{cache:'no-store'});
    if(r.status===404){quarantineRows=[];return}if(!r.ok)throw new Error(`Quarantine pack ${code} returned ${r.status}`);
    const rows=await r.json();quarantineRows=Array.isArray(rows)?rows:[];
  }

  function decisionChip(key){const d=decisionMap().get(key),value=d?.decision||'pending';const label={pending:'Pending review',include:'Included',exempt:'Kept quarantined',remove:'Removed'}[value]||value;return `<span class="review-chip ${value}">${esc(label)}</span>`}
  function actionButtons(key,current=''){return `<div class="review-actions" data-review-actions="${esc(key)}"><button data-decision="include" ${current==='include'?'disabled':''}>✓ Include / keep</button><button data-decision="exempt" ${current==='exempt'?'disabled':''}>⏸ Keep quarantined</button><button data-decision="remove" ${current==='remove'?'disabled':''}>✕ Remove</button></div>`}
  function matchesFilter(key){const d=decisionMap().get(key)?.decision||'pending';return filter==='all'||filter===d}
  function matchesSearch(...parts){if(!searchTerm)return true;const hay=parts.join(' ').toLowerCase();return hay.includes(searchTerm.toLowerCase())}

  function quarantineCard(row){
    const book=bookByCode(selectedBook),key=`question:${selectedBook}:${row.id}`,d=decisionMap().get(key),ref=`${book?.name||selectedBook} ${row.r||''}`.trim(),topics=row.safety?.topics||[];
    return `<article class="review-card ${d?.decision||'pending'}" data-review-item data-key="${esc(key)}" data-origin="quarantine" data-type="question" data-ref="${esc(ref)}"><div class="review-card-head"><div><small>${esc(ref)} · ID ${esc(row.id)}</small><h3>${esc(row.q||'')}</h3></div>${decisionChip(key)}</div><div class="review-answer"><b>Reference answer</b><br>${esc(row.a||'')}</div><div class="review-topics">${topics.map(t=>`<span class="review-chip">${esc(t)}</span>`).join('')||'<span class="review-chip">No topic tag</span>'}</div>${d?.rationale?`<div class="review-answer"><b>Latest review note</b><br>${esc(d.rationale)}</div>`:''}${actionButtons(key,d?.decision||'')}</article>`;
  }

  function reportCard(row){
    const d=decisionMap().get(row.content_key),reporter=memberMap().get(row.reporter_id),created=new Date(row.created_at).toLocaleString(),payload=row.content_payload||{};
    return `<article class="review-card ${d?.decision||'pending'}" data-review-item data-key="${esc(row.content_key)}" data-origin="user_report" data-type="${esc(row.content_type||'other')}" data-ref="${esc(row.content_ref||'')}"><div class="review-card-head"><div><small>${esc(row.content_ref||row.content_source||'BibleQuest entry')}</small><h3>${esc(row.content_text||'')}</h3></div>${decisionChip(row.content_key)}</div><div class="review-meta"><div><b>Reported by</b><br>${esc(reporter?.display_name||'Congregation member')}</div><div><b>Reason</b><br>${esc(row.reason||'other')}</div><div><b>Reported</b><br>${esc(created)}</div><div><b>Status</b><br>${esc(row.status||'open')}</div></div>${row.note?`<div class="review-answer"><b>Member note</b><br>${esc(row.note)}</div>`:''}${payload.answer?`<div class="review-answer"><b>Captured answer / explanation</b><br>${esc(payload.answer)}</div>`:''}${d?.rationale?`<div class="review-answer"><b>Latest review note</b><br>${esc(d.rationale)}</div>`:''}${actionButtons(row.content_key,d?.decision||'')}</article>`;
  }

  function summaryHtml(){
    const qTotal=bookRows().reduce((n,b)=>n+(Number(b.quarantined_questions)||0),0),qDecisions=decisions.filter(d=>d.origin==='quarantine'),openReports=reports.filter(r=>r.status==='open').length;
    return `<section class="review-summary"><div class="review-stat"><b>${qTotal}</b><span>Quarantined source questions</span></div><div class="review-stat"><b>${qDecisions.filter(d=>d.decision==='include').length}</b><span>Approved includes</span></div><div class="review-stat"><b>${qDecisions.filter(d=>d.decision==='remove').length}</b><span>Removed</span></div><div class="review-stat"><b>${openReports}</b><span>Open member reports</span></div></section>`;
  }

  function render(){
    root.className='review-app';const congregation=currentCongregationRow();const books=bookRows(),dmap=decisionMap();
    const quarantineVisible=quarantineRows.filter(row=>{const key=`question:${selectedBook}:${row.id}`;return matchesFilter(key)&&matchesSearch(row.q,row.a,row.r,(row.safety?.topics||[]).join(' '))});
    const reportsVisible=reports.filter(row=>matchesFilter(row.content_key)&&matchesSearch(row.content_text,row.content_ref,row.reason,row.note));
    root.innerHTML=`<section class="review-toolbar"><label>Congregation<select data-review-congregation>${congregations.map(c=>`<option value="${esc(c.id)}" ${c.id===currentCongregation?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label><button class="review-refresh" data-review-refresh>Refresh queue</button></section>${summaryHtml()}<section class="review-tabs"><button class="${tab==='quarantine'?'active':''}" data-review-tab="quarantine">Quarantined questions</button><button class="${tab==='reports'?'active':''}" data-review-tab="reports">Member reports ${reports.filter(r=>r.status==='open').length?`(${reports.filter(r=>r.status==='open').length})`:''}</button></section><div class="review-note"><b>Decision meanings for ${esc(congregation?.name||'this congregation')}</b>Include / keep = available in BibleQuest. Keep quarantined = retained for reference but hidden from normal play. Remove = rejected and hidden. Decisions are scoped to this congregation and apply after the app refreshes or the content pack is opened again.</div><section class="review-bookbar">${tab==='quarantine'?`<select data-review-book>${books.map(b=>`<option value="${esc(b.code)}" ${b.code===selectedBook?'selected':''}>${esc(b.name)} · ${b.quarantined_questions} quarantined</option>`).join('')}</select>`:'<div></div>'}<input data-review-search placeholder="Search question, answer, reference, reason…" value="${esc(searchTerm)}"></section><section class="review-filter">${[['pending','Pending'],['include','Included'],['exempt','Quarantined'],['remove','Removed'],['all','All']].map(([k,label])=>`<button class="${filter===k?'active':''}" data-review-filter="${k}">${label}</button>`).join('')}</section><section class="review-list">${tab==='quarantine'?(quarantineVisible.map(quarantineCard).join('')||'<div class="review-empty">No quarantined questions match this filter.</div>'):(reportsVisible.map(reportCard).join('')||'<div class="review-empty">No member reports match this filter.</div>')}</section>`;
    bind();
  }

  async function decide(card,decision){
    const key=card.dataset.key,type=card.dataset.type||'other',origin=card.dataset.origin||'review',ref=card.dataset.ref||'';
    const rationale=prompt(`Optional review note for “${{include:'Include / keep',exempt:'Keep quarantined',remove:'Remove'}[decision]}”:`,decisionMap().get(key)?.rationale||'');
    if(rationale===null)return;
    const quarantine=origin==='quarantine'?quarantineRows.find(r=>`question:${selectedBook}:${r.id}`===key):null;
    const report=origin==='user_report'?reports.find(r=>r.content_key===key):null;
    const snapshot=quarantine?{book_code:selectedBook,id:quarantine.id,question:quarantine.q,answer:quarantine.a,ref:quarantine.r,safety:quarantine.safety||{}}:{text:report?.content_text||'',ref:report?.content_ref||'',payload:report?.content_payload||{},reason:report?.reason||''};
    card.querySelectorAll('button').forEach(b=>b.disabled=true);
    try{
      const stamp=now();
      const row={congregation_id:currentCongregation,content_key:key,content_type:type,origin,decision,content_ref:ref||null,content_snapshot:snapshot,rationale:String(rationale||'').slice(0,1200)||null,reviewed_by:session.user.id,reviewed_at:stamp,updated_at:stamp};
      const saved=await client.from('bible_content_decisions').upsert(row,{onConflict:'congregation_id,content_key'}).select().single();if(saved.error)throw saved.error;
      const reportUpdate=await client.from('bible_content_reports').update({status:'reviewed',reviewed_by:session.user.id,reviewed_at:stamp,updated_at:stamp}).eq('congregation_id',currentCongregation).eq('content_key',key).eq('status','open');if(reportUpdate.error)throw reportUpdate.error;
      const i=decisions.findIndex(d=>d.content_key===key);if(i>=0)decisions[i]=saved.data;else decisions.unshift(saved.data);reports=reports.map(r=>r.content_key===key&&r.status==='open'?{...r,status:'reviewed',reviewed_by:session.user.id,reviewed_at:stamp,updated_at:stamp}:r);
      toast(`Decision saved: ${{include:'Include / keep',exempt:'Keep quarantined',remove:'Remove'}[decision]}.`);render();
    }catch(err){toast(err.message||String(err),true);render()}
  }

  function bind(){
    root.querySelector('[data-review-congregation]')?.addEventListener('change',async e=>{currentCongregation=e.target.value;localStorage.setItem('biblequest_review_congregation',currentCongregation);filter='pending';searchTerm='';try{await loadCongregationData();await loadQuarantine();render()}catch(err){toast(err.message,true)}});
    root.querySelector('[data-review-refresh]')?.addEventListener('click',async()=>{try{await loadCongregationData();await loadQuarantine();render();toast('Review queue refreshed.')}catch(err){toast(err.message,true)}});
    root.querySelectorAll('[data-review-tab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.reviewTab;filter='pending';render()}));
    root.querySelector('[data-review-book]')?.addEventListener('change',async e=>{selectedBook=e.target.value;try{await loadQuarantine(selectedBook);render()}catch(err){toast(err.message,true)}});
    root.querySelector('[data-review-search]')?.addEventListener('input',e=>{searchTerm=e.target.value;render();const input=root.querySelector('[data-review-search]');if(input){input.focus();input.setSelectionRange(searchTerm.length,searchTerm.length)}});
    root.querySelectorAll('[data-review-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.reviewFilter;render()}));
    root.querySelectorAll('[data-review-item] [data-decision]').forEach(b=>b.addEventListener('click',()=>decide(b.closest('[data-review-item]'),b.dataset.decision)));
  }

  async function boot(){
    try{await createClient();await loadAccess();await loadManifest();await loadCongregationData();await loadQuarantine();render()}catch(err){roleChip.textContent='NO ACCESS';message('Content Review unavailable',err.message||String(err))}
  }
  boot();
})();
