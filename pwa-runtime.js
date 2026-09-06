(() => {
  if (!('serviceWorker' in navigator)) return;
  const RELOAD_FLAG='bq_sw_controller_reload_v75';
  let hadController=Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!hadController){hadController=true;return}try{if(sessionStorage.getItem(RELOAD_FLAG))return;sessionStorage.setItem(RELOAD_FLAG,'1')}catch{}location.reload()});
  const register=async()=>{try{const registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});registration.update().catch(()=>{})}catch(error){console.warn('BibleQuest PWA service worker unavailable:',error?.message||error)}};
  if(document.readyState==='complete')register();else window.addEventListener('load',register,{once:true});
})();