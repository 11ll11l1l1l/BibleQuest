import fs from 'node:fs';
import {workflowInvokesNode} from './v3-workflow-contract.mjs';
const failures=[],fail=message=>failures.push(message),read=file=>fs.readFileSync(file,'utf8');
const required=['INNOVATION_SUITE_V3.md','FEATURE_INVENTORY_V3.md','src/engines/mission.js','src/app/mission.js','src/features/mission/index.js','src/features/more/index.js','src/app/open-review.js','src/app/bootstrap.js','tests/v3-innovation-suite-edge.mjs','tests/v3-innovation-suite-smoke.mjs','.github/workflows/v3-regression.yml'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing #83 Innovation suite file: ${file}`);
if(!failures.length){
  const contract=read('INNOVATION_SUITE_V3.md'),engine=read('src/engines/mission.js'),service=read('src/app/mission.js'),ui=read('src/features/mission/index.js'),more=read('src/features/more/index.js'),openReview=read('src/app/open-review.js'),bootstrap=read('src/app/bootstrap.js'),inventory=read('FEATURE_INVENTORY_V3.md'),workflow=read('.github/workflows/v3-regression.yml');

  for(const forbidden of['window.BQ','createClient','@supabase','document.','localStorage','sessionStorage'])if(engine.includes(forbidden))fail(`Mission engine leaked an external owner: ${forbidden}`);
  for(const token of['recommend','review','study'])if(!engine.includes(token))fail(`Mission engine missing contract token: ${token}`);

  for(const forbidden of['window.BQ','createClient','@supabase','document.','localStorage','sessionStorage'])if(service.includes(forbidden))fail(`Mission service bypasses verified owners: ${forbidden}`);
  if(!/openReview\.overview/.test(service))fail('Mission service must reuse Open Review\'s overview(), not track its own due/mastery state.');
  if(!openReview.includes('overview'))fail('Open Review owner missing overview() for Mission to reuse.');

  for(const forbidden of['createClient','@supabase','localStorage','sessionStorage'])if(ui.includes(forbidden))fail(`Mission UI bypasses verified owners: ${forbidden}`);
  for(const token of['data-mission-start','data-mission-back','mission.recommend'])if(!ui.includes(token))fail(`Mission UI missing presentation contract: ${token}`);

  for(const token of['data-open-mission','onMission'])if(!more.includes(token))fail(`More page missing Mission entry: ${token}`);

  for(const token of['createMissionService','missionPage',"'my-mission':()=>missionPage","onMission:()=>router.navigate('my-mission')"])if(!bootstrap.includes(token))fail(`Bootstrap missing Mission composition: ${token}`);

  for(const token of['Personal Mission','Bible World','Church Challenges','already owned elsewhere','Deferred','#84'])if(!contract.includes(token))fail(`Innovation suite contract missing recovered scope boundary: ${token}`);

  const row=n=>inventory.split('\n').find(line=>line.startsWith(`| ${n} |`))||'';
  if(!/\| (Not started|Implemented|Verified|Regression-tested) \|/.test(row(83)))fail('Inventory #83 Innovation suite must use a valid lifecycle state.');
  if(!/\| Not started \|/.test(row(84)))fail('Inventory #84 Tutorial/onboarding trainer must remain Not started during #83.');

  for(const test of['scripts/validate-v3-innovation-suite.mjs','tests/v3-innovation-suite-edge.mjs','tests/v3-innovation-suite-smoke.mjs'])if(!workflowInvokesNode(workflow,test))fail(`Accumulated workflow missing #83 regression: ${test}`);
}
if(failures.length){failures.forEach(item=>console.error(`- ${item}`));process.exit(1)}
console.log('BibleQuest v3 Innovation Suite architecture/ownership boundary passed.');
