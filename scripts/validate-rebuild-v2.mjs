import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';

const root=path.resolve(process.cwd());
const required=['index.html','bq2.css','bq2-data.js','bq2.js','bq2-reader.js','bq2-games.js','bq2-grow.js','bq2-study.js','bq2-sw.js','data/questions.js','data/stories.js'];
const legacyBoot=['runtime-safety.js','app.js','reader.js','translations.js','transformation.js','cloud.js','live-rooms.js','modern-home.js','journey-loop.js','frontpage-daily.js','quest-media.js','runtime-recovery.js','operational-hardening.js','transform-launcher.js'];
let failures=[];
const fail=m=>failures.push(m);
for(const file of required)if(!fs.existsSync(path.join(root,file)))fail(`Missing required file: ${file}`);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const file of required.filter(x=>x.endsWith('.js')||x.endsWith('.css')))if(!html.includes(file)&&!['bq2-sw.js'].includes(file))fail(`index.html does not reference ${file}`);
for(const old of legacyBoot)if(html.includes(`src="${old}"`)||html.includes(`href="${old}"`))fail(`Legacy runtime reintroduced into index.html: ${old}`);
for(const file of ['bq2-data.js','bq2.js','bq2-reader.js','bq2-games.js','bq2-grow.js','bq2-study.js','bq2-sw.js']){
  try{execFileSync(process.execPath,['--check',path.join(root,file)],{stdio:'pipe'})}catch(e){fail(`Syntax check failed: ${file}\n${e.stderr?.toString()||e.message}`)}
}
try{
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'bq2-data.js'),'utf8'),context,{filename:'bq2-data.js'});
  const books=context.window.BQ2_DATA?.books||[];
  if(books.length!==66)fail(`Expected 66 Bible books, found ${books.length}`);
  for(const b of books){
    const english=path.join(root,'data','packs','bible',`${b.code}.json`);
    const tagalog=path.join(root,'data','packs','tagalog',`${b.code}.json`);
    if(!fs.existsSync(english))fail(`Missing English Bible pack for ${b.name}: ${b.code}.json`);
    if(!fs.existsSync(tagalog))fail(`Missing Tagalog Bible pack for ${b.name}: ${b.code}.json`);
  }
}catch(e){fail(`Could not validate Bible data model: ${e.message}`)}
if(failures.length){console.error(`BibleQuest clean rebuild validation FAILED (${failures.length})`);for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('BibleQuest clean rebuild validation passed.');
console.log('Boot: clean modular runtime only; legacy runtime excluded.');
console.log('Bible packs: English 66/66 + Tagalog 66/66 present.');
