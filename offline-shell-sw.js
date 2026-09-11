const CACHE_PREFIX='biblequest-v3-offline-shell-';
const CACHE_NAME=`${CACHE_PREFIX}v1`;
const SHELL_DESTINATIONS=new Set(['script','style','image','font']);
const WARM_CONCURRENCY=8;

const sameOriginInScope=url=>url.origin===self.location.origin&&url.href.startsWith(self.registration.scope);
const isNetworkProbe=url=>url.searchParams.has('bq-net-probe');
const isShellRequest=(request,url)=>sameOriginInScope(url)&&!isNetworkProbe(url)&&(request.mode==='navigate'||SHELL_DESTINATIONS.has(request.destination));

async function put(cache,request,response){
  if(response?.ok)await cache.put(request,response.clone());
  return response;
}

async function warmOne(cache,raw){
  let url;
  try{url=new URL(raw,self.registration.scope)}catch{return}
  if(!sameOriginInScope(url)||isNetworkProbe(url))return;
  try{
    const request=new Request(url.href,{method:'GET',credentials:'same-origin',cache:'reload'});
    const response=await fetch(request);
    await put(cache,request,response);
  }catch{}
}

async function warmShell(urls){
  const cache=await caches.open(CACHE_NAME);
  const queue=Array.isArray(urls)?urls:[];
  if(!queue.length)return;
  let cursor=0;
  const drain=async()=>{
    while(cursor<queue.length){
      const raw=queue[cursor++];
      await warmOne(cache,raw);
    }
  };
  const workers=Array.from({length:Math.min(WARM_CONCURRENCY,queue.length)},()=>drain());
  await Promise.all(workers);
}

self.addEventListener('install',event=>{
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(name=>name.startsWith(CACHE_PREFIX)&&name!==CACHE_NAME).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message',event=>{
  if(event?.data?.type!=='BIBLEQUEST_WARM_SHELL')return;
  event.waitUntil(warmShell(event.data.urls).then(()=>event.ports?.[0]?.postMessage({ok:true})).catch(()=>event.ports?.[0]?.postMessage({ok:false})));
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  let url;
  try{url=new URL(request.url)}catch{return}
  if(!isShellRequest(request,url))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    try{
      const response=await fetch(request);
      return await put(cache,request,response);
    }catch(error){
      const cached=await cache.match(request,{ignoreSearch:request.mode==='navigate'});
      if(cached)return cached;
      if(request.mode==='navigate'){
        const fallback=await cache.match(new URL('./',self.registration.scope).href,{ignoreSearch:true});
        if(fallback)return fallback;
      }
      throw error;
    }
  })());
});
