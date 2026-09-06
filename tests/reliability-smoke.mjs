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
const modernHome=read('modern-home.js');
const pwaRuntime=read('pwa-runtime.js');
const headers=read('_headers');
const redirects=read('_redirects');
const shell=[...sw.matchAll(/'\.\/([^']+)'/g)].map(m=>m[1]);
const coreMatch=sw.match(/const CORE=\[([^\]]+)\]/);
const core=coreMatch?[...coreMatch[1].matchAll(/'\.\/([^']+)'/g)].map(m=>m[1]):[];
const cacheVersion=Number(sw.match(/const CACHE='biblequest-v(\d+)'/)?.[1]||0);

assert(cacheVersion>=75,`PWA cache must include canonical-route repair (v75+), got v${cacheVersion||'missing'}`);
for(const item of ['index.html','transform.html','styles.css','mobile-readability.css','home-professional.css','app.js','guest-access-hardening.js','transform-launcher.js','transformation-v2.js','transformation-v2.css','pwa-runtime.js','onboarding-tutorial.js','manifest.webmanifest','app-icon.svg'])assert(core.includes(item),`required offline core missing: ${item}`);
assert(sw.includes('const REQUIRED_CACHE_TIMEOUT_MS=8000'),'required shell caching needs a finite timeout');
assert(sw.includes('const OPTIONAL_CACHE_TIMEOUT_MS=12000'),'optional shell caching needs a finite timeout');
assert(sw.includes('Promise.all(INSTALL_REQUIRED.map(item=>cacheWithTimeout(cache,item,REQUIRED_CACHE_TIMEOUT_MS,true)))'),'required shell failures must block install without hanging indefinitely');
assert(sw.includes('Promise.allSettled(optional.map(item=>cacheWithTimeout(cache,item,OPTIONAL_CACHE_TIMEOUT_MS,false)))'),'optional shell failures must remain non-fatal');
assert(sw.includes('const isTransformNavigation=/\\/transform(?:\\.html)?\\/?$/.test(url.pathname)')&&sw.includes("fallback=isTransformNavigation?'./transform.html'"),'Transform navigation must have its own offline document fallback');
assert(sw.includes('function canonicalHtmlNavigation(url)')&&sw.includes('Response.redirect(canonical,302)'),'controlled stale .html navigations must normalize before network-first handling');
assert(sw.includes('self.skipWaiting()')&&sw.includes('self.clients.claim()'),'service worker must activate and claim promptly');
for(const row of ['/transform.html /transform 301','/admin.html /admin 301','/content-review.html /content-review 301'])assert(redirects.includes(row),`Cloudflare compatibility redirect missing: ${row}`);

