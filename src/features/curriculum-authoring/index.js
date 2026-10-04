const STEPS=Object.freeze(['scripture','understand','discuss','reflect','apply','pray','action']);
const STEP_LABELS=Object.freeze(['Scripture','Understand','Discuss','Reflect','Apply','Pray','Action']);
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const attr=escapeHtml;
const busy=state=>['loading','saving','checking'].includes(state?.status);
const selected=(rows,id)=>rows?.find(row=>row.id===id)||null;
const number=value=>Number.isInteger(value)?value:0;
function optionRows(rows,kind,currentId){
  if(!rows?.length)return `<p>No ${kind}s yet.</p>`;
  return `<ul>${rows.map(row=>`<li><button type="button" data-authoring-select="${kind}" data-id="${attr(row.id)}"${row.id===currentId?' aria-current="true"':''}>${escapeHtml(row.title||`${kind} ${row.revisionNumber??''}`)}</button>${row.publicationState?` <small>${escapeHtml(row.publicationState)}</small>`:''}</li>`).join('')}</ul>`;
}
function trackForm(track){
  return `<form data-authoring-form="${track?'track-update':'track-create'}"><h3>${track?'Edit track':'New track'}</h3><label>Title <input name="title" maxlength="240" required value="${attr(track?.title||'')}"></label><label>Summary <textarea name="summary" maxlength="4000">${escapeHtml(track?.summary||'')}</textarea></label><label>Language <input name="locale" required value="${attr(track?.locale||'en')}"></label><label>Audience <input name="audience" maxlength="240" value="${attr(track?.audience||'')}"></label><label>Order <input name="position" type="number" min="0" step="1" value="${number(track?.position)}"></label><button type="submit" class="bq-primary-button">${track?'Save track':'Create track'}</button></form>`;
}
function moduleForm(module){
  return `<form data-authoring-form="${module?'module-update':'module-create'}"><h3>${module?'Edit module':'New module'}</h3><label>Title <input name="title" maxlength="240" required value="${attr(module?.title||'')}"></label><label>Summary <textarea name="summary" maxlength="4000">${escapeHtml(module?.summary||'')}</textarea></label><label>Order <input name="position" type="number" min="0" step="1" value="${number(module?.position)}"></label><button type="submit" class="bq-primary-button">${module?'Save module':'Create module'}</button></form>`;
}
function lessonForm(lesson){
  return `<form data-authoring-form="${lesson?'lesson-update':'lesson-create'}"><h3>${lesson?'Edit lesson':'New lesson'}</h3><label>Title <input name="title" maxlength="240" required value="${attr(lesson?.title||'')}"></label><label>Order <input name="position" type="number" min="0" step="1" value="${number(lesson?.position)}"></label><button type="submit" class="bq-primary-button">${lesson?'Save lesson':'Create lesson'}</button></form>`;
}
function revisionForm(){return '<form data-authoring-form="revision-create"><h3>New lesson revision</h3><label>Language <input name="locale" required value="en"></label><label>Summary <textarea name="summary" maxlength="4000"></textarea></label><button type="submit" class="bq-primary-button">Create revision</button></form>';}
function stepEditor(state){
  if(!state.selected?.revisionId)return '';
  const byPosition=new Map((state.steps||[]).map(row=>[row.position,row]));
  const list=STEPS.map((type,index)=>{const row=byPosition.get(index);return `<li><strong>${STEP_LABELS[index]}</strong> — ${row?'Saved':'Not saved'}</li>`;}).join('');
  return `<section><h2>Seven-step lesson</h2><ol>${list}</ol><form data-authoring-form="step-save"><label>Step <select name="position">${STEPS.map((type,index)=>`<option value="${index}">${index+1}. ${STEP_LABELS[index]}</option>`).join('')}</select></label><label>Content JSON <textarea name="content" required>{}</textarea></label><label>Scripture references JSON <textarea name="scriptureRefs">[]</textarea></label><label>Library revision ID <input name="libraryRevisionId"></label><button type="submit" class="bq-primary-button">Save step</button></form></section>`;
}
function readinessView(readiness){
  if(!readiness)return '<p>Select a lesson revision to check publication readiness.</p>';
  if(readiness.ready)return `<p><strong>Ready for atomic publication.</strong> ${number(readiness.stepCount)}/7 steps complete.</p><p><small>Publication becomes actionable only after the shared atomic backend boundary is connected.</small></p>`;
  const blockers=(readiness.blockers||[]).map(item=>`<li>${escapeHtml(String(item).replaceAll('_',' '))}</li>`).join('');
  return `<p>${number(readiness.stepCount)}/7 steps complete.</p>${blockers?`<ul>${blockers}</ul>`:''}`;
}

