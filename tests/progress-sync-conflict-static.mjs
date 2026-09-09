import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../progress-sync-policy.js',import.meta.url),'utf8');
const sandbox={window:{}};
vm.runInNewContext(source,sandbox,{filename:'progress-sync-policy.js'});
const policy=sandbox.window.BQProgressSyncPolicy;

assert.ok(policy,'Progress sync policy must load before Account.');

const original={reader:{chapter:1},journey:{step:1}};
const base=policy.baseline(original);
const newerCloud={reader:{chapter:2},journey:{step:1}};
const staleDevice=policy.reconcile(original,newerCloud,base);
assert.equal(staleDevice.action,'restore','An unchanged stale device must restore newer cloud progress.');
assert.deepEqual(structuredClone(staleDevice.state),newerCloud);

const legacyDevice=policy.reconcile(original,newerCloud,null);
assert.equal(legacyDevice.action,'conflict','A pre-upgrade existing device must not overwrite a different cloud snapshot without a baseline.');
assert.deepEqual(structuredClone(legacyDevice.conflicts),['reader']);

const localAndCloudChanged=policy.reconcile(
  {reader:{chapter:1},journey:{step:2}},
  {reader:{chapter:2},journey:{step:1}},
  base
);
assert.equal(localAndCloudChanged.action,'push','Independent per-area changes should merge without discarding either device.');
assert.deepEqual(structuredClone(localAndCloudChanged.state),{journey:{step:2},reader:{chapter:2}});

const sameAreaConflict=policy.reconcile(
  {reader:{chapter:3},journey:{step:1}},
  {reader:{chapter:2},journey:{step:1}},
  base
);
assert.equal(sameAreaConflict.action,'conflict','Different edits to the same progress area must pause sync.');
assert.deepEqual(structuredClone(sameAreaConflict.conflicts),['reader']);

const firstCloudWrite=policy.reconcile(original,null,null);
assert.equal(firstCloudWrite.action,'push','A device must be able to create the first cloud snapshot.');

const account=fs.readFileSync(new URL('../account.js',import.meta.url),'utf8');
assert.match(account,/\.eq\('updated_at',expectedUpdatedAt\)/,'Cloud writes must use optimistic concurrency against the observed revision.');
assert.doesNotMatch(account,/bible_progress_snapshots'\)\.upsert/,'Progress snapshots must not use an unconditional upsert.');
assert.match(account,/data-sync-use-cloud/,'Same-area conflicts must offer an explicit cloud-preserving resolution.');
assert.match(account,/data-sync-use-device/,'Same-area conflicts must require an explicit choice before replacing cloud state.');
assert.match(account,/if\(syncConflict\)return \{status:'conflict'/,'Automatic and page-exit sync must remain blocked while a conflict is unresolved.');

console.log('Existing-device cloud progress conflict protection passed');
