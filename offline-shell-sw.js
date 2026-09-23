const CACHE_PREFIX='biblequest-v3-offline-shell-';
const CACHE_NAME=`${CACHE_PREFIX}v2`;
const SHELL_DESTINATIONS=new Set(['script','style','image','font']);
const WARM_CONCURRENCY=8;
const PUSH_FALLBACK_ROUTE='/#/notification-center';

const sameOriginInScope=url=>url.origin===self.location.origin&&url.href.startsWith(self.registration.scope);
const isNetworkProbe=url=>url.searchParams.has('bq-net-probe');
const isShellRequest=(request,url)=>sameOriginInScope(url)&&!isNetworkProbe(url)&&(request.mode==='navigate'||SHELL_DESTINATIONS.has(request.destination));

function safeNotificationUrl(raw){
  try{
    const url=new URL(String(raw||PUSH_FALLBACK_ROUTE),self.registration.scope);
    return url.origin===self.location.origin?url.href:new URL(PUSH_FALLBACK_ROUTE,self.registration.scope).href;
  }catch{return new URL(PUSH_FALLBACK_ROUTE,self.registration.scope).href}
}

async function put(cache,request,response){
  if(response?.ok)await cache.put(request,response.clone());
  return response;
}

function staticImportUrls(source,baseUrl){
  const urls=new Set(),patterns=[
    /\b(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  ];
  for(const pattern of patterns){
    for(const match of source.matchAll(pattern)){
      const specifier=String(match[1]||'').trim();
      if(!specifier||(!specifier.startsWith('.')&&!specifier.startsWith('/')))continue;
      try{
        const url=new URL(specifier,baseUrl);
        if(sameOriginInScope(url)&&!isNetworkProbe(url))urls.add(url.href);
      }catch{}
    }
  }
  return [...urls];
}

async function warmOne(cache,raw){
  let url;
  try{url=new URL(raw,self.registration.scope)}catch{return[]}
  if(!sameOriginInScope(url)||isNetworkProbe(url))return[];
  try{
    const request=new Request(url.href,{method:'GET',credentials:'same-origin',cache:'reload'});
    const response=await fetch(request);
    let imports=[];
    if(response?.ok&&/\.m?js$/i.test(url.pathname)){
      try{imports=staticImportUrls(await response.clone().text(),url.href)}catch{}
    }
    await put(cache,request,response);
    return imports;
  }catch{return[]}
}

async function warmShell(urls){
  const cache=await caches.open(CACHE_NAME);
  const pending=[],seen=new Set();
  const enqueue=raw=>{
    let url;
    try{url=new URL(raw,self.registration.scope)}catch{return}
    if(!sameOriginInScope(url)||isNetworkProbe(url)||seen.has(url.href))return;
    seen.add(url.href);
    pending.push(url.href);
  };
  for(const raw of Array.isArray(urls)?urls:[])enqueue(raw);
  while(pending.length){
    const batch=pending.splice(0,WARM_CONCURRENCY);
    const discovered=await Promise.all(batch.map(raw=>warmOne(cache,raw)));
    for(const imports of discovered)for(const imported of imports)enqueue(imported);
  }
}

self.addEventListener('install',event=>{
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    const staleNames=names.filter(name=>name.startsWith(CACHE_PREFIX)&&name!==CACHE_NAME);
    const upgrading=staleNames.length>0;
    await Promise.all(staleNames.map(name=>caches.delete(name)));
    await self.clients.claim();
    if(!upgrading)return;
    const windows=await self.clients.matchAll?.({type:'window',includeUncontrolled:true})||[];
    await Promise.all(windows.map(async client=>{
      if(typeof client?.navigate!=='function')return;
      try{
        const url=new URL(client.url);
        if(url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
        await client.navigate(client.url);
      }catch{}
    }));
  })());
});

self.addEventListener('message',event=>{
  if(event?.data?.type!=='BIBLEQUEST_WARM_SHELL')return;
  event.waitUntil(warmShell(event.data.urls).then(()=>event.ports?.[0]?.postMessage({ok:true})).catch(()=>event.ports?.[0]?.postMessage({ok:false})));
});

self.addEventListener('push',event=>{
  event.waitUntil((async()=>{
    let payload={};
    try{payload=event.data?.json?.()||{}}catch{}
    const title=String(payload?.title||'BibleQuest').slice(0,120);
    const body=String(payload?.body||'').slice(0,240);
    const url=safeNotificationUrl(payload?.url);
    await self.registration.showNotification(title,{
      body,
      tag:payload?.notificationId?`bq-${String(payload.notificationId).slice(0,80)}`:undefined,
      data:{url,notificationId:String(payload?.notificationId||''),type:String(payload?.type||'')}
    });
  })());
});

self.addEventListener('notificationclick',event=>{
  event.notification?.close?.();
  event.waitUntil((async()=>{
    const target=safeNotificationUrl(event.notification?.data?.url);
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){
      let sameOrigin=false;
      try{sameOrigin=new URL(client.url).origin===self.location.origin}catch{}
      if(!sameOrigin)continue;
      try{if(client.url!==target&&typeof client.navigate==='function')await client.navigate(target)}catch{}
      if(typeof client.focus==='function')return client.focus();
    }
    return self.clients.openWindow?.(target);
  })());
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
