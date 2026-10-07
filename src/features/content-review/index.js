const esc=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const decisionValue=item=>item?.decision?.decision||'pending';
const decisionLabel=value=>({pending:'Pending review',include:'Included',exempt:'Kept quarantined',remove:'Removed'}[value]||value);
const libraryDecisionValue=item=>item?.latestDecision?.decision||'pending';
const libraryDecisionLabel=value=>({
  pending:'No audit decision',auto_approved:'Auto-approved',needs_repair:'Needs repair',approved:'Approved',
  request_changes:'Changes requested',rejected:'Rejected'
}[value]||value);
const libraryTypeLabel=value=>({book:'Book',devotional:'Devotional',past_teaching:'Past Teaching'}[value]||value);
const visibleBody=value=>{
  if(typeof value==='string')return value;
  if(!value||typeof value!=='object')return '';
  for(const key of ['text','markdown','content','body'])if(typeof value[key]==='string')return value[key];
  try{return JSON.stringify(value)}catch{return''}
};
const clipped=(value,max=1600)=>{const text=String(value||'').trim();return text.length>max?`${text.slice(0,max)}…`:text};
const labelsFor=taxonomy=>Object.values(taxonomy?.labels||{}).map(value=>String(value||'').trim()).filter(Boolean);
const scriptureRefs=item=>{
  const refs=item?.reviewEvidence?.scriptureRefs||item?.reviewEvidence?.scripture_refs||item?.body?.scriptureRefs||item?.body?.scripture_refs;
  return Array.isArray(refs)?refs.map(value=>typeof value==='string'?value:String(value?.reference||value?.ref||'')).filter(Boolean):[];
};

function toolbar(state){
  const scopes=state.scopes||[];
  return `<section class="bq-panel" data-content-review-toolbar><div class="bq-form-grid"><label>Congregation<select data-content-review-congregation>${state.congregationId?'':'<option value="" selected>Choose a congregation</option>'}${scopes.map(row=>`<option value="${esc(row.id)}" ${row.id===state.congregationId?'selected':''}>${esc(row.name)} · ${esc(row.roleLabel)}</option>`).join('')}</select></label><button type="button" class="bq-secondary-button" data-content-review-refresh>Refresh queues</button></div>${state.warning?`<p class="bq-form-message">${esc(state.warning)}</p>`:''}</section>`;
}

function tabs(tab,state,openReports){
  const items=state.libraryItems||[];
  const counts={
    books:items.filter(row=>row.contentType==='book').length,
    devotionals:items.filter(row=>row.contentType==='devotional').length,
    teachings:items.filter(row=>row.contentType==='past_teaching').length
  };
  const button=(value,label,count='')=>`<button type="button" class="${tab===value?'bq-primary-button':'bq-secondary-button'}" data-content-review-tab="${value}">${label}${count!==''?` (${count})`:''}</button>`;
  return `<div class="bq-chip-row" data-content-review-tabs>${button('books','Books',counts.books)}${button('devotionals','Devotionals',counts.devotionals)}${button('teachings','Past Teachings',counts.teachings)}${button('quarantine','Recall quarantine')}${button('reports','Member reports',openReports)}</div>`;
}

function recallFilters(filter,search){
  return `<section class="bq-panel"><div class="bq-form-grid"><label>Search<input type="search" value="${esc(search)}" placeholder="Question, reference, reason or note" data-content-review-search></label><label>Decision state<select data-content-review-filter>${[['pending','Pending'],['include','Included'],['exempt','Kept quarantined'],['remove','Removed'],['all','All']].map(([value,label])=>`<option value="${value}" ${filter===value?'selected':''}>${label}</option>`).join('')}</select></label></div></section>`;
}

function libraryFilters(filter,search){
  const values=[['pending','No audit decision'],['auto_approved','Auto-approved'],['needs_repair','Needs repair'],['approved','Approved'],['request_changes','Changes requested'],['rejected','Rejected'],['all','All']];
  return `<section class="bq-panel"><div class="bq-form-grid"><label>Search Library audit queue<input type="search" value="${esc(search)}" placeholder="Title, source, creator, tag or translation" data-content-review-search></label><label>Latest decision<select data-content-review-filter>${values.map(([value,label])=>`<option value="${value}" ${filter===value?'selected':''}>${label}</option>`).join('')}</select></label></div></section>`;
}

