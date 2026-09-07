import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd(),failures=[];
const fail=message=>failures.push(message);
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const required=[
  'src/core/content-provenance.js','src/ui/source-labels.js','src/ui/source-labels.css','src/features/learn/index.js',
  'src/features/study/index.js','src/features/deep-questions/index.js','src/features/story-journey/index.js',
  'src/features/wisdom-situations/index.js','src/features/adaptive-learning/index.js','src/features/daily-mission/index.js',
  'src/features/games/index.js','src/core/bible.js','src/core/recall-packs.js','src/app/bootstrap.js','index.html'
];
for(const file of required)if(!fs.existsSync(path.join(root,file)))fail(`Missing #90 source-provenance file: ${file}`);

const provenance=read('src/core/content-provenance.js');
for(const id of['bq-study','bq-retelling','bq-wisdom','bq-recall','bq-game'])if(!provenance.includes(`'${id}'`))fail(`Content provenance registry missing ${id}.`);
for(const phrase of['not a Bible quotation','not Bible translation text','not a direct Scripture quotation','not a Bible quotation','not Scripture text'])if(!provenance.includes(phrase))fail(`Content provenance registry missing required distinction: ${phrase}`);
if(/document\.|window\.|localStorage|sessionStorage|fetch\s*\(|MutationObserver/.test(provenance))fail('Content provenance registry must remain static and runtime-independent.');

const labels=read('src/ui/source-labels.js');
for(const contract of['export function sourceLabel','export function sourceGuide','data-source-id','data-source-guide-id'])if(!labels.includes(contract))fail(`Source-label presentation helper missing contract: ${contract}`);
if(/Berean Standard Bible|New Living Translation|unfoldingWord Translation Questions|Tagalog Unlocked Literal Bible/.test(labels))fail('Source-label presentation helper must consume owner metadata instead of duplicating translation/question-source names.');
if(/MutationObserver|window\.BQ|localStorage|sessionStorage|fetch\s*\(/.test(labels))fail('Source-label presentation helper must remain presentation-only.');

const html=read('index.html');if(!html.includes('src/ui/source-labels.css'))fail('index.html must load source-labels.css.');

const bootstrap=read('src/app/bootstrap.js');
for(const contract of['translations:reader.translations','recallSource:recall.sourceInfo()'])if(!bootstrap.includes(contract))fail(`Learn source guide must receive metadata from existing owners: ${contract}`);
const recall=read('src/core/recall-packs.js');if(!recall.includes('sourceInfo(){return SOURCE_INFO}'))fail('Recall Pack owner must expose immutable sourceInfo() metadata.');

const learn=read('src/features/learn/index.js');
for(const contract of['sourceGuide','bq-study','bq-retelling','bq-wisdom','bq-recall','bq-game'])if(!learn.includes(contract))fail(`Learn source guide missing contract: ${contract}`);
if(!learn.includes('<h1>Learn</h1>'))fail('Stable Learn heading must remain exact.');
if(/Berean Standard Bible|New Living Translation|unfoldingWord Translation Questions|Tagalog Unlocked Literal Bible/.test(learn))fail('Learn must not duplicate owner-held source names.');

const surfaceContracts=[
  ['src/features/study/index.js','bq-study'],
  ['src/features/deep-questions/index.js','bq-study'],
  ['src/features/wisdom-situations/index.js','bq-wisdom'],
  ['src/features/adaptive-learning/index.js','bq-recall'],
  ['src/features/daily-mission/index.js','bq-study']
];
for(const [file,id] of surfaceContracts){const text=read(file);if(!text.includes('sourceLabel')||!text.includes(`'${id}'`))fail(`${file} must render provenance ${id} through the shared helper.`)}
const story=read('src/features/story-journey/index.js');for(const id of['bq-retelling','bq-recall'])if(!story.includes(`'${id}'`))fail(`Story Journey must distinguish ${id}.`);if(!story.includes('sourceLabel'))fail('Story Journey must use shared sourceLabel().');
const games=read('src/features/games/index.js');for(const id of['bq-game','bq-recall'])if(!games.includes(`'${id}'`))fail(`Games UI must distinguish ${id}.`);if(!games.includes('state.source')||!games.includes('state.license'))fail('Per-book Recall must retain source/license from its data owner.');

for(const file of['src/features/study/index.js','src/features/deep-questions/index.js','src/features/story-journey/index.js','src/features/wisdom-situations/index.js','src/features/adaptive-learning/index.js','src/features/daily-mission/index.js','src/features/games/index.js']){
  const text=read(file);
  if(/MutationObserver|window\.BQ|localStorage|sessionStorage/.test(text))fail(`Legacy source-label injection/storage pattern forbidden in ${file}.`);
}

if(failures.length){console.error(failures.map(item=>`- ${item}`).join('\n'));process.exit(1)}
console.log('BibleQuest v3 source-label provenance architecture validation passed.');
