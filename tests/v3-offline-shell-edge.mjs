import {createOfflineShellService} from '../src/app/offline-shell.js';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

let registerCalls=0,posted=null;
class FakeMessageChannel{
  constructor(){
    this.port1={onmessage:null,close(){}};
    this.port2={close(){},peer:this.port1};
  }
}
const worker={postMessage(message,ports){posted=message;queueMicrotask(()=>ports?.[0]?.peer?.onmessage?.({data:{ok:true}}))}};
const registration={active:worker};
const serviceWorker={async register(script,options){registerCalls++;assert(script==='offline-shell-sw.js','Worker registration must remain deployment-relative.');assert(options?.scope==='./','Worker scope must remain deployment-relative.');return registration},ready:Promise.resolve(registration)};
const performanceRef={getEntriesByType(type){assert(type==='resource','Offline owner must inspect resource timing only.');return[
  {name:'https://example.test/app/src/app/bootstrap.js',initiatorType:'script'},
  {name:'https://example.test/app/src/ui/app.css',initiatorType:'link'},
  {name:'https://example.test/app/pwa-icon-192.png',initiatorType:'img'},
  {name:'https://example.test/app/data/packs/bible/GEN/1.json',initiatorType:'fetch'},
  {name:'https://cdn.example.test/library.js',initiatorType:'script'}
]}};
const locationRef={href:'https://example.test/app/#/learn',origin:'https://example.test'};
const service=createOfflineShellService({serviceWorker,performanceRef,locationRef,MessageChannelCtor:FakeMessageChannel,timeoutMs:100});
const states=[];const unsubscribe=service.subscribe(state=>states.push(state.status));
const first=await service.start();
assert(first.status==='ready'&&first.ready,'Successful warmup must publish ready.');
assert(registerCalls===1,'Offline shell worker must register exactly once.');
assert(posted?.type==='BIBLEQUEST_WARM_SHELL','Offline owner must use the bounded shell-warm message.');
assert(posted.urls.includes('https://example.test/app/#/learn'),'Current document must be warmed for navigation fallback.');
assert(posted.urls.includes('https://example.test/app/src/app/bootstrap.js')&&posted.urls.includes('https://example.test/app/src/ui/app.css'),'Loaded same-origin shell resources must be warmed.');
assert(!posted.urls.some(url=>url.includes('/data/packs/')),'#98 must not warm Bible pack fetches reserved for #99.');
assert(!posted.urls.some(url=>url.includes('cdn.example.test')),'#98 must not warm cross-origin resources.');
await service.start();assert(registerCalls===1,'Repeated start must reuse the same lifecycle promise.');
unsubscribe();service.dispose();assert((await service.start()).status==='disposed','Disposed owner must not restart registration.');
const unsupported=createOfflineShellService({serviceWorker:null,performanceRef:null,locationRef,MessageChannelCtor:null});
assert((await unsupported.start()).status==='unsupported','Unsupported browsers must fail soft.');unsupported.dispose();
assert(states.includes('registering')&&states.includes('ready'),'Subscribers must receive offline-shell lifecycle changes.');
console.log('BibleQuest v3 offline shell edge regression passed.');
