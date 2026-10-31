import {createHash} from 'node:crypto';
import {open, realpath, stat, mkdir, writeFile, rm} from 'node:fs/promises';
import {dirname, extname, isAbsolute, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseV7ContentBundle} from '../src/v7/content/contract.js';
import {buildV7PublicLibraryCatalog} from './v7-generate-public-library-catalog.mjs';

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const MAX_TEXT = 100_000, MAX_BATCH = 5 * 1024 * 1024;
const hash = value => createHash('sha256').update(value).digest('hex');
const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']' : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}' : JSON.stringify(value);
const normalize = value => value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
const inside = (path, root) => { const part = relative(root, path); return !part || (!part.startsWith('..' + sep) && part !== '..' && !isAbsolute(part)); };
function keys(value, allowed, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !allowed.includes(key))) throw new Error(`INTAKE_FIELDS_INVALID:${label}`);
}
async function boundedRead(path, limit) {
  const handle = await open(path, 'r');
  try {
    if (!(await handle.stat()).isFile()) throw new Error('INTAKE_FILE_REQUIRED');
    const buffer = Buffer.alloc(limit + 1); let used = 0;
    while (used < buffer.length) { const result = await handle.read(buffer, used, buffer.length - used, used); if (!result.bytesRead) break; used += result.bytesRead; }
    if (used > limit) throw new Error('INTAKE_SIZE_LIMIT');
    return buffer.subarray(0, used);
  } finally { await handle.close(); }
}
function textFrom(bytes) { try { return new TextDecoder('utf-8', {fatal:true}).decode(bytes); } catch { throw new Error('INTAKE_UTF8_INVALID'); } }

export async function prepareLibraryIntake({manifest, sourceRoot, existingIds = new Set(), existingBodyHashes = new Set()}) {
  keys(manifest, ['schemaVersion','taxonomy','items'], 'manifest');
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.items) || !manifest.items.length || manifest.items.length > 100) throw new Error('INTAKE_BATCH_INVALID');
  const root = await realpath(sourceRoot);
  if (!(await stat(root)).isDirectory()) throw new Error('INTAKE_ROOT_INVALID');
  const items = [], evidence = [], ids = new Set(existingIds), bodies = new Set(existingBodyHashes);
  let totalBytes = 0;
  for (const entry of manifest.items) {
    keys(entry, ['id','type','title','sourceLocale','source','rights','taxonomyLinks','textPath','sourceSha256'], 'item');
    if (!['devotional','past_teaching'].includes(entry.type) || entry.source?.kind === 'fixture') throw new Error('INTAKE_TYPE_INVALID');
    if (entry.source?.uri) { let uri; try { uri = new URL(entry.source.uri); } catch { throw new Error('INTAKE_SOURCE_URI_INVALID'); } if (uri.username || uri.password) throw new Error('INTAKE_SOURCE_URI_INVALID'); }
    if (entry.rights?.status === 'verified' && !entry.rights.allowedUses?.some(use => ['display','host','hosted_reading','modify','adapt','distribute'].includes(use))) throw new Error('INTAKE_TEXT_RIGHTS_INCOMPATIBLE');
    if (ids.has(entry.id)) throw new Error('INTAKE_DUPLICATE_ID');
    ids.add(entry.id);
    if (typeof entry.textPath !== 'string' || isAbsolute(entry.textPath) || entry.textPath.includes('\\') || !['.txt','.md'].includes(extname(entry.textPath).toLowerCase())) throw new Error('INTAKE_PATH_INVALID');
    const path = await realpath(resolve(root, entry.textPath));
    if (!inside(path, root)) throw new Error('INTAKE_PATH_OUTSIDE_ROOT');
    const bytes = await boundedRead(path, MAX_TEXT); totalBytes += bytes.length;
    if (totalBytes > MAX_BATCH) throw new Error('INTAKE_BATCH_SIZE_LIMIT');
    const sourceHash = hash(bytes);
    if (entry.sourceSha256 !== undefined && entry.sourceSha256 !== sourceHash) throw new Error('INTAKE_SOURCE_HASH_MISMATCH');
    if (entry.source?.checksum && entry.source.checksum !== `sha256:${sourceHash}`) throw new Error('INTAKE_SOURCE_HASH_MISMATCH');
    const decoded = textFrom(bytes);
    if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u.test(decoded) || decoded.startsWith('%PDF-')) throw new Error('INTAKE_TEXT_INVALID');
    const body = normalize(decoded);
    if (!body) throw new Error('INTAKE_TEXT_EMPTY');
    const bodyHash = hash(body);
    if (bodies.has(bodyHash)) throw new Error('INTAKE_DUPLICATE_BODY');
    bodies.add(bodyHash);
    const revisionHash = hash(canonical({id:entry.id,type:entry.type,title:entry.title,sourceLocale:entry.sourceLocale,source:{...entry.source,checksum:`sha256:${sourceHash}`},rights:entry.rights,taxonomyLinks:entry.taxonomyLinks,body}));
    const item = {id:entry.id,type:entry.type,revision:`v8-intake-${revisionHash.slice(0,24)}`,sourceLocale:entry.sourceLocale,publicationState:'draft',source:{...entry.source,checksum:`sha256:${sourceHash}`},sourceContent:{title:entry.title,body},rights:entry.rights,review:{status:'draft'},revisionHistory:[],derivatives:[],taxonomyLinks:entry.taxonomyLinks,translations:[]};
    items.push(item);
    evidence.push({id:item.id,revision:item.revision,revisionSha256:revisionHash,sourcePath:entry.textPath,sourceSha256:sourceHash,bodySha256:bodyHash,sourceBytes:bytes.length,normalizedCharacters:body.length,wordCount:body.split(/\s+/u).length,changes:['UTF-8 decoding','leading BOM removal','line endings normalized to LF','outer whitespace trimmed'],reviewRequired:['source permissions','article adaptation/context','Scripture references','language'],rightsStatus:item.rights?.status});
  }
  const packet = parseV7ContentBundle({schemaVersion:1,taxonomy:manifest.taxonomy,items});
  const packetText = JSON.stringify(packet,null,2) + '\n';
  return {packet, packetText, report:{schemaVersion:1,state:'unpublished_draft_intake',manifestSha256:hash(canonical(manifest)),packetSha256:hash(packetText),sourceBytes:totalBytes,knownPublishedIdsChecked:existingIds.size,items:evidence}};
}

