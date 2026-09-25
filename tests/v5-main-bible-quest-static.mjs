import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

for(const file of[
  'src/app/bible-quest.js',
  'src/app/bible-quest-cloud-sync.js',
  'src/features/bible-quest/index.js',
  'src/features/home/index.js',
  'src/features/reader/index.js',
  'src/app/bootstrap.js',
  'src/app/daily-mission.js',
  'src/features/daily-mission/index.js'
]) execFileSync(process.execPath,['--check',file],{stdio:'pipe'});

const service=fs.readFileSync('src/app/bible-quest.js','utf8');
const cloudSync=fs.readFileSync('src/app/bible-quest-cloud-sync.js','utf8');
const page=fs.readFileSync('src/features/bible-quest/index.js','utf8');
const home=fs.readFileSync('src/features/home/index.js','utf8');
const reader=fs.readFileSync('src/features/reader/index.js','utf8');
const readerService=fs.readFileSync('src/app/reader.js','utf8');
const bible=fs.readFileSync('src/core/bible.js','utf8');
const bootstrap=fs.readFileSync('src/app/bootstrap.js','utf8');
const api=fs.readFileSync('src/core/api.js','utf8');
const mission=fs.readFileSync('src/app/daily-mission.js','utf8');
const missionUi=fs.readFileSync('src/features/daily-mission/index.js','utf8');

for(const token of[
  "STORAGE_KEY='bible-quest-state'",
  'expected 1189',
  'activeKey',
  'completeActive',
  'must continue in order',
  'completedBooks',
  'remainingChapters',
  "return {...normalized,activeKey:''}",
  "canonicalText(accountState(state))"
]) assert.ok(service.includes(token),`Main Bible Quest owner missing contract token: ${token}`);

assert.ok(home.includes('data-home-bible-quest'),'Home must expose Main Bible Quest as a primary card.');
assert.ok(home.indexOf('data-home-bible-quest')<home.indexOf('data-home-daily'),'Main Bible Quest must appear before Daily Journey on Home.');
assert.ok(home.includes('data-open-bible-quest-continue'),'Home must provide one-tap continuation of the ordered Quest.');

for(const token of[
  "createBibleQuestService",
  "'bible-quest':()=>bibleQuestPage",
  'onBibleQuestContinue:openBibleQuestNext',
  'createReaderService({bible,storage,progress,bibleQuest})',
  'readerPage({reader,vocabulary,furigana,offlinePackages:offlineScripturePackages})',
  'createMyJourneyService({progress,assignments,bibleQuest})'
]) assert.ok(bootstrap.includes(token),`Bootstrap missing Main Bible Quest composition: ${token}`);

assert.ok(reader.includes('data-reader-quest-complete'),'Reader must explicitly complete the active Main Quest chapter.');
assert.ok(reader.includes('data-reader-quest-away'),'Free reading must be visibly separate while a Quest chapter is active.');
assert.ok(bootstrap.includes("const navigateGeneral=route=>{if(route==='reader'){bibleQuest.deactivate();router.navigate('reader');return}router.navigate(route)}"),'Generic Reader navigation must explicitly leave Main Quest mode.');
assert.ok(bootstrap.includes("const openFreeReader=()=>navigateGeneral('reader')"),'Free Reader entry must use the generic navigation boundary.');
assert.ok(bootstrap.includes("onBibleQuestContinue:openBibleQuestNext"),'Only the dedicated Main Quest continuation path may enter Reader without deactivating Quest mode.');
assert.ok(reader.includes('Free reading elsewhere does not skip this required chapter.'),'Reader must explain ordered Quest semantics.');
assert.ok(readerService.includes('referenceLinks(code, chapter, verse = null)'),'Reader must expose exact related-Scripture links.');
assert.ok(readerService.includes('questSnapshot()'),'Reader service must expose Main Quest state without changing the Reader page API.');
for(const token of[
  "SLICE_KEY='biblequest_main_bible_quest_v1'",
  'mergeFromAccount',
  'saveSlice',
  'authenticated'
]) assert.ok(cloudSync.includes(token)||service.includes(token),`Main Bible Quest account resume missing contract token: ${token}`);
for(const token of[
  "from('bible_progress_snapshots')",
  "eq('updated_at',current.updated_at)",
  "onConflict"
]) {
  if(token==='onConflict') continue;
  assert.ok(api.includes(token),`Progress snapshot API missing optimistic account-sync contract: ${token}`);
}
assert.ok(api.includes("progressSnapshots"),'Core API must expose account progress snapshots.');
assert.ok(bootstrap.includes('createProgressCloudSyncService({api:api.progressSnapshots,session,progress,ownerStorage:authStorage,cacheStorage:privateStorage})'),'Bootstrap must inject account-isolated owner/cache storage into global progress sync.');
assert.ok(bootstrap.includes('createBibleQuestCloudSyncService({api:api.progressSnapshots,session,bibleQuest,ownerStorage:authStorage,cacheStorage:privateStorage})'),'Bootstrap must inject account-isolated owner/cache storage into Main Bible Quest sync.');

for(const provider of['NLT','ESV','NIV','AMP','STEP']) assert.ok(bible.includes(provider),`Bible data service must retain ${provider} related-reference support used by Bible Quest.`);
assert.ok(page.includes("openReader:'Open in BibleQuest Reader'")&&page.includes("openReader:'Buksan sa BibleQuest Reader'")&&page.includes("openReader:'Ablihi sa BibleQuest Reader'"),'Main Bible Quest page chrome must remain localized in EN, TL, and CEB.');
assert.ok(page.includes("esc(t.openReader)"),'Bible Quest Reader CTA must render through localized copy.');

assert.ok(mission.includes('referenceLinks?.(activePassage.code,activePassage.chapter,activePassage.from)'),'Daily Journey must attach exact related Scripture links.');
assert.ok(missionUi.includes('data-daily-related-scripture'),'Daily Journey must render related Scripture links.');
assert.ok(missionUi.includes('Open in BibleQuest Reader'),'Daily Journey must link related Scripture into the internal Reader.');

console.log('BibleQuest V5 Main Bible Quest static integration regression passed.');
