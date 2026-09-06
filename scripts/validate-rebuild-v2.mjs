import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';

const root=path.resolve(process.cwd());
const required=['index.html','classic.html','PARITY_MATRIX.md','bq2.css','bq2-parity.css','bq2-data.js','bq2.js','bq2-reader.js','bq2-games.js','bq2-grow.js','bq2-study.js','bq2-study-routes.js','bq2-bookquiz.js','bq2-parity.js','bq2-classic-bridge.js','bq2-sw.js','data/questions.js','data/stories.js','data/packs/manifest.json'];
const legacyBoot=['runtime-safety.js','app.js','reader.js','translations.js','transformation.js','cloud.js','live-rooms.js','modern-home.js','journey-loop.js','frontpage-daily.js','quest-media.js','runtime-recovery.js','operational-hardening.js','transform-launcher.js'];
const standalone=['transform.html','psychometrics.html','content-review.html','admin.html','admin-operations.html','reset.html'];
const originalAssets=['assets/bq-pinoy-japan-hero.svg','assets/avatar-adventurer.webp','assets/avatar-locked.webp','assets/avatar-royal.webp','assets/avatar-scholar.webp','assets/avatar-shepherd.webp','assets/world-locked.webp','assets/world-revealed.webp','assets/tutorial-trainer-sprite.webp'];
const originalFeatureFiles=[
  'account.js','password-recovery.js','signup-enhancements.js','cloud.js','journey-cloud-sync.js','reader.js','verse-peek.js','translations.js','japanese-learning.js','context-lab.js','learning-engine.js','open-review.js','adaptive-learning.js','guided-study-expanded.js','community.js','community-bridge.js','journey-groups.js','live-rooms.js','congregation-recognition.js','leader-dashboard.js','presence.js','team-center.js','assignment-center.js','assignment-push.js','assignment-advanced.js','ministry-hub.js','media-library.js','notification-center.js','workspace.js','couple-cloud.js','linked-activities.js','personality-profile.js','avatar-vault.js','innovation-suite.js','onboarding-tutorial.js','tutorial-launcher.js','journey-accessibility.js','content-report.js','content-moderation-runtime.js','runtime-feature-registry.js','source-labels.js','client-diagnostics.js','runtime-recovery.js'
];
let failures=[];
const fail=m=>failures.push(m);
const exists=f=>fs.existsSync(path.join(root,f));
for(const file of required)if(!exists(file))fail(`Missing required file: ${file}`);
for(const file of standalone)if(!exists(file))fail(`Missing standalone original tool: ${file}`);
for(const file of originalAssets)if(!exists(file))fail(`Missing original visual resource: ${file}`);
for(const file of originalFeatureFiles)if(!exists(file))fail(`Missing original feature resource: ${file}`);

const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const file of ['bq2.css','bq2-parity.css','bq2-data.js','bq2.js','bq2-reader.js','bq2-games.js','bq2-grow.js','bq2-study.js','bq2-study-routes.js','bq2-bookquiz.js','bq2-parity.js'])if(!html.includes(file))fail(`index.html does not reference ${file}`);
for(const old of legacyBoot)if(html.includes(`src="${old}"`)||html.includes(`href="${old}"`))fail(`Legacy runtime reintroduced into clean index.html: ${old}`);

const classic=fs.readFileSync(path.join(root,'classic.html'),'utf8');
if(classic.includes('pwa-runtime.js'))fail('classic.html must not register the legacy service worker');
if(classic.includes('bq2.js'))fail('classic.html must remain isolated from the clean runtime');
for(const file of originalFeatureFiles)if(!classic.includes(`src="${file}"`)&&!['runtime-feature-registry.js'].includes(file))fail(`classic.html does not boot preserved feature module: ${file}`);
for(const match of classic.matchAll(/<(?:script[^>]+src|link[^>]+href)="([^"]+)"/g)){
  const ref=match[1];if(/^(?:https?:|data:|#)/.test(ref))continue;
  const clean=ref.split(/[?#]/)[0].replace(/^\.\//,'');
  if(clean&&!exists(clean))fail(`classic.html references missing resource: ${clean}`);
}
if(!classic.includes('runtime-feature-registry.js'))fail('classic.html is missing the original feature registry');
if(!classic.includes('bq2-classic-bridge.js'))fail('classic.html is missing the clean return bridge');

const parity=fs.readFileSync(path.join(root,'PARITY_MATRIX.md'),'utf8');
for(const label of ['Japanese 口語訳','Live Rooms','Journey Groups','Assignments','Ministry Hub','Media Library','Psychometrics suite','Content Review workbench','Admin console','PWA/offline'])if(!parity.includes(label))fail(`Parity matrix missing capability: ${label}`);

for(const file of ['bq2-data.js','bq2.js','bq2-reader.js','bq2-games.js','bq2-grow.js','bq2-study.js','bq2-study-routes.js','bq2-bookquiz.js','bq2-parity.js','bq2-classic-bridge.js','bq2-sw.js']){
  try{execFileSync(process.execPath,['--check',path.join(root,file)],{stdio:'pipe'})}catch(e){fail(`Syntax check failed: ${file}\n${e.stderr?.toString()||e.message}`)}
}
try{
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'bq2-data.js'),'utf8'),context,{filename:'bq2-data.js'});
  const books=context.window.BQ2_DATA?.books||[];
  if(books.length!==66)fail(`Expected 66 Bible books, found ${books.length}`);
  for(const b of books){
    const english=path.join(root,'data','packs','bible',`${b.code}.json`);
    const tagalog=path.join(root,'data','packs','tagalog',`${b.code}.json`);
    if(!fs.existsSync(english))fail(`Missing English Bible pack for ${b.name}: ${b.code}.json`);
    if(!fs.existsSync(tagalog))fail(`Missing Tagalog Bible pack for ${b.name}: ${b.code}.json`);
  }
  const packManifest=JSON.parse(fs.readFileSync(path.join(root,'data','packs','manifest.json'),'utf8'));
  for(const q of packManifest.question_books||[]){const p=path.join(root,q.path);if(!fs.existsSync(p))fail(`Missing recall pack: ${q.path}`)}
}catch(e){fail(`Could not validate Bible data model: ${e.message}`)}

const studyRoutes=fs.readFileSync(path.join(root,'bq2-study-routes.js'),'utf8');
for(const token of ['w1:2','w2:2','w3:2','w4:1','w5:1','w6:2'])if(!studyRoutes.includes(token))fail(`Wisdom answer contract missing ${token}`);
const sw=fs.readFileSync(path.join(root,'bq2-sw.js'),'utf8');
for(const file of ['classic.html','bq2-parity.css','bq2-parity.js','bq2-study-routes.js','assets/bq-pinoy-japan-hero.svg'])if(!sw.includes(file))fail(`Clean service worker core missing parity resource: ${file}`);

if(failures.length){console.error(`BibleQuest parity rebuild validation FAILED (${failures.length})`);for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('BibleQuest parity rebuild validation passed.');
console.log('Boot: clean modular runtime only; legacy feature chain isolated to classic.html.');
console.log('Feature surface: clean replacements + standalone tools + complete original compatibility resources present.');
console.log('Bible packs: English 66/66 + Tagalog 66/66 present; listed recall packs present.');
