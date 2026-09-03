(() => {
  const CFG=window.BQ_CLOUD_CONFIG||{};
  const STATE_KEY='biblequest_cloud_v1';
  const COMMUNITY_KEY='biblequest_community_v1';
  const APP_KEY='biblequest_state_v4';
  const SDK='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4';
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const parse=(v,f={})=>{try{return {...f,...JSON.parse(v||'{}')}}catch{return {...f}}};
  const readState=()=>parse(localStorage.getItem(STATE_KEY),{activeCongregationId:'',syncedEventIds:[],lastInvite:'',message:'',error:''});
  const writeState=patch=>{const s={...readState(),...patch};localStorage.setItem(STATE_KEY,JSON.stringify(s));renderCard();return s};
  const enabled=()=>Boolean(CFG.enabled&&CFG.supabaseUrl&&CFG.publishableKey);
  const localCommunity=()=>window.BQCommunity?.read?.()||parse(localStorage.getItem(COMMUNITY_KEY),{roster:[],events:[]});
  const localApp=()=>parse(localStorage.getItem(APP_KEY),{});
  const isoStart=period=>{if(period==='all')return null;const d=new Date();if(period==='today')d.setHours(0,0,0,0);else{const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);d.setHours(0,0,0,0)}return d.toISOString()};
  let client=null,session=null,ownMemberships=[],members=[],active=null,remoteBoards={},sdkPromise=null,flushing=false,originalStandings=null,originalAward=null;

  function loadSdk(){
    if(window.supabase?.createClient)return Promise.resolve(window.supabase);
    if(sdkPromise)return sdkPromise;
    sdkPromise=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=SDK;s.crossOrigin='anonymous';s.onload=()=>window.supabase?.createClient?resolve(window.supabase):reject(new Error('Supabase SDK unavailable'));s.onerror=()=>reject(new Error('Could not load Supabase SDK'));document.head.appendChild(s)});
    return sdkPromise;
  }

  function callerRole(){return active?.role||'member'}
  function canFacilitate(){return ['facilitator','leader','admin'].includes(callerRole())}
  function currentUserId(){return session?.user?.id||''}
  function ownDisplayName(){
    const own=members.find(x=>x.user_id===currentUserId());
    return (own?.display_name||localApp()?.profile?.name||session?.user?.email?.split('@')[0]||'You').trim();
  }
  function memberForLocalName(name){
    const key=String(name||'').trim().toLowerCase();if(!key)return null;
    const exact=members.filter(x=>String(x.display_name||'').trim().toLowerCase()===key);
    if(exact.length===1)return exact[0];
    if(key===ownDisplayName().toLowerCase())return members.find(x=>x.user_id===currentUserId())||null;
    return null;
  }

  async function ensureProfile(){
    if(!client||!session?.user)return;
    const name=(localApp()?.profile?.name||session.user.email?.split('@')[0]||'BibleQuest learner').trim().slice(0,80);
    await client.from('bible_profiles').upsert({user_id:session.user.id,display_name:name,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  }

  async function loadMemberships(){
    if(!client||!session?.user){ownMemberships=[];members=[];active=null;return}
    const own=await client.from('bible_congregation_members').select('congregation_id,user_id,role,display_name,joined_at').eq('user_id',session.user.id).eq('active',true);
    if(own.error)throw own.error;
    ownMemberships=own.data||[];
    const ids=ownMemberships.map(x=>x.congregation_id);
    if(!ids.length){members=[];active=null;remoteBoards={};renderCard();return}
    const cfg=readState();const chosen=ids.includes(cfg.activeCongregationId)?cfg.activeCongregationId:ids[0];
    const [allMembers,congregations]=await Promise.all([
      client.from('bible_congregation_members').select('congregation_id,user_id,role,display_name,joined_at').eq('congregation_id',chosen).eq('active',true),
      client.from('bible_congregations').select('id,name,timezone,owner_id').eq('id',chosen).single()
    ]);
    if(allMembers.error)throw allMembers.error;if(congregations.error)throw congregations.error;
    members=allMembers.data||[];
    const ownRow=ownMemberships.find(x=>x.congregation_id===chosen)||{};
    active={...congregations.data,...ownRow};
    writeState({activeCongregationId:chosen,error:''});
    await loadAllBoards();
  }

  function rowsToStandings(rows=[]){
    const lanes=['overall','knowledge','reading','wisdom','mastery','consistency','group','couples'];
    const out=Object.fromEntries(lanes.map(x=>[x,new Map(members.map(m=>[m.user_id,0]))]));
    rows.forEach(r=>{const pts=Number(r.points)||0;if(out[r.category])out[r.category].set(r.user_id,(out[r.category].get(r.user_id)||0)+pts);out.overall.set(r.user_id,(out.overall.get(r.user_id)||0)+pts)});
    const byId=new Map(members.map(m=>[m.user_id,m.display_name||'Member']));
    return Object.fromEntries(lanes.map(l=>[l,[...out[l]].map(([id,points])=>({name:byId.get(id)||'Member',points})).sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name))]));
  }
  async function loadBoard(period){
    if(!client||!active)return;
    const {data,error}=await client.rpc('bible_leaderboard',{p_congregation:active.id,p_since:isoStart(period)});
    if(error)throw error;remoteBoards[period]=rowsToStandings(data||[]);
  }
  async function loadAllBoards(){
    if(!active)return;await Promise.all(['today','week','all'].map(loadBoard));
    window.dispatchEvent(new CustomEvent('bq-cloud-board-change'));renderCard();
  }

  function patchCommunity(){
    const api=window.BQCommunity;if(!api)return;
    if(!originalStandings&&api.standings){originalStandings=api.standings.bind(api);api.standings=(period='all',lane='overall')=>active&&remoteBoards[period]?.[lane]?remoteBoards[period][lane]:originalStandings(period,lane)}
    if(!originalAward&&api.awardPoints){
      originalAward=api.awardPoints.bind(api);
      api.awardPoints=(name,points,category='overall',source='activity',meta={})=>{
        originalAward(name,points,category,source,meta);
        if(enabled()&&session&&active)queueMicrotask(()=>syncLocal().catch(()=>{}));
      };
    }
  }

  async function syncLocal(){
    if(flushing||!client||!session||!active)return {synced:0};
    flushing=true;
    try{
      const s=readState(),done=new Set(s.syncedEventIds||[]),events=localCommunity().events||[];
      const claims=[];
      for(const e of events){
        if(done.has(e.id))continue;
        const target=memberForLocalName(e.name);if(!target)continue;
        if(target.user_id!==currentUserId()&&!canFacilitate())continue;
        claims.push({sourceEventId:String(e.id),source:String(e.source||''),category:String(e.category||''),claimedPoints:Number(e.points)||0,meta:e.meta||{},targetUserId:target.user_id});
        if(claims.length>=50)break;
      }
      if(!claims.length)return {synced:0};
      const {data,error}=await client.functions.invoke('bq-score',{body:{congregationId:active.id,claims}});
      if(error)throw error;
      const processed=data?.processed||[];processed.forEach(x=>{if(x.accepted||x.duplicate)done.add(x.sourceEventId)});
      writeState({syncedEventIds:[...done].slice(-10000),message:`Cloud sync: ${processed.filter(x=>x.accepted).length} new event(s)`,error:''});
      await loadAllBoards();
      if(events.some(e=>!done.has(e.id)))queueMicrotask(()=>syncLocal().catch(()=>{}));
      return {synced:processed.length};
    }catch(err){writeState({error:err?.message||String(err),message:''});throw err}finally{flushing=false}
  }

  async function sendMagicLink(email){
    if(!client)throw new Error('Cloud is not configured');email=String(email||'').trim();if(!email)throw new Error('Enter an email address');
    const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:CFG.redirectUrl||location.href.split('#')[0],shouldCreateUser:true}});if(error)throw error;
    writeState({message:'Sign-in link sent. Open it on this device to continue.',error:''});
  }
  async function signOut(){if(client)await client.auth.signOut();session=null;ownMemberships=[];members=[];active=null;remoteBoards={};writeState({activeCongregationId:'',message:'Signed out.',error:''})}
  async function createCongregation(name){
    name=String(name||'').trim();if(name.length<2)throw new Error('Enter a congregation name');
    const {data,error}=await client.functions.invoke('bq-create-congregation',{body:{name}});if(error)throw error;
    writeState({activeCongregationId:data.congregation.id,lastInvite:data.inviteCode||'',message:'Congregation created.',error:''});await loadMemberships();return data;
  }
  async function joinCongregation(code){
    code=String(code||'').trim();if(code.length<5)throw new Error('Enter the invite code');
    const {data,error}=await client.functions.invoke('bq-join',{body:{code}});if(error)throw error;
    writeState({activeCongregationId:data.congregation.id,message:`Joined ${data.congregation.name}.`,error:''});await loadMemberships();return data;
  }
  async function newInvite(){
    if(!active)throw new Error('Join a congregation first');
    const {data,error}=await client.functions.invoke('bq-invite',{body:{congregationId:active.id}});if(error)throw error;
    writeState({lastInvite:data.inviteCode||'',message:'New invite code created.',error:''});return data;
  }
  async function switchCongregation(id){writeState({activeCongregationId:id,lastInvite:'',message:'',error:''});await loadMemberships();await syncLocal()}

  function cloudSignature(){
    const s=readState();
    return JSON.stringify({enabled:enabled(),user:currentUserId(),email:session?.user?.email||'',active:active?{id:active.id,name:active.name,role:active.role}:null,members:members.map(m=>[m.user_id,m.display_name,m.role]),memberships:ownMemberships.map(m=>[m.congregation_id,m.role,m.display_name]),invite:s.lastInvite||'',message:s.message||'',error:s.error||''});
  }
  function cloudCardHtml(){
    const s=readState();
    if(!enabled())return `<section class="cloud-card" data-bq-cloud-card><div class="cloud-head"><div><span>☁️</span><h3>Cloud congregation</h3></div><i class="cloud-status off">BACKEND READY</i></div><p>Multi-device accounts, congregation invites, trusted score sync, and cloud leaderboards are built into this release. Activation is waiting for a dedicated BibleQuest Supabase project.</p></section>`;
    if(!session)return `<section class="cloud-card" data-bq-cloud-card><div class="cloud-head"><div><span>☁️</span><h3>Cloud congregation</h3></div><i class="cloud-status off">SIGNED OUT</i></div><p>Sign in to combine progress across devices and participate in your congregation leaderboard.</p><form class="cloud-grid" data-cloud-login><input type="email" name="email" autocomplete="email" placeholder="you@example.com" required><button>Send sign-in link</button></form>${messageHtml(s)}</section>`;
    if(!active)return `<section class="cloud-card" data-bq-cloud-card><div class="cloud-head"><div><span>☁️</span><h3>Cloud congregation</h3></div><i class="cloud-status">SIGNED IN</i></div><p>${esc(session.user.email||'Account ready')}. Create a congregation or join one using an invite code.</p><form class="cloud-grid" data-cloud-create><input name="name" placeholder="Congregation name" minlength="2" required><button>Create congregation</button></form><form class="cloud-grid" data-cloud-join><input name="code" placeholder="Invite code" required><button class="secondary">Join congregation</button></form><div class="cloud-grid one"><button class="ghost" type="button" data-cloud-signout>Sign out</button></div>${messageHtml(s)}</section>`;
    const own=members.find(x=>x.user_id===currentUserId());
    const chips=members.slice(0,12).map(m=>`<span>${esc(m.display_name||'Member')}${m.user_id===currentUserId()?' · you':''}</span>`).join('');
    const memberships=ownMemberships.length>1?`<div class="cloud-grid one"><select data-cloud-switch>${ownMemberships.map(m=>`<option value="${esc(m.congregation_id)}" ${m.congregation_id===active.id?'selected':''}>${esc(m.display_name||m.congregation_id)}</option>`).join('')}</select></div>`:'';
    return `<section class="cloud-card" data-bq-cloud-card><div class="cloud-head"><div><span>☁️</span><h3>${esc(active.name)}</h3></div><i class="cloud-status">CLOUD LIVE</i></div><p>${esc(session.user.email||'Signed in')} · role: <b>${esc(own?.role||callerRole())}</b></p><div class="cloud-meta"><span>👥 ${members.length} member${members.length===1?'':'s'}</span><span>🏆 Today / Week / All-time synced</span></div><div class="cloud-members">${chips}</div>${s.lastInvite?`<div class="cloud-invite"><small>SHAREABLE INVITE CODE</small><br><code>${esc(s.lastInvite)}</code></div>`:''}${memberships}<div class="cloud-grid"><button type="button" data-cloud-sync>Sync this device</button>${canFacilitate()?'<button class="secondary" type="button" data-cloud-invite>New invite code</button>':'<button class="secondary" type="button" data-cloud-refresh>Refresh board</button>'}</div><div class="cloud-grid one"><button class="ghost" type="button" data-cloud-signout>Sign out</button></div>${messageHtml(s)}</section>`;
  }
  function messageHtml(s){if(s.error)return `<div class="cloud-message error">${esc(s.error)}</div>`;if(s.message)return `<div class="cloud-message">${esc(s.message)}</div>`;return ''}
  function renderCard(){
    patchCommunity();
    const root=document.querySelector('#bqCommunityLayer:not(.hidden) .community-app');if(!root)return;
    const signature=cloudSignature();
    let card=root.querySelector('[data-bq-cloud-card]');
    if(card?.dataset.cloudSignature===signature)return;
    const html=cloudCardHtml();
    if(card)card.outerHTML=html;
    else{const note=root.querySelector('.community-note');if(note)note.insertAdjacentHTML('beforebegin',html);else root.insertAdjacentHTML('beforeend',html)}
    card=root.querySelector('[data-bq-cloud-card]');
    if(card)card.dataset.cloudSignature=signature;
    bindCard(root);
  }
  function bindCard(root){
    root.querySelector('[data-cloud-login]')?.addEventListener('submit',async e=>{e.preventDefault();try{await sendMagicLink(new FormData(e.currentTarget).get('email'))}catch(err){writeState({error:err.message,message:''})}});
    root.querySelector('[data-cloud-create]')?.addEventListener('submit',async e=>{e.preventDefault();try{await createCongregation(new FormData(e.currentTarget).get('name'))}catch(err){writeState({error:err.message,message:''})}});
    root.querySelector('[data-cloud-join]')?.addEventListener('submit',async e=>{e.preventDefault();try{await joinCongregation(new FormData(e.currentTarget).get('code'))}catch(err){writeState({error:err.message,message:''})}});
    root.querySelector('[data-cloud-sync]')?.addEventListener('click',()=>syncLocal().catch(()=>{}));
    root.querySelector('[data-cloud-refresh]')?.addEventListener('click',()=>loadAllBoards().catch(err=>writeState({error:err.message,message:''})));
    root.querySelector('[data-cloud-invite]')?.addEventListener('click',()=>newInvite().catch(err=>writeState({error:err.message,message:''})));
    root.querySelector('[data-cloud-signout]')?.addEventListener('click',()=>signOut().catch(()=>{}));
    root.querySelector('[data-cloud-switch]')?.addEventListener('change',e=>switchCongregation(e.target.value).catch(err=>writeState({error:err.message,message:''})));
  }

  async function boot(){
    patchCommunity();renderCard();
    if(!enabled())return;
    try{
      const sdk=await loadSdk();client=sdk.createClient(CFG.supabaseUrl,CFG.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      client.auth.onAuthStateChange((_event,next)=>{session=next;queueMicrotask(async()=>{try{if(session){await ensureProfile();await loadMemberships();await syncLocal()}else{active=null;members=[];remoteBoards={};renderCard()}}catch(err){writeState({error:err.message||String(err),message:''})}})});
      const {data,error}=await client.auth.getSession();if(error)throw error;session=data.session;
      if(session){await ensureProfile();await loadMemberships();await syncLocal()}renderCard();
    }catch(err){writeState({error:err.message||String(err),message:''})}
  }

  new MutationObserver(()=>renderCard()).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('bq-community-change',()=>{renderCard();if(enabled()&&session&&active)syncLocal().catch(()=>{})});
  window.BQCloud={boot,sync:syncLocal,sendMagicLink,signOut,createCongregation,joinCongregation,newInvite,switchCongregation,status:()=>({enabled:enabled(),signedIn:Boolean(session),activeCongregation:active,members:[...members]})};
  boot();
})();
