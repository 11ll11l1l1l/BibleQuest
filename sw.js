// Legacy service-worker retirement shim for the clean BibleQuest rebuild.
// Existing installs may still request sw.js once; V5 keeps that behavior and adds the minimum Web Push delivery channel.
const cleanPushText=(value,max)=>String(value??'').replace(/\r\n?/g,'\n').trim().slice(0,max);
const safePushUrl=value=>{
  const fallback=self.registration?.scope||self.location?.origin||'/';
  try{
    const raw=cleanPushText(value,1200);
    if(!raw)return fallback;
    const url=new URL(raw,self.location.origin);
    return url.origin===self.location.origin?url.href:fallback;
  }catch{return fallback;}
};
const safePushIcon=value=>{
  try{
    const raw=cleanPushText(value,600);
    if(!raw)return undefined;
    const url=new URL(raw,self.location.origin);
    return url.origin===self.location.origin?url.href:undefined;
  }catch{return undefined;}
};
const readPushPayload=event=>{
  try{
    const value=event.data?.json?.();
    return value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  }catch{return {};}
};

self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>!k.startsWith('biblequest-clean-')).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
});
self.addEventListener('push',event=>{
  const payload=readPushPayload(event);
  const title=cleanPushText(payload.title,180)||'BibleQuest';
  const body=cleanPushText(payload.body,1200);
  const notificationId=cleanPushText(payload.notificationId||payload.notification_id,120);
  const type=cleanPushText(payload.type||payload.notificationType||payload.notification_type,60).toLowerCase();
  const options={
    body,
    tag:notificationId?`biblequest-${notificationId}`:undefined,
    icon:safePushIcon(payload.icon),
    data:Object.freeze({url:safePushUrl(payload.url),notificationId,type})
  };
  event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener('notificationclick',event=>{
  event.notification?.close?.();
  const targetUrl=safePushUrl(event.notification?.data?.url);
  event.waitUntil((async()=>{
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const sameOrigin=windows.find(client=>{
      try{return new URL(client.url).origin===self.location.origin;}catch{return false;}
    });
    if(sameOrigin){
      if(typeof sameOrigin.navigate==='function'&&sameOrigin.url!==targetUrl)await sameOrigin.navigate(targetUrl);
      if(typeof sameOrigin.focus==='function')return sameOrigin.focus();
      return sameOrigin;
    }
    return self.clients.openWindow?.(targetUrl);
  })());
});
