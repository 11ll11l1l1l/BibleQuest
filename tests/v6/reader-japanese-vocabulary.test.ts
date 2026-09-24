import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canUseJapaneseVocabulary,
  selectJapaneseVocabularyNotes,
  type CuratedJapaneseVocabularyEntry,
} from '../../src/v6/reader/japanese-vocabulary.ts';

const vocabulary: readonly CuratedJapaneseVocabularyEntry[] = Object.freeze([
  Object.freeze({ term: '預言', reading: 'よげん', meaning: '神から託されたことばを伝えること', simple: '神のことばを伝えること', en: 'prophecy' }),
  Object.freeze({ term: '預言者', reading: 'よげんしゃ', meaning: '神から託されたことばを伝える人', simple: '神のメッセージを伝える人', en: 'prophet' }),
  Object.freeze({ term: '神の国', reading: 'かみのくに', meaning: '神の支配・統治', simple: '神が王として治められること', en: 'kingdom of God' }),
  Object.freeze({ term: '信仰', reading: 'しんこう', meaning: '神を信じ、信頼すること', simple: '神を信頼して従うこと', en: 'faith' }),
  Object.freeze({ term: '愛', reading: 'あい', meaning: '相手の益を求める愛', simple: '大切にすること', en: 'love' }),
  Object.freeze({ term: '永遠', reading: 'えいえん', meaning: '終わりがないこと', simple: 'いつまでも続くこと', en: 'eternal / eternity' }),
]);

test('Japanese vocabulary is available only for the Japanese kougo Reader translation', () => {
  assert.equal(canUseJapaneseVocabulary('jko'), true);
  assert.equal(canUseJapaneseVocabulary('bsb'), false);
  assert.equal(canUseJapaneseVocabulary('tl'), false);
});

test('preserves curated notes without inventing unknown readings or definitions', () => {
  const notes = selectJapaneseVocabularyNotes('信仰と愛によって歩む。', vocabulary);
  assert.deepEqual(notes.map((note) => [note.term, note.reading, note.en]), [
    ['信仰', 'しんこう', 'faith'],
    ['愛', 'あい', 'love'],
  ]);
  assert.deepEqual(selectJapaneseVocabularyNotes('天地を造られた。', vocabulary), []);
  assert.equal(Object.isFrozen(notes), true);
  assert.equal(notes.every(Object.isFrozen), true);
});

test('keeps longer reviewed terms ahead of contained shorter terms', () => {
  const notes = selectJapaneseVocabularyNotes('預言者は預言を伝える。', vocabulary);
  assert.equal(notes[0]?.term, '預言者');
  assert.equal(notes[1]?.term, '預言');
});

test('retains the accepted maximum-three Reader behavior with exact curated fields', () => {
  const notes = selectJapaneseVocabularyNotes('神の国と信仰と愛と永遠と預言者について学ぶ。', vocabulary);
  assert.equal(notes.length, 3);
  assert.deepEqual(notes[0], {
    term: '神の国',
    reading: 'かみのくに',
    meaning: '神の支配・統治',
    simple: '神が王として治められること',
    en: 'kingdom of God',
  });
});

test('fails closed for malformed reviewed entries and invalid limits', () => {
  const malformed: readonly CuratedJapaneseVocabularyEntry[] = [
    ...vocabulary,
    { term: '偽語', reading: '', meaning: 'must not surface', simple: 'must not surface', en: 'invalid' },
  ];
  assert.deepEqual(selectJapaneseVocabularyNotes('偽語', malformed), []);
  assert.deepEqual(selectJapaneseVocabularyNotes('信仰', vocabulary, 0), []);
  assert.deepEqual(selectJapaneseVocabularyNotes('信仰', vocabulary, 11), []);
});