function decisionActions(item){
  return `<div data-content-review-actions="${esc(item.contentKey)}"><label>Reviewer note <span class="bq-muted">optional</span><textarea maxlength="1200" rows="2" data-content-review-rationale="${esc(item.contentKey)}">${esc(item.decision?.rationale||'')}</textarea></label><div class="bq-chip-row"><button type="button" class="bq-primary-button" data-content-review-decide="include" data-content-key="${esc(item.contentKey)}">Include / keep</button><button type="button" class="bq-secondary-button" data-content-review-decide="exempt" data-content-key="${esc(item.contentKey)}">Keep quarantined</button><button type="button" class="bq-secondary-button" data-content-review-decide="remove" data-content-key="${esc(item.contentKey)}">Remove</button></div></div>`;
}

function quarantineCard(item,bookName){
  const value=decisionValue(item),topics=Array.isArray(item.safety?.topics)?item.safety.topics:[];
  return `<article class="bq-panel" data-content-review-item="${esc(item.contentKey)}" data-content-review-state="${esc(value)}"><p class="bq-eyebrow">${esc(bookName)} ${esc(item.reference)} · ${esc(decisionLabel(value))}</p><h3>${esc(item.question)}</h3><div class="bq-community-row"><div><b>Reference answer</b><p>${esc(item.answer)}</p></div></div>${topics.length?`<p class="bq-muted">Safety topics: ${topics.map(esc).join(', ')}</p>`:''}${decisionActions(item)}</article>`;
}

function reportCard(item){
  const value=decisionValue(item),reporter=item.reporter?.displayName||'Congregation member';
  return `<article class="bq-panel" data-content-review-item="${esc(item.contentKey)}" data-content-review-state="${esc(value)}"><p class="bq-eyebrow">${esc(item.contentRef||item.contentSource||'BibleQuest content')} · ${esc(decisionLabel(value))}</p><h3>${esc(item.contentText||'Reported BibleQuest content')}</h3><div class="bq-community-row"><div><b>Reported by</b><p>${esc(reporter)}</p></div><div><b>Reason</b><p>${esc(item.reason||'other')}</p></div><div><b>Status</b><p>${esc(item.status)}</p></div></div>${item.note?`<div class="bq-community-row"><div><b>Member note</b><p>${esc(item.note)}</p></div></div>`:''}${item.contentPayload?.answer?`<div class="bq-community-row"><div><b>Captured answer / explanation</b><p>${esc(item.contentPayload.answer)}</p></div></div>`:''}${decisionActions(item)}</article>`;
}

function automatedEvidence(item){
  const decision=(item.history||[]).find(row=>row.reviewerType==='automated_policy');
  if(!decision)return '<p class="bq-muted">No automated-policy evidence has been recorded for this exact revision.</p>';
  const criteria=(decision.criteria||[]).map(row=>`<li><b>${esc(row.id)}</b> — ${esc(row.result||'unknown')}${row.hard?' · critical':''}${row.evaluatedAt?` · ${esc(row.evaluatedAt)}`:''}${row.evidenceRefs?.length?`<br><span class="bq-muted">Evidence: ${row.evidenceRefs.map(esc).join(', ')}</span>`:''}${row.note?`<br>${esc(row.note)}`:''}</li>`).join('');
  const secondPass=decision.secondPass?`<p><b>Independent second pass:</b> ${esc(decision.secondPass.result||'unknown')} · ${esc(decision.secondPass.evaluator||'evaluator unavailable')} · revision ${esc(decision.secondPass.revision||'unknown')}${decision.secondPass.evaluatedAt?` · ${esc(decision.secondPass.evaluatedAt)}`:''}</p>${decision.secondPass.evidenceRefs?.length?`<p class="bq-muted">Second-pass evidence: ${decision.secondPass.evidenceRefs.map(esc).join(', ')}</p>`:''}`:'<p class="bq-muted">Independent second-pass evidence is not recorded.</p>';
  return `<div data-library-automated-evidence><p><b>Automated decision:</b> ${esc(libraryDecisionLabel(decision.decision))}</p><p class="bq-muted">Policy ${esc(decision.policyId||'unknown')} @ ${esc(decision.policyVersion||'unknown')} · ${esc(decision.decidedAt||'time unavailable')}</p>${decision.evidenceRefs?.length?`<p><b>Decision evidence:</b> ${decision.evidenceRefs.map(esc).join(', ')}</p>`:''}${secondPass}${criteria?`<details><summary>Automated criteria and evidence</summary><ul>${criteria}</ul></details>`:''}</div>`;
}

