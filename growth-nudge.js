(() => {
  const STORE='biblequest_growth_v1';
  const today=()=>new Date().toISOString().slice(0,10);
  function load(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}}
  function daysSince(date){if(!date)return Infinity;return Math.floor((new Date(`${today()}T00:00:00`)-new Date(`${date}T00:00:00`))/86400000)}
  function inject(){
    const stats=document.querySelector('.app .quick-stats');
    if(!stats || document.querySelector('.growth-home-nudge')) return;
    const m=load();
    const active=(m.experiments||[]).find(x=>x.status==='active');
    const last=(m.checkins||[]).at(-1);
    const weeklyDue=!last || daysSince(last.date)>=7;
    let icon='🌱', kicker='PERSONAL GROWTH', title='Growth Lab', body='Turn self-awareness into one small behavior experiment.';
    if(active){
      const done=!!active.logs?.[today()];
      kicker=done?'TODAY COMPLETE':'TODAY’S PRACTICE';
      title=active.title||'Active experiment';
      body=done?'Naka-log na ang practice mo today. Review patterns anytime.':active.practice||'Open your active growth experiment.';
    }else if(weeklyDue){
      icon='📅';kicker='WEEKLY CHECK-IN';title=last?'Time to check the pattern':'Build your growth baseline';
      body='Five quick behavior ratings. Observation lang—hindi grade at hindi clinical score.';
    }
    const btn=document.createElement('button');
    btn.className='growth-home-nudge';
    btn.innerHTML=`<span class="growth-nudge-icon">${icon}</span><span><small>${kicker}</small><b>${escapeHtml(title)}</b><em>${escapeHtml(body)}</em></span><i>›</i>`;
    btn.onclick=()=>window.BQ_GROWTH?.open?.();
    stats.insertAdjacentElement('afterend',btn);
  }
  function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  const observer=new MutationObserver(inject);observer.observe(document.documentElement,{childList:true,subtree:true});inject();
})();
