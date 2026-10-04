import { renderDevotional } from './devotional.js';
import { renderBookMetadata } from '../books/presentation.js';
import { renderPastTeachingArticle } from '../past-teachings/article.js';
import { localization } from '../../app/localization.js';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

// Shared metadata surface. Type-specific content/hosting remains with P2 lanes.
export function createLibraryItemPage({service,id,onBack}) {
  return {
    title:'Library item',
    html:'<section class="bq-panel"><button type="button" class="bq-secondary-button" data-library-back>Back to Library</button><div data-library-detail role="status" aria-live="polite"></div></section>',
    mount(root) {
      const host=root.querySelector('[data-library-detail]');
      const back=root.querySelector('[data-library-back]');
      const render=state=>{
        if(state.status==='ready'&&state.selectedItem){
          const item=state.selectedItem;
          const t=key=>escapeHtml(localization.t(key));
          host.innerHTML=`<h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(item.summary)}</p><p>${t('v7.content.source')}: ${escapeHtml(item.source.title)}</p><p>${t('v7.content.attribution')}: ${escapeHtml(item.rights.attribution)}</p><p>${t('v7.content.license')}: ${escapeHtml(item.rights.basis)}</p><p>${escapeHtml(item.rights.allowedUses.join(' · '))}</p>${item.contentType==='book'?renderBookMetadata(item):''}${renderPastTeachingArticle(item)}${item.contentType==='devotional'?renderDevotional(item,{locale:localization.getLocale(),translate:localization.t}):''}`;
        }else{
          host.textContent=state.status==='error'?state.error:state.status==='not-found'?'This published item is unavailable.':state.status==='idle'?'Library context changed. Return to Library to reload.':'Loading Library item…';
        }
      };
      const goBack=()=>onBack();
      back.addEventListener('click',goBack);
      const unsubscribe=service.subscribe(render);
      if(id)void service.getItem(id);else host.textContent='A Library item link is required.';
      return ()=>{unsubscribe();back.removeEventListener('click',goBack)};
    }
  };
}
