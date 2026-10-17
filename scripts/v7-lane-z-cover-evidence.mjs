/**
 * Lane Z: separately measured binary coverage for first-party devotional covers.
 * This audits image-file identity and source binding, not artistic/contextual QA
 * or release acceptance. A claim in a sidecar is never itself an image.
 */
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readLaneZCoverQueue } from './v7-lane-z-devotional-cover-queue.mjs';

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const RECORD_DIR = 'data/v7/visual-assets/records';
const IMAGE_PREFIX = '/v7/images/devotional/';
const FORMATS = new Set(['webp', 'png', 'jpg', 'jpeg']);
const HASH = /^[a-f0-9]{64}$/;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

function imageSize(bytes, format) {
  if (format === 'png') {
    if (bytes.length < 45 || bytes.subarray(0,8).toString('hex') !== '89504e470d0a1a0a'
      || bytes.subarray(12,16).toString('ascii') !== 'IHDR') throw Error('invalid PNG header');
    return [bytes.readUInt32BE(16),bytes.readUInt32BE(20)];
  }
  if (format === 'jpg' || format === 'jpeg') {
    if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw Error('invalid JPEG signature');
    let i=2;
    while(i+4<bytes.length) {
      if(bytes[i++]!==0xff)continue;
      let marker=bytes[i++];
      while(marker===0xff&&i<bytes.length)marker=bytes[i++];
      if(marker===0xda||marker===0xd9)break;
      if(marker===0xd8||(marker>=0xd0&&marker<=0xd7)||marker===0x01)continue;
      const n=bytes.readUInt16BE(i);
      if(n<2||i+n>bytes.length)break;
      if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))
        return [bytes.readUInt16BE(i+5),bytes.readUInt16BE(i+3)];
      i+=n;
    }
    throw Error('missing JPEG geometry');
  }
  if(bytes.length<22 || bytes.toString('ascii',0,4)!=='RIFF' || bytes.toString('ascii',8,12)!=='WEBP')
    throw Error('invalid WebP header');
  for(let i=12;i+8<=bytes.length;) {
    const tag=bytes.toString('ascii',i,i+4), size=bytes.readUInt32LE(i+4), at=i+8;
    if(at+size>bytes.length)throw Error('truncated WebP chunk');
    if(tag==='VP8X' && size>=10) return [1+bytes.readUIntLE(at+4,3),1+bytes.readUIntLE(at+7,3)];
    if(tag==='VP8L' && size>=5 && bytes[at]===0x2f)
      return [1+(bytes[at+1]|((bytes[at+2]&0x3f)<<8)),
        1+((bytes[at+2]>>6)|(bytes[at+3]<<2)|((bytes[at+4]&0x0f)<<10))];
    if(tag==='VP8 ' && size>=10 && bytes[at+3]===0x9d && bytes[at+4]===0x01 && bytes[at+5]===0x2a)
      return [bytes.readUInt16LE(at+6)&0x3fff,bytes.readUInt16LE(at+8)&0x3fff];
    i=at+size+(size%2);
  }
  throw Error('missing WebP geometry');
}

