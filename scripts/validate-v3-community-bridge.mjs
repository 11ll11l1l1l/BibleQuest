import fs from 'node:fs';
import {workflowInvokesNode} from './v3-workflow-contract.mjs';
const failures=[],fail=message=>failures.push(message),read=file=>fs.readFileSync(file,'utf8');
const required=['COMMUNITY_BRIDGE_V3.md','FEATURE_INVENTORY_V3.md','community-bridge.js','community.js','src/app/community-bridge.js','src/features/community/index.js','src/ui/community.css','src/app/bootstrap.js','src/features/more/index.js','index.html','tests/v3-community-bridge-edge.mjs','tests/v3-community-bridge-smoke.mjs','.github/workflows/v3-regression.yml'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing #67 Community Bridge file: ${file}`);
if(!failures.length){
  const legacy=read('community-bridge.js'),community=read('community.js'),owner=read('src/app/community-bridge.js'),ui=read('src/features/community/index.js'),bootstrap=read('src/app/bootstrap.js'),more=read('src/features/more/index.js'),html=read('index.html'),contract=read('COMMUNITY_BRIDGE_V3.md'),inventory=read('FEATURE_INVENTORY_V3.md'),workflow=read('.github/workflows/v3-regression.yml');
  for(const item of['Storage.prototype.setItem','appDelta','couplesDelta','BQCommunityBridge'])if(!legacy.includes(item))fail(`Legacy Community Bridge evidence missing: ${item}`);
  for(const item of['Leaderboards','Badges','Roster','Group Play'])if(!community.includes(item))fail(`Legacy Community destination evidence missing: ${item}`);
  for(const item of['createCommunityBridgeService({session,congregation,journeyGroups,encouragements','BQ_COMMUNITY_BRIDGE_MALFORMED','BQ_COMMUNITY_BRIDGE_SCOPE',"'local-preview'",'encouragements.load()','encouragementCount:items.length'])if(!owner.includes(item))fail(`Community Bridge owner missing contract: ${item}`);
  for(const forbidden of['localStorage','sessionStorage','Storage.prototype','createClient','@supabase','functions.invoke',".from('",'awardPoints','createProgressService'])if(owner.includes(forbidden))fail(`Community Bridge owner bypasses verified owners: ${forbidden}`);
  for(const forbidden of['localStorage','sessionStorage','createClient','@supabase','functions.invoke',".from('"])if(ui.includes(forbidden))fail(`Community UI bypasses its owner: ${forbidden}`);
  for(const item of['createCommunityBridgeService({session,congregation,journeyGroups,encouragements})','community:()=>communityPage','onCommunity:()=>router.navigate(\'community\')','communityBridge.clear()'])if(!bootstrap.includes(item))fail(`Bootstrap missing #67 composition: ${item}`);
  if(!more.includes('data-open-community'))fail('More must expose the Community route.');
  if(!html.includes('src/ui/community.css'))fail('v3 shell must load Community styles.');
  for(const item of['sole read-only cross-feature projection owner','does not intercept `Storage.prototype`','trusted score events (#70)','No Supabase migration'])if(!contract.includes(item))fail(`Community Bridge contract missing boundary: ${item}`);
  const rows=['| 67 | Community bridge | Yes | Compatibility | Implemented | cross-feature navigation/data contract |','| 67 | Community bridge | Yes | Compatibility | Verified | cross-feature navigation/data contract |','| 67 | Community bridge | Yes | Compatibility | Regression-tested | cross-feature navigation/data contract |'];if(!rows.some(row=>inventory.includes(row)))fail('#67 must be Implemented or better once clean v3 code exists.');
  for(const test of['scripts/validate-v3-community-bridge.mjs','tests/v3-community-bridge-edge.mjs','tests/v3-community-bridge-smoke.mjs'])if(!workflowInvokesNode(workflow,test))fail(`Accumulated workflow missing #67 regression: ${test}`);
}
if(failures.length){failures.forEach(item=>console.error(`- ${item}`));process.exit(1)}
console.log('BibleQuest v3 Community Bridge architecture boundary passed.');
