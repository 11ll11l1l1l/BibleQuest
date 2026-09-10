import fs from 'node:fs';
import {workflowInvokesNode} from './v3-workflow-contract.mjs';
const failures=[],fail=message=>failures.push(message),read=file=>fs.readFileSync(file,'utf8');
const required=['MINISTRY_HUB_V3.md','FEATURE_INVENTORY_V3.md','src/app/ministry-hub.js','src/features/ministry-hub/index.js','src/app/congregation-membership.js','src/app/bootstrap.js','src/features/more/index.js','tests/v3-ministry-hub-edge.mjs','tests/v3-ministry-hub-smoke.mjs','.github/workflows/v3-regression.yml'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing #76 Ministry Hub file: ${file}`);
if(!failures.length){
  const contract=read('MINISTRY_HUB_V3.md'),owner=read('src/app/ministry-hub.js'),ui=read('src/features/ministry-hub/index.js'),membership=read('src/app/congregation-membership.js'),bootstrap=read('src/app/bootstrap.js'),more=read('src/features/more/index.js'),inventory=read('FEATURE_INVENTORY_V3.md'),workflow=read('.github/workflows/v3-regression.yml');
  for(const item of['createMinistryHubService({congregation}','congregation.isAuthenticated()','congregation.load()',"congregation.can(congregationId,'read')","congregation.can(congregationId,'ministry')", "id:'assignments'", "route:'journey-groups'", "id:'live-room'",'available:false'])if(!owner.includes(item))fail(`Ministry Hub owner missing bounded contract: ${item}`);
  for(const forbidden of['localStorage','sessionStorage','createClient','@supabase','functions.invoke',".from('",'window.BQ'])if(owner.includes(forbidden))fail(`Ministry Hub owner bypasses verified boundaries: ${forbidden}`);
  for(const forbidden of['localStorage','sessionStorage','createClient','@supabase','functions.invoke',".from('"])if(ui.includes(forbidden))fail(`Ministry Hub UI bypasses its owner: ${forbidden}`);
  for(const item of["const MINISTRY_ROLES=new Set(['facilitator','leader','pastor','admin'])","if(capability==='read')return true","if(capability==='ministry')return MINISTRY_ROLES.has(membership.role)"])if(!membership.includes(item))fail(`Existing congregation role owner drifted from #76 dependency: ${item}`);
  for(const item of["import { createMinistryHubService } from './ministry-hub.js'","import { ministryHubPage } from '../features/ministry-hub/index.js'",'createMinistryHubService({congregation})',"'ministry-hub':()=>ministryHubPage", "onMinistryHub:()=>router.navigate('ministry-hub')"])if(!bootstrap.includes(item))fail(`Bootstrap missing #76 composition: ${item}`);
  if(!more.includes('data-open-ministry-hub'))fail('More must expose the Ministry Hub route.');
  if(/Ministry Hub[^<\n]{0,80}unavailable/i.test(more))fail('More must not still describe Ministry Hub as unavailable after #76 wiring.');
  for(const item of['open tools; role guard; navigation','portal/navigation migration only','UI visibility is convenience only','#43 Live Rooms','#77 Notification Center','#78 Workspace','#79 Linked Activities'])if(!contract.includes(item))fail(`Ministry Hub contract missing boundary: ${item}`);
  const lifecycle=['Not started','Implemented','Verified','Regression-tested'];if(!lifecycle.some(status=>inventory.includes(`| 76 | Ministry Hub | Yes | Compatibility | ${status} | open tools; role guard; navigation |`)))fail('#76 inventory row is missing or malformed.');
  for(const test of['scripts/validate-v3-ministry-hub.mjs','tests/v3-ministry-hub-edge.mjs','tests/v3-ministry-hub-smoke.mjs'])if(!workflowInvokesNode(workflow,test))fail(`Accumulated workflow missing #76 regression: ${test}`);
}
if(failures.length){failures.forEach(item=>console.error(`- ${item}`));process.exit(1)}
console.log('BibleQuest v3 Ministry Hub architecture boundary passed.');
