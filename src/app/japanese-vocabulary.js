import { JAPANESE_VOCABULARY_TERMS } from '../features/reader/vocabulary-content.js';
import { selectJapaneseVocabularyNotes } from '../v6/reader/japanese-vocabulary.ts';

const STORAGE_KEY='japanese-vocabulary';
const DEFAULT_STATE=Object.freeze({version:1,enabled:true});

export function createJapaneseVocabularyService({storage}){
  if(!storage) throw new Error('Japanese vocabulary service requires Storage.');
  const normalize=input=>({version:1,enabled:input?.enabled!==false});
  let state=normalize(storage.read(STORAGE_KEY,DEFAULT_STATE));
  const persist=()=>{storage.write(STORAGE_KEY,state);return getState()};
  const getState=()=>Object.freeze({...state});

  function setEnabled(value){state={...state,enabled:Boolean(value)};return persist()}

  function notesFor(text){
    return selectJapaneseVocabularyNotes(String(text||''),JAPANESE_VOCABULARY_TERMS,3);
  }

  return Object.freeze({
    getState,
    setEnabled,
    notesFor,
    termCount:JAPANESE_VOCABULARY_TERMS.length
  });
}
