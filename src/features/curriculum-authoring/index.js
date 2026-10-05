import { localization } from '../../app/localization.js';

const STEPS=Object.freeze(['scripture','understand','discuss','reflect','apply','pray','action']);
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const attr=escapeHtml;
const busy=state=>['loading','saving','checking'].includes(state?.status);
const selected=(rows,id)=>rows?.find(row=>row.id===id)||null;
const number=value=>Number.isInteger(value)?value:0;
const defaultTranslate=(key,values)=>localization.t(key,{values});
function optionRows(rows,kind,currentId,t){
  if(!rows?.length)return `<p>${escapeHtml(t(`v7.authoring.${kind}.empty`))}</p>`;
  return `<ul>${rows.map(row=>{const fallback=`${t(`v7.authoring.${kind}`)} ${row.revisionNumber??''}`.trim();return `<li><button type="button" data-authoring-select="${kind}" data-id="${attr(row.id)}"${row.id===currentId?' aria-current="true"':''}>${escapeHtml(row.title||fallback)}</button></li>`;}).join('')}</ul>`;
}
function trackForm(track,t){
  return `<form data-authoring-form="${track?'track-update':'track-create'}"><h3>${escapeHtml(t(track?'v7.authoring.track.edit':'v7.authoring.track.new'))}</h3><label>${escapeHtml(t('v7.authoring.field.title'))} <input name="title" maxlength="240" required value="${attr(track?.title||'')}"></label><label>${escapeHtml(t('v7.authoring.field.summary'))} <textarea name="summary" maxlength="4000">${escapeHtml(track?.summary||'')}</textarea></label><label>${escapeHtml(t('v7.authoring.field.language'))} <input name="locale" required value="${attr(track?.locale||'en')}"></label><label>${escapeHtml(t('v7.authoring.field.audience'))} <input name="audience" maxlength="240" value="${attr(track?.audience||'')}"></label><label>${escapeHtml(t('v7.authoring.field.order'))} <input name="position" type="number" min="0" step="1" value="${number(track?.position)}"></label><button type="submit" class="bq-primary-button">${escapeHtml(t(track?'v7.authoring.track.save':'v7.authoring.track.create'))}</button></form>`;
}
function moduleForm(module,t){
  return `<form data-authoring-form="${module?'module-update':'module-create'}"><h3>${escapeHtml(t(module?'v7.authoring.module.edit':'v7.authoring.module.new'))}</h3><label>${escapeHtml(t('v7.authoring.field.title'))} <input name="title" maxlength="240" required value="${attr(module?.title||'')}"></label><label>${escapeHtml(t('v7.authoring.field.summary'))} <textarea name="summary" maxlength="4000">${escapeHtml(module?.summary||'')}</textarea></label><label>${escapeHtml(t('v7.authoring.field.order'))} <input name="position" type="number" min="0" step="1" value="${number(module?.position)}"></label><button type="submit" class="bq-primary-button">${escapeHtml(t(module?'v7.authoring.module.save':'v7.authoring.module.create'))}</button></form>`;
}
function lessonForm(lesson,t){
  return `<form data-authoring-form="${lesson?'lesson-update':'lesson-create'}"><h3>${escapeHtml(t(lesson?'v7.authoring.lesson.edit':'v7.authoring.lesson.new'))}</h3><label>${escapeHtml(t('v7.authoring.field.title'))} <input name="title" maxlength="240" required value="${attr(lesson?.title||'')}"></label><label>${escapeHtml(t('v7.authoring.field.order'))} <input name="position" type="number" min="0" step="1" value="${number(lesson?.position)}"></label><button type="submit" class="bq-primary-button">${escapeHtml(t(lesson?'v7.authoring.lesson.save':'v7.authoring.lesson.create'))}</button></form>`;
}
function revisionForm(t){return `<form data-authoring-form="revision-create"><h3>${escapeHtml(t('v7.authoring.revision.new'))}</h3><label>${escapeHtml(t('v7.authoring.field.language'))} <input name="locale" required value="en"></label><label>${escapeHtml(t('v7.authoring.field.summary'))} <textarea name="summary" maxlength="4000"></textarea></label><button type="submit" class="bq-primary-button">${escapeHtml(t('v7.authoring.revision.create'))}</button></form>`;}
function stepEditor(state,t){
  if(!state.selected?.revisionId)return '';
  const byPosition=new Map((state.steps||[]).map(row=>[row.position,row]));
  const list=STEPS.map((type,index)=>{const row=byPosition.get(index);return `<li><strong>${escapeHtml(t(`v7.authoring.step.${type}`))}</strong> — ${escapeHtml(t(row?'v7.authoring.steps.saved':'v7.authoring.steps.notSaved'))}</li>`;}).join('');
  const forms=STEPS.map((type,index)=>{
    const row=byPosition.get(index);
    return `<details data-authoring-step="${index}"><summary>${index+1}. ${escapeHtml(t(`v7.authoring.step.${type}`))}</summary><form data-authoring-form="step-save"><input type="hidden" name="position" value="${index}"><label>${escapeHtml(t('v7.authoring.steps.content'))} <textarea name="content" required>${escapeHtml(JSON.stringify(row?.content??{},null,2))}</textarea></label><label>${escapeHtml(t('v7.authoring.steps.scriptureRefs'))} <textarea name="scriptureRefs">${escapeHtml(JSON.stringify(row?.scriptureRefs??[],null,2))}</textarea></label><label>${escapeHtml(t('v7.authoring.steps.libraryRevision'))} <input name="libraryRevisionId" value="${attr(row?.libraryRevisionId??'')}"></label><button type="submit" class="bq-primary-button">${escapeHtml(t('v7.authoring.steps.save'))}</button></form></details>`;
  }).join('');
  return `<section><h2>${escapeHtml(t('v7.authoring.steps.title'))}</h2><ol>${list}</ol>${forms}</section>`;
}

