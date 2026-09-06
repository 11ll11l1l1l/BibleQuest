(() => {
  'use strict';
  const LANES=[['overall','🏆','Overall Leader'],['knowledge','🧠','Knowledge Leader'],['reading','📖','Reading Leader'],['wisdom','🧭','Wisdom Builder'],['mastery','🗺️','Mastery Builder'],['consistency','🔥','Consistency Champion'],['group','👥','Group Catalyst'],['couples','💞','Couples Builder']];
  const PERIODS=[['today','Today'],['week','This Week'],['all','All Time']];
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let layer=null,period='week',lane='overall',loading=false,originalBoard=null,cache={key:'',members:[],badges:[],catalog:[],scoreRows:[]};
  const avatarGlyph=a=>window.BQAvatar?.glyph?.(a)||'🙂';
  const roleLabel=r=>({admin:'Admin',pastor:'Pastor',leader:'Leader',facilitator:'Facilitator',member:'Member'}[r]||r||'Member');
  function isoStart(p){if(p==='all')return null;const d=new Date();if(p==='today')d.setHours(0,0,0,0);else{const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);d.setHours(0,0,0,0)}return d.toISOString()}
  function cloud(){return window.BQCloud?.status?.()||{}}
  function active(){return cloud().activeCongregation||null}
  function client(){return window.BQAccount?.client?.()||window.BQ_SUPABASE_CLIENT||null}
  function ensureLayer(){if(layer)return layer;layer=document.createElement('div');layer.id='bqRecognitionLayer';layer.className='recognition-layer hidden';document.body.appendChild(layer);return layer}
  function toast(text){document.querySelector('.recognition-toast')?.remove();const el=document.createElement('div');el.className='recognition-toast';el.textContent=text;document.body.appendChild(el);setTimeout(()=>el.remove(),2600)}
  function close(){ensureLayer().classList.add('hidden');document.body.style.removeProperty('overflow')}

  async function fetchData(force=false){
    const congregation=active(),c=client();if(!congregation||!cloud().signedIn||!c)throw new Error('Sign in and select a congregation to view congregation rankings.');
    const key=`${congregation.id}:${period}`;if(!force&&cache.key===key)return cache;
    const since=isoStart(period);
    const [scores,members,badges,catalog]=await Promise.all([
      c.rpc('bible_leaderboard',{p_congregation:congregation.id,p_since:since}),
      c.from('bible_congregation_members').select('user_id,display_name,role,avatar,joined_at').eq('congregation_id',congregation.id).eq('active',true),
      c.from('bible_user_badges').select('user_id,badge_id,earned_at').eq('congregation_id',congregation.id).order('earned_at',{ascending:false}).limit(3000),
      c.from('bible_badge_catalog').select('id,name,icon,category,description,threshold').eq('active',true).limit(500)
    ]);
    if(scores.error)throw scores.error;if(members.error)throw members.error;if(badges.error)throw badges.error;if(catalog.error)throw catalog.error;
    cache={key,members:members.data||[],badges:badges.data||[],catalog:catalog.data||[],scoreRows:scores.data||[]};return cache;
  }
  function build(){
    const {members,badges,catalog,scoreRows}=cache,byId=new Map(members.map(m=>[m.user_id,m])),catalogMap=new Map(catalog.map(b=>[b.id,b])),badgeMap=new Map();
    for(const b of badges){if(!badgeMap.has(b.user_id))badgeMap.set(b.user_id,[]);badgeMap.get(b.user_id).push({...b,meta:catalogMap.get(b.badge_id)||{id:b.badge_id,name:b.badge_id,icon:'🎖️',category:'Achievement'}})}
    const maps=Object.fromEntries(LANES.map(([k])=>[k,new Map(members.map(m=>[m.user_id,0]))]));
    for(const r of scoreRows){const pts=Number(r.points)||0;if(maps[r.category])maps[r.category].set(r.user_id,(maps[r.category].get(r.user_id)||0)+pts);maps.overall.set(r.user_id,(maps.overall.get(r.user_id)||0)+pts)}
    const boards={};for(const [key] of LANES){boards[key]=[...maps[key]].map(([id,points])=>{const m=byId.get(id)||{};return {user_id:id,name:m.display_name||'Member',role:m.role||'member',avatar:m.avatar||{},points,badges:badgeMap.get(id)||[]}}).sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name))}
    return {boards,badgeMap};
  }
  function awardCards(boards){return LANES.map(([key,icon,title])=>{const top=boards[key]?.find(x=>x.points>0);if(!top)return `<article class="recognition-award"><span>${icon}</span><small>${esc(title)}</small><b>—</b><em>No scored activity yet</em></article>`;const badge=top.badges[0]?.meta;return `<article class="recognition-award"><span>${icon}</span><small>${esc(title)}</small><b>${avatarGlyph(top.avatar)} ${esc(top.name)}</b><em>${top.points} pts${badge?` · ${badge.icon} ${esc(badge.name)}`:''}</em><button type="button" data-congratulate data-name="${esc(top.name)}" data-award="${esc(title)}">Copy congratulations</button></article>`}).join('')}
  function rankRows(rows){return rows.map((r,i)=>{const shown=r.badges.slice(0,3);return `<article class="recognition-rank ${i<3?'podium':''}"><div class="recognition-place">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</div><div class="recognition-person"><b>${avatarGlyph(r.avatar)} ${esc(r.name)}</b><small>${esc(roleLabel(r.role))}</small><div class="recognition-badges">${shown.map(b=>`<span class="recognition-badge" title="${esc(b.meta.name)}">${b.meta.icon} ${esc(b.meta.name)}</span>`).join('')}${r.badges.length>shown.length?`<span class="recognition-badge">+${r.badges.length-shown.length} badges</span>`:''}</div></div><div class="recognition-score"><strong>${r.points}</strong><small>pts</small></div></article>`}).join('')||'<div class="recognition-empty">No congregation scores yet for this period.</div>'}
  function render(){
    const congregation=active(),data=build(),rows=data.boards[lane]||[],laneTitle=LANES.find(x=>x[0]===lane)?.[2]||'Overall Leader';const l=ensureLayer();
    l.innerHTML=`<main class="recognition-app"><header class="recognition-top"><button type="button" data-recognition-close>← Community</button><b>Congregation Recognition</b><span>🏆</span></header><section class="recognition-hero"><small>${esc(congregation?.name||'CONGREGATION')} · VERIFIED CLOUD ACTIVITY</small><h1>Rankings, badges & special awards</h1><p>Use this page to recognize participation and learning progress. Rankings reflect trusted BibleQuest activity; they are not a measure of spiritual worth.</p></section><div class="recognition-tabs">${PERIODS.map(([k,label])=>`<button class="${period===k?'active':''}" data-recognition-period="${k}">${label}</button>`).join('')}</div><section class="recognition-section"><div class="recognition-section-head"><h2>Special awards</h2><small>${PERIODS.find(x=>x[0]===period)?.[1]}</small></div><div class="recognition-awards">${awardCards(data.boards)}</div></section><div class="recognition-lanes">${LANES.map(([k,icon,title])=>`<button class="${lane===k?'active':''}" data-recognition-lane="${k}">${icon} ${esc(title.replace(/ Leader| Builder| Champion| Catalyst/g,''))}</button>`).join('')}</div><section class="recognition-section"><div class="recognition-section-head"><h2>${esc(laneTitle)}</h2><small>${rows.length} member${rows.length===1?'':'s'}</small></div><div class="recognition-ranks">${rankRows(rows)}</div></section><div class="recognition-note">Names, avatars, roles, points and earned congregation badges shown here come from the signed-in congregation cloud data. Private notes, answers and account credentials are not included.</div></main>`;
    l.querySelector('[data-recognition-close]')?.addEventListener('click',close);
    l.querySelectorAll('[data-recognition-period]').forEach(b=>b.addEventListener('click',async()=>{period=b.dataset.recognitionPeriod;await refresh()}));
    l.querySelectorAll('[data-recognition-lane]').forEach(b=>b.addEventListener('click',()=>{lane=b.dataset.recognitionLane;render()}));
    l.querySelectorAll('[data-congratulate]').forEach(b=>b.addEventListener('click',async()=>{const text=`Congratulations, ${b.dataset.name}! BibleQuest recognizes you as our ${b.dataset.award} for ${PERIODS.find(x=>x[0]===period)?.[1].toLowerCase()}. Thank you for faithfully participating and growing with the congregation.`;try{await navigator.clipboard.writeText(text);toast('Congratulations message copied.')}catch{toast(text)}}));
  }
  async function refresh(force=false){if(loading)return;loading=true;const l=ensureLayer();l.classList.remove('hidden');document.body.style.overflow='hidden';l.innerHTML='<div class="recognition-empty" style="margin:18vh auto;width:min(520px,calc(100% - 30px))">Loading congregation rankings…</div>';try{await fetchData(force);render()}catch(err){l.innerHTML=`<div class="recognition-empty" style="margin:18vh auto;width:min(520px,calc(100% - 30px))"><b>Congregation rankings could not load.</b><p>${esc(err.message||String(err))}</p><button type="button" data-recognition-close>Return</button></div>`;l.querySelector('[data-recognition-close]')?.addEventListener('click',close)}finally{loading=false}}
  async function open(){if(!active()||!cloud().signedIn){return originalBoard?.()}period='week';lane='overall';cache.key='';await refresh(true)}
  function install(){const api=window.BQCommunity;if(!api||api.__recognitionInstalled)return false;originalBoard=api.openBoard?.bind(api);api.openBoard=open;api.__recognitionInstalled=true;return true}
  document.addEventListener('click',e=>{const b=e.target.closest?.('[data-community-board]');if(!b||!active()||!cloud().signedIn)return;e.preventDefault();e.stopImmediatePropagation();open()},true);
  let tries=0;function boot(){if(install())return;if(++tries<30)setTimeout(boot,300)}boot();
  window.BQRecognition={open,refresh,close,status:()=>({period,lane,active:Boolean(active()),cacheKey:cache.key})};
})();
