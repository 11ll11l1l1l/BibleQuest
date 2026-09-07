import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const fail=message=>{console.error(`Japanese vocabulary architecture validation FAILED: ${message}`);process.exit(1)};
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const owner=read('src/app/japanese-vocabulary.js');
const content=read('src/features/reader/vocabulary-content.js');
const presentation=read('src/features/reader/vocabulary.js');
const readerUi=read('src/features/reader/index.js');
const bootstrap=read('src/app/bootstrap.js');
const index=read('index.html');
const architecture=read('ARCHITECTURE_V3.md');

for(const contract of ["STORAGE_KEY='japanese-vocabulary'",'storage.read','storage.write','JAPANESE_VOCABULARY_TERMS','notesFor','setEnabled']) if(!owner.includes(contract)) fail(`Vocabulary owner missing contract: ${contract}`);
if(/document\.|window\.|localStorage|sessionStorage|fetch\s*\(|MutationObserver|Progress|progress\.|kuromoji|cdn\.jsdelivr|furigana/i.test(owner)) fail('Vocabulary owner must not own DOM/network/Progress/furigana/tokenizer runtime behavior.');

const termCount=(content.match(/\{ term:/g)||[]).length;
if(termCount!==27) fail(`Expected 27 recovered curated vocabulary terms, found ${termCount}.`);
if(/document\.|window\.|localStorage|sessionStorage|fetch\s*\(|MutationObserver|kuromoji|cdn\.jsdelivr/i.test(content)) fail('Static vocabulary definitions must not contain runtime side effects.');
if(/localStorage|sessionStorage|fetch\s*\(|MutationObserver|window\.BQ|Progress|progress\.|kuromoji|cdn\.jsdelivr|furigana/i.test(presentation)) fail('Vocabulary presentation must remain rendering-only and independent from skipped furigana/tokenizer runtime.');

for(const contract of ["import { japaneseVocabularyBlock, japaneseVocabularyControl } from './vocabulary.js'",'readerPage({ reader, vocabulary = null })',"state.translation === 'jko'",'vocabulary.notesFor(peek.text)','vocabulary.setEnabled']) if(!readerUi.includes(contract)) fail(`Reader presentation missing vocabulary integration contract: ${contract}`);
if(/kuromoji|cdn\.jsdelivr|window\.BQJapaneseLearning|data-jp-furigana/i.test(readerUi)) fail('Reader must not reintroduce the skipped furigana/tokenizer runtime while implementing vocabulary.');
if(/localStorage|sessionStorage|fetch\s*\(|MutationObserver|window\.BQ/.test(readerUi)) fail('Reader presentation must not own storage/network/global runtime behavior.');

const createMatches=bootstrap.match(/createJapaneseVocabularyService/g)||[];
if(createMatches.length!==2) fail(`Expected one Japanese vocabulary import plus one composition call in bootstrap, found ${createMatches.length} references.`);
if(!bootstrap.includes('const vocabulary=createJapaneseVocabularyService({storage})')||!bootstrap.includes('readerPage({reader,vocabulary})')) fail('Bootstrap must compose vocabulary through Storage and inject it into Reader.');
if(!index.includes('src/ui/japanese-vocabulary.css')) fail('Japanese vocabulary stylesheet is not loaded.');
if(!architecture.includes('src/app/japanese-vocabulary.js')) fail('Architecture contract must list the Japanese vocabulary owner.');

console.log('BibleQuest v3 Japanese vocabulary architecture validation passed.');
