import { renderDevotional } from './devotional.js';
import { renderBookMetadata } from '../books/presentation.js';
import { renderPastTeachingArticle } from '../past-teachings/article.js';
import { localization } from '../../app/localization.js';
import { stageLibraryReturnFocus } from './navigation-focus.js';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

// Shared metadata surface. Type-specific content/hosting remains with P2 lanes.
export function createLibraryItemPage({service,id,onBack}) {
  return {
    title:localization.t('v7.library.item.title'),
    html:`<section class="bq-panel"><button type="button" class="bq-secondary-button" data-library-back>${escapeHtml(localization.t('v7.library.item.back'))}</button><div data-library-detail role="status" aria-live="polite" tabindex="-1"></div><button type="button" class="bq-secondary-button" data-library-item-retry hidden>${escapeHtml(localization.t('v7.library.retry'))}</button></section>`,
    mount(root) {
      const host=root.querySelector('[data-library-detail]');
      const back=root.querySelector('[data-library-back]');
      const retry=root.querySelector('[data-library-item-retry]');
      let disposed=false;
      const render=state=>{
        if(disposed)return;
        const urgent=state.status==='error'||state.status==='not-found';
        host.setAttribute?.('role',urgent?'alert':'status');
        host.setAttribute?.('aria-live',urgent?'assertive':'polite');
        retry.hidden=!id||!['error','idle'].includes(state.status);
        if(state.status==='ready'&&state.selectedItem){
          const item=state.selectedItem;
          const t=key=>escapeHtml(localization.t(key));
          host.innerHTML=`<h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(item.summary)}</p><p>${t('v7.content.source')}: ${escapeHtml(item.source.title)}</p><p>${t('v7.content.attribution')}: ${escapeHtml(item.rights.attribution)}</p><p>${t('v7.content.license')}: ${escapeHtml(item.rights.basis)}</p><p>${escapeHtml(item.rights.allowedUses.join(' · '))}</p>${item.contentType==='book'?renderBookMetadata(item):''}${renderPastTeachingArticle(item)}${item.contentType==='devotional'?renderDevotional(item,{locale:localization.getLocale(),translate:localization.t}):''}`;
        }else{
          const key=state.status==='error'?(globalThis.navigator?.onLine===false?'v7.library.offline':'v7.library.item.error'):state.status==='not-found'?'v7.library.item.unavailable':state.status==='idle'?'v7.library.item.contextChanged':'v7.library.item.loading';
          host.textContent=localization.t(key);
        }
      };
      const goBack=()=>{
        if(id)stageLibraryReturnFocus(id);
        onBack();
      };
      const reload=()=>{
        if(!disposed&&id&&!retry.hidden){
          host.focus?.({preventScroll:true});
          void service.getItem(id);
        }
      };
      back.addEventListener('click',goBack);
      retry.addEventListener('click',reload);
      const unsubscribe=service.subscribe(render);
      host.focus?.({preventScroll:true});
      if(id){
        void service.getItem(id);
      }else host.textContent=localization.t('v7.library.item.required');
      return ()=>{disposed=true;unsubscribe();back.removeEventListener('click',goBack);retry.removeEventListener('click',reload)};
    }
  };
}