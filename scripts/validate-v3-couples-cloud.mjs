import fs from 'node:fs';

const failures=[];const fail=message=>failures.push(message);const read=file=>fs.readFileSync(file,'utf8');
const required=['COUPLES_CLOUD_V3.md','FEATURE_INVENTORY_V3.md','couple-cloud.js','supabase/functions/bq-couple/index.ts','supabase/migrations/20260904_innovation_stage.sql','supabase/migrations/20260905071100_couple_shared_write_hardening.sql','src/core/api.js','src/app/couples-cloud.js','src/features/couples-cloud/index.js','src/ui/couples-cloud.css','src/app/bootstrap.js','src/features/more/index.js','index.html','tests/v3-couples-cloud-edge.mjs','tests/v3-couples-cloud-smoke.mjs','.github/workflows/v3-regression.yml'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing #63 Couples cloud file: ${file}`);
if(!failures.length){
  const legacy=read('couple-cloud.js'),fn=read('supabase/functions/bq-couple/index.ts'),schema=read('supabase/migrations/20260904_innovation_stage.sql'),hardening=read('supabase/migrations/20260905071100_couple_shared_write_hardening.sql'),api=read('src/core/api.js'),owner=read('src/app/couples-cloud.js'),ui=read('src/features/couples-cloud/index.js'),localOwner=read('src/app/couples-family.js'),bootstrap=read('src/app/bootstrap.js'),more=read('src/features/more/index.js'),html=read('index.html'),contract=read('COUPLES_CLOUD_V3.md'),inventory=read('FEATURE_INVENTORY_V3.md'),workflow=read('.github/workflows/v3-regression.yml');
  for(const item of["functions.invoke('bq-couple'","from('bible_couple_shared')",'Share an 8-character code','private Bible notes','Transformation results'])if(!legacy.includes(item))fail(`Legacy Couples cloud recovery evidence missing: ${item}`);
  for(const action of["action==='status'","action==='create'","action==='join'","action==='leave'",'inviteCode(8)','14*86400000'])if(!fn.includes(action))fail(`Trusted bq-couple function missing recovered contract: ${action}`);
  for(const table of['bible_couple_pairs','bible_couple_invites','bible_couple_shared'])if(!schema.includes(table))fail(`Recovered Couples backend schema missing ${table}.`);
  if(!hardening.includes('revoke update on table public.bible_couple_shared from authenticated'))fail('Couples shared history must remain browser append-only.');
  for(const item of['const couples = Object.freeze',"invoke('bq-couple',{action:'status'})","invoke('bq-couple',{action:'create'})","invoke('bq-couple',{action:'join',code})","invoke('bq-couple',{action:'leave',pairId})","from('bible_couple_shared')",'COUPLE_SHARED_FIELDS'])if(!api.includes(item))fail(`Central API missing #63 contract: ${item}`);
  for(const item of['createCouplesCloudService','BQ_COUPLES_CLOUD_AUTH_REQUIRED','BQ_COUPLES_CLOUD_REMOTE_DISABLED','BQ_COUPLES_CLOUD_PERMISSION','PAIR_CODE','completeJourney','refreshShared'])if(!owner.includes(item))fail(`Couples cloud owner missing contract: ${item}`);
  for(const forbidden of['localStorage','sessionStorage','createClient','@supabase','functions.invoke',".from('",'window.','document.','BQCommunity','progress.'])if(owner.includes(forbidden))fail(`Couples cloud owner bypasses central ownership: ${forbidden}`);
  for(const forbidden of['localStorage','sessionStorage','createClient','@supabase','functions.invoke',".from('",'BQCommunity','progress.'])if(ui.includes(forbidden))fail(`Couples cloud UI bypasses its owner/API boundaries: ${forbidden}`);
  if(/couplesCloud|bq-couple|bible_couple_shared|api\./.test(localOwner))fail('#62 local Couples owner must remain independent from #63 cloud ownership.');
  for(const item of['createCouplesCloudService({api:api.couples,session})',"'couples-cloud':()=>couplesCloudPage", "onCouplesCloud:()=>router.navigate('couples-cloud')",'couplesCloud.clear()'])if(!bootstrap.includes(item))fail(`Bootstrap missing #63 composition: ${item}`);
  if(!more.includes('data-open-couples-cloud'))fail('More must expose Couples cloud separately from local Couples tools.');
  if(!html.includes('src/ui/couples-cloud.css'))fail('v3 shell must load Couples cloud styles.');
  for(const statement of['8 characters','expire after 14 days','append-only','Private Notes','Transformation results','trusted cloud score submission is owned by inventory row #70'])if(!contract.includes(statement))fail(`Couples cloud contract missing boundary: ${statement}`);
  if(!inventory.includes('| 63 | Couples cloud | Yes | Compatibility | Not started | shared state; permission; sync; failure handling |'))fail('#63 must remain Not started until its complete functional gate passes.');
  for(const test of['node scripts/validate-v3-couples-cloud.mjs','node tests/v3-couples-cloud-edge.mjs','node tests/v3-couples-cloud-smoke.mjs'])if(!workflow.includes(test))fail(`Accumulated workflow missing #63 regression: ${test}`);
}
if(failures.length){for(const item of failures)console.error(`- ${item}`);process.exit(1)}
console.log('BibleQuest v3 Couples cloud architecture boundary passed.');
