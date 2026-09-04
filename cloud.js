(() => {
  const CFG=window.BQ_CLOUD_CONFIG||{};
  const STATE_KEY='biblequest_cloud_v1';
  const COMMUNITY_KEY='biblequest_community_v1';
  const APP_KEY='biblequest_state_v4';
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
  const parse=(v,f={})=>{try{return {...f,...JSON.parse(v||'{}')}}catch{return {...f}}};
  const enabled=()=>Boolean(CFG.enabled&&CFG.supabaseUrl&&CFG.publishableKey);
  const readState=()=>parse(localStorage.getItem(STATE_KEY),{activeCongregationId:'',syncedEventIds:[],lastInvite:'',message:'',error:''});
  const writeState=patch=>{const s={...readState(),...patch};localStorage.setItem(STATE_KEY,JSON.stringify(s));renderCard();return s};
  const localCommunity=()=>window.BQCommunity?.read?.()||parse(localStorage.getItem(COMMUNITY_KEY),{roster:[],events:[]});
  const localApp=()=>parse(localStorage.getItem(APP_KEY),{});
  const isoStart=period=>{if(period==='all')return null;const d=new Date();if(period==='today')d.setHours(0,0,0,0);else{const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);d.setHours(0,0,0,0)}return d.toISOString()};
  let client=null,session=null,ownMemberships=[],members=[],active=null,remoteBoards={},flushing=false,originalStandings=null,originalAward=null,booted=false;

  const avatarGlyph=a=>window.BQAvatar?.glyph?.(a)||'🙂';
  const accountProfile=()=>window.BQAccount?.profile?.()||null;
  function callerRole(){return active?.role||'member'}
  function canFacilitate(){return ['facilitator','leader','admin'].includes(callerRole())}
  function currentUserId(){return session?.user?.id||''}
  function ownDisplayName(){const own=members.find(x=>x.user_id===currentUserId());return (own?.display_name||accountProfile()?.preferred_name||localApp()?.profile?.name||'You').trim()}
  function memberForLocalName(name){const key=String(name||'').trim().toLowerCase();if(!key)return null;const exact=members.filter(x=>String(x.display_name||'').trim().toLowerCase()===key);if(exact.length===1)return exact[0];if(key===ownDisplayName().toLowerCase())return members.find(x=>x.user_id===currentUserId())||null;return null}

  async function getClient(){
    client=window.BQAccount?.client?.()||window.BQ_SUPABASE_CLIENT||client;
    if(!client&&enabled()){for(let i=0;i<40&&!client;i++){await new Promise(r=>setTimeout(r,100));client=window.BQAccount?.client?.()||window.BQ_SUPABASE_CLIENT||null}}
    return client;
  }
  async function refreshSession(){const c=await getClient();if(!c){session=null;return null}const r=await c.auth.getSession();if(r.error)throw r.error;session=r.data.session;return session}

  async function loadMemberships(){
    if(!client||!session?.user){ownMemberships=[];members=[];active=null;remoteBoards={};renderCard();return}
    const own=await client.from('bible_congregation_members').select('congregation_id,user_id,role,display_name,avatar,joined_at').eq('user_id',session.user.id).eq('active',true);if(own.error)throw own.error;ownMemberships=own.data||[];
    const ids=ownMemberships.map(x=>x.congregation_id);if(!ids.length){members=[];active=null;remoteBoards={};renderCard();return}
    const s=readState(),chosen=ids.includes(s.activeCongregationId)?s.activeCongregationId:ids[0];
    const [all,cong]=await Promise.all([client.from('bible_congregation_members').select('congregation_id,user_id,role,display_name,avatar,joined_at').eq('congregation_id',chosen).eq('active',true),client.from('bible_congregations').select('id,name,timezone,owner_id').eq('id',chosen).single()]);
    if(all.error)throw all.error;if(cong.error)throw cong.error;members=all.data||[];const ownRow=ownMemberships.find(x=>x.congregation_id===chosen)||{};active={...cong.data,...ownRow};writeState({activeCongregationId:chosen,error:''});await loadAllBoards();
  }
  function rowsToStandings(rows=[]){
    const lanes=['overall','knowledge','reading','wisdom','mastery','consistency','group','couples'];const out=Object.fromEntries(lanes.map(x=>[x,new Map(members.map(m=>[m.user_id,0]))]));
    rows.forEach(r=>{const pts=Number(r.points)||0;if(out[r.category])out[r.category].set(r.user_id,(out[r.category].get(r.user_id)||0)+pts);out.overall.set(r.user_id,(out.overall.get(r.user_id)||0)+pts)});
    const byId=new Map(members.map(m=>[m.user_id,m]));return Object.fromEntries(lanes.map(l=>[l,[...out[l]].map(([id,points])=>{const m=byId.get(id)||{};return {name:`${avatarGlyph(m.avatar)} ${m.display_name||'Member'}`,plainName:m.display_name||'Member',avatar:m.avatar||{},points,user_id:id}}).sort((a,b)=>b.points-a.points||a.plainName.localeCompare(b.plainName))]));
  }
  async function loadBoard(period){if(!client||!active)return;const {data,error}=await client.rpc('bible_leaderboard',{p_congregation:active.id,p_since:isoStart(period)});if(error)throw error;remoteBoards[period]=rowsToStandings(data||[])}
  async function loadAllBoards(){if(!active)return;await Promise.all(['today','week','all'].map(loadBoard));window.dispatchEvent(new CustomEvent('bq-cloud-board-change'));renderCard()}

  function patchCommunity(){
    const api=window.BQCommunity;if(!api)return;
    if(!originalStandings&&api.standings){originalStandings=api.standings.bind(api);api.standings=(period='all',lane='overall')=>active&&remoteBoards[period]?.[lane]?remoteBoards[period][lane]:originalStandings(period,lane)}
    if(!originalAward&&api.awardPoints){originalAward=api.awardPoints.bind(api);api.awardPoints=(name,points,category='overall',source='activity',meta={})=>{originalAward(name,points,category,source,meta);if(enabled()&&session&&active)queueMicrotask(()=>syncLocal().catch(()=>{}))}}
  }
  function refreshCommunityCopy(root){
    if(!root)return;
    const note=root.querySelector('.community-note');
    const noteHtml=active?'<b>Cloud congregation active</b><p>Rankings are synced across signed-in devices. Only preferred names, avatars, trusted scores and earned badges are shared with the congregation.</p>':'<b>Congregation cloud ready</b><p>Create or join a congregation to turn on multi-device rankings. Private notes and account details stay outside congregation leaderboards.</p>';
    if(note&&note.innerHTML!==noteHtml)note.innerHTML=noteHtml;
    root.querySelectorAll('small').forEach(x=>{
      const current=x.textContent||'';let next='';
      if(/local participants|cloud members?/i.test(current))next=active?`${members.length} cloud member${members.length===1?'':'s'}`:'No cloud congregation yet';
      else if(/Based on scored activities on this device|Trusted cloud-scored activities|Local preview until you join a congregation/i.test(current))next=active?'Trusted cloud-scored activities':'Local preview until you join a congregation';
      if(next&&current!==next)x.textContent=next;
    });
  }

  async function syncLocal(){
    if(flushing||!client||!session||!active)return {synced:0};flushing=true;
    try{const s=readState(),done=new Set(s.syncedEventIds||[]),events=localCommunity().events||[],claims=[];for(const e of events){if(done.has(e.id))continue;const target=memberForLocalName(e.name);if(!target)continue;if(target.user_id!==currentUserId()&&!canFacilitate())continue;claims.push({sourceEventId:String(e.id),source:String(e.source||''),category:String(e.category||''),claimedPoints:Number(e.points)||0,meta:e.meta||{},targetUserId:target.user_id});if(claims.length>=50)break}if(!claims.length)return {synced:0};const {data,error}=await client.functions.invoke('bq-score',{body:{congregationId:active.id,claims}});if(error)throw error;const processed=data?.processed||[];processed.forEach(x=>{if(x.accepted||x.duplicate)done.add(x.sourceEventId)});writeState({syncedEventIds:[...done].slice(-10000),message:`Cloud sync: ${processed.filter(x=>x.accepted).length} new event(s)`,error:''});await loadAllBoards();return {synced:processed.length}}catch(err){writeState({error:err?.message||String(err),message:''});throw err}finally{flushing=false}
  }

  async function createCongregation(name){if(!client||!session)throw new Error('Sign in first');name=String(name||'').trim();if(name.length<2)throw new Error('Enter a congregation name');const {data,error}=await client.functions.invoke('bq-create-congregation',{body:{name}});if(error)throw error;writeState({activeCongregationId:data.congregation.id,lastInvite:data.inviteCode||'',message:'Congregation created.',error:''});await loadMemberships();return data}
  async function joinCongregation(code){if(!client||!session)throw new Error('Sign in first');code=String(code||'').trim();if(code.length<5)throw new Error('Enter the invite code');const {data,error}=await client.functions.invoke('bq-join',{body:{code}});if(error)throw error;writeState({activeCongregationId:data.congregation.id,message:`Joined ${data.congregation.name}.`,error:''});await loadMemberships();return data}
  async function newInvite(){if(!active)throw new Error('Join a congregation first');const {data,error}=await client.functions.invoke('bq-invite',{body:{congregationId:active.id}});if(error)throw error;writeState({lastInvite:data.inviteCode||'',message:'New invite code created.',error:''});return data}
  async function switchCongregation(id){writeState({activeCongregationId:id,lastInvite:'',message:'',error:''});await loadMemberships();await syncLocal()}
  async function signOut(){await window.BQAccount?.pushProgress?.().catch(()=>{});const c=await getClient();if(c)await c.auth.signOut()}

  function messageHtml(s){if(s.error)return `<div class="cloud-message error">${esc(s.error)}</div>`;if(s.message)return `<div class="cloud-message">${esc(s.message)}</div>`;return ''}
  function signature(){const s=readState();return JSON.stringify({enabled:enabled(),user:currentUserId(),active:active?{id:active.id,name:active.name,role:active.role}:null,members:members.map(m=>[m.user_id,m.display_name,m.role,m.avatar]),invite:s.lastInvite||'',message:s.message||'',error:s.error||''})}
  function cardHtml(){const s=readState();if(!enabled())return `<section class="cloud-card" data-bq-cloud-card><div class="cloud-head"><div><span>☁️</span><h3>Cloud congregation</h3></div><i class="cloud-status off">LOCAL TEST</i></div><p>The live site uses cloud accounts. Localhost stays cloud-disabled for regression testing.</p></section>`;if(!session)return `<section class="cloud-card" data-bq-cloud-card><div class="cloud-head"><div><span>☁️</span><h3>Cloud congregation</h3></div><i class="cloud-status off">SIGNED OUT</i></div><p>Sign in through your BibleQuest account to use congregation rankings.</p><button class="secondary" type="button" data-cloud-account>Open account</button>${messageHtml(s)}</section>`;if(!active)return `<section class="cloud-card" data-bq-cloud-card><div class="cloud-head"><div><span>☁️</span><h3>Cloud congregation</h3></div><i class="cloud-status">ACCOUNT READY</i></div><p>Create your congregation or join one with an invite code.</p><form class="cloud-grid" data-cloud-create><input name="name" placeholder="Congregation name" minlength="2" required><button>Create congregation</button></form><form class="cloud-grid" data-cloud-join><input name="code" placeholder="Invite code" required><button class="secondary">Join congregation</button></form>${messageHtml(s)}</section>`;const own=members.find(x=>x.user_id===currentUserId()),chips=members.slice(0,16).map(m=>`<span>${avatarGlyph(m.avatar)} ${esc(m.display_name||'Member')}${m.user_id===currentUserId()?' · you':''}</span>`).join(''),switcher=ownMemberships.length>1?`<div class="cloud-grid one"><select data-cloud-switch>${ownMemberships.map(m=>`<option value="${esc(m.congregation_id)}" ${m.congregation_id===active.id?'selected':''}>${esc(m.display_name||m.congregation_id)}</option>`).join('')}</select></div>`:'';return `<section class="cloud-card" data-bq-cloud-card><div class="cloud-head"><div><span>☁️</span><h3>${esc(active.name)}</h3></div><i class="cloud-status">CLOUD LIVE</i></div><p>${avatarGlyph(own?.avatar)} ${esc(own?.display_name||ownDisplayName())} · role: <b>${esc(own?.role||callerRole())}</b></p><div class="cloud-meta"><span>👥 ${members.length} member${members.length===1?'':'s'}</span><span>🏆 Today · Week · All time</span></div><div class="cloud-members">${chips}</div>${s.lastInvite?`<div class="cloud-invite"><small>SHAREABLE INVITE CODE</small><br><code>${esc(s.lastInvite)}</code></div>`:''}${switcher}<div class="cloud-grid"><button type="button" data-cloud-sync>Sync now</button>${canFacilitate()?'<button class="secondary" type="button" data-cloud-invite>New invite code</button>':'<button class="secondary" type="button" data-cloud-refresh>Refresh ranking</button>'}</div>${messageHtml(s)}</section>`}
  function renderCard(){patchCommunity();const root=document.querySelector('#bqCommunityLayer:not(.hidden) .community-app');if(!root)return;refreshCommunityCopy(root);const sig=signature();let card=root.querySelector('[data-bq-cloud-card]');if(card?.dataset.cloudSignature===sig)return;const html=cardHtml();if(card)card.outerHTML=html;else{const note=root.querySelector('.community-note');if(note)note.insertAdjacentHTML('beforebegin',html);else root.insertAdjacentHTML('beforeend',html)}card=root.querySelector('[data-bq-cloud-card]');if(card)card.dataset.cloudSignature=sig;bindCard(root)}
  function bindCard(root){root.querySelector('[data-cloud-account]')?.addEventListener('click',()=>window.BQAccount?.open?.());root.querySelector('[data-cloud-create]')?.addEventListener('submit',async e=>{e.preventDefault();try{await createCongregation(new FormData(e.currentTarget).get('name'))}catch(err){writeState({error:err.message,message:''})}});root.querySelector('[data-cloud-join]')?.addEventListener('submit',async e=>{e.preventDefault();try{await joinCongregation(new FormData(e.currentTarget).get('code'))}catch(err){writeState({error:err.message,message:''})}});root.querySelector('[data-cloud-sync]')?.addEventListener('click',()=>syncLocal().catch(err=>writeState({error:err.message,message:''})));root.querySelector('[data-cloud-refresh]')?.addEventListener('click',()=>loadAllBoards().catch(err=>writeState({error:err.message,message:''})));root.querySelector('[data-cloud-invite]')?.addEventListener('click',()=>newInvite().catch(err=>writeState({error:err.message,message:''})));root.querySelector('[data-cloud-switch]')?.addEventListener('change',e=>switchCongregation(e.target.value).catch(err=>writeState({error:err.message,message:''}))) }

  async function boot(){if(booted)return;booted=true;patchCommunity();renderCard();if(!enabled())return;try{await getClient();await refreshSession();if(client)client.auth.onAuthStateChange((_e,next)=>{session=next;queueMicrotask(async()=>{try{if(session)await loadMemberships();else{ownMemberships=[];members=[];active=null;remoteBoards={};renderCard()}}catch(err){writeState({error:err.message||String(err),message:''})}})});if(session){await loadMemberships();await syncLocal()}renderCard()}catch(err){writeState({error:err.message||String(err),message:''})}}
  new MutationObserver(renderCard).observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('bq-community-change',()=>{renderCard();if(session&&active)syncLocal().catch(()=>{})});
  window.BQCloud={boot,sync:syncLocal,signOut,createCongregation,joinCongregation,newInvite,switchCongregation,status:()=>({enabled:enabled(),signedIn:Boolean(session),activeCongregation:active,members:[...members]})};boot();
})();