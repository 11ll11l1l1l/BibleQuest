import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>fs.existsSync(path.join(root,p));
const fail=msg=>{throw new Error(msg)};
const assert=(ok,msg)=>{if(!ok)fail(msg)};

function walk(dir,filter=()=>true){
  const out=[];
  for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
    const p=path.join(dir,entry.name);
    if(entry.isDirectory())out.push(...walk(p,filter));
    else if(filter(p))out.push(p);
  }
  return out;
}
function run(cmd,args){execFileSync(cmd,args,{cwd:root,stdio:'inherit'})}

console.log('BibleQuest release validation');

const index=read('index.html');
const localRefs=[
  ...[...index.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]),
  ...[...index.matchAll(/<link[^>]+href="([^"]+)"/g)].map(m=>m[1])
].filter(x=>!/^https?:/i.test(x)&&!x.startsWith('data:')&&!x.startsWith('#'));
for(const ref of localRefs){
  const clean=ref.replace(/^\.\//,'').split(/[?#]/)[0];
  assert(exists(clean),`index.html references missing file: ${clean}`);
}

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
const indexShellRefs=localRefs
  .map(x=>x.replace(/^\.\//,'').split(/[?#]/)[0])
  .filter(x=>/\.(?:js|css|webmanifest|svg)$/i.test(x));
for(const item of indexShellRefs)assert(shell.includes(item),`service worker shell missing index asset: ${item}`);
for(const required of ['quest-media.js','release-hardening.js','release-hardening.css']){
  assert(shell.includes(required),`service worker shell missing ${required}`);
}
assert(/const CACHE='biblequest-v\d+'/.test(sw),'service worker cache version must use biblequest-v<number>');
console.log('✓ Service worker coverage');

const cloud=read('cloud-config.js');
assert(cloud.includes("publishableKey: 'sb_publishable_"),'cloud config must use a publishable key');
assert(!/service[_-]?role|sb_secret_/i.test(cloud),'privileged Supabase credential marker found in browser cloud config');
assert(cloud.includes("new URL('./',location.href).href"),'cloud redirect root must derive from current deployment URL');
console.log('✓ Browser cloud configuration');

const workflows=walk('.github/workflows',p=>/\.ya?ml$/i.test(p));
for(const file of workflows){
  const yml=read(file);
  assert(/\bworkflow_dispatch\s*:/.test(yml),`${file} must be manual-dispatch capable`);
  for(const trigger of ['push','pull_request','schedule','workflow_run','repository_dispatch']){
    const re=new RegExp(`^\\s{2}${trigger}\\s*:`, 'm');
    assert(!re.test(yml),`${file} contains forbidden automatic trigger: ${trigger}`);
  }
}
console.log(`✓ GitHub Actions manual-only policy: ${workflows.length} workflows`);

const contextManifest=JSON.parse(read('data/packs/context/manifest.json'));
assert(contextManifest.books?.length===66,`expected 66 Bible context packs, got ${contextManifest.books?.length||0}`);
assert(contextManifest.license==='CC BY 4.0','context-pack license metadata changed unexpectedly');
for(const row of contextManifest.books){
  assert(row.code&&row.path,`invalid context manifest row: ${JSON.stringify(row)}`);
  assert(exists(row.path),`missing context pack: ${row.path}`);
  assert(Number(row.tagged_verses)>0,`context pack has no tagged verses: ${row.code}`);
}
console.log('✓ 66-book Hebrew/Greek context pack');

for(const required of [
  'reset.html','reset.js','release-hardening.js','release-hardening.css',
  'LICENSE','THIRD_PARTY_NOTICES.md','_headers',
  'assets/avatar-adventurer.webp','assets/avatar-locked.webp','assets/world-locked.webp','assets/world-revealed.webp'
])assert(exists(required),`required release file missing: ${required}`);
console.log('✓ Release hardening and recovery assets');

run(process.execPath,['scripts/verify-safety-smoke.js']);
run(process.execPath,['scripts/content-audit.js']);
run(process.execPath,['scripts/doctrinal-audit.js']);
console.log('✓ Doctrinal/content audits');

run('python3',['-m','py_compile',
  'scripts/apply-doctrinal-safety.py',
  'scripts/build_content_pack.py',
  'scripts/build_story_packs.py',
  'scripts/build_tagalog_packs.py',
  'scripts/build_original_language_packs.py'
]);
console.log('✓ Python content tooling syntax');

const sensitiveBrowserFiles=[
  'cloud-config.js','account.js','signup-enhancements.js','cloud.js','live-rooms.js',
  'innovation-suite.js','workspace.js','couple-cloud.js','context-lab.js',
  'assignment-center.js','assignment-push.js','presence.js','avatar-vault.js',
  'journey-groups.js','journey-loop.js','journey-cloud-sync.js','engagement-v3.js',
  'frontpage-daily.js','release-hardening.js','reset.js'
];
for(const file of sensitiveBrowserFiles){
  const text=read(file);
  assert(!/SUPABASE_SERVICE_ROLE_KEY|sb_secret_/i.test(text),`privileged secret marker found in browser file: ${file}`);
}
console.log('✓ Browser secret invariants');

console.log('\nBibleQuest release validation passed.');
