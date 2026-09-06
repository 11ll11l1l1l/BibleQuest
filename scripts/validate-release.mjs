import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>fs.existsSync(path.join(root,p));
const fail=msg=>{throw new Error(msg)};
const assert=(ok,msg)=>{if(!ok)fail(msg)};
function walk(dir,filter=()=>true){const out=[];for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())out.push(...walk(p,filter));else if(filter(p))out.push(p)}return out}
function run(cmd,args){execFileSync(cmd,args,{cwd:root,stdio:'inherit'})}
function localRefs(html){return [...[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]),...[...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map(m=>m[1])].filter(x=>!/^https?:/i.test(x)&&!x.startsWith('//')&&!x.startsWith('data:')&&!x.startsWith('#'))}
function cleanRef(ref){return ref.replace(/^\.\//,'').replace(/^\//,'').split(/[?#]/)[0]}
function validateHtmlEntry(file){
  const html=read(file);
  const refs=localRefs(html).map(cleanRef).filter(Boolean);
  for(const ref of refs)assert(exists(ref),`${file} references missing local file: ${ref}`);
  const duplicates=refs.filter((ref,i)=>refs.indexOf(ref)!==i);
  assert(!duplicates.length,`${file} contains duplicate script/style references: ${[...new Set(duplicates)].join(', ')}`);
  return {html,refs};
}

console.log('BibleQuest release validation');

const entries={};
for(const file of ['index.html','transform.html','psychometrics.html','admin.html','admin-operations.html','reset.html','content-review.html'])entries[file]=validateHtmlEntry(file);
const index=entries['index.html'].html;
const localRefsIndex=entries['index.html'].refs;
const standalone=entries['transform.html'].html;
const transformRuntime=read('transformation-v2.js');
const launcher=read('transform-launcher.js');
const browserSmoke=read('tests/browser-smoke.mjs');
const layoutSmoke=read('tests/layout-matrix-smoke.mjs');
const operationalSmoke=read('tests/operational-entry-smoke.mjs');
const navigationSmoke=read('tests/navigation-static-smoke.mjs');

assert(index.indexOf('mobile-production.css')>index.indexOf('release-hardening.css'),'mobile-production.css must load after release-hardening.css');
assert(index.indexOf('mobile-readability.css')>index.indexOf('mobile-production.css'),'mobile-readability.css must load after production mobile CSS');
assert(index.indexOf('home-professional.css')>index.indexOf('mobile-readability.css'),'home-professional.css must be the final Home/mobile visual correction');
assert(index.includes('<script src="transform-launcher.js"></script>'),'main SPA must load standalone Transform launcher');
assert(!index.includes('<script src="transformation-v2.js"></script>'),'main SPA must not evaluate Transform assessment runtime');
assert(!index.includes('<link rel="stylesheet" href="transformation-v2.css">'),'main SPA must not load Transform-specific CSS');
assert(!index.includes('security-center.js')&&!index.includes('security-center.css'),'retired Security & data surface must not be production-loaded');
assert(!index.includes('accessibility-runtime.js')&&!index.includes('accessibility-runtime.css'),'retired Accessibility settings surface must not be production-loaded');
assert(standalone.includes('<script src="transformation-v2.js"></script>'),'standalone Transform must load the isolated v2 runtime');
assert(transformRuntime.includes("window.BQ_TRANSFORMATION={")&&transformRuntime.includes("mode:'rebuilt-v2'"),'standalone Transform runtime must expose rebuilt-v2 source of truth');
assert(standalone.includes('<link rel="stylesheet" href="transformation-v2.css">'),'standalone Transform page must load rebuilt styles');
assert(launcher.includes("const TARGET='./transform'"),'Grow Transformation entry must target canonical /transform route');
assert(launcher.includes("const PSYCH_TARGET='./psychometrics'"),'Psychometrics entry must target canonical /psychometrics route');
assert(!exists('transform-disabled.marker'),'stale Transform quarantine marker must not exist');
assert(index.indexOf('runtime-safety.js')<index.indexOf('content-moderation-runtime.js')&&index.indexOf('content-moderation-runtime.js')<index.indexOf('app.js'),'content moderation must layer after doctrinal filtering and before app content');
console.log('✓ Production entry-point references: Home, Transform, Psychometrics, Admin, Admin Operations, Reset, Content Review');

const jsFiles=walk('.',p=>p.endsWith('.js')&&!p.includes('/node_modules/'));
for(const file of jsFiles)run(process.execPath,['--check',file]);
console.log(`✓ JavaScript syntax: ${jsFiles.length} files`);

const manifest=JSON.parse(read('manifest.webmanifest'));
assert(manifest.start_url==='.'||manifest.start_url==='./','manifest start_url must remain deployment-relative');
assert(manifest.scope==='./','manifest scope must remain ./');
assert(manifest.display==='standalone','manifest display must remain standalone');
assert(manifest.icons?.some(x=>x.src==='app-icon.svg'),'manifest must include app-icon.svg');
console.log('✓ PWA manifest');

const sw=read('sw.js');
const shell=[...sw.matchAll(/'\.\/([^']+)'/g)].map(m=>m[1]);
for(const item of shell)assert(exists(item),`service worker caches missing file: ${item}`);
const indexShellRefs=localRefsIndex.filter(x=>/\.(?:js|css|webmanifest|svg|webp)$/i.test(x));
for(const item of indexShellRefs)assert(shell.includes(item),`service worker shell missing index asset: ${item}`);
const cacheVersion=Number(sw.match(/const CACHE='biblequest-v(\d+)'/)?.[1]||0);
assert(cacheVersion>=75,'service worker cache must include canonical-route repair v75+');
for(const item of ['transform.html','transform-launcher.js','transformation-v2.js','transformation-v2.css','psychometrics.html','content-review.html','content-review.css','content-review.js','admin.html','admin-operations.html','content-moderation-runtime.js','content-report.js','content-review-link.js','congregation-recognition.js','guest-access-hardening.js','mobile-readability.css','home-professional.css'])assert(shell.includes(item),`service worker shell missing production asset: ${item}`);
assert(sw.includes('const REQUIRED_CACHE_TIMEOUT_MS=8000'),'required install shell must have a finite timeout');
assert(sw.includes('const OPTIONAL_CACHE_TIMEOUT_MS=12000'),'optional install shell must have a finite timeout');
assert(sw.includes('Promise.all(INSTALL_REQUIRED.map(item=>cacheWithTimeout(cache,item,REQUIRED_CACHE_TIMEOUT_MS,true)))'),'required PWA assets must fail closed without hanging indefinitely');
assert(sw.includes('Promise.allSettled(optional.map(item=>cacheWithTimeout(cache,item,OPTIONAL_CACHE_TIMEOUT_MS,false)))'),'optional PWA assets must fail independently');
assert(sw.includes('const isTransformNavigation=/\\/transform(?:\\.html)?\\/?$/.test(url.pathname)'),'service worker must recognize both /transform and /transform.html');
assert(sw.includes('const isContentReviewNavigation=/\\/content-review(?:\\.html)?\\/?$/.test(url.pathname)'),'service worker must preserve the standalone Content Review fallback');
assert(sw.includes('function canonicalHtmlNavigation(url)')&&sw.includes('Response.redirect(canonical,302)'),'service worker must normalize stale .html navigations before network-first handling');
assert(sw.includes('self.skipWaiting()')&&sw.includes('self.clients.claim()'),'PWA update must activate and claim promptly');
console.log(`✓ Service worker coverage/install bounds/canonical routes · cache v${cacheVersion}`);

const redirects=read('_redirects');
for(const row of ['/index.html / 301','/transform.html /transform 301','/psychometrics.html /psychometrics 301','/admin.html /admin 301','/admin-operations.html /admin-operations 301','/content-review.html /content-review 301'])assert(redirects.includes(row),`Cloudflare redirect missing: ${row}`);
assert(navigationSmoke.includes('Broken static HTML navigation/assets'),'navigation static smoke must crawl ordinary href/src/action references');
console.log('✓ Cloudflare canonical redirects and static link crawler');

for(const legacy of ['transform-quarantine.js','transformation-safe.js','transformation-state-guard.js','transformation.js','transformation-taglish.js','operational-hardening.js'])assert(!index.includes(`<script src="${legacy}"></script>`),`retired runtime must not be production-loaded: ${legacy}`);
assert(transformRuntime.includes("const STORE='biblequest_transform_v2'"),'Transform must use isolated local storage');
assert(!transformRuntime.includes('MutationObserver'),'Transform must not use MutationObserver');
assert(transformRuntime.includes("root.addEventListener('click'"),'Transform interactions must remain root-scoped');
assert((transformRuntime.match(/\['[EACSO]\d'/g)||[]).length===20,'Transform must contain exactly 20 personality items');
assert(transformRuntime.includes('Thinking Patterns Check')&&transformRuntime.includes('Reflection & Action Plan')&&transformRuntime.includes('Private Reflection Journal'),'Transform personal-development surfaces missing');
console.log('✓ Isolated standalone Transform runtime and content');

const mobileCss=read('mobile-production.css');
const mobileReadability=read('mobile-readability.css');
const homePolish=read('home-professional.css');
assert(mobileCss.includes('@media(max-width:360px)'),'360px phones require an explicit compact layout');
assert(mobileCss.includes('journey-path-card{order:-30}'),'Bible path must remain ahead of optional season on Home');
assert(mobileReadability.includes('grid-template-columns: repeat(4, minmax(0, 1fr))'),'mobile readability layer must match the four actual bottom tabs');
assert(homePolish.includes('body.bq-modern-home .modern-hubs'),'final Home polish must explicitly style Explore');
assert(homePolish.includes('[data-kids-games]'),'Kids Games must remain visually secondary to BibleQuest core hubs');
assert(browserSmoke.includes('geometry.nav.length,4'),'primary browser smoke must guard the four-tab production nav');
assert(browserSmoke.includes("locator('[data-modern-hub]').count(),4"),'primary browser smoke must count only four core Explore hubs');
assert(!browserSmoke.includes('bq-transform-overlay'),'primary browser smoke must not restore retired same-page Transform assumptions');
assert(browserSmoke.includes('canonical standalone transformation')&&browserSmoke.includes('window.BQ_TRANSFORMATION.open()'),'primary browser smoke must exercise the canonical standalone Transform route');
assert(layoutSmoke.includes('for(const width of [320,360,390,412,430])'),'layout matrix must cover required narrow-phone widths');
assert(layoutSmoke.includes('geometry.nav.length,4'),'layout matrix must guard four bottom destinations');
assert(layoutSmoke.includes('primaryHeight>=44')&&layoutSmoke.includes('pathLabelFont>=9'),'layout matrix must guard practical touch targets and critical label readability');
assert(operationalSmoke.includes("keyboard.press('Escape')"),'Transform operational smoke must exercise Escape return');
assert(operationalSmoke.includes('[data-t2-reader]')&&operationalSmoke.includes('[data-t2-wisdom]'),'Transform operational smoke must exercise Reader and Wisdom return actions');
assert(operationalSmoke.includes('bq_transform_return_action'),'Transform return actions must be verified as one-shot state');
assert(operationalSmoke.includes("==='/transform'"),'operational smoke must verify canonical Transform URL');
console.log('✓ Professional Home hierarchy and executable browser-smoke guards');

const cloud=read('cloud-config.js');
assert(cloud.includes("publishableKey: 'sb_publishable_"),'cloud config must use a publishable key');
assert(!/service[_-]?role|sb_secret_/i.test(cloud),'privileged Supabase credential marker found in browser cloud config');
assert(cloud.includes("authMode: 'email-password'"),'production auth mode must remain email-password');
console.log('✓ Browser cloud configuration');

const workflows=walk('.github/workflows',p=>/\.ya?ml$/i.test(p));
for(const file of workflows){const yml=read(file);assert(/\bworkflow_dispatch\s*:/.test(yml),`${file} must be manual-dispatch capable`);for(const trigger of ['push','pull_request','schedule','workflow_run','repository_dispatch']){const re=new RegExp(`^\\s{2}${trigger}\\s*:`, 'm');assert(!re.test(yml),`${file} contains forbidden automatic trigger: ${trigger}`)}}
console.log(`✓ GitHub Actions manual-only policy: ${workflows.length} workflows`);

for(const required of ['reset.html','reset.js','password-recovery.js','admin.html','admin.js','admin-link.js','admin-operations.html','admin-operations.js','guest-access-hardening.js','transform.html','transform-launcher.js','transformation-v2.js','transformation-v2.css','psychometrics.html','psychometrics-suite.js','content-review.html','content-review.css','content-review.js','content-moderation-runtime.js','content-report.css','content-report.js','content-review-link.js','congregation-recognition.css','congregation-recognition.js','mobile-readability.css','home-professional.css','tests/browser-smoke.mjs','tests/layout-matrix-smoke.mjs','tests/operational-entry-smoke.mjs','tests/navigation-static-smoke.mjs','tests/content-review-static-smoke.mjs','tests/congregation-recognition-static-smoke.mjs','LICENSE','THIRD_PARTY_NOTICES.md','_headers','_redirects','SHARED_SUPABASE.md','supabase/functions/bq-admin/index.ts','supabase/functions/bq-signup/index.ts','supabase/functions/bq-password-reset/index.ts','supabase/migrations/20260905_account_recovery_code_v2.sql','supabase/migrations/20260905_content_review_and_reports.sql','supabase/migrations/20260905_content_reviewer_member_read.sql'])assert(exists(required),`required release file missing: ${required}`);
console.log('✓ Required release assets');

const contextManifest=JSON.parse(read('data/packs/context/manifest.json'));
assert(contextManifest.books?.length===66,`expected 66 Bible context packs, got ${contextManifest.books?.length||0}`);
for(const row of contextManifest.books)assert(row.code&&row.path&&exists(row.path),`invalid/missing context pack: ${row.code||'unknown'}`);
console.log('✓ 66-book context pack');

const discoveredStatic=walk('tests',p=>p.endsWith('.mjs')&&path.basename(p).includes('static'));
const staticTests=[...new Set(['tests/reliability-smoke.mjs',...discoveredStatic])].sort();
for(const test of staticTests){assert(exists(test),`static regression test missing: ${test}`);run(process.execPath,[test])}
console.log(`✓ Auto-discovered cross-feature static regression suite: ${staticTests.length} tests`);

const packManifest=JSON.parse(read('data/packs/manifest.json'));
const doctrinalRuntime=read('data/doctrinal-safety.js');
const doctrinalRuntimeVersion=Number(doctrinalRuntime.match(/const VERSION=(\d+)/)?.[1]||0);
assert(doctrinalRuntimeVersion>0,'could not resolve runtime doctrinal safety version');
assert(Number(packManifest.doctrinal_safety_version)===doctrinalRuntimeVersion,`DOCTRINAL RELEASE BLOCKER: generated pack policy v${packManifest.doctrinal_safety_version} does not match runtime policy v${doctrinalRuntimeVersion}`);
run(process.execPath,['scripts/verify-safety-smoke.js']);
run(process.execPath,['scripts/content-audit.js']);
run(process.execPath,['scripts/doctrinal-audit.js']);
console.log('✓ Doctrinal/content audits and policy-version alignment');

run('python3',['-m','py_compile','scripts/apply-doctrinal-safety.py','scripts/build_content_pack.py','scripts/build_story_packs.py','scripts/build_tagalog_packs.py','scripts/build_original_language_packs.py']);
console.log('✓ Python content tooling syntax');

const sensitiveBrowserFiles=['cloud-config.js','account.js','guest-access-hardening.js','password-recovery.js','admin-link.js','admin.js','signup-enhancements.js','cloud.js','congregation-recognition.js','content-moderation-runtime.js','content-report.js','content-review-link.js','content-review.js','live-rooms.js','innovation-suite.js','workspace.js','couple-cloud.js','context-lab.js','assignment-center.js','assignment-push.js','presence.js','avatar-vault.js','journey-groups.js','journey-loop.js','journey-cloud-sync.js','engagement-v3.js','frontpage-daily.js','release-hardening.js','mobile-production.js','reset.js','japanese-learning.js','transform-launcher.js','media-library.js'];
for(const file of sensitiveBrowserFiles){const text=read(file);assert(!/SUPABASE_SERVICE_ROLE_KEY|sb_secret_/i.test(text),`privileged secret marker found in browser file: ${file}`)}
console.log('✓ Browser secret invariants');

console.log('\nBibleQuest release validation passed.');
