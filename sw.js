const CACHE='biblequest-v46';
const SHELL=['./','./index.html','./app-icon.svg','./assets/bq-pinoy-japan-hero.svg','./assets/tutorial-trainer-sprite.webp','./styles.css','./decks.css','./reader.css','./japanese-learning.css','./sequence.css','./storyjourney.css','./transformation.css','./transformation-taglish.css','./growth.css','./growth-nudge.css','./learning-engine.css','./open-review.css','./ui-enhancements.css','./extra-games.css','./couples.css','./community.css','./group-play.css','./cloud.css','./account.css','./notes.css','./innovation.css','./modern-home.css','./completion.css','./kawaii-polish.css','./round2-polish.css','./pinoy-hero.css','./journey-loop.css','./journey-groups.css','./release-hardening.css','./mobile-production.css','./tutorial.css','./data/doctrinal-safety.js','./data/doctrinal-context.js','./runtime-safety.js','./app.js','./reader.js','./translations.js','./japanese-learning.js','./sequence.js','./storyjourney.js','./transformation-state-guard.js','./transformation.js','./transformation-taglish.js','./growth.js','./growth-nudge.js','./learning-engine.js','./open-review.js','./extra-games.js','./couples.js','./community.js','./community-bridge.js','./cloud-config.js','./account.js','./onboarding-tutorial.js','./tutorial-launcher.js','./password-recovery.js','./admin-link.js','./personality-profile.js','./signup-enhancements.js','./notes.js','./cloud-copy.js','./cloud.js','./group-play.js','./live-rooms.js','./innovation-suite.js','./workspace.js','./couple-cloud.js','./context-lab.js','./assignment-center.js','./assignment-push.js','./presence.js','./avatar-vault.js','./source-labels.js','./ui-taglish.js','./account-taglish.js','./modern-home.js','./pinoy-hero.js','./journey-groups.js','./journey-loop.js','./journey-accessibility.js','./journey-cloud-sync.js','./engagement-v3.js','./frontpage-daily.js','./quest-media.js','./release-hardening.js','./mobile-production.js','./pwa-runtime.js','./operational-hardening.js','./data/questions.js','./data/connections.js','./data/packs/manifest.json','./data/packs/context/manifest.json','./manifest.webmanifest'];
const CORE=['./','./index.html','./styles.css','./tutorial.css','./app.js','./pwa-runtime.js','./operational-hardening.js','./transformation-state-guard.js','./onboarding-tutorial.js','./tutorial-launcher.js','./assets/tutorial-trainer-sprite.webp','./manifest.webmanifest','./app-icon.svg'];
const NO_RUNTIME_CACHE=['/data/library/'];

self.addEventListener('install',e=>e.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(CORE);
  const optional=SHELL.filter(item=>!CORE.includes(item));
  await Promise.allSettled(optional.map(async item=>{
    const request=new Request(item,{cache:'reload'});
    const response=await fetch(request);
    if(response.ok)await cache.put(request,response);
  }));
  await self.skipWaiting();
})()));

self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));

async function cachedFallback(request,fallback){
  return (await caches.match(request))||(fallback?await caches.match(fallback):undefined)||Response.error();
}

async function networkFirst(request,fallback){
  try{
    const response=await fetch(request);
    if(response.ok){
      const copy=response.clone();
      caches.open(CACHE).then(c=>c.put(request,copy));
      return response;
    }
    if(response.status>=500)return cachedFallback(request,fallback);
    return response;
  }catch(_err){
    return cachedFallback(request,fallback);
  }
}

async function staleWhileRevalidate(event){
  const cached=await caches.match(event.request);
  const refresh=fetch(event.request).then(async response=>{
    if(response.ok){
      const cache=await caches.open(CACHE);
      await cache.put(event.request,response.clone());
    }
    return response;
  }).catch(()=>null);
  if(cached){event.waitUntil(refresh);return cached;}
  return (await refresh)||Response.error();
}

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin)return;
  if(NO_RUNTIME_CACHE.some(prefix=>url.pathname.includes(prefix))){e.respondWith(fetch(e.request));return;}
  if(e.request.mode==='navigate'){e.respondWith(networkFirst(e.request,'./index.html'));return;}
  const refreshableShell=e.request.destination==='script'||e.request.destination==='style'||url.pathname.endsWith('/manifest.webmanifest')||url.pathname.endsWith('/data/packs/manifest.json')||url.pathname.endsWith('/data/packs/context/manifest.json');
  if(refreshableShell){e.respondWith(networkFirst(e.request));return;}
  e.respondWith(staleWhileRevalidate(e));
});
