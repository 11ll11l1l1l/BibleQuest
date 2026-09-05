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
const css=read('transformation-v2.css');
const mobileReadability=read('mobile-readability.css');
const shell=[...sw.matchAll(/'\.\/([^']+)'/g)].map(m=>m[1]);
const coreMatch=sw.match(/const CORE=\[([^\]]+)\]/);
const core=coreMatch?[...coreMatch[1].matchAll(/'\.\/([^']+)'/g)].map(m=>m[1]):[];
const cacheVersion=Number(sw.match(/const CACHE='biblequest-v(\d+)'/)?.[1]||0);

assert(cacheVersion>=52,`PWA cache must include standalone Transform + mobile readability baseline (v52+), got v${cacheVersion||'missing'}`);
for(const item of ['index.html','transform.html','styles.css','mobile-readability.css','app.js','transform-launcher.js','transformation-v2.js','transformation-v2.css','pwa-runtime.js','onboarding-tutorial.js','manifest.webmanifest','app-icon.svg'])assert(core.includes(item),`required offline core missing: ${item}`);
assert(sw.includes('Promise.allSettled(optional.map'),'optional shell precache failures must not abort service-worker install');
assert(sw.includes("url.pathname.endsWith('/transform.html')?'./transform.html':'./index.html'"),'Transform navigation must have its own offline document fallback');
assert(sw.includes('self.skipWaiting()')&&sw.includes('self.clients.claim()'),'service worker must activate and claim promptly');

// Narrow-phone production guards. The base app currently renders exactly four
// bottom tabs; the mobile override must not squeeze them into a five-column grid.
assert(index.includes('<link rel="stylesheet" href="mobile-readability.css">'),'production must load the narrow-phone readability correction');
assert(index.indexOf('mobile-readability.css')>index.indexOf('mobile-production.css'),'mobile readability correction must load after the production mobile sheet');
assert(shell.includes('mobile-readability.css')&&core.includes('mobile-readability.css'),'mobile readability correction must be available in the installed PWA core');
assert(mobileReadability.includes('grid-template-columns: repeat(4, minmax(0, 1fr))'),'phone bottom navigation must match the four production tabs');
assert(/\.navbtn\s*\{[\s\S]*?min-height:\s*54px[\s\S]*?font-size:\s*11px/.test(mobileReadability),'phone navigation must retain readable labels and a practical touch target');
assert(/\.bq-engagement-home \.journey-primary\s*\{[\s\S]*?font-size:\s*14px[\s\S]*?min-height:\s*46px/.test(mobileReadability),'Daily Journey primary CTA must remain readable and touchable on phones');
assert(/\.journey-node small\s*\{\s*font-size:\s*9px/.test(mobileReadability),'journey path support labels must not regress to the old 6px production size');

// The main BibleQuest SPA must not evaluate Transform's assessment runtime anymore.
assert(!index.includes('<script src="transformation-v2.js"></script>'),'main SPA must not directly load Transform assessment runtime');
assert(!index.includes('<link rel="stylesheet" href="transformation-v2.css">'),'main SPA must not directly load Transform styles');
assert(index.includes('<script src="transform-launcher.js"></script>'),'main SPA must load the isolated Transform launcher');
assert(launcher.includes("const TARGET='./transform.html'"),'Transform launcher must target the standalone document');
assert(launcher.includes("location.assign(new URL(TARGET,location.href).href)"),'Transform entry must navigate instead of mounting inside the main SPA');
assert(launcher.includes("window.BQ_TRANSFORMATION={open:openStandalone,mode:'standalone-route',version:2}"),'Grow callback must retain a fail-safe Transform API instead of silently no-oping');
assert(standalone.includes('<script src="transformation-v2.js"></script>'),'standalone document must load Transform v2');
assert(standalone.includes('<link rel="stylesheet" href="transformation-v2.css">'),'standalone document must load Transform styles');
assert(standalone.includes("window.BQ_TRANSFORMATION.open()"),'standalone document must explicitly initialize Transform');
assert(standalone.includes("if(event.key!=='Escape')return"),'standalone Escape must return to BibleQuest instead of leaving a blank Transform document');
assert(standalone.includes("sessionStorage.setItem('bq_transform_return_action',action)"),'Reader/Wisdom exits must preserve a return action for the main app');
for(const legacy of ['transform-quarantine.js','transformation-safe.js','transformation-state-guard.js','transformation.js','transformation-taglish.js','operational-hardening.js'])assert(!index.includes(`<script src="${legacy}"></script>`),`retired runtime must not be production-loaded: ${legacy}`);
assert(shell.includes('transform.html')&&shell.includes('transform-launcher.js')&&shell.includes('transformation-v2.js')&&shell.includes('transformation-v2.css'),'standalone Transform assets must be available offline');

assert(transform.includes("mode:'rebuilt-v2'"),'Transform must expose rebuilt-v2 runtime marker');
assert(transform.includes("const VERSION=2"),'Transform must use explicit versioned local state');
assert(transform.includes("const STORE='biblequest_transform_v2'"),'Transform must isolate rebuilt state from legacy storage');
assert(!transform.includes('MutationObserver'),'rebuilt Transform must not use MutationObserver');
assert(!transform.includes("document.addEventListener('click'"),'rebuilt Transform must not install a document-wide click interceptor');
assert(!transform.includes("window.addEventListener('error'"),'rebuilt Transform must not install global error interception');
assert(transform.includes("root.addEventListener('click',onClick)"),'Transform event handling must stay scoped to its own root');
assert(transform.includes('20-item Big Five reflection'),'Personality assessment must remain part of rebuilt Transform');
assert(transform.includes('Thinking Patterns Check'),'Thinking-pattern reflection must remain part of rebuilt Transform');
assert(transform.includes('Reflection & Action Plan'),'personal-development plan must remain part of rebuilt Transform');
assert(transform.includes('Private Reflection Journal'),'private reflection journal must remain part of rebuilt Transform');
assert((transform.match(/\['[EACSO]\d'/g)||[]).length===20,'Transform must retain exactly 20 personality items');
assert(css.includes('position:fixed;inset:0'),'Transform must remain an isolated full-screen layer');
assert(css.includes('@media(max-width:360px)'),'Transform must explicitly support narrow phones');

const pwaRuntime=read('pwa-runtime.js');
assert(index.includes('<script src="pwa-runtime.js"></script>'),'production must load PWA runtime');
assert(pwaRuntime.includes("updateViaCache: 'none'"),'service-worker update checks must bypass stale script cache');
assert(pwaRuntime.includes('registration.update()'),'loaded sessions must request a current service-worker check');

const forbiddenLargePrefixes=['data/library/','data/packs/bible/','data/packs/tagalog/','data/packs/questions/','data/packs/context/'];
for(const item of shell){if(item==='data/packs/context/manifest.json'||item==='data/packs/manifest.json')continue;assert(!forbiddenLargePrefixes.some(prefix=>item.startsWith(prefix)),`large/on-demand dataset must not be precached: ${item}`)}

const headers=read('_headers');
for(const header of ['X-Content-Type-Options: nosniff','Referrer-Policy: strict-origin-when-cross-origin','Permissions-Policy:','X-Frame-Options: SAMEORIGIN'])assert(headers.includes(header),`missing production security header: ${header}`);

console.log(`Reliability smoke passed: standalone Transform isolated, phone readability guarded, ${shell.length} shell references, cache v${cacheVersion}.`);
