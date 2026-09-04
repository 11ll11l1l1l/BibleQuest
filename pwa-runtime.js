(() => {
  if (!('serviceWorker' in navigator)) return;

  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', {
        scope: './',
        updateViaCache: 'none'
      });
      // Force a lightweight update check on each loaded session so a freshly deployed
      // Cloudflare release is not hidden behind the browser's service-worker script cache.
      registration.update().catch(() => {});
    } catch (error) {
      console.warn('BibleQuest PWA service worker unavailable:', error?.message || error);
    }
  };

  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
})();
