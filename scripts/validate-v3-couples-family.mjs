import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

execFileSync(process.execPath,['scripts/validate-v3-inventory.mjs'],{stdio:'inherit'});

const failures=[];const fail=message=>failures.push(message);const read=file=>fs.readFileSync(file,'utf8');
const required=['COUPLES_FAMILY_LOCAL_V3.md','FEATURE_INVENTORY_V3.md','classic.html','couples.js','couple-cloud.js','src/content/couples-family.js','src/app/couples-family.js','src/features/couples-family/index.js','src/ui/couples-family.css','src/app/bootstrap.js','src/features/more/index.js','index.html','tests/v3-couples-family-edge.mjs','tests/v3-couples-family-smoke.mjs','.github/workflows/v3-regression.yml'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing #62 Couples/family local file: ${file}`);
function jsFiles(dir){if(!fs.existsSync(dir))return[];return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{const target=path.join(dir,entry.name);return entry.isDirectory()?jsFiles(target):entry.isFile()&&target.endsWith('.js')?[target]:[]})}
if(!failures.length){
  const content=read('src/content/couples-family.js'),owner=read('src/app/couples-family.js'),ui=read('src/features/couples-family/index.js'),bootstrap=read('src/app/bootstrap.js'),more=read('src/features/more/index.js'),index=read('index.html'),contract=read('COUPLES_FAMILY_LOCAL_V3.md'),inventory=read('FEATURE_INVENTORY_V3.md'),workflow=read('.github/workflows/v3-regression.yml'),classic=read('classic.html');
  if(!classic.includes('<script src="couples.js"></script>')||!classic.includes('<script src="couple-cloud.js"></script>'))fail('Classic source must prove separate local Couples and Couples cloud modules.');
  const cardIds=[...content.matchAll(/id:'c(\d{2})'/g)].map(match=>match[1]);if(cardIds.length!==32||cardIds[0]!=='01'||cardIds.at(-1)!=='32')fail('Recovered Couples content must retain exactly c01–c32.');
  for(const item of['Us & God','Listen & Understand','Repair & Forgive','Friendship & Gratitude','Money & Responsibilities','Closeness & Affection','Parenting & Family','Purpose & Future'])if(!content.includes(item))fail(`Recovered Couples category missing: ${item}`);
  for(const item of["STORAGE_KEY='couples-family-local'",'createCouplesFamilyService','toggleFavorite','markDiscussed','startPractice','completeActivePractice','recordListen','recordCheckin','HISTORY_LIMIT=100','COMMITMENT_LIMIT=30','CHECKIN_LIMIT=30'])if(!owner.includes(item))fail(`Couples local owner missing contract: ${item}`);
  if(/localStorage|sessionStorage|createClient|supabase|functions\.invoke|fetch\s*\(|api\.|session\.|progress\.|window\.|document\./i.test(owner))fail('Couples local owner must use only static recovered content and shared storage.');
  if(/localStorage|sessionStorage|createClient|supabase|couple-cloud|functions\.invoke|fetch\s*\(|progress\./i.test(ui))fail('Couples local UI bypasses its local owner or crosses into cloud/progress ownership.');
  for(const forbidden of['couple-cloud','cloudNotes','api.','session.','congregation'])if(owner.includes(forbidden))fail(`Couples local owner leaked later/cloud ownership: ${forbidden}`);
  for(const item of['createCouplesFamilyService({storage})',"'couples-family':()=>couplesFamilyPage", "reader.setTranslation('bsb')",'reader.setBook(card.code,card.chapter)',"onCouplesFamily:()=>router.navigate('couples-family')"])if(!bootstrap.includes(item))fail(`Bootstrap missing #62 composition: ${item}`);
  if(!more.includes('data-open-couples-family'))fail('More must expose the recovered Couples local entry.');
  if(!index.includes('src/ui/couples-family.css'))fail('v3 shell must load Couples local styles.');
  for(const statement of['exactly eight categories and 32 conversation cards','`couple-cloud.js`, Supabase, session/account APIs','does not read or mutate the classic unprefixed `biblequest_couples_v1` key','fear, threats, coercion, stalking, or violence','No recovered #62 XP/progress reward exists'])if(!contract.includes(statement))fail(`Couples local contract missing boundary: ${statement}`);
  if(!inventory.includes('| 62 | Couples/family local tools | Yes | Clean | Regression-tested | topic open; save note/action; reload |'))fail('#62 must remain Regression-tested after the later #63 complete functional gate passes.');
  for(const test of['node scripts/validate-v3-couples-family.mjs','node tests/v3-couples-family-edge.mjs','node tests/v3-couples-family-smoke.mjs'])if(!workflow.includes(test))fail(`Accumulated workflow missing #62 regression: ${test}`);
  for(const file of jsFiles('src')){if(file==='src/core/storage.js')continue;if(/\blocalStorage\b|\bsessionStorage\b/.test(read(file)))fail(`Direct browser storage use outside storage owner: ${file}`)}
}
if(failures.length){for(const item of failures)console.error(`- ${item}`);process.exit(1)}
console.log('BibleQuest v3 Couples/family local architecture boundary passed.');
