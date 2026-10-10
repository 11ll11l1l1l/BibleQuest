/**
 * Lane Z image-byte intake (not publication approval).
 * Counts real, source-bound standalone image files with matching sizes,
 * formats and hashes. Pixel quality, text leakage, scene uniqueness and
 * responsive browser QA remain separately required.
 */
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readLaneZCoverQueue } from './v7-lane-z-devotional-cover-queue.mjs';
import { knownRejectedLaneZCoverReason } from './v7-visual-candidate-policy.mjs';

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const RECORDS = 'data/v7/visual-assets/records';
const ASSET_RE = /^\/v7\/images\/devotional\/(bqv7-devotional-[a-z0-9-]+-\d\d)\.(webp|png|jpe?g)$/;
const HEX64 = /^[a-f0-9]{64}$/;

export function dimensionsOfImage(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 30) throw new Error('Truncated or unreadable image');
  if (bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    if (bytes.toString('ascii',12,16) !== 'IHDR') throw new Error('PNG missing IHDR');
    if (!bytes.includes(Buffer.from('IDAT')) || !bytes.includes(Buffer.from('IEND')))
      throw new Error('PNG missing image data or IEND');
    return {format:'png',width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};
  }
  if (bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP') {
    if (bytes.readUInt32LE(4)+8 !== bytes.length) throw new Error('WebP declared byte length mismatch');
    const fourcc=bytes.toString('ascii',12,16);
    if (fourcc==='VP8X' && bytes.length >= 30) {
      const width=1+bytes[24]+(bytes[25]<<8)+(bytes[26]<<16);
      const height=1+bytes[27]+(bytes[28]<<8)+(bytes[29]<<16);
      return {format:'webp',width,height};
    }
    if (fourcc==='VP8 ' && bytes.length>=30 && bytes.subarray(23,26).equals(Buffer.from([0x9d,0x01,0x2a])))
      return {format:'webp',width:bytes.readUInt16LE(26)&0x3fff,height:bytes.readUInt16LE(28)&0x3fff};
    if (fourcc==='VP8L' && bytes.length>=25 && bytes[20]===0x2f) {
      return {format:'webp',width:1+(((bytes[22]&0x3f)<<8)|bytes[21]),
        height:1+(((bytes[24]&0x0f)<<10)|(bytes[23]<<2)|((bytes[22]&0xc0)>>6))};
    }
    throw new Error('Unsupported or truncated WebP frame');
  }
  if (bytes[0]===0xff && bytes[1]===0xd8) {
    let off=2;
    while (off+4<bytes.length) {
      if (bytes[off]!==0xff) throw new Error('Malformed JPEG marker');
      let marker=bytes[off+1];
      while (marker===0xff && off+2<bytes.length) marker=bytes[++off+1];
      off+=2;
      if (marker===0xd9 || marker===0xda) break;
      if (off+2>bytes.length) break;
      const size=bytes.readUInt16BE(off);
      if (size<2 || off+size>bytes.length) throw new Error('Malformed JPEG segment');
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
        if (size<7) throw new Error('Malformed JPEG frame');
        return {format:'jpeg',width:bytes.readUInt16BE(off+5),height:bytes.readUInt16BE(off+3)};
      }
      off+=size;
    }
    throw new Error('JPEG missing supported frame header');
  }
  throw new Error('Unrecognized image encoding');
}

