import fs from 'node:fs';
import {workflowInvokesNode} from './v3-workflow-contract.mjs';
const failures=[],fail=message=>failures.push(message),read=file=>fs.readFileSync(file,'utf8');
const required=['LINKED_ACTIVITIES_V3.md','FEATURE_INVENTORY_V3.md','src/app/router.js','src/app/linked-activities.js','src/app/assignments.js','src/features/assignments/index.js','supabase/functions/bq-assignment/index.ts','tests/v3-linked-activities-edge.mjs','tests/v3-linked-activities-smoke.mjs','.github/workflows/v3-regression.yml'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing #79 Linked Activities file: ${file}`);
if(!failures.length){
  const contract=read('LINKED_ACTIVITIES_V3.md'),router=read('src/app/router.js'),service=read('src/app/linked-activities.js'),ui=read('src/features/assignments/index.js'),assignment=read('src/app/assignments.js'),server=read('supabase/functions/bq-assignment/index.ts'),inventory=read('FEATURE_INVENTORY_V3.md'),workflow=read('.github/workflows/v3-regression.yml');
  for(const item of["completionOwner:'assignments'",'assignments.snapshot()','assignments.start(assignmentId)','assignments.complete(assignmentId,submission,requirements)',"liveRoomsAvailable:false","journey:'mission'","reflection:'cloud-notes'","quiz:'open-review'"])if(!service.includes(item))fail(`Linked Activities owner missing recovered boundary: ${item}`);
  for(const forbidden of['localStorage','sessionStorage','createClient','@supabase','functions.invoke',".from('",'.insert(','.update(','.delete(','.upsert(','fetch('])if(service.includes(forbidden))fail(`Linked Activities owner bypasses verified owners: ${forbidden}`);
  for(const item of["export function requestNavigation(route)",'window.dispatchEvent(new CustomEvent(NAVIGATION_REQUEST','window.addEventListener(NAVIGATION_REQUEST,onNavigationRequest)','history.pushState'])if(!router.includes(item))fail(`Router missing central linked-navigation contract: ${item}`);
  for(const item of["import {createLinkedActivitiesService} from '../../app/linked-activities.js'","import {requestNavigation} from '../../app/router.js'",'data-assignment-linked','data-linked-completion-handoff','linkedActivities.launch','linkedActivities.complete','requestNavigation(result.route)'])if(!ui.includes(item))fail(`Assignments UI missing #79 handoff: ${item}`);
  if(/location\.hash|history\.(?:pushState|replaceState)|addEventListener\(['"]hashchange/.test(ui))fail('Assignments UI must not own browser navigation; it must request navigation through Router.');
  if(!ui.includes('cannot award assignment completion or points by itself'))fail('Assignments UI must explain explicit completion handoff.');
  if(!assignment.includes("linkedPublishing:false"))fail('#79 must not silently enable linked-activity authoring in the existing Assignments contract.');
  for(const item of["linked_activity:linkedActivity","action==='start'||action==='complete'",'assignmentRecipient(admin,assignment,user.id)'])if(!server.includes(item))fail(`Trusted assignment server boundary changed or is missing: ${item}`);
  for(const item of['launch linked activity; completion handoff','does **not** automatically award assignment completion','assignments.start()','assignments.complete()','Live Rooms #43','instruction-only'])if(!contract.includes(item))fail(`Linked Activities contract missing recovered behavior: ${item}`);
  const lifecycle=['Not started','Implemented','Verified','Regression-tested'];if(!lifecycle.some(status=>inventory.includes(`| 79 | Linked activities/challenges | Yes | Compatibility | ${status} | launch linked activity; completion handoff |`)))fail('#79 inventory row is missing or malformed.');
  for(const test of['scripts/validate-v3-linked-activities.mjs','tests/v3-linked-activities-edge.mjs','tests/v3-linked-activities-smoke.mjs'])if(!workflowInvokesNode(workflow,test))fail(`Accumulated workflow missing #79 regression: ${test}`);
}
if(failures.length){failures.forEach(item=>console.error(`- ${item}`));process.exit(1)}
console.log('BibleQuest v3 Linked Activities architecture boundary passed.');
