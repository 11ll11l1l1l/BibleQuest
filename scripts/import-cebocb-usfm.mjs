import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { BIBLE_BOOKS } from '../src/core/bible.js';

const args=process.argv.slice(2);
const sourceDir=args[0];
const valueAfter=flag=>{const index=args.indexOf(flag);return index>=0?args[index+1]:''};
const outputDir=valueAfter('--output')||'data/packs/cebuano';
const sourceUrl=valueAfter('--source-url')||'https://ebible.org/Scriptures/cebocb_usfm.zip';
const suppliedSha=valueAfter('--source-sha256').toLowerCase();

if(!sourceDir)throw new Error('Usage: node scripts/import-cebocb-usfm.mjs <extracted-usfm-dir> --output data/packs/cebuano [--source-url URL] [--source-sha256 SHA256]');
if(suppliedSha&&!/^[a-f0-9]{64}$/.test(suppliedSha))throw new Error('Source SHA-256 must be 64 lowercase hexadecimal characters.');

const expected=new Map(BIBLE_BOOKS.map(book=>[book.code,book]));
const ignoredLineMarkers=new Set([
  'id','ide','sts','rem','h','h1','h2','h3','toc1','toc2','toc3','toca1','toca2','toca3',
  'mt','mt1','mt2','mt3','mt4','mte','mte1','mte2','cl','cp','cd','ca','ca*','va','va*','vp','vp*',
  'ms','ms1','ms2','ms3','mr','s','s1','s2','s3','s4','sr','r','rq','d','sp','sd','qa',
  'periph','fig','fig*','cat','cat*','esb','esbe'
]);
const continuationMarkers=/^(?:p|m|po|pr|cls|pmo|pm|pmc|pmr|pi\d*|mi|nb|pc|ph\d*|q\d*|qr|qc|qm\d*|qd|lh|li\d*|lf|lim\d*)$/;

function walk(dir){
  const out=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())out.push(...walk(full));
    else if(entry.isFile())out.push(full);
  }
  return out;
}

function removeNoteBlocks(input){
  let text=input;
  // Footnotes, cross-references, figures and extended sidebars are packaging metadata,
  // not verse wording. Remove them before verse extraction so their contents cannot leak
  // into the reduced browser packs.
  for(const marker of ['f','fe','ef','x','ex','fig']){
    const pattern=new RegExp(`\\\\${marker}\\b[\\s\\S]*?\\\\${marker}\\*`,'g');
    text=text.replace(pattern,' ');
  }
  return text;
}

function cleanInline(input){
  let text=String(input||'');
  text=text.replace(/\\zaln-s\b[^\\]*?\\\*/g,' ')
           .replace(/\\zaln-e\\\*/g,' ')
           .replace(/\\k-s\b[^\\]*?\\\*/g,' ')
           .replace(/\\k-e\\\*/g,' ');
  // Preserve the visible word while removing USFM word-level attributes.
  text=text.replace(/\\\+?w\s+([^|\\]+?)\|[^\\]*?\\\+?w\*/g,'$1');
  // Alternate verse numbers and published verse labels are not Scripture wording.
  text=text.replace(/\\(?:va|vp)\s+[^\\]*?\\(?:va|vp)\*/g,' ');
  // Remove remaining character-style markers but retain the text between them.
  text=text.replace(/\\\+?[a-z][a-z0-9-]*\*/gi,' ')
           .replace(/\\\+?[a-z][a-z0-9-]*(?=\s)/gi,' ');
  text=text.replace(/~/g,' ')
           .replace(/[ \t]+/g,' ')
           .replace(/\s+([,.;:!?])/g,'$1')
           .trim();
  return text;
}

function appendVerse(verse,text){
  const cleaned=cleanInline(text);
  if(!cleaned)return;
  verse.t=verse.t?`${verse.t} ${cleaned}`:cleaned;
}

