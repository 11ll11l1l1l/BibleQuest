const esc=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const decisionValue=item=>item?.decision?.decision||'pending';
const decisionLabel=value=>({pending:'Pending review',include:'Included',exempt:'Kept quarantined',remove:'Removed'}[value]||value);

function toolbar(state){
  const scopes=state.scopes||[];
  return `<section class="bq-panel" data-content-review-toolbar><div class="bq-form-grid"><label>Congregation<select data-content-review-congregation>${scopes.map(row=>`<option value="${esc(row.id)}" ${row.id===state.congregationId?'selected':''}>${esc(row.name)} · ${esc(row.roleLabel)}</option>`).join('')}</select></label><button type="button" class="bq-secondary-button" data-content-review-refresh>Refresh queue</button></div>${state.warning?`<p class="bq-form-message">${esc(state.warning)}</p>`:''}</section>`;
}

function tabs(tab,openReports){return `<div class="bq-chip-row" data-content-review-tabs><button type="button" class="${tab==='quarantine'?'bq-primary-button':'bq-secondary-button'}" data-content-review-tab="quarantine">Quarantined questions</button><button type="button" class="${tab==='reports'?'bq-primary-button':'bq-secondary-button'}" data-content-review-tab="reports">Member reports${openReports?` (${openReports})`:''}</button></div>`}

function filters(filter,search){return `<section class="bq-panel"><div class="bq-form-grid"><label>Search<input type="search" value="${esc(search)}" placeholder="Question, reference, reason or note" data-content-review-search></label><label>Decision state<select data-content-review-filter>${[['pending','Pending'],['include','Included'],['exempt','Kept quarantined'],['remove','Removed'],['all','All']].map(([value,label])=>`<option value="${value}" ${filter===value?'selected':''}>${label}</option>`).join('')}</select></label></div></section>`}

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

export function contentReviewPage({review,onBack,onAccount,onCongregation}={}){
  return {title:'Content Review',html:'<section data-content-review-view></section>',mount(root){
    const view=root.querySelector('[data-content-review-view]');let disposed=false,busy=false,tab='quarantine',filter='pending',search='',message='';
    const intro=()=>`<section class="bq-panel"><p class="bq-eyebrow">PASTOR · LEADER · ADMIN</p><h1>Content Review</h1><p>Review quarantined Recall questions and member reports for one congregation. Database permissions remain authoritative.</p><button type="button" class="bq-secondary-button" data-content-review-back>Back to More</button></section>`;
    const matches=(item,parts)=>{const state=decisionValue(item);if(filter!=='all'&&state!==filter)return false;const needle=search.trim().toLocaleLowerCase();return !needle||parts.join(' ').toLocaleLowerCase().includes(needle)};
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
      view.querySelectorAll('[data-content-review-tab]').forEach(button=>button.addEventListener('click',()=>{tab=button.dataset.contentReviewTab;filter='pending';message='';render(review.getState())},{once:true}));
      view.querySelector('[data-content-review-search]')?.addEventListener('input',event=>{search=event.target.value.slice(0,100);render(review.getState())},{once:true});
      view.querySelector('[data-content-review-filter]')?.addEventListener('change',event=>{filter=event.target.value;render(review.getState())},{once:true});
      view.querySelector('[data-content-review-book]')?.addEventListener('change',async event=>{if(busy)return;busy=true;message='';await review.openQuarantine(event.target.value);busy=false;render(review.getState())},{once:true});
      view.querySelectorAll('[data-content-review-decide]').forEach(button=>button.addEventListener('click',async()=>{
        if(busy)return;
        const key=button.dataset.contentKey,decision=button.dataset.contentReviewDecide,note=view.querySelector(`[data-content-review-rationale="${CSS.escape(key)}"]`)?.value||'';
        busy=true;message='';render(review.getState());
        try{await review.decide({contentKey:key,decision,rationale:note});message='Decision saved.'}catch(error){message=error?.message||'Content decision could not be saved.'}
        busy=false;render(review.getState());
      },{once:true}));
    };
    const render=state=>{
      if(disposed)return;
      if(state.status==='signed-out'){view.innerHTML=`${intro()}<section class="bq-panel"><h2>Sign in to review content</h2><p>Content Review has no guest or local authority.</p><button type="button" class="bq-primary-button" data-content-review-account>Open account</button></section>`;bindCommon();return}
      if(state.status==='unauthorized'){view.innerHTML=`${intro()}<section class="bq-panel"><h2>Reviewer role required</h2><p>Content Review is limited to congregation Leaders, Pastors and Admins, or platform Owner/Admin accounts.</p><button type="button" class="bq-primary-button" data-content-review-congregation-access>Open congregation access</button></section>`;bindCommon();return}
      if(state.status==='error'){view.innerHTML=`${intro()}<section class="bq-panel"><h2>Content Review could not load</h2><p class="bq-form-message" role="alert">${esc(state.error||'Try again.')}</p><button type="button" class="bq-secondary-button" data-content-review-retry>Try again</button></section>`;bindCommon();return}
      if(state.status!=='ready'){view.innerHTML=`${intro()}<section class="bq-panel"><h2>Opening review queue…</h2></section>`;bindCommon();return}
      const reports=review.reportItems(),openReports=reports.filter(row=>row.status==='open').length;
      const book=state.books.find(row=>row.code===state.selectedBook)||state.books[0]||null;
      const quarantine=(state.quarantine||[]).filter(item=>matches(item,[item.question,item.answer,item.reference,(item.safety?.topics||[]).join(' ')]));
      const visibleReports=reports.filter(item=>matches(item,[item.contentText,item.contentRef,item.reason,item.note,item.reporter?.displayName]));
      const list=tab==='quarantine'?quarantine.map(item=>quarantineCard(item,book?.name||state.selectedBook)).join(''):visibleReports.map(reportCard).join('');
      const bookControl=tab==='quarantine'?`<section class="bq-panel"><label>Recall book<select data-content-review-book>${state.books.map(row=>`<option value="${esc(row.code)}" ${row.code===state.selectedBook?'selected':''}>${esc(row.name)} · ${row.quarantinedQuestions} quarantined</option>`).join('')}</select></label></section>`:'';
      view.innerHTML=`${intro()}${toolbar(state)}${tabs(tab,openReports)}${bookControl}${filters(filter,search)}${message?`<p class="bq-form-message" role="status" data-content-review-message>${esc(message)}</p>`:''}<section data-content-review-list>${list||'<div class="bq-panel"><p>No review items match this filter.</p></div>'}</section>`;
      view.querySelectorAll('button,select,input,textarea').forEach(control=>control.toggleAttribute('disabled',busy||state.busy));bindReady();
    };
    async function load(){if(busy||disposed)return;busy=true;message='';view.innerHTML=`${intro()}<section class="bq-panel"><h2>Opening review queue…</h2></section>`;bindCommon();const state=await review.refresh();if(state.status==='ready'&&state.books[0])await review.openQuarantine(state.books[0].code);busy=false;render(review.getState())}
    void load();return()=>{disposed=true;review.clear()};
  }};
}
