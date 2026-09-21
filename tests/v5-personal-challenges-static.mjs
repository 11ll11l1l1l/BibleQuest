import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

for(const file of[
  'src/features/challenges/content.js',
  'src/app/personal-challenges.js',
  'src/app/personal-challenges-cloud-sync.js',
  'src/features/challenges/index.js',
  'src/features/more/index.js',
  'src/app/bootstrap.js'
]) execFileSync(process.execPath,['--check',file],{stdio:'pipe'});

const contentSource=fs.readFileSync('src/features/challenges/content.js','utf8');
const service=fs.readFileSync('src/app/personal-challenges.js','utf8');
const cloud=fs.readFileSync('src/app/personal-challenges-cloud-sync.js','utf8');
const page=fs.readFileSync('src/features/challenges/index.js','utf8');
const more=fs.readFileSync('src/features/more/index.js','utf8');
const bootstrap=fs.readFileSync('src/app/bootstrap.js','utf8');
const sprite=fs.readFileSync('assets/more-feature-icons.svg','utf8');

for(const key of['gospel7','proverbs30','acts28','couples7','family7','john21','psalms14','james5','prayer7','serve7']){
  assert.ok(contentSource.includes("key:'"+key+"'"),'Active Personal Challenge definitions missing '+key);
}
for(const token of[
  "STORAGE_KEY='personal-challenges-state-v1'",
  'function start(key)',
  'function completeNext(key,day)',
  "target!==current.nextDay",
  'function exportAccountState()',
  'function mergeFromAccount(remoteInput)',
  'done:Object.keys(row.completedAt||{})'
]) assert.ok(service.includes(token),'Personal Challenge owner missing contract: '+token);
assert.ok(!service.includes('progress.record'),'Personal Challenge habit completion must not silently become XP/score.');

for(const token of[
  "SLICE_KEY='biblequest_personal_challenges_v1'",
  "OWNER_KEY='bq-personal-challenges-sync-owner-v1'",
  'accountCacheKey',
  'BQ_PROGRESS_SNAPSHOT_CONFLICT',
  'saveSlice',
  'switchToGuest'
]) assert.ok(cloud.includes(token),'Personal Challenge account sync missing contract: '+token);

for(const token of[
  'data-personal-challenges-page',
  'data-personal-challenge-open',
  'data-personal-challenge-start',
  'data-personal-challenge-complete',
  'data-personal-challenge-state',
  'data-personal-challenge-reader'
]) assert.ok(page.includes(token),'Active Personal Challenge page missing UI contract: '+token);
assert.ok(page.includes("locked:!done&&!isNext")||service.includes("locked:!done&&!isNext"),'Future Personal Challenge days must remain locked.');
assert.ok(page.includes('BibleQuest does not treat these habits as a spiritual score.'),'Challenge page must state the non-scoring product rule.');

assert.ok(more.includes('data-more-challenges')&&more.includes('data-open-challenges'),'More must expose Personal Challenges.');
assert.ok(more.includes("featureIcon('challenge')"),'More must use the semantic Challenges icon.');
assert.ok(sprite.includes('id="challenge"'),'More icon sprite must include the Challenges symbol.');

for(const token of[
  "createPersonalChallengesService",
  "createPersonalChallengesCloudSyncService",
  "challenges:()=>challengesPage",
  "onChallenges:()=>router.navigate('challenges')",
  ".then(()=>personalChallengesCloudSync.syncNow())",
  "personalChallengesCloudSync.dispose()"
]) assert.ok(bootstrap.includes(token),'Bootstrap missing active Personal Challenges composition: '+token);

console.log('BibleQuest V5 active Personal Challenges static regression passed.');
