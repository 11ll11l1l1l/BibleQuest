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

console.log('BibleQuest release validation');

const index=read('index.html');
const localRefs=[...[...index.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]),...[...index.matchAll(/<link[^>]+href="([^"]+)"/g)].map(m=>m[1])].filter(x=>!/^https?:/i.test(x)&&!x.startsWith('data:')&&!x.startsWith('#'));
for(const ref of localRefs){const clean=ref.replace(/^\.\//,'').split(/[?#]/)[0];assert(exists(clean),`index.html references missing file: ${clean}`)}
assert(index.indexOf('mobile-production.css')>index.indexOf('release-hardening.css'),'mobile-production.css must load after release-hardening.css');
assert(index.indexOf('transformation-v2.js')<index.indexOf('modern-home.js'),'Transform API must exist before Grow menu can call it');
console.log('✓ Production entry-point references');

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
const indexShellRefs=localRefs.map(x=>x.replace(/^\.\//,'').split(/[?#]/)[0]).filter(x=>/\.(?:js|css|webmanifest|svg|webp)$/i.test(x));
for(const item of indexShellRefs)assert(shell.includes(item),`service worker shell missing index asset: ${item}`);
const cacheVersion=Number(sw.match(/const CACHE='biblequest-v(\d+)'/)?.[1]||0);
assert(cacheVersion>=49,'service worker cache must include rebuilt Transform v2');
assert(sw.includes('self.skipWaiting()')&&sw.includes('self.clients.claim()'),'PWA update must activate and claim promptly');
console.log(`✓ Service worker coverage · cache v${cacheVersion}`);

const transform=read('transformation-v2.js');
assert(index.includes('<script src="transformation-v2.js"></script>'),'rebuilt Transform v2 must be production-loaded');
assert(index.includes('<link rel="stylesheet" href="transformation-v2.css">'),'rebuilt Transform v2 styles must be production-loaded');
for(const legacy of ['transform-quarantine.js','transformation-safe.js','transformation-state-guard.js','transformation.js','transformation-taglish.js','operational-hardening.js'])assert(!index.includes(`<script src="${legacy}"></script>`),`retired runtime must not be production-loaded: ${legacy}`);
assert(transform.includes("mode:'rebuilt-v2'"),'Transform v2 runtime marker missing');
assert(transform.includes("const STORE='biblequest_transform_v2'"),'Transform v2 must use fresh isolated storage');
assert(!transform.includes('MutationObserver'),'Transform v2 must not use MutationObserver');
assert(!transform.includes("document.addEventListener('click'"),'Transform v2 must not intercept document-wide clicks');
assert(transform.includes("root.addEventListener('click',onClick)"),'Transform interactions must remain root-scoped');
assert((transform.match(/\['[EACSO]\d'/g)||[]).length===20,'Transform must contain exactly 20 personality items');
assert(transform.includes('Thinking Patterns Check')&&transform.includes('Reflection & Action Plan')&&transform.includes('Private Reflection Journal'),'Transform personal-development surfaces missing');
console.log('✓ Rebuilt Transform v2 isolation and content');

const mobileCss=read('mobile-production.css');
assert(mobileCss.includes('@media(max-width:360px)'),'360px phones require an explicit compact layout');
assert(mobileCss.includes('journey-path-card{order:-30}'),'Bible path must remain ahead of optional season on Home');
console.log('✓ Mobile hierarchy guards');

const cloud=read('cloud-config.js');
assert(cloud.includes("publishableKey: 'sb_publishable_"),'cloud config must use a publishable key');
assert(!/service[_-]?role|sb_secret_/i.test(cloud),'privileged Supabase credential marker found in browser cloud config');
assert(cloud.includes("authMode: 'email-password'"),'production auth mode must remain email-password');
console.log('✓ Browser cloud configuration');

const workflows=walk('.github/workflows',p=>/\.ya?ml$/i.test(p));
for(const file of workflows){const yml=read(file);assert(/\bworkflow_dispatch\s*:/.test(yml),`${file} must be manual-dispatch capable`);for(const trigger of ['push','pull_request','schedule','workflow_run','repository_dispatch']){const re=new RegExp(`^\\s{2}${trigger}\\s*:`, 'm');assert(!re.test(yml),`${file} contains forbidden automatic trigger: ${trigger}`)}}
console.log(`✓ GitHub Actions manual-only policy: ${workflows.length} workflows`);

for(const required of ['reset.html','reset.js','password-recovery.js','admin.html','admin.js','admin-link.js','transformation-v2.js','transformation-v2.css','tests/operational-entry-smoke.mjs','LICENSE','THIRD_PARTY_NOTICES.md','_headers','SHARED_SUPABASE.md','supabase/functions/bq-admin/index.ts','supabase/functions/bq-signup/index.ts','supabase/functions/bq-password-reset/index.ts','supabase/migrations/20260905_account_recovery_code_v2.sql'])assert(exists(required),`required release file missing: ${required}`);
console.log('✓ Required release assets');

const contextManifest=JSON.parse(read('data/packs/context/manifest.json'));
assert(contextManifest.books?.length===66,`expected 66 Bible context packs, got ${contextManifest.books?.length||0}`);
for(const row of contextManifest.books){assert(row.code&&row.path&&exists(row.path),`invalid/missing context pack: ${row.code||'unknown'}`)}
console.log('✓ 66-book context pack');

run(process.execPath,['tests/reliability-smoke.mjs']);
run(process.execPath,['tests/auth-flow-static-smoke.mjs']);
console.log('✓ Reliability/auth static regression guards');

run(process.execPath,['scripts/verify-safety-smoke.js']);
run(process.execPath,['scripts/content-audit.js']);
run(process.execPath,['scripts/doctrinal-audit.js']);
console.log('✓ Doctrinal/content audits');

run('python3',['-m','py_compile','scripts/apply-doctrinal-safety.py','scripts/build_content_pack.py','scripts/build_story_packs.py','scripts/build_tagalog_packs.py','scripts/build_original_language_packs.py']);
console.log('✓ Python content tooling syntax');

const sensitiveBrowserFiles=['cloud-config.js','account.js','password-recovery.js','admin-link.js','admin.js','signup-enhancements.js','cloud.js','live-rooms.js','innovation-suite.js','workspace.js','couple-cloud.js','context-lab.js','assignment-center.js','assignment-push.js','presence.js','avatar-vault.js','journey-groups.js','journey-loop.js','journey-cloud-sync.js','engagement-v3.js','frontpage-daily.js','release-hardening.js','mobile-production.js','reset.js','japanese-learning.js','transformation-v2.js'];
for(const file of sensitiveBrowserFiles){const text=read(file);assert(!/SUPABASE_SERVICE_ROLE_KEY|sb_secret_/i.test(text),`privileged secret marker found in browser file: ${file}`)}
console.log('✓ Browser secret invariants');

console.log('\nBibleQuest release validation passed.');
