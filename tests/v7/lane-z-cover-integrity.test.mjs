import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { dimensionsOfImage,validateLaneZCoverRecord,flagCrossCoverDuplicates } from '../../scripts/v7-lane-z-cover-integrity.mjs';

function crc(b){let c=0xffffffff;for(const v of b){c^=v;for(let k=0;k<8;k++) c=c&1?(c>>>1)^0xedb88320:c>>>1;}return(c^0xffffffff)>>>0;}
function chunk(type,data){const h=Buffer.alloc(4);h.writeUInt32BE(data.length);const t=Buffer.from(type);const f=Buffer.alloc(4);f.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([h,t,data,f]);}
function png(w,h){const header=Buffer.alloc(13);header.writeUInt32BE(w,0);header.writeUInt32BE(h,4);header[8]=8;header[9]=2;const scanline=Buffer.alloc(h*(1+w*3));return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(scanline)),chunk('IEND',Buffer.alloc(0))]);}
const source={devotionalId:'devotional.biblequest.anxiety_worry.01',title:'One concern at a time',revision:'r1',rightsEligible:true};
function record(b){return {assetId:'bqv7-devotional-biblequest-anxiety-worry-01-01',imagePath:'/v7/images/devotional/bqv7-devotional-biblequest-anxiety-worry-01-01.png',format:'png',width:800,height:1000,fileBytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),family:'devotional',contentType:'devotional',visualRole:'devotional_cover',contentId:source.devotionalId,sourceRevision:'r1',sourceTitle:'One concern at a time',status:'production_ready'};}

test('real 4:5 standalone image passes bytes gate but never visual QA',()=>{
 const b=png(800,1000);const v=validateLaneZCoverRecord(record(b),source,b);
 assert.equal(v.binaryCheckPassed,true);assert.equal(v.visualQaPassed,false);
 assert.equal(v.status,'bytes_verified_visual_qa_required');
});
test('wide dashboard or contact sheet is rejected regardless of sidecar status',()=>{
 const b=png(1200,800),r=record(b);r.width=1200;r.height=800;
 const v=validateLaneZCoverRecord(r,source,b);assert.equal(v.binaryCheckPassed,false);
 assert.match(v.problems.join(' '),/not_a_portrait_4_5_cover/);
});
test('tampered metadata and hash fail closed',()=>{
 const b=png(800,1000),r=record(b);r.sha256='1'.repeat(64);r.fileBytes=b.length+1;r.sourceRevision='r2';
 const v=validateLaneZCoverRecord(r,source,b);
 assert.deepEqual(v.problems.sort(),['record_byte_length_mismatch','record_sha256_mismatch','source_revision_mismatch'].sort());
});
test('unsafe path, absent image, and unrelated source fail',()=>{
 const b=png(800,1000),r=record(b);r.imagePath='/v7/images/devotional/../../secret.png';r.contentId='other';
 const v=validateLaneZCoverRecord(r,source,null);assert.equal(v.binaryCheckPassed,false);
 assert.ok(v.problems.includes('unsafe_or_mismatched_cover_path'));
 assert.ok(v.problems.includes('source_id_mismatch'));
 assert.ok(v.problems.includes('missing_image_bytes'));
});
test('different devotional IDs cannot reuse the same image binary',()=>{
 const b=png(800,1000),r1=record(b),r2={...r1,assetId:'bqv7-devotional-other-01',imagePath:'/v7/images/devotional/bqv7-devotional-other-01.png',contentId:'devotional.biblequest.other.01',sourceTitle:'Another story'};
 const src2={devotionalId:r2.contentId,title:r2.sourceTitle,revision:'r1',rightsEligible:true};
 const checks=[validateLaneZCoverRecord(r1,source,b),validateLaneZCoverRecord(r2,src2,b)];
 flagCrossCoverDuplicates(checks,[r1,r2]);assert.equal(checks.filter(x=>x.binaryCheckPassed).length,0);
});
test('unreadable or fake image file is rejected',()=>{
 const bytes=Buffer.from('fake-image'.repeat(40)),r=record(bytes);r.fileBytes=bytes.length;
 const v=validateLaneZCoverRecord(r,source,bytes);assert.equal(v.binaryCheckPassed,false);
 assert.match(v.problems.join(' '),/image_header_invalid/);
});
test('WebP VP8X dimension parser rejects doctored RIFF lengths',()=>{
 const b=Buffer.alloc(40);b.write('RIFF',0);b.writeUInt32LE(32,4);b.write('WEBP',8);b.write('VP8X',12);b.writeUInt32LE(10,16);
 b[24]=127;b[25]=2;b[27]=231;b[28]=3;
 assert.deepEqual(dimensionsOfImage(b),{format:'webp',width:640,height:1000});
 b.writeUInt32LE(21,4);assert.throws(()=>dimensionsOfImage(b),/length mismatch/);
});
