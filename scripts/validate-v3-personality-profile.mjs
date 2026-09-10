import fs from 'node:fs';
import {workflowInvokesNode} from './v3-workflow-contract.mjs';
const failures=[],fail=message=>failures.push(message),read=file=>fs.readFileSync(file,'utf8');
const required=['PERSONALITY_PROFILE_V3.md','FEATURE_INVENTORY_V3.md','src/app/personality-profile.js','src/app/transform.js','src/core/storage.js','src/features/personality-profile/index.js','src/features/progress/index.js','src/app/bootstrap.js','tests/v3-personality-profile-edge.mjs','tests/v3-personality-profile-smoke.mjs','.github/workflows/v3-regression.yml'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing #80 Personality Profile file: ${file}`);
if(!failures.length){
  const contract=read('PERSONALITY_PROFILE_V3.md'),service=read('src/app/personality-profile.js'),transform=read('src/app/transform.js'),storage=read('src/core/storage.js'),ui=read('src/features/personality-profile/index.js'),progress=read('src/features/progress/index.js'),bootstrap=read('src/app/bootstrap.js'),inventory=read('FEATURE_INVENTORY_V3.md'),workflow=read('.github/workflows/v3-regression.yml');
  for(const token of["ASSESSMENT_VERSION='bq_quick_transform_ipip20_v1'","owner.startsWith('account:')?'account-device':'guest-device'",'presentationProfile','privateStorage.read','privateStorage.write','privateStorage.remove'])if(!service.includes(token))fail(`Personality Profile owner missing contract: ${token}`);
  for(const forbidden of['localStorage','sessionStorage','createClient','@supabase','functions.invoke',".from('",'fetch('])if(service.includes(forbidden))fail(`Personality Profile bypasses verified owners: ${forbidden}`);
  if(service.includes('ipip_big_five_50_v1'))fail('Personality Profile runtime must not use the stale 50-item provenance label.');
  for(const token of['personalityProfile.capture','profileSaved','personalityProfile?.clear'])if(!transform.includes(token))fail(`Transform/Profile handoff missing: ${token}`);
  for(const token of["const PRIVATE_PREFIX = 'private.'",'export const privateStorage','!name.startsWith(PRIVATE_PREFIX)'])if(!storage.includes(token))fail(`Private storage boundary missing: ${token}`);
  for(const token of['data-personality-factor','data-personality-presentation','Private to this owner on this device','excluded from normal portable backup','20-item IPIP-based Big Five self-reflection','#81 Psychometrics Lab'])if(!ui.includes(token))fail(`Personality Profile UI missing boundary: ${token}`);
  for(const token of['data-open-personality-profile','onPersonalityProfile'])if(!progress.includes(token))fail(`Grow route missing Personality Profile entry: ${token}`);
  for(const token of["createPersonalityProfileService","privateStorage","personalityProfilePage","'personality-profile'","onPersonalityProfile:()=>router.navigate('personality-profile')"])if(!bootstrap.includes(token))fail(`Bootstrap missing Personality Profile composition: ${token}`);
  for(const token of['20-item IPIP-based Big Five','Psychometrics Lab','ipip_big_five_50_v1','does **not** reproduce','excluded from normal portable','presentation-only'])if(!contract.includes(token))fail(`Personality Profile contract missing recovered evidence: ${token}`);
  const row=n=>inventory.split('\n').find(line=>line.startsWith(`| ${n} |`))||'';
  if(!/\| (Not started|Implemented|Verified|Regression-tested) \|/.test(row(80)))fail('Inventory #80 must use a valid lifecycle state.');
  if(!/\| Not started \|/.test(row(81)))fail('Inventory #81 Psychometrics must remain Not started during #80.');
  for(const test of['scripts/validate-v3-personality-profile.mjs','tests/v3-personality-profile-edge.mjs','tests/v3-personality-profile-smoke.mjs'])if(!workflowInvokesNode(workflow,test))fail(`Accumulated workflow missing #80 regression: ${test}`);
}
if(failures.length){failures.forEach(item=>console.error(`- ${item}`));process.exit(1)}
console.log('BibleQuest v3 Personality Profile architecture/privacy boundary passed.');
