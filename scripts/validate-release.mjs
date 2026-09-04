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
assert(index.indexOf('mobile-production.js')>index.indexOf('release-hardening.js'),'mobile-production.js must load after release-hardening.js');

const jsFiles=walk('.',p=>p.endsWith('.js')&&!p.includes('/node_modules/'));
for(const file of jsFiles)run(process.execPath,['--check',file]);
console.log(`✓ JavaScript syntax: ${jsFiles.length} files`);

const manifest=JSON.parse(read('manifest.webmanifest'));
assert(manifest.start_url==='./','manifest start_url must remain ./');
assert(manifest.scope==='./','manifest scope must remain ./');
assert(manifest.display==='standalone','manifest display must remain standalone');
assert(manifest.icons?.some(x=>x.src==='app-icon.svg'),'manifest must include app-icon.svg');
console.log('✓ PWA manifest');

const sw=read('sw.js');
const shell=[...sw.matchAll(/'\.\/([^']+)'/g)].map(m=>m[1]);
for(const item of shell)assert(exists(item),`service worker caches missing file: ${item}`);
const indexShellRefs=localRefs.map(x=>x.replace(/^\.\//,'').split(/[?#]/)[0]).filter(x=>/\.(?:js|css|webmanifest|svg)$/i.test(x));
for(const item of indexShellRefs)assert(shell.includes(item),`service worker shell missing index asset: ${item}`);
for(const required of ['quest-media.js','release-hardening.js','release-hardening.css','mobile-production.css','mobile-production.js'])assert(shell.includes(required),`service worker shell missing ${required}`);
const cacheVersion=Number(sw.match(/const CACHE='biblequest-v(\d+)'/)?.[1]||0);
assert(cacheVersion>=39,'service worker cache must be rotated for the corrected mobile hierarchy release');
console.log(`✓ Service worker coverage · cache v${cacheVersion}`);

const mobileCss=read('mobile-production.css'),mobileJs=read('mobile-production.js');
assert(mobileCss.includes('grid-template-columns:repeat(5,minmax(0,1fr))'),'mobile production CSS must keep all five bottom tabs in one row');
assert(mobileCss.includes('body.bq-frontpage-focus #app>.app>.hero'),'mobile home must target the actual #app shell when suppressing the redundant legacy hero');
assert(mobileCss.includes('body.bq-frontpage-focus #app>.app>.quick-stats'),'mobile home must target the actual #app shell when suppressing the redundant stat strip');
assert(!mobileCss.includes('body.bq-frontpage-focus>.app>.hero'),'the broken direct-body .app selector must not return');
assert(mobileCss.includes('journey-path-card{order:-30}'),'Bible path must remain ahead of the optional season on Home');
assert(mobileCss.includes('@media(max-width:360px)'),'360px phones require an explicit compact layout');
assert(mobileJs.includes(".journey-node.current"),'mobile production behavior must keep the named current path marker visible');
assert(mobileJs.includes("first?0:"),'the first path marker must align to the start instead of being clipped');
console.log('✓ Production mobile hierarchy');

const cloud=read('cloud-config.js');
assert(cloud.includes("publishableKey: 'sb_publishable_"),'cloud config must use a publishable key');
assert(!/service[_-]?role|sb_secret_/i.test(cloud),'privileged Supabase credential marker found in browser cloud config');
assert(cloud.includes("new URL('./',location.href).href"),'cloud redirect root must derive from current deployment URL');
assert(cloud.includes("authMode: 'email-password'"),'production auth mode must remain email-password');
console.log('✓ Browser cloud configuration');

const workflows=walk('.github/workflows',p=>/\.ya?ml$/i.test(p));
for(const file of workflows){const yml=read(file);assert(/\bworkflow_dispatch\s*:/.test(yml),`${file} must be manual-dispatch capable`);for(const trigger of ['push','pull_request','schedule','workflow_run','repository_dispatch']){const re=new RegExp(`^\\s{2}${trigger}\\s*:`, 'm');assert(!re.test(yml),`${file} contains forbidden automatic trigger: ${trigger}`)}}
console.log(`✓ GitHub Actions manual-only policy: ${workflows.length} workflows`);

const contextManifest=JSON.parse(read('data/packs/context/manifest.json'));
assert(contextManifest.books?.length===66,`expected 66 Bible context packs, got ${contextManifest.books?.length||0}`);
assert(contextManifest.license==='CC BY 4.0','context-pack license metadata changed unexpectedly');
for(const row of contextManifest.books){assert(row.code&&row.path,`invalid context manifest row: ${JSON.stringify(row)}`);assert(exists(row.path),`missing context pack: ${row.path}`);assert(Number(row.tagged_verses)>0,`context pack has no tagged verses: ${row.code}`)}
console.log('✓ 66-book Hebrew/Greek context pack');

for(const required of ['reset.html','reset.js','password-recovery.js','admin.html','admin.js','admin-link.js','release-hardening.js','release-hardening.css','mobile-production.css','mobile-production.js','LICENSE','THIRD_PARTY_NOTICES.md','_headers','SHARED_SUPABASE.md','assets/avatar-adventurer.webp','assets/avatar-locked.webp','assets/world-locked.webp','assets/world-revealed.webp','supabase/functions/bq-admin/index.ts','supabase/functions/bq-signup/index.ts','supabase/functions/bq-password-reset/index.ts','supabase/migrations/20260905_admin_auth_schema_parity.sql','supabase/migrations/20260905_production_permission_hardening.sql','supabase/migrations/20260905_browser_grant_parity.sql'])assert(exists(required),`required release file missing: ${required}`);
console.log('✓ Release hardening, recovery, admin and schema-parity assets');

const adminUi=read('admin.js'),adminFn=read('supabase/functions/bq-admin/index.ts');
assert(adminUi.includes("action:'send_password_reset'"),'admin UI must use email password recovery');
assert(!adminUi.includes("action:'issue_reset_code'"),'retired reset-code action must not return to admin UI');
assert(adminFn.includes("action==='send_password_reset'"),'admin function must support email password recovery');
assert(!adminFn.includes("action==='issue_reset_code'"),'retired reset-code action must not return to admin function');
for(const host of ['mybiblequest.pages.dev','biblequest-7th.pages.dev'])assert(adminFn.includes(host),`admin function must trust active Cloudflare project ${host}`);
assert(adminFn.includes("PRIMARY_ORIGIN='https://mybiblequest.pages.dev'"),'clean mybiblequest host must remain canonical');
for(const endpoint of ['supabase/functions/bq-signup/index.ts','supabase/functions/bq-password-reset/index.ts']){const text=read(endpoint);for(const host of ['mybiblequest.pages.dev','biblequest-7th.pages.dev'])assert(text.includes(host),`${endpoint} must recognize ${host}`);assert(!text.includes('079b159e.biblequest-7th.pages.dev'),`${endpoint} must not pin one deployment hash`)}
const parityMigration=read('supabase/migrations/20260905_admin_auth_schema_parity.sql');
assert(parityMigration.includes('create table if not exists public.bible_app_access'),'admin access live schema must be reproducible');
assert(parityMigration.includes('create table if not exists public.bible_admin_audit_log'),'admin audit live schema must be reproducible');
const grantsMigration=read('supabase/migrations/20260905_production_permission_hardening.sql');
assert(/revoke all privileges on table public\.bible_app_access from anon, authenticated/i.test(grantsMigration),'production permission migration must revoke broad app-access grants');
assert(/grant select on table public\.bible_app_access to authenticated/i.test(grantsMigration),'signed-in users must retain self-read access through RLS');
const browserGrants=read('supabase/migrations/20260905_browser_grant_parity.sql');
assert(browserGrants.includes("left(c.relname, 6) = 'bible_'"),'browser grant parity migration must stay scoped to BibleQuest tables');
assert(!/grant\s+(truncate|trigger|references)/i.test(browserGrants),'browser grant parity must never add administrative table privileges');
console.log('✓ Admin/auth source-of-truth invariants');

run(process.execPath,['scripts/verify-safety-smoke.js']);
run(process.execPath,['scripts/content-audit.js']);
run(process.execPath,['scripts/doctrinal-audit.js']);
console.log('✓ Doctrinal/content audits');

run('python3',['-m','py_compile','scripts/apply-doctrinal-safety.py','scripts/build_content_pack.py','scripts/build_story_packs.py','scripts/build_tagalog_packs.py','scripts/build_original_language_packs.py']);
console.log('✓ Python content tooling syntax');

const sensitiveBrowserFiles=['cloud-config.js','account.js','password-recovery.js','admin-link.js','admin.js','signup-enhancements.js','cloud.js','live-rooms.js','innovation-suite.js','workspace.js','couple-cloud.js','context-lab.js','assignment-center.js','assignment-push.js','presence.js','avatar-vault.js','journey-groups.js','journey-loop.js','journey-cloud-sync.js','engagement-v3.js','frontpage-daily.js','release-hardening.js','mobile-production.js','reset.js','japanese-learning.js'];
for(const file of sensitiveBrowserFiles){const text=read(file);assert(!/SUPABASE_SERVICE_ROLE_KEY|sb_secret_/i.test(text),`privileged secret marker found in browser file: ${file}`)}
console.log('✓ Browser secret invariants');

const front=read('frontpage-daily.js'),smoke=read('tests/browser-smoke.mjs');
assert(!front.includes('maybePrompt'),'front page must not restore an automatic first-visit focus modal');
assert(front.includes('BQJourneyLoop?.openSupport'),'legacy focus entry point must route to optional Journey support');
assert(front.includes('body.bq-frontpage-focus #app>.app>.hero'),'front-page runtime style must target the real app shell');
assert(front.includes('body.bq-frontpage-focus #app>.app>.quick-stats'),'front-page runtime style must hide the redundant mobile stat strip');
assert(smoke.includes('/My Mission/'),'browser smoke must target the current My Mission route');
assert(smoke.includes("'日本語'"),'browser smoke must verify Japanese translation visibility');
assert(smoke.includes('personal focus must not block the Daily Journey'),'browser smoke must protect the unblocked first-visit path');
assert(smoke.includes('home must not horizontally overflow'),'browser smoke must guard phone-width overflow');
assert(smoke.includes('legacy Keep growing hero must not precede the Daily Journey'),'browser smoke must preserve the compact mobile hierarchy');
console.log('✓ Current Daily Journey and browser-smoke expectations');

console.log('\nBibleQuest release validation passed.');
