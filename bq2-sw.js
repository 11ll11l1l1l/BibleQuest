const CACHE='biblequest-clean-v2';
const CORE=['./','./index.html','./bq2.css','./bq2-data.js','./bq2.js','./bq2-reader.js','./bq2-games.js','./bq2-grow.js','./bq2-study.js','./data/questions.js','./data/stories.js','./app-icon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('biblequest-clean-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.pathname.includes('/data/packs/bible/')||url.pathname.includes('/data/packs/tagalog/')){
    e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(e.request);if(hit)return hit;const res=await fetch(e.request);if(res.ok)c.put(e.request,res.clone());return res;}));
    return;
  }
  e.respondWith(fetch(e.request).then(res=>{if(res.ok&&url.origin===location.origin)caches.open(CACHE).then(c=>c.put(e.request,res.clone()));return res;}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
});
