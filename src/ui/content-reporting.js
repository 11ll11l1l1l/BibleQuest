const REPORTABLE_ROUTES=new Set(['home','mission','learn','study','deep-questions','story-journey','wisdom-situations','adaptive-learning','open-review','play','media','my-mission']);
const CANDIDATE_SELECTOR='[class*="question"],[class*="prompt"],[class*="scenario"],[class*="situation"],[class*="story"],[class*="explain"],[class*="feedback"],[class*="media"] h1,[class*="media"] h2,article h1,article h2,article h3,article p,h1,h2,h3';
const EXCLUDED_SELECTOR='form,[class*="response"],[class*="note"],[data-private-note],[data-cloud-note],[data-user-content],[contenteditable="true"]';
const REASON_LABELS=Object.freeze({doctrinal:'Doctrinal / interpretation concern',accuracy:'Accuracy or factual concern',wording:'Confusing or misleading wording',inappropriate:'Inappropriate for the audience',duplicate:'Duplicate / repetitive',source:'Source or reference problem',other:'Other'});
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
const visible=element=>Boolean(element&&!element.closest('[hidden]')&&element.getClientRects().length&&getComputedStyle(element).visibility!=='hidden');
const fingerprint=value=>{let hash=2166136261;for(const char of String(value)){hash^=char.codePointAt(0);hash=Math.imul(hash,16777619)}return (hash>>>0).toString(36)};
const scriptureReference=value=>clean(value).match(/(?:[1-3]\s*)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+\d{1,3}:\d{1,3}(?:[-–]\d{1,3})?/)?.[0]||'';

function score(element){
  if(!visible(element)||element.closest(EXCLUDED_SELECTOR))return -1;
  const value=clean(element.textContent);
  if(value.length<8||value.length>900)return -1;
  const classes=String(element.className||'');
  let points=0;
  if(value.includes('?'))points+=100;
  if(/question|prompt|scenario|situation/i.test(classes))points+=80;
  if(/story|explain|feedback|media/i.test(classes))points+=45;
  if(/^H[1-3]$/.test(element.tagName))points+=25;
  if(value.length>=20&&value.length<=420)points+=20;
  return points;
}

function contentTypeFor(element,value,route){
  const classes=String(element?.className||'');
  if(value.includes('?')||/question|prompt/i.test(classes))return 'question';
  if(/explain|feedback/i.test(classes))return 'explanation';
  if(route==='story-journey'||/story/i.test(classes))return 'story';
  return 'statement';
}

export function snapshotReportableContent({route,documentRef=document}={}){
  if(!REPORTABLE_ROUTES.has(String(route||'')))return null;
  const view=documentRef.querySelector('#bq-view');
  if(!view)return null;
  const ranked=[...view.querySelectorAll(CANDIDATE_SELECTOR)].map(element=>({element,points:score(element)})).filter(item=>item.points>=0).sort((a,b)=>b.points-a.points);
  const selected=ranked[0]?.element||null;
  const title=clean(view.querySelector('h1,h2')?.textContent)||documentRef.title.replace(/\s*·\s*BibleQuest\s*$/,'')||'BibleQuest content';
  const contentText=selected?clean(selected.textContent):title;
  if(!contentText)return null;
  const contentRef=scriptureReference(contentText);
  return Object.freeze({
    contentKey:`v3:${route}:${fingerprint(`${contentText}|${contentRef}`)}`,
    contentType:contentTypeFor(selected,contentText,route),
    contentSource:'v3-screen',
    contentRef,
    contentText:contentText.slice(0,4000),
    contentPayload:Object.freeze({route:String(route),title:title.slice(0,180)})
  });
}

