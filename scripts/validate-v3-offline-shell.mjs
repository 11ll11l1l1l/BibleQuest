import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const failures=[];const fail=message=>failures.push(message);const read=file=>fs.readFileSync(file,'utf8');
const required=['OFFLINE_SHELL_V3.md','offline-shell-sw.js','src/app/offline-shell.js','src/app/bootstrap.js','index.html','PWA_INSTALL_V3.md','FEATURE_INVENTORY_V3.md'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing Offline Shell file: ${file}`);
if(!failures.length){
  const owner=read('src/app/offline-shell.js'),worker=read('offline-shell-sw.js'),bootstrap=read('src/app/bootstrap.js'),index=read('index.html'),pwa=read('src/app/pwa-install.js'),contract=read('OFFLINE_SHELL_V3.md'),inventory=read('FEATURE_INVENTORY_V3.md');
  try{execFileSync(process.execPath,['--check','offline-shell-sw.js'],{stdio:'pipe'})}catch(error){fail(`Offline worker syntax check failed: ${error.stderr?.toString()||error.message}`)}
  for(const item of['createOfflineShellService',"register('offline-shell-sw.js',{scope:'./'})","getEntriesByType?.('resource')",'BIBLEQUEST_WARM_SHELL','MessageChannelCtor','disposed'])if(!owner.includes(item))fail(`Offline Shell owner missing contract ${item}.`);
  for(const item of["CACHE_PREFIX='biblequest-v3-offline-shell-'","addEventListener('install'","addEventListener('activate'","addEventListener('message'","addEventListener('fetch'",'skipWaiting','clients.claim','bq-net-probe','request.destination','request.mode===\'navigate\'','cache.match'])if(!worker.includes(item))fail(`Offline worker missing contract ${item}.`);
  if(!worker.includes("new Set(['script','style','image','font'])"))fail('Offline worker must restrict runtime shell caching to static shell destinations.');
  if(!owner.includes("new Set(['script','link','css','img'])"))fail('Offline owner must restrict first-load warming to shell resource initiators.');
  for(const forbidden of['data/packs/','supabase','localStorage','sessionStorage','window.BQ'])if(owner.includes(forbidden)||worker.includes(forbidden))fail(`#98 must not cross into pack/backend/storage/global ownership: ${forbidden}`);
  if(/\bcaches\b|addEventListener\(['"]fetch/.test(owner))fail('Page-side Offline Shell owner must not own Cache Storage or fetch interception.');
  if(/serviceWorker|CacheStorage|\bcaches\b/.test(pwa))fail('#97 PWA install owner must remain offline-independent after #98.');
  for(const item of["import { createOfflineShellService } from './offline-shell.js'",'const offlineShell=createOfflineShellService()','offlineShell.start()','offlineShell.dispose()'])if(!bootstrap.includes(item))fail(`Bootstrap missing Offline Shell composition: ${item}.`);
  if(/serviceWorker|offline-shell-sw\.js/.test(index))fail('index.html must not become a second service-worker registration owner.');
  if(!contract.includes('#99 alone may add an opened-Bible-pack cache'))fail('Offline Shell contract must preserve the #99 pack boundary.');
  if(!inventory.includes('| 98 | Offline shell | Yes | Clean | Regression-tested | reload offline after first load; bounded shell cache; no pack/API/probe interception; 390px offline reload |'))fail('#98 must remain Regression-tested.');
  for(const total of['**Regression-tested:** 61','**Verified:** 1','**Not started:** 38'])if(!inventory.includes(total))fail(`Inventory totals missing post-#100 bookkeeping: ${total}`);
}
if(failures.length){for(const item of failures)console.error(`- ${item}`);process.exit(1)}
console.log('BibleQuest v3 Offline Shell architecture boundary passed.');