export function renderCurriculumAuthoring(state,{localError=null}={}){
  const track=selected(state.tracks,state.selected?.trackId),module=selected(state.modules,state.selected?.moduleId),lesson=selected(state.lessons,state.selected?.lessonId);
  const isBusy=busy(state),disabled=isBusy?' disabled':'';
  return `<section class="bq-panel"><p class="bq-eyebrow">CURRICULUM AUTHORING</p><h1>ONE 2 ONE curriculum</h1><p>Create the discipleship path from track to the seven lesson steps.</p><p role="status" aria-live="polite">${escapeHtml(localError||state.error||(isBusy?`${state.status}…`:''))}</p><div><button type="button" data-authoring-action="reload"${disabled}>Reload</button><button type="button" data-authoring-action="readiness"${!state.selected?.revisionId||isBusy?' disabled':''}>Check readiness</button></div><fieldset${disabled}><section><h2>Tracks</h2>${optionRows(state.tracks,'track',state.selected?.trackId)}${trackForm()}${track?trackForm(track):''}</section>${track?`<section><h2>Modules</h2>${optionRows(state.modules,'module',state.selected?.moduleId)}${moduleForm()}${module?moduleForm(module):''}</section>`:''}${module?`<section><h2>Lessons</h2>${optionRows(state.lessons,'lesson',state.selected?.lessonId)}${lessonForm()}${lesson?lessonForm(lesson):''}</section>`:''}${lesson?`<section><h2>Revisions</h2>${optionRows(state.revisions,'revision',state.selected?.revisionId)}${revisionForm()}</section>`:''}${stepEditor(state)}</fieldset><section><h2>Publication readiness</h2>${readinessView(state.readiness)}</section></section>`;
}

function formValue(form,name){return form.elements?.namedItem(name)?.value??'';}
function position(form){const value=Number(formValue(form,'position'));if(!Number.isInteger(value)||value<0)throw new Error('Order must be a non-negative integer.');return value;}
function json(form,name,fallback){const raw=formValue(form,name).trim();return raw?JSON.parse(raw):fallback;}

export function curriculumAuthoringPage({controller,subscribeContext=()=>()=>{},onBack=()=>{},onAccount=()=>{},onCongregation=()=>{}}){
  if(!controller?.getState||!controller?.subscribe||!controller?.load)throw new TypeError('Curriculum authoring page requires the feature-local controller.');
  return {title:'Curriculum authoring',html:'<main data-curriculum-authoring></main><nav><button type="button" data-authoring-nav="back">Back</button><button type="button" data-authoring-nav="account">Account</button><button type="button" data-authoring-nav="congregation">Choose congregation</button></nav>',mount(root){
    const host=root.querySelector('[data-curriculum-authoring]');let localError=null,disposed=false;
    const render=state=>{if(!disposed&&host)host.innerHTML=renderCurriculumAuthoring(state,{localError});};
    const run=async work=>{localError=null;render(controller.getState());try{await work();}catch(error){localError=error?.message||'Authoring action failed.';render(controller.getState());}};
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
    const unsubscribe=controller.subscribe(state=>{localError=null;render(state);});
    const unsubscribeContext=subscribeContext(()=>{controller.invalidate();localError='Account or congregation changed. Reload curriculum authoring.';render(controller.getState());});
    render(controller.getState());void run(()=>controller.load());
    return()=>{disposed=true;unsubscribe();unsubscribeContext();root.removeEventListener('click',click);root.removeEventListener('submit',submit);controller.dispose();};
  }};
}
