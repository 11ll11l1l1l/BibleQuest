const CACHE='biblequest-v28';
const SHELL=['./','./index.html','./app-icon.svg','./assets/bq-pinoy-japan-hero.svg','./styles.css','./decks.css','./reader.css','./sequence.css','./storyjourney.css','./transformation.css','./transformation-taglish.css','./growth.css','./growth-nudge.css','./learning-engine.css','./open-review.css','./ui-enhancements.css','./extra-games.css','./couples.css','./community.css','./group-play.css','./cloud.css','./account.css','./notes.css','./innovation.css','./modern-home.css','./completion.css','./kawaii-polish.css','./round2-polish.css','./pinoy-hero.css','./app.js','./reader.js','./translations.js','./sequence.js','./storyjourney.js','./transformation.js','./transformation-taglish.js','./growth.js','./growth-nudge.js','./learning-engine.js','./open-review.js','./extra-games.js','./couples.js','./community.js','./community-bridge.js','./cloud-config.js','./account.js','./signup-enhancements.js','./notes.js','./cloud-copy.js','./cloud.js','./group-play.js','./live-rooms.js','./innovation-suite.js','./workspace.js','./couple-cloud.js','./context-lab.js','./assignment-center.js','./assignment-push.js','./presence.js','./avatar-vault.js','./source-labels.js','./ui-taglish.js','./account-taglish.js','./modern-home.js','./pinoy-hero.js','./data/questions.js','./data/connections.js','./data/packs/manifest.json','./data/packs/context/manifest.json','./manifest.webmanifest'];

self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));

async function networkFirst(request,fallback){
  try{
    const response=await fetch(request);
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(request,copy));}
    return response;
  }catch(_err){
    return (await caches.match(request))||(fallback?await caches.match(fallback):undefined)||Response.error();
  }
}

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin)return;

  if(e.request.mode==='navigate'){
    e.respondWith(networkFirst(e.request,'./index.html'));
    return;
  }

  const refreshableShell=e.request.destination==='script'||e.request.destination==='style'||url.pathname.endsWith('/manifest.webmanifest')||url.pathname.endsWith('/data/packs/manifest.json')||url.pathname.endsWith('/data/packs/context/manifest.json');
  if(refreshableShell){
    e.respondWith(networkFirst(e.request));
    return;
  }

  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(resp=>{
    if(resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}
    return resp;
  })));
});