function translationBlock(item){
  const sourceBody=clipped(visibleBody(item.body));
  const source=`<div><b>${esc((item.sourceLocale||'en').toUpperCase())} · source revision</b><p>${esc(item.title)}</p>${item.summary?`<p>${esc(item.summary)}</p>`:''}${sourceBody?`<p>${esc(sourceBody)}</p>`:''}</div>`;
  const byLocale=new Map((item.translations||[]).map(row=>[String(row.locale||'').toLowerCase(),row]));
  const translations=['tl','ceb','ilo'].map(locale=>{
    const row=byLocale.get(locale);
    if(!row)return `<div><b>${locale.toUpperCase()}</b><p class="bq-muted">Translation not recorded for this revision.</p></div>`;
    const body=clipped(visibleBody(row.body));
    return `<div><b>${locale.toUpperCase()} · ${esc(row.reviewStatus||'unreviewed')}</b><p>${esc(row.title)}</p>${row.summary?`<p>${esc(row.summary)}</p>`:''}${body?`<p>${esc(body)}</p>`:''}<p class="bq-muted">${esc(row.translator||'Translator not recorded')}${row.reviewedAt?` · ${esc(row.reviewedAt)}`:''}</p></div>`;
  }).join('');
  return `<details><summary>EN / TL / CEB / ILO content</summary><div class="bq-community-row">${source}${translations}</div></details>`;
}

function libraryActions(item){
  const note=item.latestDecision?.reviewerType==='human'?item.latestDecision.note||'':'';
  return `<div data-library-review-actions="${esc(item.revisionId)}"><label>Audit note <span class="bq-muted">optional</span><textarea maxlength="4000" rows="3" data-library-review-rationale="${esc(item.revisionId)}">${esc(note)}</textarea></label><div class="bq-chip-row"><button type="button" class="bq-primary-button" data-library-review-decide="approved" data-revision-id="${esc(item.revisionId)}">Approve</button><button type="button" class="bq-secondary-button" data-library-review-decide="request_changes" data-revision-id="${esc(item.revisionId)}">Request Changes</button><button type="button" class="bq-secondary-button" data-library-review-decide="rejected" data-revision-id="${esc(item.revisionId)}">Reject</button></div></div>`;
}

function libraryCard(item){
  const value=libraryDecisionValue(item);
  const tags=(item.taxonomy||[]).map(row=>`${row.kind}: ${labelsFor(row)[0]||row.id}`);
  const refs=scriptureRefs(item);
  const humanHistory=(item.history||[]).filter(row=>row.reviewerType==='human').slice(0,5);
  const sourceLink=item.source?.uri?`<a href="${esc(item.source.uri)}" target="_blank" rel="noopener noreferrer">Open source</a>`:'Source URL not recorded';
  return `<article class="bq-panel" data-library-review-item="${esc(item.revisionId)}" data-library-review-state="${esc(value)}">
    <p class="bq-eyebrow">${esc(libraryTypeLabel(item.contentType))} · ${esc(libraryDecisionLabel(value))} · ${esc(item.publicationState||item.revisionPublicationState||'unknown state')}</p>
    <h3>${esc(item.title||'Untitled Library item')}</h3>
    ${item.summary?`<p>${esc(item.summary)}</p>`:''}
    <div class="bq-community-row">
      <div><b>Source</b><p>${esc(item.source?.title||'Untitled source')}</p><p>${esc(item.source?.creator||'Creator not recorded')}${item.source?.organization?` · ${esc(item.source.organization)}`:''}</p><p>${sourceLink}</p></div>
      <div><b>Rights</b><p>${esc(item.rights?.status||'unknown')}</p><p>${esc(item.rights?.basis||'Rights basis not recorded')}</p><p class="bq-muted">Allowed: ${esc((item.rights?.allowedUses||[]).join(', ')||'none recorded')}</p></div>
      <div><b>Revision</b><p>${esc(item.revisionId)}</p><p class="bq-muted">Review: ${esc(item.reviewStatus||'unknown')}${item.reviewerType?` · ${esc(item.reviewerType)}`:''}</p></div>
    </div>
    ${tags.length?`<p><b>Tags:</b> ${tags.map(esc).join(' · ')}</p>`:'<p class="bq-muted">No taxonomy tags recorded.</p>'}
    <p><b>Scripture / references:</b> ${refs.length?refs.map(esc).join(', '):'<span class="bq-muted">No structured Scripture references recorded in review evidence.</span>'}</p>
    ${translationBlock(item)}
    ${automatedEvidence(item)}
    ${humanHistory.length?`<details><summary>Human audit history</summary><ul>${humanHistory.map(row=>`<li>${esc(libraryDecisionLabel(row.decision))} · ${esc(row.decidedAt||'time unavailable')}${row.note?` — ${esc(row.note)}`:''}</li>`).join('')}</ul></details>`:''}
    ${libraryActions(item)}
  </article>`;
}

