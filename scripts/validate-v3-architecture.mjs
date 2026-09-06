import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root=process.cwd(),failures=[];
const fail=message=>failures.push(message);
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const required=[
  'index.html','src/app/bootstrap.js','src/app/router.js','src/app/store.js','src/app/session.js','src/app/account.js','src/app/reader.js','src/app/daily-mission.js','src/app/transform.js','src/app/audio.js','src/app/recordings.js','src/app/media-library.js','src/app/games.js',
  'src/core/storage.js','src/core/api.js','src/core/bible.js','src/core/progress.js','src/core/recall-packs.js','src/engines/lesson.js','src/engines/transform.js',
  'src/features/transform/content.js','src/features/transform/index.js','src/features/recordings/index.js','src/features/media-library/index.js','src/features/games/content.js','src/features/games/index.js',
  'src/ui/shell.js','src/ui/app.css','src/ui/reader.css','src/ui/progress.css','src/ui/daily-mission.css','src/ui/transform.css','src/ui/recordings.css','src/ui/media-library.css','src/ui/games.css',
  'src/features/home/index.js','src/features/account/index.js','src/features/learn/index.js','src/features/reader/index.js','src/features/progress/index.js','src/features/daily-mission/content.js','src/features/daily-mission/index.js',
  'FEATURE_INVENTORY_V3.md','DEVELOPMENT_STATUS_V3.md','ARCHITECTURE_V3.md','data/packs/ATTRIBUTION.md'
];
for(const file of required)if(!fs.existsSync(path.join(root,file)))fail(`Missing v3 required file: ${file}`);

