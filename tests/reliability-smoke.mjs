import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const fail=msg=>{throw new Error(msg)};
const assert=(ok,msg)=>{if(!ok)fail(msg)};

const sw=read('sw.js');
const index=read('index.html');
const standalone=read('transform.html');
const launcher=read('transform-launcher.js');
const transform=read('transformation-v2.js');
const transformCss=read('transformation-v2.css');
const mobile=read('mobile-production.css');
const runtime=read('runtime-health.js');
const modernHome=read('modern-home.js');
const reader=read('reader.js');
const translations=read('translations.js');
const shell=[...sw.matchAll(/'\.\/([^']+)'/g)].map(m=>m[1]);
const coreMatch=sw.match(/const CORE=\[([^\]]+)\]/);
const core=coreMatch?[...coreMatch[1].matchAll(/'\.\/([^']+)'/g)].map(m=>m[1]):[];
const cacheVersion=Number(sw.match(/const CACHE='biblequest-v(\d+)'/)?.[1]||0);

assert(cacheVersion>=60,`PWA cache must include latest Transform + consolidated mobile/runtime-health baseline (v60+), got v${cacheVersion||'missing'}`);
for(const item of ['index.html','transform.html','styles.css','mobile-production.css','runtime-health.js','app.js','transform-launcher.js','transformation-v2.js','transformation-v2.css','pwa-runtime.js','onboarding-tutorial.js','manifest.webmanifest','app-icon.svg'])assert(core.includes(item),`required offline core missing: ${item}`);
assert(!index.includes('mobile-readability.css'),'retired mobile override sheet must not be production-loaded');
assert(!sw.includes('mobile-readability.css'),'retired mobile override sheet must not be cached');
assert(sw.includes('Promise.allSettled(optional.map'),'optional shell precache failures must not abort service-worker install');
assert(sw.includes('const isTransformNavigation=/\\/transform(?:\\.html)?\\/?$/.test(url.pathname)')&&sw.includes("fallback=isTransformNavigation?'./transform.html'"),'Transform navigation must have its own offline document fallback');
assert(sw.includes('self.skipWaiting()')&&sw.includes('self.clients.claim()'),'service worker must activate and claim promptly');

// Narrow-phone production guards now live in one authoritative mobile stylesheet.
assert(index.includes('<link rel="stylesheet" href="mobile-production.css">'),'production must load the mobile contract');
assert(/\.bottom\{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/.test(mobile),'phone bottom navigation must match the four production tabs');
assert(/\.navbtn\{[^}]*min-height:54px!important[^}]*font-size:12px!important/.test(mobile),'phone navigation must retain readable labels and a practical touch target');
assert(/\.bq-engagement-home \.journey-primary\{[^}]*min-height:46px!important[^}]*font-size:14px!important/.test(mobile),'Daily Journey primary CTA must remain readable and touchable on phones');
assert(/\.today-journey-actions \.journey-secondary\{[^}]*min-height:44px!important/.test(mobile),'Daily Journey secondary CTA must retain a practical touch target');
assert(/\.journey-node small\{font-size:11px!important/.test(mobile),'journey path support labels must remain readable');
assert(/\.ui-language-toggle\{[^}]*min-width:44px!important[^}]*min-height:44px!important/.test(mobile),'persistent language control must remain touchable');

// Hub entry points must fail visibly rather than relying on optional-chain no-ops.
assert(modernHome.includes('function featureFailure(label,retry,error=null)'),'Home hubs need a shared recoverable feature-failure surface');
assert(modernHome.includes('class="modern-feature-failure" role="alert"'),'feature-entry failure must be visible and announced');
assert(modernHome.includes("function openApi(label,getApi,method='open')"),'API-backed hub entries must use the guarded opener');
assert(modernHome.includes('result.catch(error=>featureFailure(label,retry,error))'),'async feature rejection must degrade to the visible failure surface');
assert(!modernHome.includes('Daily 5'),'modern Home must not reintroduce the retired Daily 5 identity');
assert(modernHome.includes("['🧭','Daily Journey','Recall → context → learn → apply → reflect'"),'Play must route its daily entry to Daily Journey');
assert(modernHome.includes('opens the selected passage in a licensed reader'),'Home source copy must describe current NLT behavior truthfully');
assert(modernHome.includes("obs.observe(appRoot,{childList:true,subtree:true})"),'Home observer must stay scoped to the app root');

// Reader/translation integration must be event-driven and source-truthful.
assert(reader.includes("new CustomEvent('bq-reader-rendered')"),'Reader must emit a lifecycle event after rendering');
assert(reader.includes("observe(appRoot,{childList:true,subtree:true})"),'Reader home injection must stay scoped to the app root');
assert(!translations.includes('MutationObserver'),'translation enhancement must not use a document mutation observer');
assert(translations.includes("window.addEventListener('bq-reader-rendered',enhance)"),'translations must react to Reader lifecycle events');
assert(translations.includes("article.removeAttribute('data-bq-scripture')"),'licensed external readers must not retain a false Scripture-version marker');