function readinessView(readiness,t){
  if(!readiness)return `<p>${escapeHtml(t('v7.authoring.readiness.selectRevision'))}</p>`;
  const count=escapeHtml(t('v7.authoring.readiness.steps',{count:number(readiness.stepCount)}));
  if(readiness.ready)return `<p><strong>${escapeHtml(t('v7.authoring.readiness.ready'))}</strong> ${count}</p><p><small>${escapeHtml(t('v7.authoring.readiness.backendPending'))}</small></p>`;
  const known=new Set(['track_not_draft','module_not_draft','lesson_not_draft','revision_already_published','seven_steps_incomplete']);
  const blockers=(readiness.blockers||[]).map(item=>`<li>${escapeHtml(t(known.has(item)?`v7.authoring.readiness.${item}`:'v7.authoring.error'))}</li>`).join('');
  return `<p>${count}</p>${blockers?`<ul>${blockers}</ul>`:''}`;
}

export function renderCurriculumAuthoring(state,{localErrorKey=null,translate=defaultTranslate}={}){
  const t=(key,values)=>translate(key,values),track=selected(state.tracks,state.selected?.trackId),module=selected(state.modules,state.selected?.moduleId),lesson=selected(state.lessons,state.selected?.lessonId);
  const isBusy=busy(state),disabled=isBusy?' disabled':'';
  const statusKey=localErrorKey||(state.error?'v7.authoring.error':isBusy?`v7.authoring.${state.status}`:null);
  return `<section class="bq-panel"><p class="bq-eyebrow">${escapeHtml(t('v7.authoring.eyebrow'))}</p><h1>${escapeHtml(t('v7.authoring.title'))}</h1><p>${escapeHtml(t('v7.authoring.intro'))}</p><p role="status" aria-live="polite">${statusKey?escapeHtml(t(statusKey)):''}</p><div><button type="button" data-authoring-action="reload"${disabled}>${escapeHtml(t('v7.authoring.reload'))}</button><button type="button" data-authoring-action="readiness"${!state.selected?.revisionId||isBusy?' disabled':''}>${escapeHtml(t('v7.authoring.checkReadiness'))}</button></div><fieldset${disabled}><section><h2>${escapeHtml(t('v7.authoring.tracks'))}</h2>${optionRows(state.tracks,'track',state.selected?.trackId,t)}${trackForm(null,t)}${track?trackForm(track,t):''}</section>${track?`<section><h2>${escapeHtml(t('v7.authoring.modules'))}</h2>${optionRows(state.modules,'module',state.selected?.moduleId,t)}${moduleForm(null,t)}${module?moduleForm(module,t):''}</section>`:''}${module?`<section><h2>${escapeHtml(t('v7.authoring.lessons'))}</h2>${optionRows(state.lessons,'lesson',state.selected?.lessonId,t)}${lessonForm(null,t)}${lesson?lessonForm(lesson,t):''}</section>`:''}${lesson?`<section><h2>${escapeHtml(t('v7.authoring.revisions'))}</h2>${optionRows(state.revisions,'revision',state.selected?.revisionId,t)}${revisionForm(t)}</section>`:''}${stepEditor(state,t)}</fieldset><section><h2>${escapeHtml(t('v7.authoring.readiness.title'))}</h2>${readinessView(state.readiness,t)}</section></section>`;
}