function assertOutput(path) {
  for (const directory of ['data','assets','kids-games','public','dist-v6']) if (inside(path,resolve(ROOT,directory))) throw new Error('INTAKE_OUTPUT_MUST_NOT_BE_SERVED');
}
export async function runLibraryIntake({manifestPath,sourceRoot,outputDirectory,existingIds,existingBodyHashes}) {
  const output = resolve(outputDirectory); assertOutput(output);
  const manifestBytes = await boundedRead(manifestPath, 1024 * 1024);
  let manifest; try { manifest = JSON.parse(textFrom(manifestBytes)); } catch { throw new Error('INTAKE_MANIFEST_INVALID'); }
  if (!existingIds || !existingBodyHashes) {
    const catalog = await buildV7PublicLibraryCatalog();
    existingIds ||= new Set(catalog.items.map(item=>item.id));
    existingBodyHashes ||= new Set(catalog.items.filter(item=>typeof item.sourceContent?.body === 'string').map(item=>hash(normalize(item.sourceContent.body))));
  }
  const result = await prepareLibraryIntake({manifest,sourceRoot,existingIds,existingBodyHashes});
  result.report.manifestBytesSha256 = hash(manifestBytes);
  await mkdir(dirname(output),{recursive:true});
  assertOutput(resolve(await realpath(dirname(output)),relative(dirname(output),output)));
  await mkdir(output); // Exclusive: never replace an earlier packet or user's files.
  try {
    await writeFile(resolve(output,'draft-bundle.json'),result.packetText,{flag:'wx'});
    await writeFile(resolve(output,'intake-report.json'),JSON.stringify(result.report,null,2)+'\n',{flag:'wx'});
  } catch (error) { await rm(output,{recursive:true,force:true}); throw error; }
  return {outputDirectory:output,itemCount:result.packet.items.length,packetSha256:result.report.packetSha256};
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [manifestPath,sourceRoot,outputDirectory,...extra] = process.argv.slice(2);
  if (!manifestPath || !sourceRoot || !outputDirectory || extra.length) { process.stderr.write('Usage: node scripts/v8-library-intake.mjs <manifest.json> <source-root> <new-output-directory>\n'); process.exitCode=1; }
  else { try { const result=await runLibraryIntake({manifestPath,sourceRoot,outputDirectory}); process.stdout.write(JSON.stringify(result)+'\n'); } catch(error) { process.stderr.write(String(error.message)+'\n'); process.exitCode=1; } }
}