export function contentReviewPage({review,onBack,onAccount,onCongregation}={}){
  return {title:'Content Review',html:'<section data-content-review-view></section>',mount(root){
    const view=root.querySelector('[data-content-review-view]');let disposed=false,busy=false,tab=typeof review?.libraryReviewItems==='function'?'books':'quarantine',filter='pending',search='',message='';
    const libraryTabs=new Set(['books','devotionals','teachings']);
    const intro=()=>`<section class="bq-panel"><p class="bq-eyebrow">LIBRARY AUDIT · RECALL MODERATION</p><h1>Content Review</h1><p>Audit V7 Books, Devotionals and Past Teachings independently from congregation-scoped Recall moderation. Automated approval evidence remains visible and human overrides are preserved as revision-bound history.</p><button type="button" class="bq-secondary-button" data-content-review-back>Back to More</button></section>`;
    const recallMatches=(item,parts)=>{const state=decisionValue(item);if(filter!=='all'&&state!==filter)return false;const needle=search.trim().toLocaleLowerCase();return !needle||parts.join(' ').toLocaleLowerCase().includes(needle)};
    const libraryMatches=item=>{
      const state=libraryDecisionValue(item);if(filter!=='all'&&state!==filter)return false;
      const needle=search.trim().toLocaleLowerCase();if(!needle)return true;
      const haystack=[
        item.title,item.summary,item.source?.title,item.source?.creator,item.source?.organization,item.rights?.basis,
        ...(item.taxonomy||[]).flatMap(row=>[row.id,...labelsFor(row)]),
        ...(item.translations||[]).flatMap(row=>[row.locale,row.title,row.summary,visibleBody(row.body)])
      ].join(' ').toLocaleLowerCase();
      return haystack.includes(needle);
    };
    const bindCommon=()=>{
      view.querySelector('[data-content-review-back]')?.addEventListener('click',()=>onBack?.(),{once:true});
      view.querySelector('[data-content-review-account]')?.addEventListener('click',()=>onAccount?.(),{once:true});
      view.querySelector('[data-content-review-congregation-access]')?.addEventListener('click',()=>onCongregation?.(),{once:true});
      view.querySelector('[data-content-review-retry]')?.addEventListener('click',load,{once:true});
    };
    const bindReady=()=>{
      bindCommon();
      view.querySelector('[data-content-review-refresh]')?.addEventListener('click',load,{once:true});
      view.querySelector('[data-content-review-congregation]')?.addEventListener('change',async event=>{if(busy)return;busy=true;message='';const next=await review.selectCongregation(event.target.value);if(next.status==='ready'&&next.books[0])await review.openQuarantine(next.books[0].code);busy=false;render(review.getState())},{once:true});
      view.querySelectorAll('[data-content-review-tab]').forEach(button=>button.addEventListener('click',()=>{tab=button.dataset.contentReviewTab;filter='pending';search='';message='';render(review.getState())},{once:true}));
      view.querySelector('[data-content-review-search]')?.addEventListener('input',event=>{search=event.target.value.slice(0,120);render(review.getState())},{once:true});
      view.querySelector('[data-content-review-filter]')?.addEventListener('change',event=>{filter=event.target.value;render(review.getState())},{once:true});
      view.querySelector('[data-content-review-book]')?.addEventListener('change',async event=>{if(busy)return;busy=true;message='';await review.openQuarantine(event.target.value);busy=false;render(review.getState())},{once:true});
      view.querySelectorAll('[data-content-review-decide]').forEach(button=>button.addEventListener('click',async()=>{
        if(busy)return;
        const key=button.dataset.contentKey,decision=button.dataset.contentReviewDecide,note=view.querySelector(`[data-content-review-rationale="${CSS.escape(key)}"]`)?.value||'';
        busy=true;message='';render(review.getState());
        try{await review.decide({contentKey:key,decision,rationale:note});message='Decision saved.'}catch(error){message=error?.message||'Content decision could not be saved.'}
        busy=false;render(review.getState());
      },{once:true}));
      view.querySelectorAll('[data-library-review-decide]').forEach(button=>button.addEventListener('click',async()=>{
        if(busy)return;
        const revisionId=button.dataset.revisionId,decision=button.dataset.libraryReviewDecide,note=view.querySelector(`[data-library-review-rationale="${CSS.escape(revisionId)}"]`)?.value||'';
        busy=true;message='';render(review.getState());
        try{await review.decideLibrary({revisionId,decision,rationale:note});message='Library audit decision saved.'}catch(error){message=error?.message||'Library audit decision could not be saved.'}
        busy=false;render(review.getState());
      },{once:true}));
    };
    const render=state=>{
      if(disposed)return;
      if(state.status==='signed-out'){view.innerHTML=`${intro()}<section class="bq-panel"><h2>Sign in to review content</h2><p>Content Review has no guest or local authority.</p><button type="button" class="bq-primary-button" data-content-review-account>Open account</button></section>`;bindCommon();return}
      if(state.status==='unauthorized'){view.innerHTML=`${intro()}<section class="bq-panel"><h2>Reviewer role required</h2><p>Content Review is limited to authorized congregation reviewers or platform Owner/Admin accounts.</p><button type="button" class="bq-primary-button" data-content-review-congregation-access>Open congregation access</button></section>`;bindCommon();return}
      if(state.status==='error'){view.innerHTML=`${intro()}<section class="bq-panel"><h2>Content Review could not load</h2><p class="bq-form-message" role="alert">${esc(state.error||'Try again.')}</p><button type="button" class="bq-secondary-button" data-content-review-retry>Try again</button></section>`;bindCommon();return}
      if(state.status!=='ready'){view.innerHTML=`${intro()}<section class="bq-panel"><h2>Opening review queues…</h2></section>`;bindCommon();return}

      const reports=review.reportItems(),openReports=reports.filter(row=>row.status==='open').length;
      const navigation=`${intro()}${tabs(tab,state,openReports)}`;
      if(libraryTabs.has(tab)){
        const type=tab==='books'?'book':tab==='devotionals'?'devotional':'past_teaching';
        const items=review.libraryReviewItems(type).filter(libraryMatches);
        view.innerHTML=`${navigation}${libraryFilters(filter,search)}${message?`<p class="bq-form-message" role="status" data-content-review-message>${esc(message)}</p>`:''}<section data-content-review-list>${items.map(libraryCard).join('')||'<div class="bq-panel"><p>No Library items match this audit filter.</p></div>'}</section>`;
        view.querySelectorAll('button,select,input,textarea').forEach(control=>control.toggleAttribute('disabled',busy||state.busy));bindReady();return;
      }

      if(!state.congregationId){
        view.innerHTML=`${navigation}${toolbar(state)}<section class="bq-panel"><h2>Select a congregation</h2><p>Recall quarantine and member reports are congregation-scoped. Library audit remains available in the first three tabs.</p></section>`;bindReady();return
      }
      const book=state.books.find(row=>row.code===state.selectedBook)||state.books[0]||null;
      const quarantine=(state.quarantine||[]).filter(item=>recallMatches(item,[item.question,item.answer,item.reference,(item.safety?.topics||[]).join(' ')]));
      const visibleReports=reports.filter(item=>recallMatches(item,[item.contentText,item.contentRef,item.reason,item.note,item.reporter?.displayName]));
      const list=tab==='quarantine'?quarantine.map(item=>quarantineCard(item,book?.name||state.selectedBook)).join(''):visibleReports.map(reportCard).join('');
      const bookControl=tab==='quarantine'?`<section class="bq-panel"><label>Recall book<select data-content-review-book>${state.books.map(row=>`<option value="${esc(row.code)}" ${row.code===state.selectedBook?'selected':''}>${esc(row.name)} · ${row.quarantinedQuestions} quarantined</option>`).join('')}</select></label></section>`:'';
      view.innerHTML=`${navigation}${toolbar(state)}${bookControl}${recallFilters(filter,search)}${message?`<p class="bq-form-message" role="status" data-content-review-message>${esc(message)}</p>`:''}<section data-content-review-list>${list||'<div class="bq-panel"><p>No review items match this filter.</p></div>'}</section>`;
      view.querySelectorAll('button,select,input,textarea').forEach(control=>control.toggleAttribute('disabled',busy||state.busy));bindReady();
    };
    async function load(){if(busy||disposed)return;busy=true;message='';view.innerHTML=`${intro()}<section class="bq-panel"><h2>Opening review queues…</h2></section>`;bindCommon();const state=await review.refresh();if(state.status==='ready'&&state.congregationId&&state.books[0])await review.openQuarantine(state.books[0].code);busy=false;render(review.getState())}
    void load();return()=>{disposed=true;review.clear()};
  }};
}
