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
const shell=[...sw.matchAll(/'\.\/([^']+)'/g)].map(m=>m[1]);
const coreMatch=sw.match(/const CORE=\[([^\]]+)\]/);
const core=coreMatch?[...coreMatch[1].matchAll(/'\.\/([^']+)'/g)].map(m=>m[1]):[];
const cacheVersion=Number(sw.match(/const CACHE='biblequest-v(\d+)'/)?.[1]||0);

assert(cacheVersion>=50,`PWA cache must include standalone Transform baseline (v50+), got v${cacheVersion||'missing'}`);
for(const item of ['index.html','transform.html','styles.css','app.js','transform-launcher.js','transformation-v2.js','transformation-v2.css','pwa-runtime.js','onboarding-tutorial.js','manifest.webmanifest','app-icon.svg'])assert(core.includes(item),`required offline core missing: ${item}`);
assert(sw.includes('Promise.allSettled(optional.map'),'optional shell precache failures must not abort service-worker install');
assert(sw.includes("url.pathname.endsWith('/transform.html')?'./transform.html':'./index.html'"),'Transform navigation must have its own offline document fallback');
assert(sw.includes('self.skipWaiting()')&&sw.includes('self.clients.claim()'),'service worker must activate and claim promptly');

// The main BibleQuest SPA must not evaluate Transform's assessment runtime anymore.
assert(!index.includes('<script src="transformation-v2.js"></script>'),'main SPA must not directly load Transform assessment runtime');
assert(!index.includes('<link rel="stylesheet" href="transformation-v2.css">'),'main SPA must not directly load Transform styles');
assert(index.includes('<script src="transform-launcher.js"></script>'),'main SPA must load the isolated Transform launcher');
assert(launcher.includes("const TARGET='./transform.html'"),'Transform launcher must target the standalone document');
assert(launcher.includes("location.assign(new URL(TARGET,location.href).href)"),'Transform entry must navigate instead of mounting inside the main SPA');
assert(standalone.includes('<script src="transformation-v2.js"></script>'),'standalone document must load Transform v2');
assert(standalone.includes('<link rel="stylesheet" href="transformation-v2.css">'),'standalone document must load Transform styles');
assert(standalone.includes("window.BQ_TRANSFORMATION.open()"),'standalone document must explicitly initialize Transform');
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

console.log(`Reliability smoke passed: standalone Transform isolated from main SPA, ${shell.length} shell references, cache v${cacheVersion}.`);
