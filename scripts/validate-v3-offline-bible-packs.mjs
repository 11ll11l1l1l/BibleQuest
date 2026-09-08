import fs from 'node:fs';
import path from 'node:path';

const failures=[];const fail=message=>failures.push(message);const read=file=>fs.readFileSync(file,'utf8');
const required=['OFFLINE_BIBLE_PACKS_V3.md','FEATURE_INVENTORY_V3.md','src/core/bible.js','offline-shell-sw.js','src/features/reader/index.js','tests/v3-offline-bible-packs-edge.mjs','tests/v3-offline-bible-packs-smoke.mjs','.github/workflows/v3-regression.yml'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing Offline Bible packs file: ${file}`);

function jsFiles(dir){
  if(!fs.existsSync(dir))return[];
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const target=path.join(dir,entry.name);
    return entry.isDirectory()?jsFiles(target):entry.isFile()&&target.endsWith('.js')?[target]:[];
  });
}

if(!failures.length){
  const owner=read('src/core/bible.js'),worker=read('offline-shell-sw.js'),reader=read('src/features/reader/index.js'),contract=read('OFFLINE_BIBLE_PACKS_V3.md'),inventory=read('FEATURE_INVENTORY_V3.md'),workflow=read('.github/workflows/v3-regression.yml');
  for(const item of["OFFLINE_PACK_CACHE = 'biblequest-v3-opened-bible-packs-v1'",'createOpenedPackStore','cacheStorage.open(OFFLINE_PACK_CACHE)','persistOpenedPack','readOpenedPack','persistOffline = true','persistOffline: false','packStore.remove?.(path)','normalizeBundledPack'])if(!owner.includes(item))fail(`Bible data owner missing #99 contract: ${item}`);
  if(!owner.includes("path = `data/packs/${translation.folder}/${book.code}.json`"))fail('Bible data owner must remain the sole bundled Scripture pack-path constructor.');
  if(!owner.includes("translation.mode === 'licensed-link'")||!owner.includes('!translation.bundled'))fail('#99 must remain behind existing bundled-translation guards.');
  if(/localStorage|sessionStorage|document\.|window\.|navigator\.serviceWorker/.test(owner))fail('#99 Bible pack owner must not bypass storage/UI/service-worker ownership.');
  if(worker.includes('biblequest-v3-opened-bible-packs')||/data\/packs\/(?:bible|tagalog)/.test(worker))fail('#98 shell worker must not become the #99 Bible-pack persistence owner.');
  if(/\bcaches\b|CacheStorage|biblequest-v3-opened-bible-packs/.test(reader))fail('Reader UI must not access #99 Cache Storage directly.');
  for(const file of jsFiles('src')){
    if(file==='src/core/bible.js')continue;
    if(read(file).includes('biblequest-v3-opened-bible-packs-v1'))fail(`#99 cache ownership leaked outside src/core/bible.js: ${file}`);
  }
  for(const statement of['Japanese 口語訳 remains a verified live chapter source and is not persisted by #99','NLT remains a licensed external-reader mode and is never cached or redistributed by #99','Whole-translation text search','semantically corrupt persisted pack is removed'])if(!contract.includes(statement))fail(`Offline Bible packs contract missing boundary: ${statement}`);
  if(!inventory.includes('| 99 | Offline opened Bible packs | Yes | Clean | Regression-tested | opened bundled BSB/Tagalog pack persists only through Bible owner; offline reload/switch; corrupt-cache eviction; no bulk search caching; live/licensed sources excluded; 390px mobile |'))fail('#99 must be Regression-tested after surviving the complete #100 functional suite.');
  for(const test of['node tests/v3-offline-bible-packs-edge.mjs','node tests/v3-offline-bible-packs-smoke.mjs'])if(!workflow.includes(test))fail(`Accumulated workflow missing #99 regression: ${test}`);
}

if(failures.length){for(const item of failures)console.error(`- ${item}`);process.exit(1)}
console.log('BibleQuest v3 Offline opened Bible packs architecture boundary passed.');
