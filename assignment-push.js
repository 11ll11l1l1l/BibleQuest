(() => {
  let channel=null,currentCid='',timer=null;
  const account=()=>window.BQAccount,client=()=>account()?.client?.(),session=()=>account()?.session?.();
  function cloud(){try{return JSON.parse(localStorage.getItem('biblequest_cloud_v1')||'{}')}catch{return {}}}
  const cid=()=>cloud().activeCongregationId||'';
  const seenKey=id=>`biblequest_assignments_seen_${id}`;
  function seen(id){try{return new Set(JSON.parse(localStorage.getItem(seenKey(id))||'[]'))}catch{return new Set()}}
  function pill(){let p=document.querySelector('[data-assignment-pill]');if(!p){p=document.createElement('button');p.dataset.assignmentPill='1';p.className='assignment-pill';p.onclick=()=>window.BQAssignments?.open?.()}return p}
  function showPill(count){const home=document.querySelector('.modern-home');if(!home)return;const p=pill();if(!count){p.remove();return}p.innerHTML=`<span>📮</span><b>${count} new task${count===1?'':'s'}</b><small>from your leader</small><i>›</i>`;const label=home.querySelector('.modern-label');if(label&&!p.isConnected)label.before(p)}
  function toast(title){let t=document.querySelector('.bq-task-toast');if(!t){t=document.createElement('button');t.className='bq-task-toast';t.onclick=()=>window.BQAssignments?.open?.();document.body.appendChild(t)}t.textContent=`📮 New assignment: ${title||'BibleQuest task'}`;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),7000)}
  async function refresh(){const c=client(),id=cid();if(!c||!session()||!id){showPill(0);return}const r=await c.from('bible_assignments').select('id,title,created_at').eq('congregation_id',id).eq('active',true).order('created_at',{ascending:false}).limit(100);if(r.error)return;const s=seen(id),unseen=(r.data||[]).filter(x=>!s.has(x.id));showPill(unseen.length)}
  function subscribe(){const c=client(),id=cid();if(!c||!session()||!id)return;if(channel&&currentCid===id)return;if(channel)c.removeChannel(channel);currentCid=id;channel=c.channel(`bq-assignment-push-${id}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'bible_assignments',filter:`congregation_id=eq.${id}`},payload=>{toast(payload.new?.title);refresh().catch(()=>{})}).on('postgres_changes',{event:'UPDATE',schema:'public',table:'bible_assignments',filter:`congregation_id=eq.${id}`},()=>refresh().catch(()=>{})).subscribe()}
  async function boot(){if(!account()?.status?.().signedIn||!client()||!cid())return;subscribe();await refresh().catch(()=>{})}
  const obs=new MutationObserver(()=>{if(document.querySelector('.modern-home'))refresh().catch(()=>{})});obs.observe(document.documentElement,{subtree:true,childList:true});setTimeout(boot,1800);timer=setInterval(boot,30000);window.addEventListener('bq-cloud-board-change',boot);window.addEventListener('bq-assignment-change',refresh);window.BQAssignmentPush={refresh};
})();
