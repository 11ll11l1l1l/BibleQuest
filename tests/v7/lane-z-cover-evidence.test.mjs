import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { auditLaneZImageCoverage, auditLaneZCoverRepository } from '../../scripts/v7-lane-z-cover-evidence.mjs';

function png(width=800,height=1000) {
  const crc32=b=>{let c=-1;for(const x of b){c^=x;for(let j=0;j<8;j++)c=(c>>>1)^(c&1?0xedb88320:0);}return(c^-1)>>>0;};
  const chunk=(type,b)=>{const name=Buffer.from(type),n=Buffer.alloc(4),crc=Buffer.alloc(4);
    n.writeUInt32BE(b.length);crc.writeUInt32BE(crc32(Buffer.concat([name,b])));return Buffer.concat([n,name,b,crc]);};
  const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=2;
  const scan=Buffer.alloc(height*(width*3+1));
  return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),
    chunk('IDAT',deflateSync(scan)),chunk('IEND',Buffer.alloc(0))]);
}
const ID='devotional.biblequest.anxiety_worry.01';
const PATH='/v7/images/devotional/bqv7-devotional-biblequest-anxiety-worry-01.png';
const source={schemaVersion:1,queue:[{devotionalId:ID,title:'One concern at a time',
  revision:'r1',sourcePath:'content/v7/devotionals/source.json',rightsEligible:true}]};
const bytes=png();
const rec={
  schemaVersion:1,assetId:'bqv7-devotional-biblequest-anxiety-worry-01',
  contentType:'devotional',contentId:ID,family:'devotional',visualRole:'devotional_cover',
  status:'production_ready',sourceRevision:'r1',sourcePath:'content/v7/devotionals/source.json',
  imagePath:PATH,format:'png',width:800,height:1000,fileBytes:bytes.length,
  sha256:createHash('sha256').update(bytes).digest('hex'),
  rights:{sourceType:'generated',thirdPartyAsset:false},
  accessibility:{altText:'A person placing a single folded note on a quiet table.'}
};
const read=async () => bytes;

test('unfilled queue never counts a generated-file claim', async ()=>{
 const result=await auditLaneZImageCoverage(source,[],read);
 assert.equal(result.counts.eligible,1);
 assert.equal(result.counts.publishedBinaryVerified,0);
 assert.equal(result.counts.unfilled,1);
 assert.equal(result.counts.editorialApproved,0);
});

test('actual hashed portrait passes technical checks but not editorial/release certification',async ()=>{
 const result=await auditLaneZImageCoverage(source,[rec],read);
 assert.deepEqual(result.failures,[]);
 assert.equal(result.counts.publishedBinaryVerified,1);
 assert.equal(result.counts.editorialApproved,0);
 assert.equal(result.counts.releaseCertified,0);
 assert.equal(result.rows[0].nextAction,'editorial_and_browser_qa');
});

test('candidate bytes never count as published artwork',async ()=>{
 const result=await auditLaneZImageCoverage(source,[{...rec,status:'candidate_qa_pending'}],read);
 assert.equal(result.counts.candidateFilesVerified,1);
 assert.equal(result.counts.publishedBinaryVerified,0);
 assert.equal(result.rows[0].nextAction,'repair_candidate_or_binary_proof');
});

test('wrong hash, source revision and malformed geometry fail closed',async ()=>{
 const out=await auditLaneZImageCoverage(source,[{
  ...rec,sha256:'0'.repeat(64),sourceRevision:'r2',width:801
 }],read);
 assert.equal(out.counts.publishedBinaryVerified,0);
 assert.match(JSON.stringify(out.failures),/file SHA-256 mismatch/);
 assert.match(JSON.stringify(out.failures),/geometry mismatch/);
 assert.match(JSON.stringify(out.failures),/source revision mismatch/);
});

test('path traversal and missing file are treated as failed evidence',async ()=>{
 const bad=await auditLaneZImageCoverage(source,[{...rec,imagePath:'/v7/images/devotional/../../secret.png'}],read);
 assert.match(JSON.stringify(bad.failures),/path-unsafe/);
 const missing=await auditLaneZImageCoverage(source,[rec],async()=>{throw Error('ENOENT');});
 assert.match(JSON.stringify(missing.failures),/ENOENT/);
});

test('identical binary cannot be reused for two different devotionals',async ()=>{
 const second='devotional.biblequest.fear.01';
 const queue={queue:[...source.queue,{...source.queue[0],devotionalId:second,title:'Courage for the next step'}]};
 const duplicate={...rec,assetId:'bqv7-devotional-biblequest-fear-01',contentId:second,
  imagePath:'/v7/images/devotional/bqv7-devotional-biblequest-fear-01.png'};
 const out=await auditLaneZImageCoverage(queue,[rec,duplicate],read);
 assert.equal(out.counts.publishedBinaryVerified,1);
 assert.match(JSON.stringify(out.failures),/same image bytes reused/);
});

test('current repository remains unverified rather than inventing 300 completed covers',async ()=>{
 const result=await auditLaneZCoverRepository();
 assert.equal(result.counts.eligible,300);
 assert.equal(result.counts.editorialApproved,0);
 assert.equal(result.counts.releaseCertified,0);
});