function parseUsfm(file){
  const raw=removeNoteBlocks(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
  const idMatch=raw.match(/^\\id\s+([A-Z0-9]{3})\b/m);
  if(!idMatch)return null;
  const code=idMatch[1];
  if(!expected.has(code))return null;
  let chapter=0,current=null;
  const verses=[];
  for(const original of raw.replace(/\r\n?/g,'\n').split('\n')){
    const line=original.trim();
    if(!line)continue;
    const chapterMatch=line.match(/^\\c\s+(\d+)\b/);
    if(chapterMatch){chapter=Number(chapterMatch[1]);current=null;continue}
    const verseMatch=line.match(/^\\v\s+(\S+)\s*(.*)$/);
    if(verseMatch){
      if(!chapter)throw new Error(`${path.basename(file)} contains verse ${verseMatch[1]} before a chapter marker.`);
      const token=verseMatch[1];
      if(!/^\d+$/.test(token))throw new Error(`${path.basename(file)} uses unsupported verse token "${token}" in chapter ${chapter}; refusing to silently remap a bridge/suffix.`);
      current={c:chapter,v:Number(token),t:''};
      appendVerse(current,verseMatch[2]);
      verses.push(current);
      continue;
    }
    if(!current)continue;
    const markerMatch=line.match(/^\\([^\s]+)\s*(.*)$/);
    if(markerMatch){
      const marker=markerMatch[1].replace(/^\+/,'').toLowerCase();
      if(ignoredLineMarkers.has(marker)||marker==='b')continue;
      if(continuationMarkers.test(marker)){appendVerse(current,markerMatch[2]);continue}
      // A character marker may begin a continuation line. Preserve its visible text.
      if(/^[a-z][a-z0-9-]*\*?$/.test(marker)){appendVerse(current,line);continue}
      continue;
    }
    appendVerse(current,line);
  }
  for(const verse of verses){
    verse.t=verse.t.trim();
    if(!verse.t)throw new Error(`${code} ${verse.c}:${verse.v} has no readable verse text after USFM conversion.`);
    if(verse.t.includes('\\'))throw new Error(`${code} ${verse.c}:${verse.v} still contains a USFM marker after conversion.`);
  }
  return {code,verses};
}

const candidates=walk(sourceDir);
const books=new Map();
for(const file of candidates){
  let parsed;
  try{parsed=parseUsfm(file)}catch(error){throw new Error(`${file}: ${error.message}`)}
  if(!parsed)continue;
  if(books.has(parsed.code))throw new Error(`Multiple USFM files declare canonical book ${parsed.code}.`);
  books.set(parsed.code,{...parsed,file});
}

const missing=BIBLE_BOOKS.filter(book=>!books.has(book.code));
if(missing.length)throw new Error(`CEBOCB source is missing ${missing.length} canonical book(s): ${missing.map(book=>book.code).join(', ')}`);
if(books.size!==BIBLE_BOOKS.length)throw new Error(`Expected ${BIBLE_BOOKS.length} canonical books, parsed ${books.size}.`);

fs.rmSync(outputDir,{recursive:true,force:true});
fs.mkdirSync(outputDir,{recursive:true});
let totalVerses=0;
for(const book of BIBLE_BOOKS){
  const parsed=books.get(book.code);
  const seen=new Set();
  let maxChapter=0;
  for(const verse of parsed.verses){
    if(verse.c<1||verse.c>book.chapters)throw new Error(`${book.code} contains invalid chapter ${verse.c}; expected 1-${book.chapters}.`);
    const key=`${verse.c}:${verse.v}`;
    if(seen.has(key))throw new Error(`${book.code} contains duplicate verse ${key}.`);
    seen.add(key);maxChapter=Math.max(maxChapter,verse.c);
  }
  if(maxChapter!==book.chapters)throw new Error(`${book.code} ends at chapter ${maxChapter}; expected canonical chapter ${book.chapters}.`);
  if(!parsed.verses.length)throw new Error(`${book.code} contains no verses.`);
  totalVerses+=parsed.verses.length;
  fs.writeFileSync(path.join(outputDir,`${book.code}.json`),JSON.stringify(parsed.verses)+'\n');
}
if(totalVerses<30000)throw new Error(`Parsed only ${totalVerses} verses; expected a complete Bible-sized source.`);

const sourceFiles=candidates.filter(file=>/\.(?:usfm|sfm|txt)$/i.test(file)).sort().map(file=>path.relative(sourceDir,file));
const manifest={
  translationId:'cebocb',
  abbreviation:'OCCB',
  title:'Biblica® Open Ang Pulong sa Dios™ / Biblica® Open Cebuano Contemporary Bible™ 2024',
  language:'Cebuano',
  sourceUrl,
  sourcePackageSha256:suppliedSha||null,
  sourceFormat:'USFM',
  canonicalBooks:BIBLE_BOOKS.length,
  verseRecords:totalVerses,
  sourceFiles,
  conversion:'Reduced BibleQuest browser delivery packs preserve extracted verse wording while omitting non-verse USFM layout, headings, footnotes, cross-references, figures and publication metadata. No translation or doctrinal rewriting is performed by the importer.',
  generatedBy:'scripts/import-cebocb-usfm.mjs'
};
fs.writeFileSync(path.join(outputDir,'SOURCE.json'),JSON.stringify(manifest,null,2)+'\n');

const outputHash=crypto.createHash('sha256');
for(const book of BIBLE_BOOKS)outputHash.update(fs.readFileSync(path.join(outputDir,`${book.code}.json`)));
console.log(`Generated ${BIBLE_BOOKS.length} CEBOCB books / ${totalVerses} verse records. Pack-set SHA-256: ${outputHash.digest('hex')}`);
