(() => {
  if (!('serviceWorker' in navigator)) return;

  const report=(code,error,meta={})=>window.BQRuntime?.report?.('pwa',code,error,meta);

  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', {
        scope: './',
        updateViaCache: 'none'
      });

      registration.addEventListener('updatefound',()=>{
        const worker=registration.installing;
        if(!worker)return;
        worker.addEventListener('statechange',()=>{
          if(worker.state==='installed')window.dispatchEvent(new CustomEvent('bq-pwa-update',{detail:{ready:Boolean(navigator.serviceWorker.controller)}}));
        });
      });

      // Force a lightweight update check on each loaded session so a freshly deployed
      // Cloudflare release is not hidden behind the browser's service-worker script cache.
      registration.update().catch(error=>report('update_check_failed',error));
      window.dispatchEvent(new CustomEvent('bq-pwa-ready'));
    } catch (error) {
      report('registration_failed',error);
      console.warn('BibleQuest PWA service worker unavailable:', error?.message || error);
    }
  };

  navigator.serviceWorker.addEventListener('controllerchange',()=>window.dispatchEvent(new CustomEvent('bq-pwa-controller-changed')));
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
})();
