import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const fail=msg=>{throw new Error(msg)};
const assert=(ok,msg)=>{if(!ok)fail(msg)};

const sw=read('sw.js');
const shell=[...sw.matchAll(/'\.\/([^']+)'/g)].map(m=>m[1]);
const coreMatch=sw.match(/const CORE=\[([^\]]+)\]/);
const core=coreMatch?[...coreMatch[1].matchAll(/'\.\/([^']+)'/g)].map(m=>m[1]):[];
const forbiddenLargePrefixes=['data/library/','data/packs/bible/','data/packs/tagalog/','data/packs/questions/','data/packs/context/'];
for(const item of shell){
  if(item==='data/packs/context/manifest.json'||item==='data/packs/manifest.json')continue;
  assert(!forbiddenLargePrefixes.some(prefix=>item.startsWith(prefix)),`large/on-demand dataset must not be precached: ${item}`);
}
const cacheVersion=Number(sw.match(/const CACHE='biblequest-v(\d+)'/)?.[1]||0);
assert(cacheVersion>=47,`PWA cache must include isolated Transform runtime baseline (v47+), got v${cacheVersion||'missing'}`);
for(const item of ['index.html','styles.css','app.js','pwa-runtime.js','operational-hardening.js','transformation-safe.css','transformation-state-guard.js','transformation-safe.js','onboarding-tutorial.js','manifest.webmanifest','app-icon.svg'])assert(core.includes(item),`required offline core missing: ${item}`);
assert(sw.includes('Promise.allSettled(optional.map'),'optional shell precache failures must not abort the whole service-worker install');
assert(sw.includes("e.request.mode==='navigate'"),'service worker must special-case navigations');
assert(sw.includes("networkFirst(e.request,'./index.html')"),'navigations must be network-first with offline shell fallback');
assert(sw.includes('if(response.status>=500)return cachedFallback(request,fallback)'),'HTTP 5xx responses must fall back to cached production assets instead of breaking offline-capable sessions');
assert(sw.includes("e.request.destination==='script'||e.request.destination==='style'"),'scripts/styles must refresh network-first');
assert(sw.includes('self.skipWaiting()'),'new service worker must not wait behind stale worker');
assert(sw.includes('self.clients.claim()'),'activated worker must claim open clients');

const index=read('index.html');
const pwaRuntime=read('pwa-runtime.js');
const operational=read('operational-hardening.js');
const transformGuard=read('transformation-state-guard.js');
const safeTransform=read('transformation-safe.js');
assert(index.includes('<script src="transformation-state-guard.js"></script>'),'production page must load the Transform state guard');
assert(index.includes('<script src="transformation-safe.js"></script>'),'production page must load the isolated Transform runtime');
assert(index.includes('<link rel="stylesheet" href="transformation-safe.css">'),'production page must load isolated Transform styles');
assert(index.indexOf('transformation-state-guard.js')<index.indexOf('transformation-safe.js'),'legacy Transform state must be normalized before safe Transform initializes');
assert(!index.includes('<script src="transformation.js"></script>'),'unstable legacy Transformation assessment runtime must not be production-loaded');
assert(!index.includes('<script src="transformation-taglish.js"></script>'),'legacy Transformation translation observer must not be production-loaded');
assert(!index.includes('<link rel="stylesheet" href="transformation.css">'),'legacy Transform layout must not be production-loaded');
assert(!index.includes('<link rel="stylesheet" href="transformation-taglish.css">'),'legacy Transform translation styles must not be production-loaded');
assert(shell.includes('transformation-safe.js')&&shell.includes('transformation-safe.css'),'isolated Transform runtime must be available offline');
assert(!shell.includes('transformation.js')&&!shell.includes('transformation-taglish.js'),'legacy Transform scripts must stay out of the active PWA shell');
assert(transformGuard.includes('validPersonalityResult')&&transformGuard.includes('validBiasResult'),'Transform state guard must validate persisted legacy result shapes');
assert(transformGuard.includes('sanitize();'),'Transform state guard must sanitize before the safe runtime loads');
assert(safeTransform.includes("mode:'safe-application-v1'"),'production Transform must expose the isolated safe runtime marker');
assert(!safeTransform.includes('MutationObserver'),'safe Transform must not depend on DOM mutation observers');
assert(safeTransform.includes('data-transform-safe-close'),'safe Transform must have an explicit close path');
assert(safeTransform.includes('setTimeout(ensureTab,0)'),'safe Transform tab restoration must be event/timer-driven rather than observer-driven');

assert(index.includes('<script src="operational-hardening.js"></script>'),'production page must load the operational recovery guard');
assert(index.indexOf('operational-hardening.js')<index.indexOf('pwa-runtime.js'),'operational recovery must initialize after feature modules and before PWA registration');
assert(shell.includes('operational-hardening.js'),'operational recovery must be available offline');
assert(operational.includes('repairTransformationState'),'operational layer must keep defensive legacy-state repair');
assert(operational.includes('REQUIREMENTS'),'major feature entry points must remain preflighted before launch');
assert(!operational.includes("new MutationObserver(()=>{if(document.querySelector('.bq-transform-overlay'))enhanceTransform()"),'operational hardening must never restore a self-triggering Transform observer');
assert(index.includes('<script src="onboarding-tutorial.js"></script>'),'production page must load post-registration onboarding tutorial');
assert(shell.includes('onboarding-tutorial.js'),'protected onboarding tutorial must be available offline');
assert(index.includes('<script src="pwa-runtime.js"></script>'),'production page must load PWA registration runtime');
assert(shell.includes('pwa-runtime.js'),'PWA registration runtime must be available offline');
assert(pwaRuntime.includes("navigator.serviceWorker.register('./sw.js'"),'PWA runtime must register the production service worker');
assert(pwaRuntime.includes("updateViaCache: 'none'"),'service-worker update checks must bypass stale HTTP script cache');
assert(pwaRuntime.includes('registration.update()'),'loaded sessions must request a current service-worker check');

const headers=read('_headers');
for(const header of ['X-Content-Type-Options: nosniff','Referrer-Policy: strict-origin-when-cross-origin','Permissions-Policy:','X-Frame-Options: SAMEORIGIN'])assert(headers.includes(header),`missing production security header: ${header}`);

const manifest=JSON.parse(read('manifest.webmanifest'));
assert(manifest.display==='standalone','PWA display must remain standalone');
assert(manifest.start_url==='./'&&manifest.scope==='./','PWA start_url/scope must stay deployment-relative');
assert(Array.isArray(manifest.icons)&&manifest.icons.some(x=>x.sizes==='192x192')&&manifest.icons.some(x=>x.sizes==='512x512'),'PWA must expose install-sized icons');

const largeFiles=['data/library/bible_places.jsonl','data/library/bsb_bible_index.jsonl','data/library/cross_references.txt','data/library/stepbible_tipnr.txt'];
for(const file of largeFiles){
  const bytes=fs.statSync(path.join(root,file)).size;
  assert(bytes>5_000_000,`${file} no longer qualifies for the large-payload guard; update this test intentionally`);
  assert(!shell.includes(file),`${file} must remain on-demand and outside the service-worker shell`);
}

console.log(`Reliability smoke passed: ${shell.length} shell references; ${core.length} core assets; cache v${cacheVersion}; isolated Transform runtime, operational recovery, onboarding, PWA update/fallback behavior, and large-payload boundaries guarded.`);
