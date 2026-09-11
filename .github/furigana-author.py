from pathlib import Path

def replace_once(path,old,new):
 p=Path(path); text=p.read_text()
 if text.count(old)!=1: raise SystemExit(f'{path}: expected one match for {old[:80]!r}, got {text.count(old)}')
 p.write_text(text.replace(old,new,1))

replace_once('src/features/reader/index.js',"import { japaneseVocabularyBlock, japaneseVocabularyControl } from './vocabulary.js';","import { japaneseVocabularyBlock, japaneseVocabularyControl } from './vocabulary.js';\nimport { japaneseFuriganaControl } from './furigana.js';")
replace_once('src/features/reader/index.js','export function readerPage({ reader, vocabulary = null }) {','export function readerPage({ reader, vocabulary = null, furigana = null }) {')
replace_once('src/features/reader/index.js',"const host = root.querySelector('[data-reader-page]'); let searchResults = null, highlightVerse = null, operation = 0;","const host = root.querySelector('[data-reader-page]'); let searchResults = null, highlightVerse = null, operation = 0, furiganaPass = 0, currentChapter = null;")
replace_once('src/features/reader/index.js',"const state = reader.getState(), links = reader.externalLinks(), japanese = state.translation === 'jko', licensed = chapter.translation.mode === 'licensed-link';\n        const vocabularyControl = japanese && vocabulary ? japaneseVocabularyControl(vocabulary.getState()) : '';","const state = reader.getState(), links = reader.externalLinks(), japanese = state.translation === 'jko', licensed = chapter.translation.mode === 'licensed-link';\n        currentChapter=chapter;\n        const furiganaControl = japanese && furigana ? japaneseFuriganaControl(furigana.getState()) : '';\n        const vocabularyControl = japanese && vocabulary ? japaneseVocabularyControl(vocabulary.getState()) : '';")
replace_once('src/features/reader/index.js','<p>${escapeHtml(verse.text)}</p>','<p data-reader-verse-text>${escapeHtml(verse.text)}</p>')
replace_once('src/features/reader/index.js','${vocabularyControl}${searchControl}','${furiganaControl}${vocabularyControl}${searchControl}')
replace_once('src/features/reader/index.js',"        if (highlightVerse && !licensed) queueMicrotask(() => host.querySelector(`[data-verse=\"${highlightVerse}\"]`)?.scrollIntoView({ block: 'center' }));","        void applyFurigana(chapter,japanese);\n        if (highlightVerse && !licensed) queueMicrotask(() => host.querySelector(`[data-verse=\"${highlightVerse}\"]`)?.scrollIntoView({ block: 'center' }));")
replace_once('src/features/reader/index.js',"      const load = async (message = 'Loading chapter…') =>","      const applyFurigana = async (chapter,japanese) => {\n        const pass=++furiganaPass;\n        if(!japanese||!furigana||chapter.translation.mode==='licensed-link') return;\n        const rendered=await Promise.all(chapter.verses.map(async verse=>{try{return {verse:verse.verse,...await furigana.render(verse.text)}}catch{return {verse:verse.verse,html:escapeHtml(verse.text),fallback:true}}}));\n        if(pass!==furiganaPass||reader.getState().translation!=='jko') return;\n        for(const row of rendered){const node=host.querySelector(`[data-verse=\"${row.verse}\"] [data-reader-verse-text]`);if(node) node.innerHTML=row.html}\n      };\n      const load = async (message = 'Loading chapter…') =>")
replace_once('src/features/reader/index.js',"try { if (target.matches('[data-reader-translation]')) reader.setTranslation(target.value);","try { if (target.matches('[data-reader-furigana]') && furigana) { furigana.setMode(target.value); if(currentChapter) renderChapter(currentChapter); return; } if (target.matches('[data-reader-translation]')) reader.setTranslation(target.value);")
replace_once('src/features/reader/index.js','return () => { operation++;','return () => { operation++; furiganaPass++;')

replace_once('src/app/bootstrap.js',"import { createJapaneseVocabularyService } from './japanese-vocabulary.js';","import { createJapaneseVocabularyService } from './japanese-vocabulary.js';\nimport { createJapaneseFuriganaService } from './japanese-furigana.js';\nimport { createJapaneseFuriganaTokenizerRuntime } from './japanese-furigana-tokenizer.js';")
replace_once('src/app/bootstrap.js','  const vocabulary=createJapaneseVocabularyService({storage});','  const vocabulary=createJapaneseVocabularyService({storage});\n  const furiganaTokenizer=createJapaneseFuriganaTokenizerRuntime();\n  const furigana=createJapaneseFuriganaService({storage,tokenizer:furiganaTokenizer});')
replace_once('src/app/bootstrap.js','reader:()=>readerPage({reader,vocabulary})','reader:()=>readerPage({reader,vocabulary,furigana})')

replace_once('scripts/validate-v3-japanese-vocabulary.mjs',"'readerPage({ reader, vocabulary = null })'","'readerPage({ reader, vocabulary = null, furigana = null })'")
replace_once('scripts/validate-v3-japanese-vocabulary.mjs',"'readerPage({reader,vocabulary})'","'readerPage({reader,vocabulary,furigana})'")

arch=Path('ARCHITECTURE_V3.md').read_text()
if '## Japanese furigana (#15)' not in arch:
 arch += '''\n\n## Japanese furigana (#15)\n\n- `src/app/japanese-furigana.js` owns furigana preference state and safe Scripture-to-ruby transformation through the existing Storage boundary. It reuses the recovered curated Japanese term/readings instead of duplicating vocabulary content.\n- `src/app/japanese-furigana-tokenizer.js` is the isolated lazy Kuromoji adapter for the recovered all-readings mode. It owns only loading/tokenization; if unavailable, rendering falls back to curated support readings.\n- `src/features/reader/furigana.js` renders the JKO-only control; Reader applies returned ruby markup while cancelling stale passes on translation/navigation/teardown.\n- Recovered modes are `off`, `support` (難しい語だけ), and `all` (すべて). Furigana is a reading aid only: canonical Scripture text, Progress, and non-Japanese translations remain unchanged.\n'''
 Path('ARCHITECTURE_V3.md').write_text(arch)

wf=Path('.github/workflows/v3-regression.yml'); text=wf.read_text()
for old,new in [
 ('scripts/validate-v3-japanese-vocabulary.mjs scripts/validate-v3-nlt-licensed.mjs','scripts/validate-v3-japanese-vocabulary.mjs scripts/validate-v3-japanese-furigana.mjs scripts/validate-v3-nlt-licensed.mjs'),
 ('tests/v3-japanese-vocabulary-edge.mjs tests/v3-nlt-licensed-edge.mjs','tests/v3-japanese-vocabulary-edge.mjs tests/v3-japanese-furigana-edge.mjs tests/v3-nlt-licensed-edge.mjs'),
 ('tests/v3-japanese-vocabulary-smoke.mjs tests/v3-nlt-licensed-smoke.mjs','tests/v3-japanese-vocabulary-smoke.mjs tests/v3-japanese-furigana-smoke.mjs tests/v3-nlt-licensed-smoke.mjs')]:
 if text.count(old)!=1: raise SystemExit(f'workflow expected one match for {old}, got {text.count(old)}')
 text=text.replace(old,new,1)
if 'workflow_dispatch:' not in text or 'push:' in text.split('jobs:')[0]: raise SystemExit('product workflow trigger contract changed')
wf.write_text(text)
