import {createLibraryReadingList, readingListCopy} from './reading-list.js';
import { renderLibraryPracticeHandoff } from './practice-handoff.js';
import { relatedLibraryTopics, relatedReadingsCopy } from './related-readings.js';
import { renderLibraryConversationHandoff } from './conversation-handoff.js';
import { renderDevotional } from './devotional.js';
import { renderBookMetadata } from '../books/presentation.js';
import { renderPastTeachingArticle } from '../past-teachings/article.js';
import { localization } from '../../app/localization.js';
import { stageLibraryReturnFocus } from './navigation-focus.js';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

// Shared metadata surface. Type-specific content/hosting remains with P2 lanes.
export function createLibraryItemPage({service,id,onBack,onRelated,readingListStorage,getReadingListOwner,isContextReady=()=>true,subscribeContext=()=>()=>{}}) {
  const readingList=readingListStorage&&getReadingListOwner?createLibraryReadingList({storage:readingListStorage,getOwner:getReadingListOwner}):null;
  const copy=readingListCopy(localization.getLocale());
  return {
    title:localization.t('v7.library.item.title'),
    html:`<section class="bq-panel"><button type="button" class="bq-secondary-button" data-library-back>${escapeHtml(localization.t('v7.library.item.back'))}</button><div data-library-detail role="status" aria-live="polite" tabindex="-1"></div><button type="button" class="bq-secondary-button" data-library-item-retry hidden>${escapeHtml(localization.t('v7.library.retry'))}</button></section>`,
    mount(root) {
      const host=root.querySelector('[data-library-detail]');
      const back=root.querySelector('[data-library-back]');
      const retry=root.querySelector('[data-library-item-retry]');
      let disposed=false,selectedItem=null,listOwner=readingList?.owner();
      let relatedRequest=0;
      let relatedRows=new Set();
      const relatedCopy=relatedReadingsCopy(localization.getLocale());
      const relatedLocale=['en','tl','ceb'].includes(localization.getLocale())?localization.getLocale():'en';
      const renderSaved=(message='')=>{
        const node=host.querySelector?.('[data-library-reading-save]');
        if(!node||!readingList||!selectedItem)return;
        try{const saved=readingList.list(listOwner).some(row=>row.id===selectedItem.id);node.innerHTML=`<button type="button" class="bq-secondary-button" data-reading-list-save-action="toggle">${escapeHtml(saved?copy.remove:copy.save)}</button><p role="status">${escapeHtml(message)}</p>`;}
        catch{node.innerHTML=`<p role="status">${escapeHtml(copy.error)}</p><button type="button" class="bq-secondary-button" data-reading-list-save-action="refresh">${escapeHtml(copy.retry)}</button>`;}
      };
      const saveClick=event=>{
        const button=event.target.closest?.('[data-reading-list-save-action]');
        if(disposed||!readingList||!button||!host.contains(button)||!selectedItem)return;
        if(listOwner!==readingList.owner()){selectedItem=null;host.textContent=localization.t('v7.library.item.contextChanged');return;}
        if(button.dataset.readingListSaveAction==='refresh'){renderSaved();return;}
        try{const saved=readingList.list(listOwner).some(row=>row.id===selectedItem.id);if(saved)readingList.remove(selectedItem.id,listOwner);else readingList.save(selectedItem,listOwner);renderSaved(saved?copy.removed:copy.saved);}
        catch(error){renderSaved(error?.code==='BQ_READING_LIST_FULL'?copy.full:copy.error);}
      };
      const relatedClick=event=>{
        const button=event.target.closest?.('[data-library-related-action]');
        if(disposed||!button||!host.contains?.(button)||!selectedItem||!isContextReady())return;
        const action=button.dataset.libraryRelatedAction;
        if(action==='open'){
          const relatedId=button.dataset.id;
          if(relatedRows.has(relatedId)&&typeof onRelated==='function'){
            relatedRequest+=1;
            onRelated({routeKey:'library-item',resourceId:relatedId});
          }
          return;
        }
        if(action!=='load'||typeof service.findRelated!=='function')return;
        const node=host.querySelector?.('[data-library-related-results]');
        if(!node)return;
        const expected=++relatedRequest, selectedId=selectedItem.id, selected=selectedItem;
        relatedRows.clear();
        node.textContent=relatedCopy.loading;
        button.disabled=true;
        void Promise.resolve().then(()=>service.findRelated(selected)).then(rows=>{
          if(disposed||expected!==relatedRequest||selectedItem?.id!==selectedId||!isContextReady())return;
          relatedRows=new Set(rows.map(row=>row.id));
          node.innerHTML=rows.length?`<ul>${rows.map(row=>`<li><button type="button" class="bq-secondary-button" data-library-related-action="open" data-id="${escapeHtml(row.id)}">${escapeHtml(row.title)}</button></li>`).join('')}</ul>`:escapeHtml(relatedCopy.empty);
          button.disabled=false;
        }).catch(()=>{
          if(disposed||expected!==relatedRequest||selectedItem?.id!==selectedId||!isContextReady())return;
          node.textContent=relatedCopy.error;
          button.disabled=false;
        });
      };
      const detailClick=event=>{saveClick(event);relatedClick(event);};
      host.addEventListener?.('click',detailClick);
      const render=state=>{
        if(disposed)return;
        relatedRequest+=1;
        relatedRows.clear();
        const urgent=state.status==='error'||state.status==='not-found';
        host.setAttribute?.('role',urgent?'alert':'status');
        host.setAttribute?.('aria-live',urgent?'assertive':'polite');
        retry.hidden=!id||!isContextReady()||!['error','idle'].includes(state.status);
        if(state.status==='ready'&&state.selectedItem){
          const item=state.selectedItem;
          selectedItem=item;
          const t=key=>escapeHtml(localization.t(key));
          const detailsLabel = ({en:'Source and usage details',tl:'Pinagmulan at paggamit',ceb:'Tinubdan ug paggamit'}[localization.getLocale()] || 'Source and usage details');
          let sourceUrl = '';
          try { const url = new URL(item.source.uri); if (url.protocol === 'https:' && !url.username && !url.password) sourceUrl = url.href; } catch { /* Source prose remains available without a link. */ }
          host.innerHTML=`<h1>${escapeHtml(item.title)}</h1>${readingList?'<div data-library-reading-save></div>':''}${item.contentType==='book'?renderBookMetadata(item):''}${renderPastTeachingArticle(item)}${item.contentType==='devotional'?renderDevotional(item,{locale:localization.getLocale(),translate:localization.t,showTitle:false,showMetadata:false}):''}<details class="bq-library-source-details"><summary>${escapeHtml(detailsLabel)}</summary><p>${t('v7.content.source')}: ${escapeHtml(item.source.title)}</p><p>${t('v7.content.attribution')}: ${escapeHtml(item.rights.attribution)}</p><p>${t('v7.content.license')}: ${escapeHtml(item.rights.basis)}</p><p>${escapeHtml(item.rights.allowedUses.join(' · '))}</p>${sourceUrl?`<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.source.title)}</a>`:''}</details>${renderLibraryConversationHandoff(item,localization.getLocale())}${renderLibraryPracticeHandoff(item,localization.getLocale())}${typeof onRelated==='function'&&typeof service.findRelated==='function'&&relatedLibraryTopics(item).length?`<section data-library-related lang="${relatedLocale}"><h2>${escapeHtml(relatedCopy.title)}</h2><p>${escapeHtml(relatedCopy.note)}</p><button type="button" class="bq-secondary-button" data-library-related-action="load">${escapeHtml(relatedCopy.open)}</button><div data-library-related-results role="status" aria-live="polite"></div></section>`:''}`;
          renderSaved();
        }else{
          selectedItem=null;
          const key=state.status==='error'?(globalThis.navigator?.onLine===false?'v7.library.offline':'v7.library.item.error'):state.status==='not-found'?'v7.library.item.unavailable':state.status==='idle'?'v7.library.item.contextChanged':'v7.library.item.loading';
          host.textContent=localization.t(key);
        }
      };
      const goBack=()=>{
        if(id)stageLibraryReturnFocus(id);
        onBack();
      };
      const reload=()=>{
        if(disposed||!id||retry.hidden)return;
        host.focus?.({preventScroll:true});
        if(!isContextReady()){service.reset?.();return;}
        void service.getItem(id);
      };
      back.addEventListener('click',goBack);
      retry.addEventListener('click',reload);
      const unsubscribe=service.subscribe(render);
      const unsubscribeContext=subscribeContext(()=>{
        if(disposed||!id)return;
        relatedRequest+=1;relatedRows.clear();
        selectedItem=null;listOwner=readingList?.owner();
        if(!isContextReady()){service.reset?.();return;}
        void service.getItem(id);
      });
      host.focus?.({preventScroll:true});
      if(id){
        if(isContextReady())void service.getItem(id);
        else service.reset?.();
      }else host.textContent=localization.t('v7.library.item.required');
      return ()=>{disposed=true;relatedRequest+=1;relatedRows.clear();host.removeEventListener?.('click',detailClick);unsubscribe();unsubscribeContext?.();back.removeEventListener('click',goBack);retry.removeEventListener('click',reload)};
    }
  };
}