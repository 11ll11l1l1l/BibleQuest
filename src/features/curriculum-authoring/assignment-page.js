import { localization } from '../../app/localization.js';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));
const attr=escapeHtml;
const busy=state=>state?.status==='loading';
const selected=(rows,id)=>rows?.find(row=>row.id===id)||null;
const tDefault=(key,values)=>localization.t(key,{values});
const assignmentStatuses=new Set(['assigned','started','completed']);

function list(rows,kind,currentId,label,t,isBusy=false){
  if(!rows?.length)return `<p>${escapeHtml(t(`v7.assignment.${kind}.empty`))}</p>`;
  return `<ul>${rows.map(row=>`<li><button type="button" data-assignment-select="${kind}" data-id="${attr(row.id)}"${row.id===currentId?' aria-current="true"':''}${isBusy?' disabled':''}>${escapeHtml(row.title||label(row))}</button></li>`).join('')}</ul>`;
}

function path(state,t,isBusy=false){
  const pair=selected(state.pairs,state.selected?.pairId);
  const track=selected(state.curriculum,state.selected?.trackId);
  const module=selected(track?.modules,state.selected?.moduleId);
  const lesson=selected(module?.lessons,state.selected?.lessonId);
  return {pair,track,module,lesson,
    html:`<section><h2>${escapeHtml(t('v7.assignment.path.title'))}</h2>
      <div><h3>${escapeHtml(t('v7.assignment.pairs'))}</h3>${list(state.pairs,'pair',state.selected?.pairId,row=>t('v7.assignment.pair.label',{id:row.menteeId}),t,isBusy)}</div>
      ${pair?`<div><h3>${escapeHtml(t('v7.assignment.tracks'))}</h3>${list(state.curriculum,'track',state.selected?.trackId,row=>row.id,t,isBusy)}</div>`:''}
      ${track?`<div><h3>${escapeHtml(t('v7.assignment.modules'))}</h3>${list(track.modules,'module',state.selected?.moduleId,row=>row.id,t,isBusy)}</div>`:''}
      ${module?`<div><h3>${escapeHtml(t('v7.assignment.lessons'))}</h3>${list(module.lessons,'lesson',state.selected?.lessonId,row=>row.id,t,isBusy)}</div>`:''}
    </section>`};
}

function validateReceipt(value,request){
  if(!value||typeof value!=='object'||Array.isArray(value))throw Object.assign(new Error('Assignment authority returned an invalid acknowledgement.'),{code:'BQ_ASSIGNMENT_ACK_INVALID'});
  const id=String(value.id??'').trim(),status=String(value.status??'').trim();
  if(!id||!assignmentStatuses.has(status))throw Object.assign(new Error('Assignment authority returned an invalid acknowledgement.'),{code:'BQ_ASSIGNMENT_ACK_INVALID'});
  for(const key of ['pairId','trackId','moduleId','lessonId','lessonRevisionId']){
    if(String(value[key]??'')!==String(request[key]??''))throw Object.assign(new Error('Assignment authority acknowledged a different assignment request.'),{code:'BQ_ASSIGNMENT_ACK_INVALID'});
  }
  return Object.freeze({id,status,pairId:request.pairId,trackId:request.trackId,moduleId:request.moduleId,lessonId:request.lessonId,lessonRevisionId:request.lessonRevisionId});
}

export function renderAssignmentPreparation(state,{translate=tDefault,localErrorKey=null,canCreate=false,mutationBusy=false,receipt=null}={}){
  const t=(key,values)=>translate(key,values),isBusy=busy(state)||mutationBusy,current=path(state,t,isBusy);
  const statusKey=localErrorKey||(mutationBusy?'v7.assignment.creating':state?.error?'v7.assignment.error':busy(state)?'v7.assignment.loading':null);
  const ready=Boolean(current.pair&&current.track&&current.module&&current.lesson);
  const action=canCreate?'create':'prepare',actionLabel=canCreate?'v7.assignment.create':'v7.assignment.prepare';
  const authorityNote=canCreate?'':`<p><small>${escapeHtml(t('v7.assignment.backendPending'))}</small></p>`;
  const receiptHtml=receipt?`<p data-assignment-created role="status">${escapeHtml(t('v7.assignment.created',{status:receipt.status}))}</p>`:'';
  return `<section class="bq-panel"><p class="bq-eyebrow">${escapeHtml(t('v7.assignment.eyebrow'))}</p><h1>${escapeHtml(t('v7.assignment.title'))}</h1><p>${escapeHtml(t('v7.assignment.intro'))}</p><p role="status" aria-live="polite">${statusKey?escapeHtml(t(statusKey)):''}</p><button type="button" data-assignment-action="reload"${isBusy?' disabled':''}>${escapeHtml(t('v7.assignment.reload'))}</button>${current.html}<section><h2>${escapeHtml(t('v7.assignment.review.title'))}</h2>${ready?`<p>${escapeHtml(t('v7.assignment.review.ready'))}</p><dl><dt>${escapeHtml(t('v7.assignment.review.mentee'))}</dt><dd>${escapeHtml(current.pair.menteeId)}</dd><dt>${escapeHtml(t('v7.assignment.review.track'))}</dt><dd>${escapeHtml(current.track.title)}</dd><dt>${escapeHtml(t('v7.assignment.review.module'))}</dt><dd>${escapeHtml(current.module.title)}</dd><dt>${escapeHtml(t('v7.assignment.review.lesson'))}</dt><dd>${escapeHtml(current.lesson.title)}</dd></dl><button type="button" data-assignment-action="${action}"${isBusy?' disabled':''}>${escapeHtml(t(actionLabel))}</button>${authorityNote}${receiptHtml}`:`<p>${escapeHtml(t('v7.assignment.review.incomplete'))}</p>`}</section></section>`;
}

