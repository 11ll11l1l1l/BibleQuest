(() => {
  let queued=false;

  function alignCurrentPath(root=document){
    const strip=root.querySelector?.('.journey-path-scroll');
    const current=strip?.querySelector('.journey-node.current');
    if(!strip||!current||strip.dataset.bqAligned==='1')return;
    strip.dataset.bqAligned='1';
    requestAnimationFrame(()=>{
      const first=current===strip.firstElementChild;
      const left=first?0:Math.max(0,current.offsetLeft-(strip.clientWidth-current.offsetWidth)/2);
      strip.scrollTo({left,top:0,behavior:'auto'});
    });
  }

  function normalizeHome(){
    const home=document.querySelector('.modern-home');
    const daily=home?.querySelector('.today-journey-card');
    if(home&&daily){
      document.body.classList.add('bq-frontpage-focus','bq-engagement-home');
      alignCurrentPath(home);
    }
  }

  function refresh(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;normalizeHome()});
  }

  new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('resize',refresh,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
  document.addEventListener('DOMContentLoaded',refresh);
  refresh();
  setTimeout(refresh,500);
  setTimeout(refresh,1500);
})();
