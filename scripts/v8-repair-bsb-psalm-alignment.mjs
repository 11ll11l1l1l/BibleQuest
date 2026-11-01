import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {SCRIPTURE_PACKAGE_SOURCES, buildScripturePackageManifest} from './v6-generate-scripture-manifests.mjs';
import {convertBsbWordAlignments} from './v6-import-bsb-word-alignments.mjs';
import {buildBsbAlignmentManifest, validateBsbAlignmentManifest} from './v6-bsb-alignment-manifest.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export function repairPsalmAlignment({root = process.cwd(), previousPsalms, previousManifest, wordOutput}) {
  const source = SCRIPTURE_PACKAGE_SOURCES.find(row => row.translationId === 'bsb');
  const scripture = buildScripturePackageManifest(root, source);
  const oldPsalms = JSON.parse(previousPsalms);
  const currentPsalms = JSON.parse(readFileSync(`${root}/data/packs/bible/PSA.json`));
  const added = currentPsalms.filter(row => row.c === 127 && row.v === 1);
  if (added.length !== 1 || JSON.stringify(currentPsalms.filter(row => !(row.c === 127 && row.v === 1))) !== JSON.stringify(oldPsalms)) throw Error('Repair must add only PSA 127:1.');
  const previousBooks = scripture.books.map(book => book.bookCode === 'PSA' ? {...book, sha256: hash(previousPsalms), bytes: Buffer.byteLength(previousPsalms)} : book);
  const previousVersion = 'sha256-' + hash(previousBooks.map(book => `${book.bookCode}:${book.sha256}:${book.bytes}`).join('\n')).slice(0,20);
  const oldValidation = validateBsbAlignmentManifest(previousManifest, {requireComplete: true, scriptureContentVersion: previousVersion});
  if (!oldValidation.valid) throw Error('Unchanged chapter reuse is not source-proven: ' + oldValidation.issues.join('; '));
  const original = previousManifest.chapters.find(row => row.book === 'PSA' && row.chapter === 127);
  if (!original || original.audioSha256 !== '247f3659eb2ac645909a916eaf1c56488001229a92a7a93888bb3075086dac38' || original.audioByteLength !== 668426 || original.durationSeconds !== 52.140408) throw Error('Certified Psalm audio identity mismatch.');
  const metadata = {translationId: 'bsb', source: original.source, license: original.license, alignmentSource: previousManifest.alignmentSource.replace('@' + previousManifest.alignmentRevision, ''), alignmentRevision: previousManifest.alignmentRevision, contentVersion: previousManifest.audioContentVersion};
  const converted = convertBsbWordAlignments({records:[wordOutput], durations:[{book:'PSA',chapter:127,durationSeconds:original.durationSeconds}], bookPacks:{PSA:currentPsalms}, metadata, scriptureContentVersion:scripture.contentVersion, requireComplete:false});
  const repaired = {...converted.alignments[0], audioSha256:original.audioSha256, audioByteLength:original.audioByteLength};
  const alignments = previousManifest.chapters.map(row => row.book === 'PSA' && row.chapter === 127 ? repaired : {...row, scriptureContentVersion:scripture.contentVersion});
  const manifest = buildBsbAlignmentManifest({alignments, metadata, scriptureContentVersion:scripture.contentVersion, audioInventorySha256:previousManifest.audioInventorySha256, complete:true});
  return {manifest, audit:converted.audit};
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [oldPack, oldManifest, words, output] = process.argv.slice(2);
  if (!output) throw Error('Usage: node scripts/v8-repair-bsb-psalm-alignment.mjs <previous-PSA.json> <previous-alignment.json> <new-PSA-127-words.json> <output.json>');
  const result = repairPsalmAlignment({previousPsalms:readFileSync(oldPack), previousManifest:JSON.parse(readFileSync(oldManifest)), wordOutput:JSON.parse(readFileSync(words))});
  writeFileSync(output, JSON.stringify(result.manifest,null,2)+'\n');
  console.log(JSON.stringify({scriptureContentVersion:result.manifest.scriptureContentVersion, chapterCount:result.manifest.chapterCount, verseCount:result.manifest.verseCount, audit:result.audit}));
}
