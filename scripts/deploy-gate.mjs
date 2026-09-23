import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const fail=message=>{throw new Error(message)};
const exists=p=>fs.existsSync(path.join(root,p));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

function walk(dir='.'){
  const output=[];
  for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
    if(entry.name==='.git'||entry.name==='node_modules')continue;
    const rel=path.join(dir,entry.name);
    if(entry.isDirectory())output.push(...walk(rel));
    else output.push(rel.replace(/^\.\//,''));
  }
  return output;
}

function localRefs(html){
  return [
    ...[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m=>m[1]),
    ...[...html.matchAll(/<link[^>]+href=["']([^"']+)["']/gi)].map(m=>m[1])
  ].filter(ref=>!/^https?:/i.test(ref)&&!ref.startsWith('//')&&!ref.startsWith('data:')&&!ref.startsWith('#'))
   .map(ref=>ref.replace(/^\.\//,'').replace(/^\//,'').split(/[?#]/)[0]);
}

console.log('BibleQuest deployment gate');

const files=walk();
const jsFiles=files.filter(file=>file.endsWith('.js'));
for(const file of jsFiles){
  execFileSync(process.execPath,['--check',file],{cwd:root,stdio:'pipe'});
}
console.log(`✓ JavaScript syntax: ${jsFiles.length} files`);

const entries=['index.html','transform.html','psychometrics.html','content-review.html','admin.html','admin-operations.html','reset.html'];
for(const entry of entries){
  if(!exists(entry))fail(`Missing production entry point: ${entry}`);
  const refs=localRefs(read(entry));
  const missing=refs.filter(ref=>!exists(ref));
  if(missing.length)fail(`${entry} references missing local assets: ${missing.join(', ')}`);
}
console.log('✓ Production entry-point assets exist');

const v5Bootstrap=read('src/app/bootstrap.js');
const requiredV5Routes=[
  {
    route:'bible-quest',
    files:['src/app/bible-quest.js','src/features/bible-quest/index.js'],
    owner:[
      "import { bibleQuestPage } from '../features/bible-quest/index.js';",
      "const bibleQuestPage = args => lazyFeaturePage('bible-quest', 'bibleQuestPage', args);"
    ],
    registration:"'bible-quest':()=>bibleQuestPage(",
    entry:"onBibleQuest:()=>router.navigate('bible-quest')"
  },
  {
    route:'explorer',
    files:['src/app/explorer.js','src/features/explorer/index.js'],
    owner:[
      "import { explorerPage } from '../features/explorer/index.js';",
      "const explorerPage = args => lazyFeaturePage('explorer', 'explorerPage', args);"
    ],
    registration:'explorer:()=>explorerPage(',
    entry:"onExplorer:()=>router.navigate('explorer')"
  },
  {
    route:'challenges',
    files:['src/app/personal-challenges.js','src/features/challenges/index.js'],
    owner:[
      "import { challengesPage } from '../features/challenges/index.js';",
      "const challengesPage = args => lazyFeaturePage('challenges', 'challengesPage', args);"
    ],
    registration:'challenges:()=>challengesPage(',
    entry:"onChallenges:()=>router.navigate('challenges')"
  }
];
for(const contract of requiredV5Routes){
  for(const file of contract.files){
    if(!exists(file))fail(`Required V5 route ${contract.route} is missing implementation file: ${file}`);
  }
  if(!contract.owner.some(needle=>v5Bootstrap.includes(needle))){
    fail(`Required V5 route ${contract.route} is missing static-or-lazy page ownership`);
  }
  for(const [label,needle] of Object.entries({registration:contract.registration,'navigation entry':contract.entry})){
    if(!v5Bootstrap.includes(needle))fail(`Required V5 route ${contract.route} is missing ${label}`);
  }
}
console.log(`✓ Required V5 routes are reachable: ${requiredV5Routes.map(item=>item.route).join(', ')}`);

if(!exists('offline-shell-sw.js')||!exists('src/app/offline-shell.js'))fail('Missing v3 offline-shell owner or worker');
const offlineShellOwner=read('src/app/offline-shell.js');
const offlineShellWorker=read('offline-shell-sw.js');
for(const contract of ["register('offline-shell-sw.js',{scope:'./',updateViaCache:'none'})",'BIBLEQUEST_WARM_SHELL',"getEntriesByType?.('resource')"]){
  if(!offlineShellOwner.includes(contract))fail(`v3 offline-shell owner missing contract: ${contract}`);
}
for(const contract of ['BIBLEQUEST_WARM_SHELL',"addEventListener('fetch'","request.mode==='navigate'",'SHELL_DESTINATIONS']){
  if(!offlineShellWorker.includes(contract))fail(`v3 offline-shell worker missing contract: ${contract}`);
}
console.log('✓ PWA shell uses the v3 runtime-warming owner/worker');

const liveRooms=read('live-rooms.js');
if(!liveRooms.includes('window.BQLiveRooms='))fail('Live Rooms module does not expose window.BQLiveRooms');
if(!liveRooms.includes("}).join('')}</div>`}"))fail('Live Rooms poll rendering regression guard failed');
console.log('✓ Live Rooms startup/module guard');

const runtimeRecovery=read('runtime-recovery.js');
if(!runtimeRecovery.includes("if(label==='Transformation')return"))fail('Generic runtime recovery must yield Transformation clicks to the dedicated Transform menu launcher');
console.log('✓ Transform menu click ownership guard');

const runtimeRegistry=read('runtime-feature-registry.js');
if(runtimeRegistry.includes('new MutationObserver'))fail('Runtime feature registry must not observe the entire document');
if(!runtimeRegistry.includes('bq-modern-home-rendered'))fail('Runtime feature injection must follow the Home render lifecycle');
console.log('✓ Runtime feature injection guard');

console.log('BibleQuest deployment gate passed.');