// Runtime health is local/privacy-safe and loaded before application modules.
assert(index.indexOf('runtime-health.js')>index.indexOf('runtime-safety.js')&&index.indexOf('runtime-health.js')<index.indexOf('app.js'),'runtime health must load after safety policy and before app modules');
assert(runtime.includes('const MAX=30'),'runtime diagnostics must remain bounded');
assert(runtime.includes("'[email]'"),'runtime diagnostics must redact email addresses');
assert(runtime.includes("'[token]'"),'runtime diagnostics must redact long token-like values');
assert(runtime.includes('window.BQRuntime=Object.freeze'),'runtime diagnostics API must be explicit and immutable');

// Transform remains a standalone route with transformation-v2.js as its single source of truth.
assert(!index.includes('<script src="transformation-v2.js"></script>'),'main SPA must not directly load Transform assessment runtime');
assert(!index.includes('<link rel="stylesheet" href="transformation-v2.css">'),'main SPA must not directly load Transform styles');
assert(index.includes('<script src="transform-launcher.js"></script>'),'main SPA must load the isolated Transform launcher');
assert(launcher.includes("const TARGET='./transform.html'"),'Transform launcher must target the standalone document');
assert(launcher.includes("location.assign(new URL(TARGET,location.href).href)"),'Transform entry must navigate instead of mounting inside the main SPA');
assert(launcher.includes("window.BQ_TRANSFORMATION={open:openStandalone,mode:'standalone-route',version:2}"),'Grow callback must retain a fail-safe Transform API instead of silently no-oping');
assert(standalone.includes('<script src="transformation-v2.js"></script>'),'standalone Transform must load the canonical Transform v2 runtime');
assert(standalone.includes('<link rel="stylesheet" href="transformation-v2.css">'),'standalone Transform page must load its visual stylesheet');
assert(!standalone.includes('var FACTORS=')&&!standalone.includes('var ITEMS=['),'standalone document must not carry a second assessment implementation');
assert(!standalone.includes('localStorage.setItem(STORE'),'standalone document must delegate Transform state ownership to transformation-v2.js');
assert(transform.includes("mode:'rebuilt-v2'"),'Transform runtime must expose rebuilt-v2 marker');
assert(transform.includes('const VERSION=2'),'Transform runtime must use explicit versioning');
assert(transform.includes("const STORE='biblequest_transform_v2'"),'Transform runtime must use isolated local storage');
assert(!transform.includes('MutationObserver'),'Transform runtime must not use MutationObserver');
assert(transform.includes("root.addEventListener('click',onClick)"),'Transform event handling must stay scoped to its own root');
assert(transform.includes('Thinking Patterns Check')&&transform.includes('Reflection & Action Plan')&&transform.includes('Private Reflection Journal'),'Transform development surfaces must remain available');
assert((transform.match(/\['[EACSO]\d'/g)||[]).length===20,'Transform must retain exactly 20 personality items');
for(const legacy of ['transform-quarantine.js','transformation-safe.js','transformation-state-guard.js','transformation.js','transformation-taglish.js','operational-hardening.js'])assert(!index.includes(`<script src="${legacy}"></script>`),`retired runtime must not be production-loaded: ${legacy}`);
assert(shell.includes('transform.html')&&shell.includes('transform-launcher.js')&&shell.includes('transformation-v2.js')&&shell.includes('transformation-v2.css'),'standalone Transform assets must be available offline');
assert(transformCss.includes('position:fixed;inset:0'),'Transform must remain an isolated full-screen layer');

const pwaRuntime=read('pwa-runtime.js');
assert(index.includes('<script src="pwa-runtime.js"></script>'),'production must load PWA runtime');
assert(pwaRuntime.includes("updateViaCache: 'none'"),'service-worker update checks must bypass stale script cache');
assert(pwaRuntime.includes('registration.update()'),'loaded sessions must request a current service-worker check');
assert(pwaRuntime.includes("report('registration_failed',error)"),'PWA registration failures must reach runtime health diagnostics');

const forbiddenLargePrefixes=['data/library/','data/packs/bible/','data/packs/tagalog/','data/packs/questions/','data/packs/context/'];
for(const item of shell){if(item==='data/packs/context/manifest.json'||item==='data/packs/manifest.json')continue;assert(!forbiddenLargePrefixes.some(prefix=>item.startsWith(prefix)),`large/on-demand dataset must not be precached: ${item}`)}

const headers=read('_headers');
for(const header of ['X-Content-Type-Options: nosniff','Referrer-Policy: strict-origin-when-cross-origin','Permissions-Policy:','X-Frame-Options: SAMEORIGIN'])assert(headers.includes(header),`missing production security header: ${header}`);

console.log(`Reliability smoke passed: runtime health, Reader lifecycle, consolidated mobile contract, canonical external Transform runtime, ${shell.length} shell references, cache v${cacheVersion}.`);
