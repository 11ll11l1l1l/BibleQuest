const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function mediaLibraryPage({library,onHome,onAccount}){
  return{
    title:'Media Library',
    html:'<section data-media-library-page><section class="bq-panel"><p>Loading Media Library…</p></section></section>',
    mount(root){
      const host=root.querySelector('[data-media-library-page]');
      let disposed=false;

      const render=state=>{
        if(disposed)return;
        if(state.status==='locked'){
          host.innerHTML='<section class="bq-panel bq-media-head"><p class="bq-eyebrow">MEDIA LIBRARY</p><h1>Sign in to browse congregation media</h1><p>Protected congregation media stays behind the account boundary. Guest mode does not contact the cloud.</p><div class="bq-media-actions"><button type="button" class="bq-primary-button" data-media-account>Sign in</button><button type="button" class="bq-secondary-button" data-media-home>Back home</button></div></section>';
          return;
        }
        if(state.status==='error'){
          host.innerHTML=`<section class="bq-panel bq-media-head" role="alert"><p class="bq-eyebrow">MEDIA LIBRARY</p><h1>Media Library could not load</h1><p>${escapeHtml(state.error)}</p><div class="bq-media-actions"><button type="button" class="bq-primary-button" data-media-retry>Try again</button><button type="button" class="bq-secondary-button" data-media-home>Back home</button></div></section>`;
          return;
        }
        if(state.status==='loading'){
          host.innerHTML='<section class="bq-panel bq-media-head" role="status"><p class="bq-eyebrow">MEDIA LIBRARY</p><h1>Loading media…</h1><p>The same bounded recordings data boundary is used here, so a failed request cannot freeze the shell.</p></section>';
          return;
        }
        const rows=library.visibleRows(state);
        host.innerHTML=`<section class="bq-panel bq-media-head"><p class="bq-eyebrow">MEDIA LIBRARY</p><h1>Browse congregation media</h1><p>Browse published worship and Bible-study replays. Playback reuses BibleQuest’s single verified media player.</p></section>
        <section class="bq-panel bq-media-toolbar">
          <div class="bq-media-tabs" role="group" aria-label="Media filter"><button type="button" class="${state.view==='all'?'is-active':''}" data-media-view="all">All</button><button type="button" class="${state.view==='featured'?'is-active':''}" data-media-view="featured">Featured</button></div>
          <label><span>Search media</span><input type="search" maxlength="120" value="${escapeHtml(state.query)}" placeholder="Worship, Bible study…" data-media-search></label>
        </section>
        <section class="bq-media-layout">
          <div class="bq-media-grid" data-media-grid>${rows.length?rows.map(row=>`<article class="bq-panel bq-media-card"><span>${row.featured?'★ Featured':'Video replay'}</span><h2>${escapeHtml(row.title)}</h2>${row.description?`<p>${escapeHtml(row.description)}</p>`:''}<button type="button" class="bq-secondary-button" data-media-open="${escapeHtml(row.id)}">Open media</button></article>`).join(''):'<section class="bq-panel bq-media-empty"><h2>No matching media</h2><p>There are no published items for this view.</p></section>'}</div>
          <section class="bq-panel bq-media-player-shell">
            <div data-media-now><p class="bq-eyebrow">MEDIA VIEWER</p><h2>${state.selectedId?'Media selected':'Choose an item'}</h2><p>${state.selectedId?'Use the shared playback controls below.':'Select an item from the library to open it.'}</p></div>
            <div class="bq-media-frame" data-media-frame></div>
            <div class="bq-media-controls" data-media-controls ${state.selectedId?'':'hidden'}>
              <button type="button" data-media-play>Play</button><button type="button" data-media-pause>Pause</button><button type="button" data-media-stop>Stop</button>
              <label><span>Seek to second</span><input type="number" min="0" max="86400" step="5" value="0" data-media-seek-value></label><button type="button" data-media-seek>Seek</button>
              <button type="button" class="bq-secondary-button" data-media-close-item>Back to library</button>
            </div>
            <p class="bq-form-message" data-media-message aria-live="polite"></p>
          </section>
        </section>
        <div class="bq-media-actions"><button type="button" class="bq-secondary-button" data-media-home>Back home</button></div>`;
      };

      const load=async()=>{render({status:'loading',rows:[],view:'all',query:'',selectedId:null});const state=await library.load();render(state)};
      const message=text=>{const node=host.querySelector('[data-media-message]');if(node)node.textContent=text||''};
      const onClick=async event=>{
        const target=event.target instanceof Element?event.target:null;if(!target)return;
        if(target.closest('[data-media-home]')){library.leave();onHome();return}
        if(target.closest('[data-media-account]')){library.leave();onAccount();return}
        if(target.closest('[data-media-retry]')){await load();return}
        const view=target.closest('[data-media-view]');if(view){render(library.setView(view.dataset.mediaView));return}
        const open=target.closest('[data-media-open]');if(open){try{const frameHost=host.querySelector('[data-media-frame]');const state=library.open(open.dataset.mediaOpen,frameHost);const row=library.selected();host.querySelector('[data-media-now]').innerHTML=`<p class="bq-eyebrow">NOW OPEN</p><h2>${escapeHtml(row?.title||'Media')}</h2><p>${escapeHtml(row?.description||'Published congregation media.')}</p>`;host.querySelector('[data-media-controls]').hidden=false;message('Media ready.')}catch(error){message(error?.message||'Could not open media.')}return}
        if(target.closest('[data-media-close-item]')){render(library.returnToBrowse());return}
        try{
          if(target.closest('[data-media-play]')){library.play();message('Playing.');return}
          if(target.closest('[data-media-pause]')){library.pause();message('Paused.');return}
          if(target.closest('[data-media-stop]')){library.stop();message('Stopped.');return}
          if(target.closest('[data-media-seek]')){library.seek(host.querySelector('[data-media-seek-value]')?.value||0);message('Seek requested.');return}
        }catch(error){message(error?.message||'Playback control failed.')}
      };
      const onInput=event=>{const target=event.target instanceof Element?event.target:null;if(target?.matches('[data-media-search]'))render(library.setQuery(target.value))};
      host.addEventListener('click',onClick);host.addEventListener('change',onInput);
      load().catch(error=>render({status:'error',rows:[],view:'all',query:'',selectedId:null,error:error?.message||'Could not load Media Library.'}));
      return()=>{disposed=true;host.removeEventListener('click',onClick);host.removeEventListener('change',onInput);library.leave()};
    }
  };
}
