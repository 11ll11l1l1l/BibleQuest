import { localization } from '../../app/localization.js';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const defaultTranslate=(key,values)=>localization.t(key,{values});

function validateReceipt(value,request){
  if(!value||typeof value!=='object'||Array.isArray(value))throw Object.assign(new Error('Publication authority returned an invalid acknowledgement.'),{code:'BQ_AUTHORING_PUBLICATION_ACK_INVALID'});
  for(const key of ['trackId','moduleId','lessonId','lessonRevisionId']){
    if(String(value[key]??'')!==String(request?.[key]??''))throw Object.assign(new Error('Publication authority acknowledged a different curriculum path.'),{code:'BQ_AUTHORING_PUBLICATION_ACK_INVALID'});
  }
  if(value.trackPublicationState!=='published'||value.modulePublicationState!=='published'||value.lessonPublicationState!=='published'){
    throw Object.assign(new Error('Publication authority returned an invalid publication state.'),{code:'BQ_AUTHORING_PUBLICATION_ACK_INVALID'});
  }
  if(typeof value.publishedAt!=='string'||!Number.isFinite(Date.parse(value.publishedAt))){
    throw Object.assign(new Error('Publication authority returned an invalid publication timestamp.'),{code:'BQ_AUTHORING_PUBLICATION_ACK_INVALID'});
  }
  return Object.freeze({
    trackId:request.trackId,moduleId:request.moduleId,lessonId:request.lessonId,lessonRevisionId:request.lessonRevisionId,
    trackPublicationState:'published',modulePublicationState:'published',lessonPublicationState:'published',publishedAt:value.publishedAt,
  });
}

export function renderPublicationHandoff(readiness,{translate=defaultTranslate,busy=false,canPublish=false,receipt=null,errorKey=null}={}){
  const t=(key,values)=>translate(key,values);
  if(readiness?.ready!==true||!readiness.request){
    return `<section data-publication-handoff><h2>${escapeHtml(t('v7.publicationHandoff.title'))}</h2><p>${escapeHtml(t('v7.publicationHandoff.notReady'))}</p></section>`;
  }
  const action=canPublish?'publish':'prepare';
  const label=canPublish?'v7.publicationHandoff.publish':'v7.publicationHandoff.prepare';
  const pending=canPublish?'':`<p><small>${escapeHtml(t('v7.publicationHandoff.backendPending'))}</small></p>`;
  const status=busy?`<p role="status">${escapeHtml(t(canPublish?'v7.publicationHandoff.publishing':'v7.publicationHandoff.preparing'))}</p>`:errorKey?`<p role="alert">${escapeHtml(t(errorKey))}</p>`:'';
  const success=receipt?`<p data-publication-published role="status">${escapeHtml(t('v7.publicationHandoff.published'))}</p>`:'';
  return `<section data-publication-handoff><h2>${escapeHtml(t('v7.publicationHandoff.title'))}</h2><p>${escapeHtml(t('v7.publicationHandoff.ready'))}</p>${status}<button type="button" data-publication-handoff-action="${action}"${busy?' disabled':''}>${escapeHtml(t(label))}</button>${pending}${success}</section>`;
}

// Feature-local bridge. Without an injected authority this preserves the preparation-only
// handoff. With one, the exact locally revalidated request is sent to the schema-owned
// atomic publisher and success is accepted only after an exact server acknowledgement.
export function publicationHandoff({preparePublication,onPrepared=()=>{},publish=null,onPublished=()=>{}}={}){
  if(typeof preparePublication!=='function')throw new TypeError('Publication handoff requires the feature publication-request preparer.');
  if(typeof onPrepared!=='function')throw new TypeError('Publication handoff callback must be a function.');
  if(publish!==null&&typeof publish!=='function')throw new TypeError('Publication authority must be a function when supplied.');
  if(typeof onPublished!=='function')throw new TypeError('Publication success callback must be a function.');
  let disposed=false,busy=false,receipt=null,errorKey=null,generation=0;
  const ensureAvailable=()=>{
    if(disposed)throw Object.assign(new Error('Publication handoff is disposed.'),{code:'BQ_AUTHORING_PUBLICATION_DISPOSED'});
    if(busy)throw Object.assign(new Error('Publication action is already in progress.'),{code:'BQ_AUTHORING_PUBLICATION_BUSY'});
  };
  const api={
    get busy(){return busy;},
    get receipt(){return receipt;},
    render(readiness,options={}){return renderPublicationHandoff(readiness,{...options,busy,canPublish:Boolean(publish),receipt,errorKey});},
    async prepare(){
      ensureAvailable();busy=true;receipt=null;errorKey=null;const token=++generation;
      try{
        const request=preparePublication();
        await onPrepared(request);
        return request;
      }catch(error){if(!disposed&&token===generation)errorKey='v7.publicationHandoff.error';throw error;}
      finally{if(!disposed&&token===generation)busy=false;}
    },
    dispose(){disposed=true;generation+=1;busy=false;receipt=null;},
  };
  if(publish){
    api.publish=async()=>{
      ensureAvailable();busy=true;receipt=null;errorKey=null;const token=++generation;
      try{
        const request=preparePublication();
        const confirmed=validateReceipt(await publish(request),request);
        if(disposed||token!==generation)return confirmed;
        receipt=confirmed;
        try{await onPublished(confirmed);}catch{/* confirmed backend success remains authoritative */}
        return confirmed;
      }catch(error){if(!disposed&&token===generation)errorKey='v7.publicationHandoff.error';throw error;}
      finally{if(!disposed&&token===generation)busy=false;}
    };
  }
  return Object.freeze(api);
}
