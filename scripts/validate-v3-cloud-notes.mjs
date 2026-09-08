import fs from 'node:fs';

const failures=[];
const fail=message=>failures.push(message);
const read=file=>fs.readFileSync(file,'utf8');
const required=['src/app/cloud-notes.js','src/features/cloud-notes/index.js','src/ui/cloud-notes.css','tests/v3-cloud-notes-edge.mjs','tests/v3-cloud-notes-smoke.mjs'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing Cloud Notes contract file: ${file}`);

if(!failures.length){
  const owner=read('src/app/cloud-notes.js'),ui=read('src/features/cloud-notes/index.js'),api=read('src/core/api.js'),privateOwner=read('src/app/private-notes.js'),privateUi=read('src/features/private-notes/index.js'),bootstrap=read('src/app/bootstrap.js'),learn=read('src/features/learn/index.js'),html=read('index.html'),workflow=read('.github/workflows/v3-regression.yml'),architecture=read('ARCHITECTURE_V3.md'),inventory=read('FEATURE_INVENTORY_V3.md');
  for(const contract of['export function createCloudNotesService','api.list','api.create','api.update','api.remove','BQ_CLOUD_NOTES_AUTH_REQUIRED','BQ_CLOUD_NOTES_CONFLICT','updatedAt'])if(!owner.includes(contract))fail(`Cloud Notes owner missing required contract: ${contract}`);
  if(/localStorage|sessionStorage|storage\.|from\(['"]bible_notes|createClient|supabase|document\.|window\./.test(owner))fail('Cloud Notes owner must use only centralized API/session boundaries and in-memory state.');
  if(/localStorage|sessionStorage|storage\.|createClient|supabase|from\(['"]bible_notes|fetch\s*\(/.test(ui))fail('Cloud Notes UI bypasses its owner or shared API/session boundaries.');
  if(/cloudNotes|bible_notes|supabase|createClient|fetch\s*\(/.test(privateOwner))fail('Private Notes owner must remain independent of Cloud Notes/backend code.');
  if(!privateUi.includes('does not upload or sync these notes to an account'))fail('Private Notes UI lost its device-only/no-cloud promise.');
  for(const contract of["from('bible_notes')",".eq('user_id',userId)",".eq('updated_at',expectedUpdatedAt)",'const cloudNotes = Object.freeze'])if(!api.includes(contract))fail(`Central API missing Cloud Notes contract: ${contract}`);
  for(const contract of['createCloudNotesService({api:api.cloudNotes,session})',"'cloud-notes':()=>cloudNotesPage", "onCloudNotes:()=>router.navigate('cloud-notes')"])if(!bootstrap.includes(contract))fail(`Bootstrap missing Cloud Notes composition contract: ${contract}`);
  if(!learn.includes('data-open-cloud-notes'))fail('Learn must expose Cloud Notes separately from Private Notes.');
  if(!html.includes('src/ui/cloud-notes.css'))fail('index.html must load Cloud Notes styles.');
  if(!ui.includes('never uploaded automatically'))fail('Cloud Notes UI must state that Private Notes are never auto-uploaded.');
  for(const contract of['## Cloud Notes boundaries','existing `public.bible_notes` backend contract','Private Notes are never uploaded','Cloud Notes owner'])if(!architecture.includes(contract))fail(`Architecture contract missing Cloud Notes boundary: ${contract}`);
  if(!inventory.includes('| 55 | Private local notes | Yes | Clean | Regression-tested |'))fail('Inventory must promote #55 to Regression-tested after the #56 full gate.');
  if(!inventory.includes('| 56 | Cloud notes | Yes | Compatibility | Regression-tested |'))fail('Inventory must promote #56 Cloud Notes after the later #66 full gate.');
  for(const total of['**Regression-tested:** 57','**Verified:** 1','**Not started:** 42'])if(!inventory.includes(total))fail(`Inventory totals missing post-#95 bookkeeping: ${total}`);
  for(const test of['node tests/v3-cloud-notes-edge.mjs','node tests/v3-cloud-notes-smoke.mjs'])if(!workflow.includes(test))fail(`Accumulated workflow missing Cloud Notes regression: ${test}`);
}

if(failures.length){console.error(failures.map(item=>`- ${item}`).join('\n'));process.exit(1)}
console.log('BibleQuest v3 Cloud Notes architecture boundaries passed.');