export async function auditLaneZImageCoverage(queue, records, readImage) {
  const originals = new Map(queue.queue.filter(row=>row.rightsEligible)
    .map(row=>[row.devotionalId,row]));
  const evidence = new Map(), seenSha=new Map(), failures=[];
  let candidateFilesVerified=0, publishedFilesVerified=0;
  for(const record of records) {
    if(record.contentType!=='devotional' || record.visualRole!=='devotional_cover')continue;
    const issues=[];
    const row=originals.get(record.contentId);
    if(!row)issues.push('unknown or ineligible devotional ID');
    if(record.family!=='devotional')issues.push('incorrect image family');
    if(!record.assetId || !/^bqv7-devotional-[a-z0-9-]+$/.test(record.assetId))issues.push('invalid asset ID');
    if(!record.imagePath?.startsWith(IMAGE_PREFIX)
      || !/^\/v7\/images\/devotional\/[a-z0-9-]+\.(webp|png|jpg|jpeg)$/.test(record.imagePath))
      issues.push('invalid/path-unsafe devotional image path');
    if(!FORMATS.has(record.format)||record.imagePath?.split('.').pop()!==record.format)
      issues.push('unsupported or mismatched image format');
    if(row && record.sourceRevision!==row.revision)issues.push('source revision mismatch');
    if(row && record.sourcePath!==row.sourcePath)issues.push('source path mismatch');
    if(record.rights?.sourceType!=='generated' || record.rights?.thirdPartyAsset!==false)
      issues.push('missing generated-art rights evidence');
    if(!record.accessibility?.altText?.trim())issues.push('missing meaningful alt text');
    if(!HASH.test(record.sha256||''))issues.push('missing/invalid SHA-256');
    if(!Number.isInteger(record.fileBytes)||record.fileBytes<=0)issues.push('missing byte count');
    if(!issues.some(x=>x.includes('path')||x.includes('format'))) {
      try{
        const bytes=await readImage(record.imagePath);
        if(bytes.length!==record.fileBytes)issues.push('file byte count mismatch');
        const actual=sha256(bytes);
        if(actual!==record.sha256)issues.push('file SHA-256 mismatch');
        const [w,h]=imageSize(bytes,record.format);
        if(w!==record.width||h!==record.height)issues.push('geometry mismatch');
        if(w<800||h<1000||Math.abs(w/h-4/5)>0.004)issues.push('not a usable 4:5 portrait >=800x1000');
        const other=seenSha.get(actual);
        if(other && other!==record.contentId)issues.push('same image bytes reused for '+other);
        else seenSha.set(actual,record.contentId);
      }catch(error){issues.push('image bytes missing or undecodable metadata: '+error.message);}
    }
    const technicalPass=issues.length===0;
    if(technicalPass) {
      if(record.status==='production_ready')publishedFilesVerified++;
      else candidateFilesVerified++;
    }
    if(issues.length)failures.push({assetId:record.assetId||null,contentId:record.contentId||null,issues});
    const previous=evidence.get(record.contentId)||[];
    previous.push({assetId:record.assetId,technicalPass,published:record.status==='production_ready',issues});
    evidence.set(record.contentId,previous);
  }
  const rows=queue.queue.map(row=>{
    const art=evidence.get(row.devotionalId)||[];
    const pass=art.some(x=>x.technicalPass&&x.published);
    return {
      devotionalId:row.devotionalId,title:row.title,
      rightsEligible:row.rightsEligible,
      binaryVerified:pass,
      assets:art,
      // A pixel/artistic review and exact-head built-app evidence are *separate* gates.
      editorialApproved:false,releaseCertified:false,
      nextAction:!row.rightsEligible?'hold_rights':pass?'editorial_and_browser_qa':
        art.length?'repair_candidate_or_binary_proof':'create_original_cover'
    };
  });
  return {
    schemaVersion:1,lane:'Z',type:'technical_binary_inventory_not_release_certification',
    counts: {
      devotionals:rows.length,eligible:originals.size,
      publishedBinaryVerified:rows.filter(x=>x.binaryVerified).length,
      candidateFilesVerified,publishedFilesVerified,
      editorialApproved:0,releaseCertified:0,
      unfilled:rows.filter(x=>x.nextAction==='create_original_cover').length,
      needsRepair:rows.filter(x=>x.nextAction==='repair_candidate_or_binary_proof').length
    },
    failures,rows
  };
}

export async function auditLaneZCoverRepository(root=ROOT) {
  const queue=await readLaneZCoverQueue(root);
  const filenames=(await readdir(join(root,RECORD_DIR))).filter(n=>n.endsWith('.json')&&!n.endsWith('-derivatives.json'));
  const records=await Promise.all(filenames.map(async name=>JSON.parse(await readFile(join(root,RECORD_DIR,name),'utf8'))));
  const reader=path=>readFile(join(root,'public',path.slice(1)));
  return auditLaneZImageCoverage(queue,records,reader);
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const report=await auditLaneZCoverRepository();
  const short=process.argv.includes('--summary');
  console.log(JSON.stringify(short?{counts:report.counts,failures:report.failures}:report,null,2));
  if(report.failures.length)process.exitCode=1;
}
