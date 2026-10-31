import test from 'node:test';
import assert from 'node:assert/strict';
import { createPracticeOffline } from '../../src/features/spiritual-practices/offline.js';
const ref = { translation: 'bsb', book: 'PSA', chapter: 46, verse: 10 };
function fixture() {
  let owner = 'guest', installed = false, installs = 0, removes = 0, cancels = 0;
  const manager = { snapshot: async () => ({ downloadable: true, installed: installed ? {} : null }), install: async () => { installs++; installed = true; }, remove: async () => { removes++; installed = false; }, cancel: () => { cancels++; } };
  const service = createPracticeOffline({ books: [{ code: 'PSA' }], shell: { getState: () => ({ ready: true }) }, getOwner: () => owner, load: async () => ({ createBrowserScripturePackageController: () => manager }) });
  return { service, manager, owner: value => { owner = value; }, counts: () => ({ installs, removes, cancels }) };
}
test('offline preparation delegates verified downloads and removal to the shared Bible manager', async () => {
  const f = fixture();
  assert.equal((await f.service.status()).guidesReady, true);
  assert.equal((await f.service.status(ref)).book.installed, null);
  assert.ok((await f.service.prepare(ref)).book.installed);
  await f.service.remove(ref);
  assert.deepEqual(f.counts(), { installs: 1, removes: 1, cancels: 0 });
});
test('unsupported or failed packages never become reported as prepared', async () => {
  const f = fixture();
  f.manager.snapshot = async () => ({ downloadable: false, installed: null, reason: 'Source not licensed for offline' });
  await assert.rejects(f.service.prepare(ref), /not licensed/);
  assert.equal(f.counts().installs, 0);
  f.manager.snapshot = async () => ({ downloadable: true, installed: null });
  f.manager.install = async () => { throw new Error('Checksum mismatch'); };
  await assert.rejects(f.service.prepare(ref), /Checksum mismatch/);
  assert.equal((await f.service.status(ref)).book.installed, null);
});
test('account switches reject late preparation results and stop old progress callbacks', async () => {
  const f = fixture(); let finish, progress, seen = 0;
  f.manager.install = (_, __, callback) => { progress = callback; return new Promise(resolve => { finish = resolve; }); };
  const pending = f.service.prepare(ref, () => { seen++; });
  for (let i = 0; i < 6; i++) await Promise.resolve();
  f.owner('account:alice'); progress({}); finish();
  await assert.rejects(pending, /context changed/);
  assert.equal(seen, 0);
});
test('cancel/disposal delegates cancellation and prevents late success or duplicate downloads', async () => {
  const f = fixture(); let finish;
  f.manager.install = () => new Promise(resolve => { finish = resolve; });
  const pending = f.service.prepare(ref);
  await assert.rejects(f.service.prepare(ref), /already/);
  for (let i = 0; i < 6; i++) await Promise.resolve();
  f.service.dispose(); finish();
  await assert.rejects(pending, /context changed/);
  assert.equal(f.counts().cancels, 1);
  await assert.rejects(f.service.prepare(ref), /closed/);
});
