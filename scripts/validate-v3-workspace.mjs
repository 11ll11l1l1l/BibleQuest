import fs from 'node:fs';
import {workflowInvokesNode} from './v3-workflow-contract.mjs';
const failures=[],fail=message=>failures.push(message),read=file=>fs.readFileSync(file,'utf8');
const required=['WORKSPACE_V3.md','FEATURE_INVENTORY_V3.md','src/app/workspace.js','src/features/workspace/index.js','src/app/cloud-notes.js','src/app/reader.js','src/app/congregation-membership.js','src/core/storage.js','src/app/bootstrap.js','src/features/more/index.js','tests/v3-workspace-edge.mjs','tests/v3-workspace-smoke.mjs','.github/workflows/v3-regression.yml'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing #78 Workspace file: ${file}`);
if(!failures.length){
  const contract=read('WORKSPACE_V3.md'),owner=read('src/app/workspace.js'),ui=read('src/features/workspace/index.js'),bootstrap=read('src/app/bootstrap.js'),more=read('src/features/more/index.js'),inventory=read('FEATURE_INVENTORY_V3.md'),workflow=read('.github/workflows/v3-regression.yml');
  for(const item of["const STORAGE_KEY='workspace-state'",'cloudNotes.load()','congregation.load()','reader.getState()','storage.write(STORAGE_KEY'])if(!owner.includes(item))fail(`Workspace owner missing composition/state boundary: ${item}`);
  for(const item of['openScripture','reader.setBook(note.book,note.chapter)',"cloudNotesRoute:()=> 'cloud-notes'","readerRoute:()=> 'reader'",'sharedWorkspace:false'])if(!owner.includes(item))fail(`Workspace owner missing fixed delegation/fail-closed contract: ${item}`);
  for(const forbidden of['localStorage','sessionStorage','createClient','@supabase','functions.invoke',".from('",'.insert(','.update(','.delete(','.upsert(','window.BQ'])if(owner.includes(forbidden))fail(`Workspace owner bypasses verified owners: ${forbidden}`);
  for(const forbidden of['localStorage','sessionStorage','createClient','@supabase','functions.invoke',".from('",'.insert(','.update(','.delete(','.upsert(','window.BQ'])if(ui.includes(forbidden))fail(`Workspace UI bypasses application owners: ${forbidden}`);
  for(const item of["import { createWorkspaceService } from './workspace.js'","import { workspacePage } from '../features/workspace/index.js'",'createWorkspaceService({session,cloudNotes,congregation,reader,storage})',"workspace:()=>workspacePage",'onWorkspace:()=>router.navigate(\'workspace\')','workspace.clear()'])if(!bootstrap.includes(item))fail(`Bootstrap missing #78 composition: ${item}`);
  if(!more.includes('data-open-workspace'))fail('More must expose the Workspace route.');
  if(/Workspace[^<\n]{0,80}(remain|unavailable|still being rebuilt)/i.test(more))fail('More must not still describe Workspace itself as unavailable after #78 wiring.');
  for(const item of['open; save state; role/session boundary','only new persisted Workspace state','Cloud Notes','Reader','Legacy bookmark/highlight','does **not** invent'])if(!contract.includes(item))fail(`Workspace contract missing recovered boundary: ${item}`);
  for(const forbidden of['note text','search terms','account IDs','congregation IDs','auth tokens'])if(!contract.includes(forbidden))fail(`Workspace contract must state non-persistence of sensitive state: ${forbidden}`);
  const lifecycle=['Not started','Implemented','Verified','Regression-tested'];if(!lifecycle.some(status=>inventory.includes(`| 78 | Workspace | Yes | Compatibility | ${status} | open; save state; role/session boundary |`)))fail('#78 inventory row is missing or malformed.');
  for(const test of['scripts/validate-v3-workspace.mjs','tests/v3-workspace-edge.mjs','tests/v3-workspace-smoke.mjs'])if(!workflowInvokesNode(workflow,test))fail(`Accumulated workflow missing #78 regression: ${test}`);
}
if(failures.length){failures.forEach(item=>console.error(`- ${item}`));process.exit(1)}
console.log('BibleQuest v3 Workspace architecture boundary passed.');
