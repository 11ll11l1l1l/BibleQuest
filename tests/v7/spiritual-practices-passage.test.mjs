import test from 'node:test';
import assert from 'node:assert/strict';
import { createMeditationPassageService } from '../../src/features/spiritual-practices/passage.js';
function fixture() {
  let owner = 'guest';
  const data = new Map();
  const book = { code: 'PSA', name: 'Psalms', chapters: 150 };
  const translation = { id: 'bsb', label: 'BSB', attribution: 'Source attribution', mode: 'bundled' };
  const bible = {
    getBook: code => { if (code !== 'PSA') throw new Error('Unknown book'); return book; },
    getTranslation: id => id === 'nlt' ? { id, mode: 'licensed-link' } : translation,
    loadChapter: async () => ({ book, chapter: 46, translation, verses: [{ verse: 10, text: 'Provider verse text' }] }),
  };
  const storage = { read: key => data.get(key), write: (key, value) => data.set(key, value) };
  return { bible, data, setOwner: value => { owner = value; }, service: createMeditationPassageService({ bible, storage, getOwner: () => owner }) };
}
const ref = { translation: 'bsb', book: 'PSA', chapter: 46, verse: 10 };
test('meditation persists only canonical identity and resolves provider Scripture with attribution', async () => {
  const f = fixture();
  await f.service.select({ ...ref, text: 'untrusted text', reflection: 'private thought' });
  assert.deepEqual(f.service.selection(), ref);
  assert.deepEqual([...f.data.values()][0], ref);
  const result = await f.service.resolve(ref);
  assert.equal(result.reference, 'Psalms 46:10');
  assert.equal(result.text, 'Provider verse text');
  assert.equal(result.attribution, 'Source attribution');
  f.setOwner('account:alice');
  assert.equal(f.service.selection(), null);
});
test('reject licensed-reader-only, unknown translations, invalid bounds and mismatched provider responses', async () => {
  const f = fixture();
  for (const invalid of [{ ...ref, translation: 'nlt' }, { ...ref, translation: 'unknown' }, { ...ref, chapter: 151 }, { ...ref, verse: 0 }, { ...ref, verse: 11 }]) await assert.rejects(f.service.select(invalid));
  f.bible.loadChapter = async () => ({ book: { code: 'GEN' }, chapter: 46, translation: { id: 'bsb' }, verses: [] });
  await assert.rejects(f.service.select(ref), /does not match/);
  assert.equal(f.data.size, 0);
});
test('account switch during provider resolution cannot save Scripture selection to either account', async () => {
  const f = fixture();
  let resolve;
  f.bible.loadChapter = () => new Promise(done => { resolve = done; });
  const pending = f.service.select(ref);
  f.setOwner('account:bob');
  resolve({ book: { code: 'PSA' }, chapter: 46, translation: { id: 'bsb' }, verses: [{ verse: 10, text: 'Provider verse text' }] });
  await assert.rejects(pending, /Account changed/);
  assert.equal(f.data.size, 0);
});
test('offline/provider failure never substitutes fabricated Scripture or persists a selection', async () => {
  const f = fixture();
  f.bible.loadChapter = async () => { throw new Error('Offline passage unavailable'); };
  await assert.rejects(f.service.select(ref), /Offline passage unavailable/);
  assert.equal(f.data.size, 0);
});
