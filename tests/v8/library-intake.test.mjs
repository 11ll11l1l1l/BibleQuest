import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,mkdir,symlink,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {prepareLibraryIntake,runLibraryIntake} from '../../scripts/v8-library-intake.mjs';
import {parseV7ContentBundle} from '../../src/v7/content/contract.js';
import {normalizeLibraryItem} from '../../src/features/library/contracts.js';
const digest = text => createHash('sha256').update(text).digest('hex');
const manifest = () => ({schemaVersion:1,taxonomy:[{id:'topic.prayer',kind:'topic',labels:{en:'Prayer'}}],items:[{id:'teaching.test-only-intake',type:'past_teaching',title:'Synthetic test transcript',sourceLocale:'en',source:{kind:'first_party',title:'Synthetic source — test only',catalogId:'test-only-source',creator:'Test fixture'},rights:{status:'unknown',allowedUses:[]},taxonomyLinks:[{id:'topic.prayer',kind:'topic',order:0}],textPath:'transcript.txt'}]});
async function fixture(run){const root=await mkdtemp(join(tmpdir(),'bq-intake-'));try{await mkdir(join(root,'sources'));await writeFile(join(root,'sources','transcript.txt'),'\uFEFF## Synthetic heading\r\n\r\nSynthetic source wording, preserved exactly.\r\n');await run(root);}finally{await rm(root,{recursive:true,force:true});}}
const prepare=(root,input=manifest(),extra={})=>prepareLibraryIntake({manifest:input,sourceRoot:join(root,'sources'),...extra});
test('intake is deterministic, source-bound and uses existing unpublished content contract',async()=>fixture(async root=>{
  const first=await prepare(root),second=await prepare(root);assert.equal(first.packetText,second.packetText);
  assert.equal(first.packet.items[0].sourceContent.body,'## Synthetic heading\n\nSynthetic source wording, preserved exactly.');
  assert.equal(first.packet.items[0].publicationState,'draft');assert.deepEqual(first.packet.items[0].review,{status:'draft'});
  assert.equal(first.packet.items[0].rights.status,'unknown');assert.deepEqual(first.packet.items[0].translations,[]);
  assert.equal(first.report.packetSha256,digest(first.packetText));assert.equal(first.packet.items[0].source.checksum,`sha256:${first.report.items[0].sourceSha256}`);
  assert.equal(parseV7ContentBundle(first.packet).items.length,1);
  assert.throws(()=>normalizeLibraryItem({...first.packet.items[0],contentType:'past_teaching',publishedRevisionId:first.packet.items[0].revision,title:'test',locale:'en'}));
  const edited=manifest();edited.items[0].title='Changed title';assert.notEqual((await prepare(root,edited)).packet.items[0].revision,first.packet.items[0].revision);
  await writeFile(join(root,'sources','transcript.txt'),'changed source words');assert.notEqual((await prepare(root)).packet.items[0].revision,first.packet.items[0].revision);
}));
test('duplicate published IDs or prose and duplicate batch content are rejected',async()=>fixture(async root=>{
  const base=await prepare(root),id=base.packet.items[0].id;
  await assert.rejects(prepare(root,manifest(),{existingIds:new Set([id])}),/DUPLICATE_ID/);
  await assert.rejects(prepare(root,manifest(),{existingBodyHashes:new Set([base.report.items[0].bodySha256])}),/DUPLICATE_BODY/);
  const duplicate=manifest();duplicate.items.push({...duplicate.items[0],id:'teaching.another-test'});await assert.rejects(prepare(root,duplicate),/DUPLICATE_BODY/);
}));
test('source paths, hashes, sizes, encodings and controlled taxonomy fail before packet output',async()=>fixture(async root=>{
  await writeFile(join(root,'outside.txt'),'outside');await symlink(join(root,'outside.txt'),join(root,'sources','escape.txt'));
  for(const textPath of ['../outside.txt','escape.txt','/etc/passwd','photo.png']){const input=manifest();input.items[0].textPath=textPath;await assert.rejects(prepare(root,input),/PATH/);}
  const pinned=manifest();pinned.items[0].sourceSha256='a'.repeat(64);await assert.rejects(prepare(root,pinned),/HASH_MISMATCH/);
  const taxonomy=manifest();taxonomy.items[0].taxonomyLinks[0].id='topic.missing';await assert.rejects(prepare(root,taxonomy),/controlled taxonomy/);
  await writeFile(join(root,'sources','transcript.txt'),Buffer.from([0xff,0xfe]));await assert.rejects(prepare(root),/UTF8_INVALID/);
  await writeFile(join(root,'sources','transcript.txt'),'binary\u0000text');await assert.rejects(prepare(root),/TEXT_INVALID/);
  await writeFile(join(root,'sources','transcript.txt'),'x'.repeat(100001));await assert.rejects(prepare(root),/SIZE_LIMIT/);
}));
test('approval/publication injection, fixture sources, unsupported types and credential URLs are rejected',async()=>fixture(async root=>{
  for(const patch of [{publicationState:'published'},{review:{status:'approved'}},{type:'book'},{source:{kind:'fixture',title:'test'}},{source:{kind:'external',title:'test',uri:'https://user:password@example.test/source'}}]){
    const input=manifest();Object.assign(input.items[0],patch);await assert.rejects(prepare(root,input));
  }
}));
test('verified input rights are retained without granting approval; literal markup remains inert source text',async()=>fixture(async root=>{
  const input=manifest();input.items[0].rights={status:'verified',holder:'Synthetic fixture owner',basis:'Test-only permission claim',attribution:'Synthetic fixture',allowedUses:['display']};
  await writeFile(join(root,'sources','transcript.txt'),'<script>literal test markup</script>');
  const result=await prepare(root,input);assert.equal(result.packet.items[0].rights.status,'verified');assert.equal(result.packet.items[0].review.status,'draft');assert.equal(result.packet.items[0].sourceContent.body,'<script>literal test markup</script>');
}));
test('writer validates the whole batch, creates exclusive output and never writes into served trees',async()=>fixture(async root=>{
  const path=join(root,'manifest.json'),output=join(root,'packet');await writeFile(path,JSON.stringify(manifest()));
  const options={manifestPath:path,sourceRoot:join(root,'sources'),outputDirectory:output,existingIds:new Set(),existingBodyHashes:new Set()};
  const result=await runLibraryIntake(options);assert.equal(result.itemCount,1);
  const bytes=await readFile(join(output,'draft-bundle.json'));const report=JSON.parse(await readFile(join(output,'intake-report.json'),'utf8'));assert.equal(digest(bytes),report.packetSha256);
  await assert.rejects(runLibraryIntake(options),/EEXIST/);assert.deepEqual(await readFile(join(output,'draft-bundle.json')),bytes);
  const invalid=manifest();invalid.items.push({...invalid.items[0],id:'teaching.second-test',textPath:'missing.txt'});await writeFile(path,JSON.stringify(invalid));
  const failed=join(root,'failed');await assert.rejects(runLibraryIntake({...options,outputDirectory:failed}));await assert.rejects(access(failed));
  await assert.rejects(runLibraryIntake({...options,outputDirectory:resolve('data/v8/intake-test')}),/MUST_NOT_BE_SERVED/);
}));

