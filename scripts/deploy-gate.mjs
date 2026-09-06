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

const indexRefs=localRefs(read('index.html')).filter(ref=>/\.(?:js|css|webmanifest|svg|webp)$/i.test(ref));
const sw=read('sw.js');
for(const ref of indexRefs){
  if(!sw.includes(`'./${ref}'`)&&!sw.includes(`"./${ref}"`))fail(`PWA shell missing index asset: ${ref}`);
}
console.log('✓ PWA shell covers Home assets');

const liveRooms=read('live-rooms.js');
if(!liveRooms.includes('window.BQLiveRooms='))fail('Live Rooms module does not expose window.BQLiveRooms');
if(!liveRooms.includes("}).join('')}</div>`}"))fail('Live Rooms poll rendering regression guard failed');
console.log('✓ Live Rooms startup/module guard');

const runtimeRegistry=read('runtime-feature-registry.js');
if(runtimeRegistry.includes('new MutationObserver'))fail('Runtime feature registry must not observe the entire document');
if(!runtimeRegistry.includes('bq-modern-home-rendered'))fail('Runtime feature injection must follow the Home render lifecycle');
console.log('✓ Runtime feature injection guard');

console.log('BibleQuest deployment gate passed.');
