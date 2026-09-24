import { describe, expect, it } from 'vitest';
import {
  canUseJapaneseVocabulary,
  selectJapaneseVocabularyNotes,
  type JapaneseVocabularyEntry,
} from '../../src/v6/reader/japanese-vocabulary.ts';

const vocabulary: readonly JapaneseVocabularyEntry[] = Object.freeze([
  Object.freeze({ term: '預言', reading: 'よげん', meaning: '神から託されたことばを伝えること', simple: '神のことばを伝えること', en: 'prophecy' }),
  Object.freeze({ term: '預言者', reading: 'よげんしゃ', meaning: '神から託されたことばを伝える人', simple: '神のメッセージを伝える人', en: 'prophet' }),
  Object.freeze({ term: '信仰', reading: 'しんこう', meaning: '神を信じ、信頼すること', simple: '神を信頼して従うこと', en: 'faith' }),
  Object.freeze({ term: '愛', reading: 'あい', meaning: '相手の益を求める愛', simple: '大切にすること', en: 'love' }),
  Object.freeze({ term: '永遠', reading: 'えいえん', meaning: '終わりがないこと', simple: 'いつまでも続くこと', en: 'eternal / eternity' }),
]);

describe('V6 Japanese Reader vocabulary seam', () => {
  it('is available only for the Japanese kougo Reader translation', () => {
    expect(canUseJapaneseVocabulary('jko')).toBe(true);
    expect(canUseJapaneseVocabulary('bsb')).toBe(false);
    expect(canUseJapaneseVocabulary('tagalog')).toBe(false);
  });

  it('preserves curated notes without inventing unknown readings or definitions', () => {
    const notes = selectJapaneseVocabularyNotes('信仰と愛によって歩む。', vocabulary);
    expect(notes.map((note) => [note.term, note.reading, note.en])).toEqual([
      ['信仰', 'しんこう', 'faith'],
      ['愛', 'あい', 'love'],
    ]);
    expect(selectJapaneseVocabularyNotes('天地を造られた。', vocabulary)).toEqual([]);
    expect(Object.isFrozen(notes)).toBe(true);
    expect(notes.every(Object.isFrozen)).toBe(true);
  });

  it('keeps longer reviewed terms ahead of contained shorter terms', () => {
    const notes = selectJapaneseVocabularyNotes('預言者は預言を伝える。', vocabulary);
    expect(notes[0]?.term).toBe('預言者');
    expect(notes[1]?.term).toBe('預言');
  });

  it('retains the accepted maximum-three Reader behavior', () => {
    const notes = selectJapaneseVocabularyNotes('信仰と愛と永遠と預言者について学ぶ。', vocabulary);
    expect(notes).toHaveLength(3);
  });

  it('fails closed for malformed reviewed entries and invalid limits', () => {
    const malformed = [
      ...vocabulary,
      { term: '偽語', reading: '', meaning: 'must not surface', simple: 'must not surface', en: 'invalid' },
    ] satisfies readonly JapaneseVocabularyEntry[];
    expect(selectJapaneseVocabularyNotes('偽語', malformed)).toEqual([]);
    expect(selectJapaneseVocabularyNotes('信仰', vocabulary, 0)).toEqual([]);
    expect(selectJapaneseVocabularyNotes('信仰', vocabulary, 11)).toEqual([]);
  });
});
