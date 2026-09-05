import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const index=read('index.html');
const recognition=read('congregation-recognition.js');
const cloud=read('cloud.js');
const score=read('supabase/functions/bq-score/index.ts');

for(const asset of ['congregation-recognition.css','congregation-recognition.js'])assert(index.includes(asset),`production app missing ${asset}`);
assert(recognition.includes("c.rpc('bible_leaderboard'"),'recognition must use trusted cloud leaderboard RPC');
for(const table of ['bible_congregation_members','bible_user_badges','bible_badge_catalog'])assert(recognition.includes(table),`recognition missing ${table}`);
for(const period of ['today','week','all'])assert(recognition.includes(`['${period}'`)||recognition.includes(`'${period}'`),`recognition missing ${period} period`);
for(const lane of ['overall','knowledge','reading','wisdom','mastery','consistency','group','couples'])assert(recognition.includes(`'${lane}'`),`recognition missing ${lane} lane`);
assert(recognition.includes('data-congratulate')&&recognition.includes('navigator.clipboard.writeText'),'leaders need a direct congratulations action');
assert(recognition.includes('api.openBoard=open'),'Community leaderboard entry must route to cloud recognition');
assert(recognition.includes('return originalBoard?.()'),'local/offline board must remain a safe fallback');
assert(cloud.includes("client.rpc('bible_leaderboard'"),'cloud sync must retain congregation leaderboard loading');
assert(score.includes("admin.from('bible_user_badges').upsert"),'trusted scoring engine must continue awarding persisted cloud badges');
assert(score.includes("admin.from('bible_badge_catalog')"),'badge awards must come from the central badge catalog');

console.log('Congregation recognition static smoke passed: cloud rankings, names, badges, awards and congratulations are wired.');
