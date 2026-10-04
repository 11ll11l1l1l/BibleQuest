import { localization } from '../../app/localization.js';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const defaultTranslate=(key,values)=>localization.t(key,{values});

export function renderPublicationHandoff(readiness,{translate=defaultTranslate,busy=false}={}){
  const t=(key,values)=>translate(key,values);
  if(readiness?.ready!==true||!readiness.request){
    return `<section data-publication-handoff><h2>${escapeHtml(t('v7.publicationHandoff.title'))}</h2><p>${escapeHtml(t('v7.publicationHandoff.notReady'))}</p></section>`;
  }
  return `<section data-publication-handoff><h2>${escapeHtml(t('v7.publicationHandoff.title'))}</h2><p>${escapeHtml(t('v7.publicationHandoff.ready'))}</p><button type="button" data-publication-handoff-action="prepare"${busy?' disabled':''}>${escapeHtml(t('v7.publicationHandoff.prepare'))}</button><p><small>${escapeHtml(t('v7.publicationHandoff.backendPending'))}</small></p></section>`;
}

// Feature-local callback bridge only. `preparePublication` performs local stale/readiness
// validation and returns a payload; `onPrepared` is supplied by the eventual backend owner.
// This module never publishes or archives curriculum itself.
export function publicationHandoff({preparePublication,onPrepared=()=>{}}={}){
  if(typeof preparePublication!=='function')throw new TypeError('Publication handoff requires the feature publication-request preparer.');
  if(typeof onPrepared!=='function')throw new TypeError('Publication handoff callback must be a function.');
  let disposed=false,busy=false;
  return Object.freeze({
    get busy(){return busy;},
    render(readiness,options={}){return renderPublicationHandoff(readiness,{...options,busy});},
    async prepare(){
      if(disposed)throw Object.assign(new Error('Publication handoff is disposed.'),{code:'BQ_AUTHORING_PUBLICATION_DISPOSED'});
      if(busy)throw Object.assign(new Error('Publication request is already being prepared.'),{code:'BQ_AUTHORING_PUBLICATION_BUSY'});
      busy=true;
      try{
        const request=preparePublication();
        await onPrepared(request);
        return request;
      }finally{busy=false;}
    },
    dispose(){disposed=true;},
  });
}
