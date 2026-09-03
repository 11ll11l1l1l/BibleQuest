const CACHE='biblequest-v15';
const SHELL=['./','./index.html','./styles.css','./decks.css','./reader.css','./sequence.css','./storyjourney.css','./transformation.css','./transformation-taglish.css','./growth.css','./growth-nudge.css','./learning-engine.css','./open-review.css','./ui-enhancements.css','./extra-games.css','./couples.css','./community.css','./group-play.css','./modern-home.css','./app.js','./reader.js','./sequence.js','./storyjourney.js','./transformation.js','./transformation-taglish.js','./growth.js','./growth-nudge.js','./learning-engine.js','./open-review.js','./extra-games.js','./couples.js','./community.js','./group-play.js','./source-labels.js','./ui-taglish.js','./modern-home.js','./data/questions.js','./data/connections.js','./data/packs/manifest.json','./manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin)return;
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return r}).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(resp=>{
    if(resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}
    return resp;
  })));
});
