const CACHE='bq-kids-games-v1';
const FILES=["./","./index.html","./sw.js","./bundle-00.txt","./bundle-01.txt","./bundle-02.txt","./bundle-03.txt","./bundle-04.txt","./bundle-05.txt","./bundle-06.txt","./bundle-07.txt","./bundle-08.txt","./bundle-09.txt","./bundle-10.txt","./bundle-11.txt"];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('bq-kids-games-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res}).catch(()=>caches.match('./index.html'))))});