export function assignmentPreparationPage({preparation,subscribeContext=()=>()=>{},onBack=()=>{},onPrepared=()=>{},createAssignment=null,onCreated=()=>{}}={}){
  if(!preparation?.getState||!preparation?.subscribe||!preparation?.loadPairs||!preparation?.buildRequest){
    throw new TypeError('Assignment preparation page requires the feature-local preparation boundary.');
  }
  if(createAssignment!==null&&typeof createAssignment!=='function')throw new TypeError('Assignment creation authority must be a function when supplied.');
  if(typeof onPrepared!=='function'||typeof onCreated!=='function')throw new TypeError('Assignment callbacks must be functions.');
  const t=(key,values)=>localization.t(key,{values});
  return {title:t('v7.assignment.title'),html:`<main data-assignment-preparation></main><nav><button type="button" data-assignment-nav="back">${escapeHtml(t('v7.assignment.back'))}</button></nav>`,mount(root){
    const host=root.querySelector('[data-assignment-preparation]');let disposed=false,localErrorKey=null,mutationBusy=false,receipt=null,generation=0;
    const render=state=>{if(!disposed&&host)host.innerHTML=renderAssignmentPreparation(state,{localErrorKey,canCreate:Boolean(createAssignment),mutationBusy,receipt});};
    const clearResult=()=>{receipt=null;localErrorKey=null;generation+=1;};
    const run=async work=>{clearResult();render(preparation.getState());try{await work();}catch{if(!disposed){localErrorKey='v7.assignment.error';render(preparation.getState());}}};
    const runCreate=async()=>{
      if(mutationBusy||disposed)return;
      localErrorKey=null;receipt=null;mutationBusy=true;const token=++generation;render(preparation.getState());
      try{
        const request=preparation.buildRequest();
        const result=validateReceipt(await createAssignment(request),request);
        if(disposed||token!==generation)return;
        receipt=result;await onCreated(result);
      }catch{
        if(!disposed&&token===generation)localErrorKey='v7.assignment.error';
      }finally{
        if(!disposed&&token===generation){mutationBusy=false;render(preparation.getState());}
      }
    };
    const click=event=>{
      const button=event.target?.closest?.('button');if(!button||button.disabled)return;
      const kind=button.getAttribute('data-assignment-select'),id=button.getAttribute('data-id');
      if(kind&&id){const method={pair:'selectPair',track:'selectTrack',module:'selectModule',lesson:'selectLesson'}[kind];if(method)void run(()=>preparation[method](id));return;}
      const action=button.getAttribute('data-assignment-action');
      if(action==='reload')void run(()=>preparation.loadPairs());
      if(action==='prepare')void run(()=>onPrepared(preparation.buildRequest()));
      if(action==='create'&&createAssignment)void runCreate();
      if(button.getAttribute('data-assignment-nav')==='back')onBack();
    };
    root.addEventListener('click',click);
    const unsubscribe=preparation.subscribe(state=>{if(!mutationBusy){localErrorKey=null;receipt=null;generation+=1;}render(state);});
    const unsubscribeContext=subscribeContext(()=>{generation+=1;mutationBusy=false;receipt=null;preparation.invalidate();localErrorKey='v7.assignment.contextChanged';render(preparation.getState());});
    render(preparation.getState());void run(()=>preparation.loadPairs());
    return()=>{disposed=true;generation+=1;unsubscribe();unsubscribeContext();root.removeEventListener('click',click);preparation.dispose();};
  }};
}
