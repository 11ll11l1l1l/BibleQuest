const CACHE='biblequest-clean-v4';
const CORE=['./','./index.html','./classic.html','./bq2.css','./bq2-parity.css','./bq2-data.js','./bq2.js','./bq2-reader.js','./bq2-games.js','./bq2-grow.js','./bq2-study.js','./bq2-bookquiz.js','./bq2-parity.js','./bq2-classic-bridge.js','./data/questions.js','./data/stories.js','./data/packs/manifest.json','./app-icon.svg','./assets/bq-pinoy-japan-hero.svg','./assets/avatar-scholar.webp'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('biblequest-clean-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin)return;
  if(url.pathname.includes('/data/packs/bible/')||url.pathname.includes('/data/packs/tagalog/')||url.pathname.includes('/data/packs/questions/')||url.pathname.includes('/data/packs/context/')){
    e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(e.request);if(hit)return hit;const res=await fetch(e.request);if(res.ok)c.put(e.request,res.clone());return res;}));
    return;
  }
  e.respondWith(fetch(e.request).then(res=>{if(res.ok)caches.open(CACHE).then(c=>c.put(e.request,res.clone()));return res;}).catch(async()=>{
    const hit=await caches.match(e.request);if(hit)return hit;
    if(e.request.mode==='navigate')return (await caches.match('./index.html'))||Response.error();
    return Response.error();
  }));
});