assert(index.includes('<link rel="stylesheet" href="mobile-readability.css">'),'production must load the narrow-phone readability correction');
assert(index.includes('<link rel="stylesheet" href="home-professional.css">'),'production must load final Home polish');
assert(index.indexOf('mobile-readability.css')>index.indexOf('mobile-production.css'),'mobile readability correction must load after production mobile CSS');
assert(index.indexOf('home-professional.css')>index.indexOf('mobile-readability.css'),'professional Home polish must load last among Home/mobile CSS');
assert(shell.includes('mobile-readability.css')&&core.includes('mobile-readability.css'),'mobile readability correction must be available offline');
assert(shell.includes('home-professional.css')&&core.includes('home-professional.css'),'professional Home polish must be available offline');
assert(mobileReadability.includes('grid-template-columns: repeat(4, minmax(0, 1fr))'),'phone bottom navigation must match the four production tabs');
assert(/\.navbtn\s*\{[\s\S]*?min-height:\s*54px[\s\S]*?font-size:\s*12px/.test(mobileReadability),'phone navigation must retain readable labels and practical touch targets');
assert(/\.bq-engagement-home \.journey-primary\s*\{[\s\S]*?font-size:\s*14px[\s\S]*?min-height:\s*46px/.test(mobileReadability),'Daily Journey CTA must remain readable/touchable');
assert(/\.journey-node small\s*\{\s*font-size:\s*11px/.test(mobileReadability),'journey support labels must not regress to the old tiny size');

assert(!index.includes('security-center.js')&&!index.includes('security-center.css'),'retired Security & data surface must not load');
assert(!index.includes('accessibility-runtime.js')&&!index.includes('accessibility-runtime.css'),'retired Accessibility settings surface must not load');

assert(modernHome.includes('function featureFailure(label,retry)'),'Home hubs need a shared recoverable failure surface');
assert(modernHome.includes('class="modern-feature-failure" role="alert"'),'feature-entry failure must be visible');
assert(modernHome.includes("result.catch(()=>featureFailure(label,retry))"),'async feature rejection must degrade visibly');
assert(!/window\.BQ[A-Za-z0-9_]+\?\.open\?\.\(\)/.test(modernHome),'Home hubs must not restore silent optional-chain .open() calls');

assert(!index.includes('<script src="transformation-v2.js"></script>'),'main SPA must not directly load Transform assessment runtime');
assert(!index.includes('<link rel="stylesheet" href="transformation-v2.css">'),'main SPA must not directly load Transform styles');
assert(index.includes('<script src="transform-launcher.js"></script>'),'main SPA must load isolated Transform launcher');
assert(launcher.includes("const TARGET='./transform'"),'Transform launcher must target canonical standalone route');
assert(launcher.includes("const PSYCH_TARGET='./psychometrics'"),'Psychometrics launcher must target canonical standalone route');
assert(launcher.includes("mode:'standalone-route',version:5"),'Grow callback must expose current standalone Transform v5 launcher');
assert(standalone.includes('<script src="transformation-v2.js"></script>'),'standalone Transform must load v2 runtime');
assert(standalone.includes('<link rel="stylesheet" href="transformation-v2.css">'),'standalone Transform must load rebuilt styles');
assert(standalone.includes("window.BQ_TRANSFORMATION.open()"),'standalone Transform must initialize explicitly');
assert(standalone.includes("if(event.key!=='Escape')return"),'Escape must return from standalone Transform');
assert(standalone.includes("sessionStorage.setItem(RETURN_KEY,action)"),'Reader/Wisdom exits must preserve return action');
for(const legacy of ['transform-quarantine.js','transformation-safe.js','transformation-state-guard.js','transformation.js','transformation-taglish.js','operational-hardening.js'])assert(!index.includes(`<script src="${legacy}"></script>`),`retired runtime must not be production-loaded: ${legacy}`);
assert(shell.includes('transform.html')&&shell.includes('transform-launcher.js')&&shell.includes('transformation-v2.js')&&shell.includes('transformation-v2.css'),'standalone Transform assets must be available offline');
assert(transform.includes("mode:'rebuilt-v2'")&&transform.includes("const VERSION=2")&&transform.includes("const STORE='biblequest_transform_v2'"),'Transform rebuilt-v2 state contract changed');
assert(!transform.includes('MutationObserver')&&!transform.includes("document.addEventListener('click'")&&!transform.includes("window.addEventListener('error'"),'Transform must stay scoped and avoid global interception');
assert(transform.includes("root.addEventListener('click',onClick)"),'Transform interactions must stay root-scoped');
assert(transform.includes('20-item Big Five reflection')&&transform.includes('Thinking Patterns Check')&&transform.includes('Reflection & Action Plan')&&transform.includes('Private Reflection Journal'),'Transform content surfaces missing');
assert((transform.match(/\['[EACSO]\d'/g)||[]).length===20,'Transform must retain exactly 20 personality items');
assert(css.includes('position:fixed;inset:0')&&css.includes('@media(max-width:360px)'),'Transform must remain isolated and narrow-phone aware');

assert(index.includes('<script src="pwa-runtime.js"></script>'),'production must load PWA runtime');
assert(pwaRuntime.includes(`bq_sw_controller_reload_v${cacheVersion}`),'PWA controller reload flag must match cache version');
assert(pwaRuntime.includes("updateViaCache:'none'")||pwaRuntime.includes("updateViaCache: 'none'"),'loaded sessions must bypass service-worker script cache');
assert(pwaRuntime.includes('registration.update()'),'loaded sessions must request a fresh service-worker check');

const forbiddenLargePrefixes=['data/library/','data/packs/bible/','data/packs/tagalog/','data/packs/questions/','data/packs/context/'];
for(const item of shell){if(item==='data/packs/context/manifest.json'||item==='data/packs/manifest.json')continue;assert(!forbiddenLargePrefixes.some(prefix=>item.startsWith(prefix)),`large/on-demand dataset must not be precached: ${item}`)}
for(const header of ['X-Content-Type-Options: nosniff','Referrer-Policy: strict-origin-when-cross-origin','Permissions-Policy:','X-Frame-Options: SAMEORIGIN'])assert(headers.includes(header),`missing production security header: ${header}`);

console.log(`Reliability smoke passed: canonical routes repaired, retired utility panels unloaded, Home polish cached, PWA install bounded, cache v${cacheVersion}.`);