export function validateLaneZCoverRecord(record, source, bytes) {
  const problems=[];
  const path=String(record.imagePath||'');
  const m=path.match(ASSET_RE);
  if (!m || m[1]!==record.assetId) problems.push('unsafe_or_mismatched_cover_path');
  if (!source || !source.rightsEligible) problems.push('missing_or_rights_ineligible_source');
  if (record.family!=='devotional' || record.contentType!=='devotional' || record.visualRole!=='devotional_cover')
    problems.push('not_a_devotional_cover');
  if (source && record.contentId!==source.devotionalId) problems.push('source_id_mismatch');
  if (!record.sourceRevision || record.sourceRevision!==source?.revision) problems.push('source_revision_mismatch');
  if (!record.sourceTitle || record.sourceTitle!==source?.title) problems.push('source_title_mismatch');
  if (!Buffer.isBuffer(bytes)) problems.push('missing_image_bytes');
  let measure=null;
  if (Buffer.isBuffer(bytes)) {
    try {
      measure=dimensionsOfImage(bytes);
      if (measure.width<640 || measure.height<800 || Math.abs(measure.width/measure.height-0.8)>0.0125)
        problems.push('not_a_portrait_4_5_cover');
      if (m && ((m[2]==='jpg'||m[2]==='jpeg'?'jpeg':m[2])!==measure.format))
        problems.push('file_extension_encoding_mismatch');
      if (record.format!==measure.format) problems.push('record_format_mismatch');
      if (record.width!==measure.width || record.height!==measure.height)
        problems.push('record_dimensions_mismatch');
    } catch(err) { problems.push('image_header_invalid:'+err.message); }
    if (bytes.length !== record.fileBytes) problems.push('record_byte_length_mismatch');
    const actualSha256=createHash('sha256').update(bytes).digest('hex');
    const rejectedScene=knownRejectedLaneZCoverReason(actualSha256);
    if (rejectedScene) problems.push('known_rejected_devotional_scene:'+rejectedScene);
    if (!HEX64.test(record.sha256||'') || actualSha256!==record.sha256)
      problems.push('record_sha256_mismatch');
    if (bytes.length>10_000_000) problems.push('cover_exceeds_10mb');
  }
  return {assetId:record.assetId||null,contentId:record.contentId||null,imagePath:path,
    binaryCheckPassed:problems.length===0,visualQaPassed:false,
    status:problems.length===0?'bytes_verified_visual_qa_required':'rejected_technical',
    width:measure?.width||null,height:measure?.height||null,
    fileBytes:bytes?.length||null,problems};
}

export function flagCrossCoverDuplicates(results, rawRecords) {
  const hashes=new Map();
  rawRecords.forEach((record,i)=>{
    if (!results[i].binaryCheckPassed) return;
    const old=hashes.get(record.sha256)||[];old.push(i);hashes.set(record.sha256,old);
  });
  for (const positions of hashes.values()) if (positions.length>1) {
    for (const i of positions) {
      results[i].problems.push('binary_reused_across_distinct_devotionals');
      results[i].binaryCheckPassed=false;
      results[i].status='rejected_technical';
    }
  }
  return results;
}

export async function auditLaneZCoverFiles(root=ROOT) {
  const queue=await readLaneZCoverQueue(root);
  const lookup=new Map(queue.queue.map(item=>[item.devotionalId,item]));
  const names=(await readdir(join(root,RECORDS))).filter(n=>n.endsWith('.json')&&!n.endsWith('-derivatives.json')).sort();
  const recs=[];const findings=[];
  for (const name of names) {
    const record=JSON.parse(await readFile(join(root,RECORDS,name),'utf8'));
    if (record.contentType!=='devotional' || record.visualRole!=='devotional_cover') continue;
    recs.push(record);
    const source=lookup.get(record.contentId);
    let bytes=null;
    if (ASSET_RE.test(String(record.imagePath||''))) {
      try { bytes=await readFile(join(root,'public',record.imagePath.slice(1))); }
      catch { /* Missing binary is a rejection, not an exception. */ }
    }
    findings.push(validateLaneZCoverRecord(record,source,bytes));
  }
  flagCrossCoverDuplicates(findings,recs);
  const uniqueBinaryIds=new Set(findings.filter(f=>f.binaryCheckPassed).map(f=>f.contentId));
  return {lane:'Z',eligibleDevotionals:queue.counts.eligible,coverRecords:findings.length,
    byteVerifiedUniqueDevotionals:uniqueBinaryIds.size,
    requiringIndependentVisualQa:uniqueBinaryIds.size,
    technicallyRejected:findings.filter(f=>!f.binaryCheckPassed).length,
    publicationApprovedByThisTool:0,
    withoutVerifiedBinary:queue.counts.eligible-uniqueBinaryIds.size,
    note:'Valid headers, 4:5 aspect, hashes and source identity do not prove the scene is correct or free of generated text. Independent visual/browser QA and canonical asset audits remain mandatory.',
    findings};
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url))
  console.log(JSON.stringify(await auditLaneZCoverFiles(),null,2));
