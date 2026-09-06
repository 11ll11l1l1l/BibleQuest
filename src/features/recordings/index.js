const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function recordingsPage({recordings,onHome,onAccount}){
  return{
    title:'Live Recordings',
    html:'<section data-recordings-page><section class="bq-panel"><p>Loading Live Recordings…</p></section></section>',
    mount(root){
      const host=root.querySelector('[data-recordings-page]');
      let disposed=false;

      const render=state=>{
        if(disposed)return;
        if(state.status==='locked'){
          host.innerHTML='<section class="bq-panel bq-recordings-head"><p class="bq-eyebrow">LIVE RECORDINGS</p><h1>Sign in to view congregation recordings</h1><p>Recordings are account-backed content. Guest mode does not contact the cloud.</p><div class="bq-recording-actions"><button type="button" class="bq-primary-button" data-recordings-account>Sign in</button><button type="button" class="bq-secondary-button" data-recordings-home>Back home</button></div></section>';
          return;
        }
        if(state.status==='error'){
          host.innerHTML=`<section class="bq-panel bq-recordings-head" role="alert"><p class="bq-eyebrow">LIVE RECORDINGS</p><h1>Recordings could not load</h1><p>${escapeHtml(state.error)}</p><div class="bq-recording-actions"><button type="button" class="bq-primary-button" data-recordings-retry>Try again</button><button type="button" class="bq-secondary-button" data-recordings-home>Back home</button></div></section>`;
          return;
        }
        if(state.status==='loading'){
          host.innerHTML='<section class="bq-panel bq-recordings-head" role="status"><p class="bq-eyebrow">LIVE RECORDINGS</p><h1>Loading recordings…</h1><p>This request is bounded so a failed connection cannot leave BibleQuest frozen.</p></section>';
          return;
        }
        const rows=state.rows||[];
        host.innerHTML=`<section class="bq-panel bq-recordings-head"><p class="bq-eyebrow">LIVE RECORDINGS</p><h1>Worship and Bible study replays</h1><p>Playback stays inside one controlled player. Switching or leaving tears the previous player down first.</p></section>
        <section class="bq-recordings-layout">
          <div class="bq-recordings-list" data-recordings-list>${rows.length?rows.map(row=>`<button type="button" class="bq-recording-card" data-recording-select="${escapeHtml(row.id)}"><span>${row.featured?'★ Featured':'Recording'}</span><b>${escapeHtml(row.title)}</b>${row.description?`<small>${escapeHtml(row.description)}</small>`:''}</button>`).join(''):'<section class="bq-panel bq-recordings-empty"><h2>No recordings yet</h2><p>No published live recordings are currently available to this account.</p></section>'}</div>
          <section class="bq-panel bq-recording-player-shell">
            <div data-recording-now><p class="bq-eyebrow">PLAYER</p><h2>Choose a recording</h2><p>Only one player instance can exist at a time.</p></div>
            <div class="bq-recording-frame" data-recording-frame></div>
            <div class="bq-recording-controls" data-recording-controls hidden>
              <button type="button" data-recording-play>Play</button>
              <button type="button" data-recording-pause>Pause</button>
              <button type="button" data-recording-stop>Stop</button>
              <label><span>Seek to second</span><input type="number" min="0" max="86400" step="5" value="0" data-recording-seek-value></label>
              <button type="button" data-recording-seek>Seek</button>
            </div>
            <p class="bq-form-message" data-recording-message aria-live="polite"></p>
          </section>
        </section>
        <div class="bq-recording-actions"><button type="button" class="bq-secondary-button" data-recordings-home>Back home</button></div>`;
      };

      const load=async()=>{render({status:'loading',rows:[]});const state=await recordings.load();render(state)};
      const message=text=>{const node=host.querySelector('[data-recording-message]');if(node)node.textContent=text||''};
      const onClick=async event=>{
        const target=event.target instanceof Element?event.target:null;if(!target)return;
        if(target.closest('[data-recordings-home]')){recordings.leave();onHome();return}
        if(target.closest('[data-recordings-account]')){recordings.leave();onAccount();return}
        if(target.closest('[data-recordings-retry]')){await load();return}
        const select=target.closest('[data-recording-select]');
        if(select){
          try{
            const frameHost=host.querySelector('[data-recording-frame]');
            recordings.select(select.dataset.recordingSelect,frameHost);
            const state=recordings.getState(),row=state.rows.find(item=>item.id===state.selectedId);
            host.querySelector('[data-recording-now]').innerHTML=`<p class="bq-eyebrow">NOW PLAYING</p><h2>${escapeHtml(row?.title||'Recording')}</h2><p>${escapeHtml(row?.description||'Use the controls below to play, pause, seek, or stop.')}</p>`;
            host.querySelector('[data-recording-controls]').hidden=false;
            message('Recording ready.');
          }catch(error){message(error?.message||'Could not open recording.')}
          return;
        }
        try{
          if(target.closest('[data-recording-play]')){recordings.play();message('Playing.');return}
          if(target.closest('[data-recording-pause]')){recordings.pause();message('Paused.');return}
          if(target.closest('[data-recording-stop]')){recordings.stop();message('Stopped.');return}
          if(target.closest('[data-recording-seek]')){recordings.seek(host.querySelector('[data-recording-seek-value]')?.value||0);message('Seek requested.');return}
        }catch(error){message(error?.message||'Playback control failed.')}
      };
      host.addEventListener('click',onClick);
      load().catch(error=>render({status:'error',rows:[],error:error?.message||'Could not load recordings.'}));
      return()=>{disposed=true;host.removeEventListener('click',onClick);recordings.leave()};
    }
  };
}
