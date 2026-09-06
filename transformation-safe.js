(() => {
  const STORE='biblequest_transform_reflection_v1';
  let overlay=null;

  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function load(){
    try{
      const raw=JSON.parse(localStorage.getItem(STORE)||'{}');
      return raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
    }catch{return {}}
  }

  function save(data){
    try{localStorage.setItem(STORE,JSON.stringify(data));return true}catch{return false}
  }

  function close(){
    overlay?.remove();
    overlay=null;
    document.querySelectorAll('[data-transform-tab]').forEach(b=>b.classList.remove('active'));
  }

  function openLinked(selector){
    close();
    setTimeout(()=>document.querySelector(selector)?.click(),0);
  }

  function render(){
    const state=load();
    const notice=esc(state.notice||'');
    const action=esc(state.action||'');
    const prayer=esc(state.prayer||'');
    overlay=document.createElement('section');
    overlay.className='bq-transform-overlay bq-transform-safe-page';
    overlay.setAttribute('aria-label','Transformation');
    overlay.innerHTML=`<div class="transform-app">
      <header class="transform-top">
        <button type="button" class="transform-brand" data-transform-home>BibleQuest <span>Transform</span></button>
        <div class="bq-transform-title-actions"><span class="local-chip">🔒 private on this device</span><button type="button" class="transform-safe-close" data-transform-safe-close aria-label="Close Transformation">×</button></div>
      </header>
      <section class="bq-transform-safe-hero">
        <div class="eyebrow">Scripture → practice</div>
        <h1>Turn what you learn into one faithful next step.</h1>
        <p>Transform is for reflection and application. Nothing here grades your faith, diagnoses your personality, or locks Scripture behind progress.</p>
      </section>
      <section class="bq-transform-safe-grid">
        <article class="bq-transform-safe-card">
          <div class="bq-transform-safe-icon">🪞</div><div><small>NOTICE</small><h2>What is God’s Word showing me?</h2><p>Name one truth, correction, encouragement, or question you want to remember.</p></div>
          <textarea data-transform-notice maxlength="1200" placeholder="Write a short reflection…">${notice}</textarea>
        </article>
        <article class="bq-transform-safe-card">
          <div class="bq-transform-safe-icon">👣</div><div><small>ACT</small><h2>What will I do differently?</h2><p>Choose one concrete action that can be practiced today or this week.</p></div>
          <textarea data-transform-action maxlength="1200" placeholder="One specific next step…">${action}</textarea>
        </article>
        <article class="bq-transform-safe-card">
          <div class="bq-transform-safe-icon">🙏</div><div><small>PRAY</small><h2>Turn the reflection into prayer.</h2><p>Keep it simple and honest. This note stays on this device.</p></div>
          <textarea data-transform-prayer maxlength="1200" placeholder="Prayer or reminder…">${prayer}</textarea>
        </article>
      </section>
      <div class="bq-transform-save-row"><button type="button" class="primary" data-transform-save>Save reflection</button><span data-transform-save-status aria-live="polite"></span></div>
      <section class="bq-transform-safe-actions">
        <button type="button" data-transform-situation><span>🧭</span><div><b>Situations & Wisdom</b><small>Practice careful biblical decision-making.</small></div><i>›</i></button>
        <button type="button" data-transform-think><span>💭</span><div><b>Think Deeper</b><small>Explore motives, forgiveness, planning, and judgment.</small></div><i>›</i></button>
        <button type="button" data-transform-reader><span>📖</span><div><b>Open Bible Reader</b><small>Return to the passage itself before applying it.</small></div><i>›</i></button>
      </section>
      <div class="source-note"><b>Why this version is simpler:</b> Transform now uses a lightweight application page with no background DOM observers or assessment engine. Your older Transformation assessment data is left untouched, but it is not loaded by this screen.</div>
    </div>`;
    document.body.appendChild(overlay);
    document.querySelectorAll('[data-transform-tab]').forEach(b=>b.classList.add('active'));

    overlay.querySelector('[data-transform-safe-close]').onclick=close;
    overlay.querySelector('[data-transform-home]').onclick=close;
    overlay.querySelector('[data-transform-save]').onclick=()=>{
      const next={
        notice:overlay.querySelector('[data-transform-notice]').value.trim(),
        action:overlay.querySelector('[data-transform-action]').value.trim(),
        prayer:overlay.querySelector('[data-transform-prayer]').value.trim(),
        saved_at:new Date().toISOString()
      };
      const status=overlay.querySelector('[data-transform-save-status]');
      status.textContent=save(next)?'Saved on this device.':'Could not save on this device.';
    };
    overlay.querySelector('[data-transform-situation]').onclick=()=>openLinked('[data-action="situation"]');
    overlay.querySelector('[data-transform-think]').onclick=()=>openLinked('[data-route="discuss"]');
    overlay.querySelector('[data-transform-reader]').onclick=()=>openLinked('[data-reader-open]');
  }

  function open(){
    close();
    render();
  }

  function ensureTab(){
    const nav=document.querySelector('.bottom');
    if(!nav||nav.querySelector('[data-transform-tab]'))return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='navbtn';
    btn.dataset.transformTab='1';
    btn.innerHTML='<b>🪞</b>Transform';
    const profile=[...nav.querySelectorAll('.navbtn')].find(x=>x.dataset.route==='profile');
    nav.insertBefore(btn,profile||null);
    btn.addEventListener('click',open);
  }

  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay)close()});
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-route]'))setTimeout(ensureTab,0)},true);
  document.addEventListener('DOMContentLoaded',()=>setTimeout(ensureTab,0));
  window.addEventListener('bq-modern-home-rendered',ensureTab);
  setTimeout(ensureTab,0);
  setTimeout(ensureTab,300);

  window.BQ_TRANSFORMATION={open,close,ensureTab,mode:'safe-application-v1'};
})();