export function mountContentReportingRuntime({reporting,getRoute,onAccount,onCongregation,documentRef=document}={}){
  if(!reporting?.prepare||!reporting?.submit||typeof getRoute!=='function'||!documentRef?.body)throw new Error('Content reporting runtime requires reporting, route, and document boundaries.');
  let disposed=false,current=null,previousFocus=null;
  const root=documentRef.createElement('div');
  root.dataset.contentReportingRoot='';
  root.innerHTML=`<button type="button" class="bq-report-launcher" data-report-open aria-label="Report current BibleQuest content">⚑ Report</button><div class="bq-report-layer" data-report-layer hidden><div class="bq-report-scrim" data-report-close></div><section class="bq-report-dialog" role="dialog" aria-modal="true" aria-labelledby="bq-report-title"><header><div><p class="bq-eyebrow">CONTENT REPORT</p><h2 id="bq-report-title">Report this content</h2></div><button type="button" class="bq-report-close" data-report-close aria-label="Close report dialog">×</button></header><div data-report-body></div></section></div>`;
  documentRef.body.appendChild(root);
  const launcher=root.querySelector('[data-report-open]'),layer=root.querySelector('[data-report-layer]'),body=root.querySelector('[data-report-body]');

  const refresh=()=>{if(disposed)return;const allowed=REPORTABLE_ROUTES.has(String(getRoute()||''));launcher.hidden=!allowed;launcher.setAttribute('aria-hidden',allowed?'false':'true')};
  const close=()=>{layer.hidden=true;current=null;previousFocus?.focus?.({preventScroll:true});previousFocus=null};
  const showMessage=(message,{error=false,action=''}={})=>{
    body.innerHTML=`<div class="bq-report-message${error?' is-error':''}" role="${error?'alert':'status'}">${escapeHtml(message)}</div>${action==='account'?'<button type="button" class="bq-primary-button" data-report-account>Open account</button>':action==='congregation'?'<button type="button" class="bq-primary-button" data-report-congregation>Open congregation</button>':''}`;
  };
  const open=async()=>{
    if(disposed)return;
    current=snapshotReportableContent({route:getRoute(),documentRef});
    if(!current)return;
    previousFocus=documentRef.activeElement;
    layer.hidden=false;
    showMessage('Preparing report…');
    root.querySelector('[data-report-close]')?.focus({preventScroll:true});
    try{
      const prepared=await reporting.prepare();
      if(!prepared.congregations?.length){showMessage('Join or select a congregation before submitting a report.',{error:true,action:'congregation'});return}
      const reasons=(prepared.reasons||[]).filter(reason=>REASON_LABELS[reason]);
      body.innerHTML=`<div class="bq-report-preview"><small>${escapeHtml(current.contentRef||current.contentPayload.title||'Current content')}</small><p>${escapeHtml(current.contentText)}</p></div><form data-report-form><label>Congregation<select name="congregation" required>${prepared.congregations.map(item=>`<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')}</select></label><label>Reason<select name="reason" required>${reasons.map(reason=>`<option value="${reason}">${escapeHtml(REASON_LABELS[reason])}</option>`).join('')}</select></label><label>Optional note<textarea name="note" maxlength="1200" rows="5" placeholder="What should your leaders check?"></textarea></label><div class="bq-report-actions"><button type="submit" class="bq-primary-button" data-report-submit>Send for review</button><button type="button" class="bq-secondary-button" data-report-close>Cancel</button></div><div data-report-status aria-live="polite"></div></form>`;
      body.querySelector('select')?.focus({preventScroll:true});
    }catch(error){
      const auth=error?.code==='BQ_CONTENT_REPORT_AUTH_REQUIRED';
      showMessage(error?.message||'Report could not be prepared.',{error:true,action:auth?'account':''});
    }
  };
  const onSubmit=async event=>{
    const form=event.target instanceof HTMLFormElement?event.target:null;
    if(!form?.matches('[data-report-form]')||!current)return;
    event.preventDefault();
    const button=form.querySelector('[data-report-submit]'),status=form.querySelector('[data-report-status]');
    button.disabled=true;status.textContent='Sending report…';status.className='bq-report-status';
    try{
      const data=new FormData(form);
      await reporting.submit({congregationId:data.get('congregation'),context:current,reason:data.get('reason'),note:data.get('note')});
      status.textContent='Report sent. Your congregation leaders can review this content.';
      form.querySelectorAll('select,textarea,button[type="submit"]').forEach(control=>{control.disabled=true});
    }catch(error){
      status.textContent=error?.message||'Report could not be sent.';
      status.className='bq-report-status is-error';
      button.disabled=false;
    }
  };
  const onClick=event=>{
    const target=event.target instanceof Element?event.target:null;if(!target)return;
    if(target.closest('[data-report-open]')){void open();return}
    if(target.closest('[data-report-close]')){close();return}
    if(target.closest('[data-report-account]')){close();onAccount?.();return}
    if(target.closest('[data-report-congregation]')){close();onCongregation?.()}
  };
  const onKeyDown=event=>{if(event.key==='Escape'&&!layer.hidden)close()};
  root.addEventListener('click',onClick);root.addEventListener('submit',onSubmit);documentRef.addEventListener('keydown',onKeyDown);globalThis.addEventListener?.('hashchange',refresh);refresh();
  return Object.freeze({refresh,open,dispose(){if(disposed)return;disposed=true;root.removeEventListener('click',onClick);root.removeEventListener('submit',onSubmit);documentRef.removeEventListener('keydown',onKeyDown);globalThis.removeEventListener?.('hashchange',refresh);root.remove()}});
}
