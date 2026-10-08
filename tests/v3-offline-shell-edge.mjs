import fs from 'node:fs';
import {createOfflineShellService} from '../src/app/offline-shell.js';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

let registerCalls=0,updateCalls=0,posted=null;
class FakeMessageChannel{
  constructor(){
    this.port1={onmessage:null,close(){}};
    this.port2={close(){},peer:this.port1};
  }
}
const worker={postMessage(message,ports){posted=message;queueMicrotask(()=>ports?.[0]?.peer?.onmessage?.({data:{ok:true}}))}};
const registration={active:worker,async update(){updateCalls++}};
const serviceWorker={async register(script,options){registerCalls++;assert(script==='offline-shell-sw.js','Worker registration must remain deployment-relative.');assert(options?.scope==='./','Worker scope must remain deployment-relative.');assert(options?.updateViaCache==='none','Worker registration must bypass stale service-worker script caches.');return registration},ready:Promise.resolve(registration)};
const performanceRef={getEntriesByType(type){assert(type==='resource','Offline owner must inspect resource timing only.');return[
  {name:'https://example.test/app/src/app/bootstrap.js',initiatorType:'script'},
  {name:'https://example.test/app/src/ui/app.css',initiatorType:'link'},
  {name:'https://example.test/app/pwa-icon-192.png',initiatorType:'img'},
  {name:'https://example.test/app/_v6/lazy-chunk-ABC123.js',initiatorType:'other'},
  {name:'https://example.test/app/data/packs/bible/GEN/1.json',initiatorType:'fetch'},
  {name:'https://cdn.example.test/library.js',initiatorType:'script'}
]}};
const locationRef={href:'https://example.test/app/#/learn',origin:'https://example.test'};
const service=createOfflineShellService({serviceWorker,performanceRef,locationRef,MessageChannelCtor:FakeMessageChannel,timeoutMs:100});
const states=[];const unsubscribe=service.subscribe(state=>states.push(state.status));
const first=await service.start();
assert(first.status==='ready'&&first.ready,'Successful warmup must publish ready.');
assert(registerCalls===1,'Offline shell worker must register exactly once.');
assert(updateCalls===1,'Offline shell startup must explicitly check for a newer worker.');
assert(posted?.type==='BIBLEQUEST_WARM_SHELL','Offline owner must use the bounded shell-warm message.');
assert(posted.urls.includes('https://example.test/app/'),'Current document must be warmed as a fragmentless navigation fallback.');
assert(!posted.urls.some(url=>url.includes('#')),'Offline shell warm URLs must not retain client-side route fragments.');
assert(posted.urls.includes('https://example.test/app/src/app/bootstrap.js')&&posted.urls.includes('https://example.test/app/src/ui/app.css'),'Loaded same-origin shell resources must be warmed.');
assert(posted.urls.includes('https://example.test/app/_v6/lazy-chunk-ABC123.js'),'Built Vite chunks must be warmed even when browser initiator metadata is not script/link/css/img.');
assert(!posted.urls.some(url=>url.includes('/data/packs/')),'#98 must not warm Bible pack fetches reserved for #99.');
assert(!posted.urls.some(url=>url.includes('cdn.example.test')),'#98 must not warm cross-origin resources.');
await service.start();assert(registerCalls===1,'Repeated start must reuse the same lifecycle promise.');
unsubscribe();service.dispose();assert((await service.start()).status==='disposed','Disposed owner must not restart registration.');
const unsupported=createOfflineShellService({serviceWorker:null,performanceRef:null,locationRef,MessageChannelCtor:null});
assert((await unsupported.start()).status==='unsupported','Unsupported browsers must fail soft.');unsupported.dispose();
assert(states.includes('registering')&&states.includes('ready'),'Subscribers must receive offline-shell lifecycle changes.');

posted=null;
let loadHandler=null;
const documentRef={readyState:'loading'};
const loadTarget={
  addEventListener(type,handler){assert(type==='load','Offline warm timing must wait only for page load.');loadHandler=handler},
  removeEventListener(type,handler){if(type==='load'&&handler===loadHandler)loadHandler=null}
};
const delayedEntries=[{name:'https://example.test/app/src/app/bootstrap.js',initiatorType:'script'}];
const delayedPerformance={getEntriesByType(type){assert(type==='resource','Delayed warm must inspect resource timing only.');return delayedEntries}};
const delayed=createOfflineShellService({serviceWorker,performanceRef:delayedPerformance,locationRef,MessageChannelCtor:FakeMessageChannel,documentRef,loadTarget,timeoutMs:100});
const delayedStart=delayed.start();
for(let attempt=0;attempt<5&&!loadHandler;attempt++)await Promise.resolve();
assert(typeof loadHandler==='function','First-load warmup must wait for the page load boundary.');
assert(posted===null,'Offline shell must not snapshot resources before page load completes.');
delayedEntries.push({name:'https://example.test/app/src/features/games/index.js',initiatorType:'script'});
documentRef.readyState='complete';
const fireLoad=loadHandler;fireLoad();
const delayedReady=await delayedStart;
assert(delayedReady.ready,'Delayed first-load warmup must become ready after page load.');
assert(posted?.urls.includes('https://example.test/app/src/features/games/index.js'),'Warm snapshot must include shell modules that finished loading after DOMContentLoaded.');
delayed.dispose();

