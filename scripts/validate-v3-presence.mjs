import fs from 'node:fs';
import {workflowInvokesNode} from './v3-workflow-contract.mjs';
const failures=[],fail=message=>failures.push(message),read=file=>fs.readFileSync(file,'utf8');
const required=['PRESENCE_V3.md','FEATURE_INVENTORY_V3.md','src/app/presence.js','src/app/session.js','src/core/api.js','src/app/bootstrap.js','tests/v3-presence-edge.mjs','tests/v3-presence-smoke.mjs','.github/workflows/v3-regression.yml'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing #68 Presence file: ${file}`);
if(!failures.length){
  const owner=read('src/app/presence.js'),session=read('src/app/session.js'),api=read('src/core/api.js'),bootstrap=read('src/app/bootstrap.js'),contract=read('PRESENCE_V3.md'),inventory=read('FEATURE_INVENTORY_V3.md'),workflow=read('.github/workflows/v3-regression.yml');
  for(const item of['createPresenceService','PRESENCE_HEARTBEAT_MS=60000','PRESENCE_STALE_MS=150000','BQ_PRESENCE_SCOPE','api.touch','api.list','api.leave','session.beforeSignOut','store.subscribe','congregation.can'])if(!owner.includes(item))fail(`Presence owner missing contract: ${item}`);
  for(const forbidden of['createClient','@supabase','functions.invoke',".from('",'localStorage','sessionStorage'])if(owner.includes(forbidden))fail(`Presence owner bypasses shared boundaries: ${forbidden}`);
  for(const item of["from('bible_presence').select(PRESENCE_FIELDS)","from('bible_presence').upsert(row", "from('bible_presence').delete()", "onConflict:'congregation_id,user_id'"])if(!api.includes(item))fail(`Presence API boundary missing: ${item}`);
  for(const item of['beforeSignOutListeners','async function signOut()','Promise.allSettled(cleanups)','await auth.signOut()'])if(!session.includes(item))fail(`Session cleanup boundary missing: ${item}`);
  if(session.indexOf('Promise.allSettled(cleanups)')>session.indexOf('await auth.signOut()'))fail('Session must run registered cleanup before discarding auth.');
  for(const item of["import { createPresenceService } from './presence.js'",'createPresenceService({api:api.presence,session,congregation,store})','presence.start()','void presence.dispose()'])if(!bootstrap.includes(item))fail(`Bootstrap missing #68 lifecycle composition: ${item}`);
  for(const item of['existing `public.bible_presence` table','60 seconds','150 seconds','stale timeout','No new table or Supabase migration'])if(!contract.includes(item))fail(`Presence contract missing boundary: ${item}`);
  if(!inventory.includes('| 68 | Presence | Yes | Compatibility |'))fail('Inventory #68 Presence row is missing.');
  for(const test of['scripts/validate-v3-presence.mjs','tests/v3-presence-edge.mjs','tests/v3-presence-smoke.mjs'])if(!workflowInvokesNode(workflow,test))fail(`Accumulated workflow missing #68 regression: ${test}`);
}
if(failures.length){failures.forEach(item=>console.error(`- ${item}`));process.exit(1)}
console.log('BibleQuest v3 Presence architecture boundary passed.');
