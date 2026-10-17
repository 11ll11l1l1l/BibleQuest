#!/usr/bin/env node
/* BibleQuest V7 construction guidebook mechanical integrity audit.
 * Not a visual-approval, Bible-context, copyright, likeness, pixel, or release gate.
 * Node built-ins only; safe to run on any checked-out branch with the guidebook present.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const base = join(root, 'docs/v7/unfinished-artwork-guide');
const contentDir = join(root, 'content/v7/devotionals');
const chapters = [
  ['01-first-story-shots.md', 30],
  ['02-second-story-shots.md', 30],
  ['03-third-narrative-shots.md', 30],
  ['04-prayer-wisdom-shots.md', 30],
  ['05-next-hour-action-shots.md', 24],
  ['06-faithful-action-shots.md', 30],
  ['07-reflection-practice-shots.md', 30],
  ['08-prayer-moments-shots.md', 30],
  ['09-trustworthy-sharing-shots.md', 30],
  ['10-remembrance-cue-shots.md', 30],
  ['11-original-backfill-shots.md', 6]
];
const sceneField = /\*\*(?:Mandatory scene|Generate this exact story|Visual action \(mandatory\)|Unique scene|Required unique scene|Required scene|Generate only this moment|Distinct human interaction|Unique remembrance cue):\*\* (.+)/i;
const toWords = s => new Set(String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').split(' ').filter(w=>w.length>3));
const similarity = (a,b) => {
  const A=toWords(a),B=toWords(b);
  return [...A].filter(w=>B.has(w)).length / Math.max(1, new Set([...A,...B]).size);
};
const errors=[], warnings=[], sourceMap = new Map(), guideMap = new Map(), scenes=[];
for (const file of readdirSync(contentDir).filter(f=>f.startsWith('biblequest-original-emotions-')&&f.endsWith('.json'))) {
  const relative='content/v7/devotionals/'+file;
  for (const item of JSON.parse(readFileSync(join(contentDir,file),'utf8')).items||[]) {
    if(item?.type!=='devotional'||item?.source?.kind!=='first_party'||item?.rights?.status!=='verified') continue;
    if(sourceMap.has(item.id)) errors.push('Duplicate source '+item.id);
    sourceMap.set(item.id,{item,path:relative});
  }
}
for (const [file, expected] of chapters) {
  let content;
  try{content=readFileSync(join(base,file),'utf8')}catch(e){errors.push('Cannot read chapter: '+file);continue}
  const blocks=content.split(/(?=^### devotional\.biblequest\.)/m).slice(1);
  if(blocks.length!==expected) errors.push(`${file} sections ${blocks.length} != ${expected}`);
  for(const block of blocks){
    const match=block.match(/^### (devotional\.biblequest\.[a-z0-9_]+\.\d+)\s*(?:—\s*(.+))?/m);
    if(!match){errors.push('Invalid heading in '+file);continue}
    const id=match[1], obj=sourceMap.get(id), prior=guideMap.get(id);
    if(prior) errors.push('Duplicate guide ID '+id+' in '+prior+' and '+file);
    guideMap.set(id,file);
    if(!obj){errors.push('Unknown devotional ID '+id);continue}
    const {item,path}=obj, title=item.sourceContent?.title||'', rev=item.revision, checksum=item.source?.checksum;
    if(!block.includes(title)) errors.push(id+' title mismatch/missing');
    if(!block.includes(rev)) errors.push(id+' revision not found');
    if(file!=='01-first-story-shots.md'&&file!=='02-second-story-shots.md'&&file!=='03-third-narrative-shots.md'){
      if(!block.includes(path)) errors.push(id+' wrong or missing original source file');
    }
    if(!file.startsWith('01-')&&!file.startsWith('02-')){
      if(!checksum||!block.includes(checksum)) errors.push(id+' checksum absent or stale');
      if(!block.includes(item.sourceContent.body)) errors.push(id+' exact source body absent or stale');
    } else {
      const anchor=block.match(/\*\*Source body anchor:\*\* ([^\n]+)/);
      if(!anchor||!item.sourceContent.body.startsWith(anchor[1].trim())) errors.push(id+' body anchor missing/mismatched');
    }
    const s=block.match(sceneField)?.[1]?.trim();
    if(!s||s.length<90) errors.push(id+' scene insufficient/absent');
    if(s)scenes.push({id,s,file});
  }
}
if(sourceMap.size!==300)errors.push('Eligible first-party source count is '+sourceMap.size+', expected 300');
if(guideMap.size!==300)errors.push('Guide covers '+guideMap.size+' unique IDs instead of 300');
for(const id of sourceMap.keys())if(!guideMap.has(id))errors.push('Missing coverage '+id);
for(let i=0;i<scenes.length;i++)for(let j=i+1;j<scenes.length;j++){
  if(scenes[i].s.toLowerCase()===scenes[j].s.toLowerCase())errors.push('Exact repeated scene: '+scenes[i].id+' + '+scenes[j].id);
  else if(similarity(scenes[i].s,scenes[j].s)>=0.78)warnings.push('Manually compare potentially similar brief: '+scenes[i].id+' + '+scenes[j].id);
}
console.log(JSON.stringify({guideCount:guideMap.size,sourceCount:sourceMap.size,chapterCount:chapters.length,errors,warnings:warnings.slice(0,150),warningTotal:warnings.length,mechanicalStatus:errors.length?'FAIL':'PASS',editorialApproved:0,releaseCertified:0},null,2));
if(errors.length)process.exitCode=1;
