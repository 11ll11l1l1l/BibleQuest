import { createJapaneseVocabularyService } from '../src/app/japanese-vocabulary.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const memory=new Map();
const storage={
  read(key,fallback=null){return memory.has(key)?structuredClone(memory.get(key)):structuredClone(fallback)},
  write(key,value){memory.set(key,structuredClone(value));return value}
};

const vocabulary=createJapaneseVocabularyService({storage});
assert(vocabulary.termCount===27,`Expected 27 recovered curated Japanese vocabulary terms, got ${vocabulary.termCount}.`);
assert(vocabulary.getState().enabled===true,'Japanese vocabulary learning should default enabled, matching the old learning panel.');

const notes=vocabulary.notesFor('神の国について信仰と愛を学ぶ。');
assert(notes.length===3,'Vocabulary lookup must return at most three retained notes.');
assert(notes.some(item=>item.term==='神の国'&&item.reading==='かみのくに'&&item.en==='kingdom of God'),'Recovered 神の国 vocabulary note is incomplete.');
assert(notes.some(item=>item.term==='信仰'&&item.reading==='しんこう'&&item.en==='faith'),'Recovered 信仰 vocabulary note is incomplete.');
assert(notes.some(item=>item.term==='愛'&&item.reading==='あい'&&item.en==='love'),'Recovered 愛 vocabulary note is incomplete.');
assert(Object.isFrozen(notes)&&notes.every(Object.isFrozen),'Vocabulary note snapshots must be immutable.');

const longest=vocabulary.notesFor('預言者は預言を伝える。');
assert(longest[0]?.term==='預言者','Longer retained vocabulary terms must take priority over contained shorter terms.');

const none=vocabulary.notesFor('天地を造られた。');
assert(none.length===0,'Unknown verse text must not fabricate a reading or vocabulary definition.');

vocabulary.setEnabled(false);
assert(vocabulary.getState().enabled===false,'Vocabulary preference did not change.');
const reloaded=createJapaneseVocabularyService({storage});
assert(reloaded.getState().enabled===false,'Vocabulary enabled state did not persist through Storage.');
reloaded.setEnabled(true);
assert(memory.get('japanese-vocabulary')?.enabled===true,'Vocabulary state must remain behind its namespaced Storage record.');

const malformedMemory=new Map([['japanese-vocabulary',{version:'bad',enabled:'maybe'}]]);
const malformedStorage={read(key,fallback=null){return malformedMemory.has(key)?structuredClone(malformedMemory.get(key)):structuredClone(fallback)},write(key,value){malformedMemory.set(key,structuredClone(value));return value}};
const normalized=createJapaneseVocabularyService({storage:malformedStorage});
assert(normalized.getState().version===1&&normalized.getState().enabled===true,'Malformed vocabulary state must normalize safely.');

console.log('BibleQuest v3 Japanese vocabulary edge regression passed.');