function uiError(key){throw Object.assign(new Error(key),{uiKey:key});}
function formValue(form,name){return form.elements?.namedItem(name)?.value??'';}
function position(form){const value=Number(formValue(form,'position'));if(!Number.isInteger(value)||value<0)uiError('v7.authoring.invalidOrder');return value;}
function json(form,name,fallback){const raw=formValue(form,name).trim();if(!raw)return fallback;try{return JSON.parse(raw);}catch{uiError('v7.authoring.invalidJson');}}

export function curriculumAuthoringPage({controller,subscribeContext=()=>()=>{},onBack=()=>{},onAccount=()=>{},onCongregation=()=>{}}){
  if(!controller?.getState||!controller?.subscribe||!controller?.load)throw new TypeError('Curriculum authoring page requires the feature-local controller.');
  const t=(key,values)=>localization.t(key,{values});
  return {title:t('v7.authoring.title'),html:`<main data-curriculum-authoring></main><nav><button type="button" data-authoring-nav="back">${escapeHtml(t('v7.authoring.nav.back'))}</button><button type="button" data-authoring-nav="account">${escapeHtml(t('v7.authoring.nav.account'))}</button><button type="button" data-authoring-nav="congregation">${escapeHtml(t('v7.authoring.nav.congregation'))}</button></nav>`,mount(root){
    const host=root.querySelector('[data-curriculum-authoring]');let localErrorKey=null,disposed=false;
    const render=state=>{if(!disposed&&host)host.innerHTML=renderCurriculumAuthoring(state,{localErrorKey});};
    const run=async work=>{localErrorKey=null;render(controller.getState());try{await work();}catch(error){localErrorKey=error?.uiKey||'v7.authoring.error';render(controller.getState());}};
    const click=event=>{
      const button=event.target?.closest?.('button');if(!button)return;
      const kind=button.getAttribute('data-authoring-select'),id=button.getAttribute('data-id');
      if(kind&&id){const method={track:'selectTrack',module:'selectModule',lesson:'selectLesson',revision:'selectRevision'}[kind];if(method)void run(()=>controller[method](id));return;}
      const action=button.getAttribute('data-authoring-action');if(action==='reload')void run(()=>controller.load());if(action==='readiness')void run(()=>controller.refreshReadiness());
      const nav=button.getAttribute('data-authoring-nav');if(nav==='back')onBack();if(nav==='account')onAccount();if(nav==='congregation')onCongregation();
    };
    const submit=event=>{const form=event.target?.closest?.('form[data-authoring-form]');if(!form)return;event.preventDefault();const kind=form.getAttribute('data-authoring-form');void run(async()=>{
      if(kind==='track-create'||kind==='track-update'){const input={title:formValue(form,'title'),summary:formValue(form,'summary'),locale:formValue(form,'locale'),audience:formValue(form,'audience'),position:position(form)};return kind==='track-create'?controller.createTrack(input):controller.updateTrack(input);}
      if(kind==='module-create'||kind==='module-update'){const input={title:formValue(form,'title'),summary:formValue(form,'summary'),position:position(form)};return kind==='module-create'?controller.createModule(input):controller.updateModule(input);}
      if(kind==='lesson-create'||kind==='lesson-update'){const input={title:formValue(form,'title'),position:position(form)};return kind==='lesson-create'?controller.createLesson(input):controller.updateLesson(input);}
      if(kind==='revision-create')return controller.createRevision({locale:formValue(form,'locale'),summary:formValue(form,'summary')});
      if(kind==='step-save')return controller.saveStep({position:position(form),content:json(form,'content',{}),scriptureRefs:json(form,'scriptureRefs',[]),libraryRevisionId:formValue(form,'libraryRevisionId').trim()||null});
    });};
    root.addEventListener('click',click);root.addEventListener('submit',submit);
    const unsubscribe=controller.subscribe(state=>{localErrorKey=null;render(state);});
    const unsubscribeContext=subscribeContext(()=>{controller.invalidate();localErrorKey='v7.authoring.contextChanged';render(controller.getState());});
    render(controller.getState());void run(()=>controller.load());
    return()=>{disposed=true;unsubscribe();unsubscribeContext();root.removeEventListener('click',click);root.removeEventListener('submit',submit);controller.dispose();};
  }};
}