const html=read('index.html');
const scriptTags=[...html.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi)].map(match=>match[1]);
if(scriptTags.length!==1||scriptTags[0]!=='src/app/bootstrap.js')fail(`index.html must boot exactly one script entry. Found: ${scriptTags.join(', ')||'none'}`);
if(!/type=["']module["']/.test(html))fail('v3 bootstrap must be loaded as an ES module.');
for(const style of['src/ui/app.css','src/ui/reader.css','src/ui/progress.css','src/ui/daily-mission.css','src/ui/transform.css','src/ui/recordings.css','src/ui/media-library.css','src/ui/games.css'])if(!html.includes(style))fail(`index.html must load ${style}.`);
for(const legacy of['app.js','runtime-safety.js','cloud.js','live-rooms.js','modern-home.js','journey-loop.js','runtime-recovery.js','transform-launcher.js','bq2.js','media-library.js'])if(html.includes(legacy))fail(`Legacy runtime reference found in v3 index.html: ${legacy}`);

const jsFiles=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.name.endsWith('.js'))jsFiles.push(full)}}
walk(path.join(root,'src'));
for(const file of jsFiles){
  const rel=path.relative(root,file).replaceAll('\\','/'),text=fs.readFileSync(file,'utf8');
  try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'})}catch(error){fail(`Syntax check failed: ${rel}\n${error.stderr?.toString()||error.message}`)}
  if(rel!=='src/core/storage.js'&&/\b(localStorage|sessionStorage)\b/.test(text))fail(`Direct browser storage use outside storage service: ${rel}`);
  if(rel!=='src/app/router.js'&&/(hashchange|location\.hash|history\.(replaceState|pushState))/.test(text))fail(`Navigation ownership leaked outside router: ${rel}`);
  if(/window\.BQ[A-Z0-9_]*/.test(text))fail(`Legacy/global BQ namespace is forbidden in v3 source: ${rel}`);
  if(rel!=='src/core/api.js'&&/(supabase-js|createClient\s*\(|signInWithPassword|onAuthStateChange|bq-signup|bq-password-reset|bible_devices|bible_media_library)/.test(text))fail(`Account/backend ownership leaked outside API wrapper: ${rel}`);
  if(rel!=='src/core/bible.js'&&/data\/packs\/(?:bible|tagalog)\//.test(text))fail(`Bible pack ownership leaked outside Bible data service: ${rel}`);
  if(rel!=='src/core/recall-packs.js'&&/data\/packs\/questions\//.test(text))fail(`Recall question-pack ownership leaked outside Recall Pack service: ${rel}`);
  if(rel!=='src/core/progress.js'&&/['"]progress-state['"]/.test(text))fail(`Progress persistence ownership leaked outside progress service: ${rel}`);
  if(rel!=='src/core/progress.js'&&/(?:\.xp|\.streak|\.badges|\.totalActivities)\s*(?:[+\-*/]?=|\+\+|--)/.test(text))fail(`Direct progress mutation outside progress service: ${rel}`);
  if(rel!=='src/engines/lesson.js'&&/['"]lesson-sessions['"]/.test(text))fail(`Lesson lifecycle persistence ownership leaked outside lesson engine: ${rel}`);
  if(rel!=='src/engines/transform.js'&&/['"]transform-state['"]/.test(text))fail(`Transform persistence ownership leaked outside Transform engine: ${rel}`);
  if(rel!=='src/app/audio.js'&&/(document\.createElement\(['"]iframe['"]\)|youtube-nocookie\.com\/embed\/)/.test(text))fail(`Embedded media-player ownership leaked outside Audio owner: ${rel}`);
  if(rel!=='src/app/audio.js'&&/data-bq-audio-player/.test(text))fail(`Audio player instance marker leaked outside Audio owner: ${rel}`);
  if(/MutationObserver/.test(text)&&/(record|media-library)/.test(rel))fail(`MutationObserver is forbidden in v3 media runtime: ${rel}`);
}

const onlyOwner=(pattern,expected,label)=>{const owners=jsFiles.filter(file=>pattern.test(fs.readFileSync(file,'utf8')));if(owners.length!==1||path.relative(root,owners[0]).replaceAll('\\','/')!==expected)fail(`Exactly one ${label} owner is required: ${expected}`)};
onlyOwner(/addEventListener\(['"]hashchange/,'src/app/router.js','hashchange listener');
onlyOwner(/export function createSessionService/,'src/app/session.js','session service');
onlyOwner(/export function createAccountService/,'src/app/account.js','account workflow');
onlyOwner(/export function createBibleDataService/,'src/core/bible.js','Bible data-service');
onlyOwner(/export function createReaderService/,'src/app/reader.js','reader-state');
onlyOwner(/export function createProgressService/,'src/core/progress.js','progress service');
onlyOwner(/export function createRecallPackService/,'src/core/recall-packs.js','Recall Pack data service');
onlyOwner(/export function createLessonEngine/,'src/engines/lesson.js','lesson lifecycle');
onlyOwner(/export function createDailyMissionService/,'src/app/daily-mission.js','Daily Mission orchestration');
onlyOwner(/export function createTransformEngine/,'src/engines/transform.js','Transform state/scoring');
onlyOwner(/export function createTransformService/,'src/app/transform.js','Transform orchestration');
onlyOwner(/export function createAudioManager/,'src/app/audio.js','Audio/player lifecycle');
onlyOwner(/export function createRecordingsService/,'src/app/recordings.js','Recordings lifecycle');
onlyOwner(/export function createMediaLibraryService/,'src/app/media-library.js','Media Library orchestration');
onlyOwner(/export function createGameLauncherService/,'src/app/games.js','Game Launcher lifecycle');

const api=read('src/core/api.js');
if(!api.includes('@supabase/supabase-js@2.112.4'))fail('Supabase browser dependency must remain pinned to 2.112.4.');
if(!api.includes("signOut({ scope: 'local' })"))fail('Session sign-out must be device-local, not global.');
for(const contract of["'bq-signup'","'bq-password-reset'","'bible_devices'","'bible_media_library'"])if(!api.includes(contract))fail(`API wrapper missing required account/media contract ${contract}.`);
if(/service_role|sb_secret_/i.test(api))fail('Privileged Supabase credentials are forbidden in browser code.');
if(!api.includes('Live Recordings took too long to load'))fail('Media cloud request must remain bounded.');

const progress=read('src/core/progress.js');if(!progress.includes('Progress event identity conflict'))fail('Progress service must reject conflicting reuse of an event identity.');
const recallPacks=read('src/core/recall-packs.js');for(const contract of['data/packs/manifest.json','data/packs/questions/${code}.json',"row?.safety?.action!=='allow'",'fetcher'])if(!recallPacks.includes(contract))fail(`Recall Pack service missing required contract: ${contract}`);if(/document\.|window\.|localStorage|sessionStorage|progress\.record|createClient/.test(recallPacks))fail('Recall Pack service must remain DOM/storage/progress/backend independent.');
const transformEngine=read('src/engines/transform.js');if(/window\.|document\.|localStorage|sessionStorage|progress\.record|createClient/.test(transformEngine))fail('Transform engine must remain DOM/router/storage-implementation/API/progress independent.');
for(const name of['calculateSpiritual','calculatePersonality','calculateBias']){const owners=jsFiles.filter(file=>new RegExp(`function\\s+${name}\\s*\\(`).test(fs.readFileSync(file,'utf8')));if(owners.length!==1||path.relative(root,owners[0]).replaceAll('\\','/')!=='src/engines/transform.js')fail(`Transform derived-result function ${name} must be defined only by src/engines/transform.js.`)}
const transformService=read('src/app/transform.js');for(const contract of['transform:spiritual:v1:complete','progress.record','engine.calculateSpiritual'])if(!transformService.includes(contract))fail(`Transform orchestration missing contract ${contract}.`);if(/localStorage|sessionStorage|\.xp\s*=|\.streak\s*=/.test(transformService))fail('Transform orchestration bypasses storage/progress ownership.');
const transformUi=read('src/features/transform/index.js');if(/localStorage|sessionStorage|progress\.record|engine\.|createTransformEngine/.test(transformUi))fail('Transform UI bypasses an owning service.');

const audio=read('src/app/audio.js');for(const contract of['youtube-nocookie.com','dataset.bqAudioPlayer','postMessage','function unload','function mount'])if(!audio.includes(contract))fail(`Audio owner missing required lifecycle contract: ${contract}`);if(/MutationObserver|window\.onYouTubeIframeAPIReady|youtube\.com\/iframe_api/.test(audio))fail('Audio owner must not recreate the legacy YouTube global/runtime loader.');
const recordings=read('src/app/recordings.js');for(const contract of['media.listLiveRecordings','audio.mount','audio.unload','session.isAuthenticated'])if(!recordings.includes(contract))fail(`Recordings owner missing required contract: ${contract}`);if(/document\.|window\.|localStorage|sessionStorage|createClient/.test(recordings))fail('Recordings lifecycle owner must remain DOM/storage/backend-implementation independent.');
const recordingsUi=read('src/features/recordings/index.js');if(/createElement\(['"]iframe|youtube-nocookie|createClient|bible_media_library|localStorage|sessionStorage/.test(recordingsUi))fail('Recordings UI bypasses Audio/API/storage ownership.');
const mediaLibrary=read('src/app/media-library.js');for(const contract of['recordings.load','recordings.select','recordings.leave'])if(!mediaLibrary.includes(contract))fail(`Media Library owner missing shared-owner contract: ${contract}`);if(/document\.|window\.|localStorage|sessionStorage|createClient|bible_media_library|youtube-nocookie/.test(mediaLibrary))fail('Media Library orchestration must remain DOM/storage/backend/player-implementation independent.');
const mediaUi=read('src/features/media-library/index.js');if(/createElement\(['"]iframe|youtube-nocookie|createClient|bible_media_library|localStorage|sessionStorage|recordings\./.test(mediaUi))fail('Media Library UI bypasses its orchestration owner.');
const games=read('src/app/games.js');for(const contract of['buildGameRound','progress.record','storage.read','storage.write','recall.loadManifest','recall.loadBook'])if(!games.includes(contract))fail(`Game Launcher owner missing required contract: ${contract}`);if(/document\.|window\.|localStorage|sessionStorage|createClient|fetch\s*\(/.test(games))fail('Game Launcher owner must remain DOM/storage-implementation/backend/pack-fetch independent.');
const gamesUi=read('src/features/games/index.js');if(/localStorage|sessionStorage|createClient|progress\.record|storage\.|fetch\s*\(/.test(gamesUi))fail('Games UI bypasses Game Launcher/progress/storage/content ownership.');

const inventory=read('FEATURE_INVENTORY_V3.md'),allowed=new Set(['Not started','Implemented','Verified','Regression-tested']),rows=inventory.split('\n').filter(line=>/^\|\s*\d+\s*\|/.test(line));
if(rows.length!==100)fail(`Feature inventory must contain exactly 100 numbered capability rows; found ${rows.length}.`);
rows.forEach((line,index)=>{const columns=line.split('|').slice(1,-1).map(value=>value.trim());if(Number(columns[0])!==index+1)fail(`Feature inventory row sequence error at ${index+1}.`);if(!allowed.has(columns[4]))fail(`Invalid v3 status on row ${columns[0]}.`)});

const architecture=read('ARCHITECTURE_V3.md');for(const owner of['src/core/bible.js','src/app/reader.js','src/core/progress.js','src/core/recall-packs.js','src/engines/lesson.js','src/app/daily-mission.js','src/engines/transform.js','src/app/transform.js','src/app/audio.js','src/app/recordings.js','src/app/media-library.js','src/app/games.js'])if(!architecture.includes(owner))fail(`Architecture document must name active owner ${owner}.`);
const status=read('DEVELOPMENT_STATUS_V3.md');if(!status.includes('Defect / root-cause ledger')||!status.includes('Next major milestone'))fail('Development status must retain defect ledger and next-work queue.');

if(failures.length){console.error(`BibleQuest v3 architecture validation FAILED (${failures.length})`);failures.forEach(message=>console.error(`- ${message}`));process.exit(1)}
console.log('BibleQuest v3 architecture validation passed.');console.log(`Checked ${jsFiles.length} v3 JavaScript modules and ${rows.length} inventory rows.`);
