import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd(),failures=[];
const fail=message=>failures.push(message);
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const required=[
  'src/core/doctrinal-safety.js','src/ui/doctrinal-safety.js','src/ui/doctrinal-safety.css',
  'src/core/recall-packs.js','src/features/games/content.js','src/app/study.js','src/app/story-journey.js','src/app/deep-questions.js','src/app/wisdom-situations.js','src/app/daily-mission.js','src/features/learn/index.js',
  'tests/v3-doctrinal-safety-edge.mjs','tests/v3-recall-packs-edge.mjs','DOCTRINAL_SAFETY.md','index.html'
];
for(const file of required)if(!fs.existsSync(path.join(root,file)))fail(`Missing doctrinal-safety file: ${file}`);

const policy=read('src/core/doctrinal-safety.js');
for(const contract of['TEXTUAL_FACT','PASSAGE_CONTEXT','INTERPRETIVE_OR_DOCTRINAL','classifyDoctrinalContent','reviewAuthoredBinary','reviewNeutralContent','reviewImportedRecall','assertBinaryScorable','assertNeutralAssessment','quarantine','Scripture first'])if(!policy.includes(contract))fail(`Doctrinal safety owner missing contract: ${contract}`);
if(/\b(window|document|localStorage|sessionStorage|MutationObserver|createClient)\b|\bfetch\s*\(|progress\.|lesson\./.test(policy))fail('Doctrinal safety owner must remain DOM/global/storage/network/backend/Progress/Lesson independent.');

const jsFiles=[];
function walk(dir){for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const rel=path.join(dir,entry.name).replaceAll('\\','/');if(entry.isDirectory())walk(rel);else if(entry.name.endsWith('.js'))jsFiles.push(rel)}}
walk('src');
const classifierOwners=jsFiles.filter(file=>read(file).includes('export function classifyDoctrinalContent'));
if(classifierOwners.length!==1||classifierOwners[0]!=='src/core/doctrinal-safety.js')fail(`Exactly one doctrinal classifier owner is required; found ${classifierOwners.join(', ')||'none'}.`);
for(const file of jsFiles){
  const text=read(file);
  if(file!=='src/core/doctrinal-safety.js'&&/BQ_DOCTRINAL_SAFETY|BQ_DOCTRINAL_CONTEXT/.test(text))fail(`Legacy doctrinal safety global leaked into v3 source: ${file}`);
  if(/runtime-safety\.js/.test(text))fail(`Legacy fetch-override safety runtime leaked into v3 source: ${file}`);
}

const games=read('src/features/games/content.js');
for(const contract of['reviewAuthoredBinary','assertBinaryScorable'])if(!games.includes(contract))fail(`Shared Games/Adaptive question bank does not enforce ${contract}.`);
const recall=read('src/core/recall-packs.js');
if(!recall.includes('reviewImportedRecall'))fail('Recall Pack owner must re-evaluate imported question safety.');
if(/row\?\.safety\?\.action!==['"]allow['"]/.test(recall))fail('Recall Pack owner must not trust a raw allow tag as its sole doctrinal-safety decision.');
for(const file of['src/app/study.js','src/app/story-journey.js','src/app/daily-mission.js']){
  const text=read(file);if(!text.includes('reviewAuthoredBinary')||!text.includes('assertBinaryScorable'))fail(`${file} must gate binary-scored Bible content through the doctrinal-safety owner.`);
}
for(const file of['src/app/deep-questions.js','src/app/wisdom-situations.js']){
  const text=read(file);if(!text.includes('reviewNeutralContent')||!text.includes('assertNeutralAssessment'))fail(`${file} must classify interpretive/wisdom content as neutral.`);
}
const wisdom=read('src/app/wisdom-situations.js');if(/quizCorrect/.test(wisdom))fail('Neutral Wisdom Situations must not emit quizCorrect evidence.');
const deep=read('src/app/deep-questions.js');if(/progress\.record|quizCorrect/.test(deep))fail('Deep Questions must remain unscored and Progress-independent.');

const lesson=read('src/engines/lesson.js');if(/doctrinal-safety/.test(lesson))fail('Generic Lesson engine must remain content-policy agnostic.');
const progress=read('src/core/progress.js');if(/doctrinal-safety/.test(progress))fail('Progress owner must remain separate from doctrinal classification.');

const learn=read('src/features/learn/index.js');
if(!learn.includes('DOCTRINAL_SAFETY')||!learn.includes('data-doctrinal-policy'))fail('Learn must expose the reviewed doctrinal-safety policy without owning it.');
const html=read('index.html');if(!html.includes('src/ui/doctrinal-safety.css'))fail('index.html must load doctrinal-safety notice styles.');

const legacy=read('DOCTRINAL_SAFETY.md');
for(const phrase of['TEXTUAL_FACT','PASSAGE_CONTEXT','INTERPRETIVE_OR_DOCTRINAL'])if(!legacy.includes(phrase))fail(`Retained doctrinal policy reference lost ${phrase}.`);

if(failures.length){console.error(`BibleQuest v3 doctrinal-safety validation FAILED (${failures.length})`);failures.forEach(message=>console.error(`- ${message}`));process.exit(1)}
console.log('BibleQuest v3 doctrinal-safety architecture validation passed.');