test('default CLI baseline rejects existing public content and output symlinks cannot enter served data',async()=>fixture(async root=>{
  const input=manifest();input.items[0].id='devotional.biblequest.anxiety_worry.01';
  const path=join(root,'manifest.json');await writeFile(path,JSON.stringify(input));
  await assert.rejects(runLibraryIntake({manifestPath:path,sourceRoot:join(root,'sources'),outputDirectory:join(root,'duplicate')}),/DUPLICATE_ID/);
  await writeFile(path,JSON.stringify(manifest()));await symlink(resolve('data'),join(root,'served'));
  await assert.rejects(runLibraryIntake({manifestPath:path,sourceRoot:join(root,'sources'),outputDirectory:join(root,'served','intake-test'),existingIds:new Set(),existingBodyHashes:new Set()}),/MUST_NOT_BE_SERVED/);
}));
test('link-only rights do not authorize text drafts and batch limits are bounded',async()=>fixture(async root=>{
  const input=manifest();input.items[0].rights={status:'verified',holder:'Fixture',basis:'Link only',attribution:'Fixture',allowedUses:['external_link']};
  await assert.rejects(prepare(root,input),/TEXT_RIGHTS_INCOMPATIBLE/);
  await assert.rejects(prepare(root,{...manifest(),items:[]}),/BATCH_INVALID/);
  await assert.rejects(prepare(root,{...manifest(),items:Array(101).fill(manifest().items[0])}),/BATCH_INVALID/);
}));

test('documented CLI produces a review packet without logging transcript prose',async()=>fixture(async root=>{
  const path=join(root,'manifest.json');await writeFile(path,JSON.stringify(manifest()));
  const output=join(root,'cli-packet');
  const {stdout}=await promisify(execFile)(process.execPath,[resolve('scripts/v8-library-intake.mjs'),path,join(root,'sources'),output]);
  const result=JSON.parse(stdout);assert.equal(result.itemCount,1);assert.equal(result.outputDirectory,output);
  assert.doesNotMatch(stdout,/Synthetic source wording|Synthetic heading/);
  const packet=JSON.parse(await readFile(join(output,'draft-bundle.json'),'utf8'));assert.equal(packet.items[0].review.status,'draft');
}));

test('aggregate text limit rejects a batch even when every individual file fits',async()=>fixture(async root=>{
  const input=manifest();input.items=[];
  for(let index=0;index<54;index++){
    const textPath=`source-${index}.txt`;await writeFile(join(root,'sources',textPath),`${index} `+'x'.repeat(97990));
    input.items.push({...manifest().items[0],id:`teaching.batch-${index}`,textPath});
  }
  await assert.rejects(prepare(root,input),/BATCH_SIZE_LIMIT/);
}));
