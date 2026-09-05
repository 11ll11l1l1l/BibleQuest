import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const fail=msg=>{throw new Error(msg)};
const assert=(ok,msg)=>{if(!ok)fail(msg)};

const sw=read('sw.js');
const index=read('index.html');
const transform=read('transformation-v2.js');
const css=read('transformation-v2.css');
const shell=[...sw.matchAll(/'\.\/([^']+)'/g)].map(m=>m[1]);
const coreMatch=sw.match(/const CORE=\[([^\]]+)\]/);
const core=coreMatch?[...coreMatch[1].matchAll(/'\.\/([^']+)'/g)].map(m=>m[1]):[];
const cacheVersion=Number(sw.match(/const CACHE='biblequest-v(\d+)'/)?.[1]||0);

assert(cacheVersion>=49,`PWA cache must include rebuilt Transform v2 baseline (v49+), got v${cacheVersion||'missing'}`);
for(const item of ['index.html','styles.css','app.js','transformation-v2.js','transformation-v2.css','pwa-runtime.js','onboarding-tutorial.js','manifest.webmanifest','app-icon.svg'])assert(core.includes(item),`required offline core missing: ${item}`);
assert(sw.includes('Promise.allSettled(optional.map'),'optional shell precache failures must not abort service-worker install');
assert(sw.includes("networkFirst(e.request,'./index.html')"),'navigations must stay network-first with offline fallback');
assert(sw.includes('self.skipWaiting()')&&sw.includes('self.clients.claim()'),'service worker must activate and claim promptly');

assert(index.includes('<script src="transformation-v2.js"></script>'),'production must load rebuilt Transform v2');
assert(index.includes('<link rel="stylesheet" href="transformation-v2.css">'),'production must load rebuilt Transform v2 styles');
for(const legacy of ['transform-quarantine.js','transformation-safe.js','transformation-state-guard.js','transformation.js','transformation-taglish.js'])assert(!index.includes(`<script src="${legacy}"></script>`),`retired Transform runtime must not be production-loaded: ${legacy}`);
for(const legacy of ['transform-quarantine.css','transformation-safe.css','transformation.css','transformation-taglish.css'])assert(!index.includes(`<link rel="stylesheet" href="${legacy}">`),`retired Transform styles must not be production-loaded: ${legacy}`);
assert(shell.includes('transformation-v2.js')&&shell.includes('transformation-v2.css'),'Transform v2 must be available offline');
for(const legacy of ['transform-quarantine.js','transformation-safe.js','transformation-state-guard.js','transformation.js','transformation-taglish.js'])assert(!shell.includes(legacy),`retired Transform runtime must stay out of active PWA shell: ${legacy}`);

assert(transform.includes("mode:'rebuilt-v2'"),'Transform must expose rebuilt-v2 runtime marker');
assert(transform.includes("const VERSION=2"),'Transform must use explicit versioned local state');
assert(transform.includes("const STORE='biblequest_transform_v2'"),'Transform must isolate rebuilt state from legacy storage');
assert(!transform.includes('MutationObserver'),'rebuilt Transform must not use MutationObserver');
assert(!transform.includes("document.addEventListener('click'"),'rebuilt Transform must not install a document-wide click interceptor');
assert(!transform.includes("window.addEventListener('error'"),'rebuilt Transform must not install global error interception');
assert(transform.includes("root.addEventListener('click',onClick)"),'Transform event handling must stay scoped to its own root');
assert(transform.includes("root.addEventListener('keydown'"),'Transform must have scoped keyboard close support');
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

console.log(`Reliability smoke passed: rebuilt Transform v2 isolated, ${shell.length} shell references, cache v${cacheVersion}.`);
