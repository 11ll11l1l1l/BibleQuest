import fs from 'node:fs';

const failures=[];
const fail=message=>failures.push(message);
const read=file=>fs.readFileSync(file,'utf8');
const required=['src/app/private-notes.js','src/features/private-notes/index.js','src/ui/private-notes.css','tests/v3-private-notes-edge.mjs','tests/v3-private-notes-smoke.mjs'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing Private Notes contract file: ${file}`);

if(!failures.length){
  const owner=read('src/app/private-notes.js');
  const ui=read('src/features/private-notes/index.js');
  const bootstrap=read('src/app/bootstrap.js');
  const learn=read('src/features/learn/index.js');
  const html=read('index.html');
  const workflow=read('.github/workflows/v3-regression.yml');

  for(const contract of['export function createPrivateNotesService','private-notes','storage.read','storage.write','biblequest.private-notes','exportJson','function create','function update','function remove'])if(!owner.includes(contract))fail(`Private Notes owner missing required contract: ${contract}`);
  if(/document\.|window\.|localStorage|sessionStorage|createClient|supabase|progress\.record|lesson\./.test(owner))fail('Private Notes owner must remain DOM/global/storage-implementation/backend/Progress/Lesson independent.');
  if(/localStorage|sessionStorage|storage\.|createClient|supabase|progress\.record|lesson\.|fetch\s*\(/.test(ui))fail('Private Notes UI bypasses its owner or another shared boundary.');

  const ownerDefs=[...owner.matchAll(/export function createPrivateNotesService/g)].length;
  if(ownerDefs!==1)fail(`Exactly one Private Notes service definition is required; found ${ownerDefs}.`);
  for(const contract of["createPrivateNotesService({storage})","'private-notes':()=>privateNotesPage","onPrivateNotes:()=>router.navigate('private-notes')"])if(!bootstrap.includes(contract))fail(`Bootstrap missing Private Notes composition contract: ${contract}`);
  if(!learn.includes('data-open-private-notes'))fail('Learn must expose the verified Private Notes route.');
  if(!html.includes('src/ui/private-notes.css'))fail('index.html must load Private Notes styles.');
  if(!ui.includes('does not upload or sync these notes to an account'))fail('Private Notes UI must preserve the explicit device-only/no-cloud boundary.');
  for(const test of['node tests/v3-private-notes-edge.mjs','node tests/v3-private-notes-smoke.mjs'])if(!workflow.includes(test))fail(`Accumulated workflow missing Private Notes regression: ${test}`);
}

if(failures.length){console.error(failures.map(item=>`- ${item}`).join('\n'));process.exit(1)}
console.log('BibleQuest v3 Private Notes architecture boundaries passed.');
