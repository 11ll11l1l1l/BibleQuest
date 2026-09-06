(() => {
  'use strict';
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let layer=null,rows=[],role='member',siteRole='',tab='all',loading=false,bound=false;
  const account=()=>window.BQAccount,client=()=>account()?.client?.(),session=()=>account()?.session?.(),cloud=()=>window.BQCloud?.status?.()||{},congregation=()=>cloud().activeCongregation||null;
  const editor=()=>['owner','admin'].includes(siteRole)||['leader','pastor','admin'].includes(role);
  const timeout=(promise,ms=10000,message='Live Recordings took too long to load. Please try again.')=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(message)),ms))]);

  function youtube(value){
    let u;try{u=new URL(String(value||'').trim())}catch{throw new Error('Enter a valid YouTube live-recording URL.')}
    const host=u.hostname.toLowerCase().replace(/^www\./,'').replace(/^m\./,'');
    if(host!=='youtube.com')throw new Error('Use a youtube.com/live/... recording link.');
    const match=u.pathname.match(/^\/live\/([A-Za-z0-9_-]{6,20})\/?$/);
    const id=match?.[1]||'';
    if(!/^[A-Za-z0-9_-]{6,20}$/.test(id))throw new Error('Only YouTube live-recording links such as youtube.com/live/VIDEO_ID are accepted.');
    return {url:u.href,id};
  }
  function youtubeThumb(id){return /^[A-Za-z0-9_-]{6,20}$/.test(String(id||''))?`https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`:''}

  function ensureLayer(){
    if(layer)return layer;
    layer=document.createElement('div');layer.id='bqMediaLayer';layer.className='media-layer hidden';document.body.appendChild(layer);
    if(!bound){
      bound=true;
      layer.addEventListener('click',event=>{
        const target=event.target.closest?.('button,[data-media-close]');if(!target)return;
        if(target.matches('[data-media-close]')){close();return}
        if(target.matches('[data-media-tab]')){tab=target.dataset.mediaTab;render();return}
        if(target.matches('[data-media-report]')){report(target.dataset.mediaReport);return}
        if(target.matches('[data-media-feature]')){const r=rows.find(x=>x.id===target.dataset.mediaFeature);if(r)patch(r.id,{featured:!r.featured}).catch(err=>render(err.message||String(err)));return}
        if(target.matches('[data-media-up]')){const r=rows.find(x=>x.id===target.dataset.mediaUp);if(r)patch(r.id,{display_order:(Number(r.display_order)||0)-1}).catch(err=>render(err.message||String(err)));return}
        if(target.matches('[data-media-down]')){const r=rows.find(x=>x.id===target.dataset.mediaDown);if(r)patch(r.id,{display_order:(Number(r.display_order)||0)+1}).catch(err=>render(err.message||String(err)));return}
        if(target.matches('[data-media-edit]')){edit(target.dataset.mediaEdit).catch(err=>render(err.message||String(err)));return}
        if(target.matches('[data-media-archive]')){if(confirm('Archive this live recording?'))patch(target.dataset.mediaArchive,{active:false}).catch(err=>render(err.message||String(err)));return}
        if(target.matches('[data-media-retry]'))open(true);
      });
      layer.addEventListener('submit',event=>{
        const form=event.target.closest?.('[data-media-create]');if(!form)return;event.preventDefault();createMedia(form).catch(err=>render(err.message||String(err)));
      });
    }
    return layer;
  }
  function showLayer(){ensureLayer().classList.remove('hidden');document.body.classList.add('media-open')}
  function close(){ensureLayer().classList.add('hidden');document.body.classList.remove('media-open')}

  function loadingView(){
    const x=ensureLayer(),g=congregation();
    x.innerHTML=`<main class="media-app"><header class="media-top"><button type="button" data-media-close>← BibleQuest</button><b>Live Recordings</b><span>📺</span></header><section class="media-loading" role="status" aria-live="polite"><div class="media-loading-mark">▶</div><div><small>${esc(g?.name||'CONGREGATION')}</small><h1>Loading recordings…</h1><p>BibleQuest is getting the latest published livestream replays.</p></div></section></main>`;
    showLayer();
  }

  async function resolveAccess(){
    const c=client(),s=session(),g=congregation();if(!c||!s||!g)throw new Error('Sign in and select a congregation first.');
    role=g.role||'member';
    const known=window.BQAdminAccess?.status?.();
    if(known?.resolved){siteRole=known.allowed?String(known.role||''):'';return}
    const a=await timeout(c.from('bible_app_access').select('role,active').eq('user_id',s.user.id).maybeSingle(),5000,'Account permissions took too long to load.');
    if(a.error)throw a.error;siteRole=a.data?.active?String(a.data.role||''):'';
  }

  async function loadData(){
    await resolveAccess();
    const g=congregation(),now=new Date().toISOString();
    const request=client().from('bible_media_library')
      .select('id,congregation_id,created_by,media_type,title,description,youtube_url,youtube_id,featured,display_order,active,publish_at,created_at')
      .eq('congregation_id',g.id).eq('active',true).eq('media_type','youtube_video')
      .like('youtube_url','%youtube.com/live/%').lte('publish_at',now)
      .order('featured',{ascending:false}).order('display_order',{ascending:true}).order('created_at',{ascending:false}).limit(80);
    const r=await timeout(request,10000);
    if(r.error)throw r.error;
    rows=(r.data||[]).filter(x=>{try{return Boolean(youtube(x.youtube_url).id)}catch{return false}});
  }

  function card(x){
    const thumb=youtubeThumb(x.youtube_id),title=x.title||'Live Recording';
    return `<article class="media-card ${x.featured?'featured':''}" data-media-id="${x.id}" data-bq-content-key="media:${x.id}" data-bq-reportable="1"><a class="media-cover media-youtube-thumb" href="${esc(x.youtube_url)}" target="_blank" rel="noopener noreferrer" aria-label="Watch ${esc(title)} on YouTube">${thumb?`<img src="${esc(thumb)}" alt="YouTube thumbnail for ${esc(title)}" loading="lazy" decoding="async">`:''}<span class="media-live-badge">LIVE RECORDING</span><span class="media-play-mark">▶</span></a><div class="media-copy"><small>${x.featured?'★ FEATURED · ':''}YOUTUBE LIVE RECORDING</small><h3>${esc(title)}</h3>${x.description?`<p>${esc(x.description)}</p>`:''}<div class="media-actions"><a class="watch" href="${esc(x.youtube_url)}" target="_blank" rel="noopener noreferrer">▶ Watch recording</a><button type="button" data-media-report="${x.id}">⚑ Report</button></div></div>${editor()?`<div class="media-editor-actions"><button type="button" data-media-feature="${x.id}">${x.featured?'★ Unfeature':'☆ Feature'}</button><button type="button" data-media-up="${x.id}">↑ Earlier</button><button type="button" data-media-down="${x.id}">↓ Later</button><button type="button" data-media-edit="${x.id}">Edit</button><button type="button" class="danger" data-media-archive="${x.id}">Archive</button></div>`:''}</article>`
  }
  function createForm(){if(!editor())return '';return `<details class="media-create"><summary>＋ Add YouTube live recording</summary><form data-media-create><label>YouTube live-recording link<input name="url" type="url" placeholder="https://www.youtube.com/live/VIDEO_ID" required></label><label>Title<input name="title" maxlength="160" placeholder="Sunday Worship · September 6" required></label><label>Description<textarea name="description" rows="3" maxlength="2500" placeholder="Optional short note"></textarea></label><div class="media-inline"><label>Publish<input name="publish" type="datetime-local"></label><label>Order<input name="order" type="number" value="0" min="-999" max="999"></label></div><label><span><input name="featured" type="checkbox"> Feature this recording</span></label><div class="media-note">Only <b>youtube.com/live/…</b> recordings are accepted. BibleQuest shows the YouTube thumbnail automatically and opens playback on YouTube instead of embedding a heavy player inside the app.</div><button type="submit">Publish recording</button></form></details>`}

  function render(error=''){
    const g=congregation(),x=ensureLayer(),shown=rows.filter(r=>tab==='all'||r.featured);
    x.innerHTML=`<main class="media-app"><header class="media-top"><button type="button" data-media-close>← BibleQuest</button><b>Live Recordings</b><span>📺</span></header><section class="media-hero"><small>${esc(g?.name||'CONGREGATION')}</small><h1>Live recordings</h1><p>Worship services, Bible studies and congregation livestream replays. Tap a thumbnail to watch on YouTube without loading a video player inside BibleQuest.</p></section>${error?`<section class="media-section media-error" role="alert"><b>Could not load Live Recordings</b><p>${esc(error)}</p><button type="button" data-media-retry>Try again</button></section>`:''}${error?'':createForm()}${error?'':`<div class="media-tabs"><button type="button" data-media-tab="all" class="${tab==='all'?'active':''}">All recordings</button><button type="button" data-media-tab="featured" class="${tab==='featured'?'active':''}">Featured</button></div><section class="media-grid">${shown.length?shown.map(card).join(''):'<div class="media-empty">No live recordings have been published yet.</div>'}</section>`}</main>`;
    showLayer();
  }

  async function createMedia(form){
    const fd=new FormData(form),g=congregation(),s=session(),parsed=youtube(fd.get('url')),publish=String(fd.get('publish')||'').trim();
    const row={congregation_id:g.id,created_by:s.user.id,media_type:'youtube_video',title:String(fd.get('title')||'').trim(),description:String(fd.get('description')||'').trim(),youtube_url:parsed.url,youtube_id:parsed.id,cover_path:null,featured:fd.get('featured')==='on',display_order:Math.max(-999,Math.min(999,Number(fd.get('order')||0))),publish_at:publish?new Date(publish).toISOString():new Date().toISOString(),active:true};
    const r=await timeout(client().from('bible_media_library').insert(row),10000,'Publishing the recording took too long.');if(r.error)throw r.error;await refresh()
  }
  async function patch(id,changes){const r=await timeout(client().from('bible_media_library').update({...changes,updated_at:new Date().toISOString()}).eq('id',id).eq('congregation_id',congregation().id),10000,'Updating the recording took too long.');if(r.error)throw r.error;await refresh()}
  async function edit(id){const x=rows.find(r=>r.id===id);if(!x)return;const title=prompt('Recording title:',x.title);if(title===null)return;const description=prompt('Description:',x.description||'');if(description===null)return;await patch(id,{title:String(title).trim().slice(0,160),description:String(description).trim().slice(0,2500)})}
  function report(id){const x=rows.find(r=>r.id===id);if(!x)return;window.BQContentReport?.openFor?.({key:`media:${x.id}`,contentType:'other',source:'congregation-live-recording',ref:x.youtube_url,text:x.title,answer:x.description,surfaceTitle:'Live Recordings'})||window.BQContentReport?.open?.()}
  async function refresh(){await loadData();render()}
  async function open(force=false){
    if(loading&&!force){showLayer();return}
    loading=true;loadingView();
    try{await loadData();render()}catch(err){render(err?.message||String(err))}finally{loading=false}
  }

  function inject(){
    const home=document.querySelector('.modern-home');if(!home||home.querySelector('[data-media-entry]'))return;
    const anchor=home.querySelector('[data-ministry-entry]')||home.querySelector('.modern-footer-row')||home.lastElementChild;
    const card=document.createElement('section');card.className='media-entry';card.dataset.mediaEntry='1';
    card.innerHTML='<div><b>📺 Live Recordings</b><small>Worship · Bible study · congregation livestream replays</small></div><button type="button" data-media-open>View recordings</button>';
    anchor?.insertAdjacentElement(anchor?.matches?.('[data-ministry-entry]')?'afterend':'beforebegin',card);
  }
  document.addEventListener('click',event=>{if(event.target.closest?.('[data-media-open]'))open()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!ensureLayer().classList.contains('hidden'))close()});
  new MutationObserver(inject).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});setTimeout(inject,900);
  window.BQMediaLibrary={open,refresh,parseYoutube:youtube,thumbnail:youtubeThumb};
})();