let controllerChangeHandler=null,reloadCalls=0,controlledUpdateCalls=0;
const controlledRegistration={active:worker,async update(){controlledUpdateCalls++;queueMicrotask(()=>controllerChangeHandler?.())}};
const controlledServiceWorker={
  controller:{},
  async register(script,options){
    assert(script==='offline-shell-sw.js','Controlled update must use the same worker path.');
    assert(options?.scope==='./'&&options?.updateViaCache==='none','Controlled update must retain scope and bypass worker HTTP cache.');
    return controlledRegistration;
  },
  ready:Promise.resolve(controlledRegistration),
  addEventListener(type,handler){assert(type==='controllerchange','PWA refresh listener must only watch controller changes.');controllerChangeHandler=handler},
  removeEventListener(type,handler){if(type==='controllerchange'&&handler===controllerChangeHandler)controllerChangeHandler=null}
};
const controlledLocation={...locationRef,reload(){reloadCalls++}};
const controlled=createOfflineShellService({serviceWorker:controlledServiceWorker,performanceRef,locationRef:controlledLocation,MessageChannelCtor:FakeMessageChannel,timeoutMs:100});
const controlledReady=await controlled.start();
await Promise.resolve();
assert(controlledReady.ready,'Controlled PWA update path must still finish shell warmup.');
assert(controlledUpdateCalls===1,'Controlled installed PWA must check for an update once.');
assert(reloadCalls===1,'An already-controlled PWA must reload exactly once when a new worker takes control.');
controlled.dispose();
controllerChangeHandler?.();
assert(reloadCalls===1,'Disposed offline-shell owner must not trigger an additional update reload.');

const workerSource=fs.readFileSync(new URL('../offline-shell-sw.js',import.meta.url),'utf8');
assert(workerSource.includes("const CACHE_NAME=`${CACHE_PREFIX}v7`;"),'Offline shell cache generation must rotate after deployed dynamic-chunk warmup hardening.');
for(const token of[
  "const staleNames=names.filter(name=>name.startsWith(CACHE_PREFIX)&&name!==CACHE_NAME)",
  "const upgrading=staleNames.length>0",
  "if(!upgrading)return",
  "self.clients.matchAll?.({type:'window',includeUncontrolled:true})",
  "await client.navigate(client.url)"
]){
  assert(workerSource.includes(token),'Offline shell worker missing installed-client upgrade refresh contract: '+token);
}
assert((workerSource.match(/url\.hash=''/g)||[]).length>=2,'Offline shell worker must normalize warmed URLs before cache lookup/write.');
assert(workerSource.includes("const matchCached=()=>cache.match(url.href,{ignoreSearch:request.mode==='navigate',ignoreVary:true})"),'Offline shell fetch fallback must match warmed resources by normalized URL and ignore response Vary headers.');
assert(workerSource.includes("const isBuildAsset=url=>sameOriginInScope(url)&&url.pathname.includes('/_v6/')"),'All same-origin hashed Vite chunks must be classified as offline shell assets independent of request destination metadata.');
assert(workerSource.includes("||isBuildAsset(url)"),'Offline shell request classification must include hashed Vite chunks even when browser destination metadata is empty.');
assert(workerSource.includes("if(isBuildAsset(url))"),'Immutable deployable build assets must be checked in Cache Storage before attempting the network.');
assert(workerSource.includes("if(immutable)return immutable"),'Cached immutable build assets must short-circuit network access during offline reload.');
assert(workerSource.includes("ignoreSearch:true,ignoreVary:true"),'Offline navigation root fallback must ignore response Vary headers.');
assert(workerSource.includes("/\\.(?:[cm]?js|tsx?)$/i.test(url.pathname)"),'Offline recursive warm must traverse JavaScript and TypeScript module URLs.');
assert(workerSource.includes("(?:import|export)(?!\\s*\\()\\s*"),'Offline recursive warm must recognize minified static import/export syntax.');
assert(workerSource.includes("async function manifestGraphUrls(seedUrls)"),'Offline shell worker must derive deterministic deployable dependencies from the Vite manifest.');
assert(workerSource.includes('MANIFEST_SHELL_EXTENSIONS')&&workerSource.includes('manifestUrls')&&workerSource.includes('cache.match(raw,{ignoreVary:true})'),'Offline shell worker must validate every Vite JS/CSS cache entry before signaling success.');
assert(workerSource.includes("const PUBLIC_V7_OFFLINE_ARTIFACTS=['data/v7/library-public-catalog.json','data/v7/visual-assets.json'];"),'Public V7 Library and audited visual index must be declared for offline installation.');
assert(workerSource.includes('isPublicV7Artifact(url)')&&workerSource.includes('reviewedPublicUrls')&&workerSource.includes('...manifestUrls,...reviewedPublicUrls'),'Fresh offline install must prewarm and cache-check only public reviewed V7 files.');
assert(workerSource.includes("vite-manifest.json"),'Offline shell worker must read the deployable Vite manifest.');
assert(workerSource.includes("record?.isEntry")&&workerSource.includes("record.imports"),'Offline shell Vite-manifest warm must traverse entry/static import records.');
assert(workerSource.includes("record.dynamicImports"),'Offline shell Vite-manifest warm must traverse dynamic import records for route/startup chunks.');
for(const token of['function staticImportUrls(source,baseUrl)','while(pending.length)','staticImportUrls(await response.clone().text(),url.href)','for(const imports of discovered)for(const imported of imports)enqueue(imported)']){
  assert(workerSource.includes(token),'Offline shell worker missing recursive module-graph contract: '+token);
}
assert(/specifier\.startsWith\('\.'\).*specifier\.startsWith\('\/'\)/s.test(workerSource),'Offline shell recursive warm must only follow relative or scope-rooted module imports.');

console.log('BibleQuest v3 offline shell edge regression passed.');
