import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

for(const file of[
  'src/features/explorer/content.js',
  'src/app/explorer.js',
  'src/app/explorer-cloud-sync.js',
  'src/features/explorer/index.js',
  'src/features/learn/index.js',
  'src/app/bootstrap.js'
]) execFileSync(process.execPath,['--check',file],{stdio:'pipe'});

const contentSource=fs.readFileSync('src/features/explorer/content.js','utf8');
const service=fs.readFileSync('src/app/explorer.js','utf8');
const cloud=fs.readFileSync('src/app/explorer-cloud-sync.js','utf8');
const page=fs.readFileSync('src/features/explorer/index.js','utf8');
const learn=fs.readFileSync('src/features/learn/index.js','utf8');
const bootstrap=fs.readFileSync('src/app/bootstrap.js','utf8');

assert.equal((contentSource.match(/kind:'person'/g)||[]).length,10,'Active Bible Explorer must retain ten people.');
assert.equal((contentSource.match(/kind:'place'/g)||[]).length,5,'Active Bible Explorer must retain five places.');
assert.equal((contentSource.match(/reader:\{code:/g)||[]).length,15,'Every Bible Explorer item must expose a Reader target.');
assert.equal((contentSource.match(/refs:'/g)||[]).length,15,'Every Bible Explorer item must expose a Scripture reference.');

for(const token of[
  "STORAGE_KEY='explorer-state-v1'",
  "KINDS=Object.freeze(['person','place'])",
  'cycle:cycle.cycle+1',
  "item.id!==cycle.lastId",
  'seen:[...new Set([...picked.cycle.seen,picked.chosen.id])]',
  'if(existing&&!existing.revealed)',
  'function nextClue(kind)',
  'function reveal(kind)',
  'function nextCase(kind)',
  'function mergeFromAccount(remoteInput)'
]) assert.ok(service.includes(token),'Bible Explorer owner missing contract: '+token);
assert.ok(!service.includes('progress.record'),'Bible Explorer exploration must not silently award XP or spiritual score.');
assert.ok(!/window\.|document\.|localStorage|sessionStorage|createClient/.test(service),'Bible Explorer owner must remain DOM/global/storage-implementation/backend independent.');

for(const token of[
  "SLICE_KEY='biblequest_explorer_v1'",
  "OWNER_KEY='bq-explorer-sync-owner-v1'",
  'accountCacheKey',
  'BQ_PROGRESS_SNAPSHOT_CONFLICT',
  'saveSlice',
  'switchToGuest'
]) assert.ok(cloud.includes(token),'Bible Explorer account sync missing contract: '+token);

for(const token of[
  'data-explorer-page',
  'data-explorer-mode="person"',
  'data-explorer-mode="place"',
  'data-explorer-mode="connections"',
  'data-explorer-current-clue',
  'data-explorer-reveal',
  'data-explorer-next',
  'data-explorer-reader'
]) assert.ok(page.includes(token),'Bible Explorer page missing UI contract: '+token);

assert.ok(learn.includes('data-open-explorer'),'Learn must expose Bible Explorer.');
assert.ok(learn.includes('Characters & Places'),'Learn must describe the Explorer destination.');

for(const token of[
  'createExplorerService',
  'createExplorerCloudSyncService',
  "onExplorer:()=>router.navigate('explorer')",
  "explorer:()=>explorerPage",
  '.then(()=>explorerCloudSync.syncNow())',
  'explorerCloudSync.dispose()'
]) assert.ok(bootstrap.includes(token),'Bootstrap missing Bible Explorer composition: '+token);

console.log('BibleQuest V5 active Bible Explorer static regression passed.');
