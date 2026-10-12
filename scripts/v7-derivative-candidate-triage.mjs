/**
 * Candidate-only, source-locked triage for historical Lane Y derivative sidecars.
 * Published CLEAN masters are reused without republishing any candidate TYPE.
 * No image becomes production-ready because it passes these technical checks.
 */
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIBRARY_EMOTIONS } from '../src/features/library/emotion-taxonomy.js';
import { EMOTION_QUEUE_CANONICAL } from './v7-visual-assets-audit.mjs';
import { candidateQuarantineReason } from './v7-visual-candidate-policy.mjs';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const SHA=b=>createHash('sha256').update(b).digest('hex');
const blobSHA=b=>createHash('sha1').update(Buffer.from('blob '+b.length)).update(Buffer.from([0])).update(b).digest('hex');
const FILENAME=/^(bqv7-emotion-[a-z0-9-]+-[0-9]{2,})-derivatives\.json$/;
const SAFE_PATH=/^\/v7\/images\/emotion\/bqv7-emotion-[a-z0-9-]+\.webp$/;
function geometry(bytes) {
  if(bytes.length<32||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')throw Error('not a genuine WebP');
  for(let i=12;i+8<=bytes.length;){
    const tag=bytes.toString('ascii',i,i+4),len=bytes.readUInt32LE(i+4),p=i+8;
    if(p+len>bytes.length)throw Error('truncated WebP');
    if(tag==='VP8X'&&len>=10)return [1+bytes.readUIntLE(p+4,3),1+bytes.readUIntLE(p+7,3)];
    if(tag==='VP8L'&&len>=5&&bytes[p]===0x2f)return [1+(bytes[p+1]|((bytes[p+2]&63)<<8)),1+((bytes[p+2]>>6)|(bytes[p+3]<<2)|((bytes[p+4]&15)<<10))];
    if(tag==='VP8 '&&len>=10&&bytes[p+3]===0x9d&&bytes[p+4]===1&&bytes[p+5]===0x2a)return [bytes.readUInt16LE(p+6)&16383,bytes.readUInt16LE(p+8)&16383];
    i=p+len+(len%2);
  }
  throw Error('unrecognized WebP frame');
}
async function verify(root, masterId, variant){
  const path=variant?.imagePath;
  if(!path||!SAFE_PATH.test(path)||!path.startsWith('/v7/images/emotion/'+masterId))throw Error('invalid or cross-owner candidate path');
  if(variant.format!=='webp')throw Error('SVG or other non-WebP derivative is not eligible');
  const dir=resolve(root,'public/v7/images/emotion');
  const file=resolve(root,'public',path.slice(1));
  if(!file.startsWith(dir+'/'))throw Error('candidate path escapes image root');
  const bytes=await readFile(file);
  if(bytes.length!==variant.fileBytes||SHA(bytes)!==variant.sha256)throw Error('candidate size or SHA mismatch: '+path);
  const [width,height]=geometry(bytes);
  if(width!==variant.width||height!==variant.height)throw Error('candidate native geometry mismatch: '+path);
  if(!variant.altText?.trim())throw Error('candidate image missing alt text');
  return {kind:variant.kind,path,sha256:variant.sha256,width,height,bytes:bytes.length};
}
export async function triageV7DerivativeCandidates(root=ROOT){
  const dir=join(root,'data/v7/visual-assets/records');
  const names=(await readdir(dir)).filter(x=>FILENAME.test(x)).sort();
  const technicallyVerified=[],rejected=[];
  for(const name of names){
    const assetId=name.slice(0,-'.json'.length),masterId=name.slice(0,-'-derivatives.json'.length);
    try{
      const record=JSON.parse(await readFile(join(dir,name),'utf8'));
      const master=JSON.parse(await readFile(join(dir,masterId+'.json'),'utf8'));
      if(record.assetId!==assetId||record.sourceMasterAssetId!==masterId||master.assetId!==masterId)throw Error('master / derivative identity mismatch');
      if(!String(record.status).startsWith('candidate'))continue;
      if(record.productionCertified===true||record.qa?.productionReady===true)throw Error('candidate falsely claims approval');
      const reason=candidateQuarantineReason(record);
      if(reason)throw Error('candidate quarantined: '+reason);
      if(record.contentType!=='emotion'||record.schemaVersion!==2||record.recordType!=='derivative_bundle')throw Error('candidate derivative schema incorrect');
      if(record.contentId!==master.contentId||master.status!=='production_ready')throw Error('CLEAN source not a valid production master');
      const canonical=EMOTION_QUEUE_CANONICAL[record.contentId];
      const taxonomy=LIBRARY_EMOTIONS.find(x=>x.id===canonical);
      const historical=record.inspectionEvidence;
      const proof=record.wordingEvidence || (historical ? {
        sourcePath: historical.taxonomySourcePath,
        sourceBlobSha: historical.taxonomyBlobSha,
        canonicalEmotionId: historical.canonicalEmotionId,
        locale:'en',
        exactLabel:historical.exactLabel,
        reference:historical.approvedReference,
        scriptureTextIncluded:historical.scriptureTextIncluded
      } : null);
      if(!taxonomy||proof?.sourcePath!=='src/features/library/emotion-taxonomy.js'
        ||proof.sourceBlobSha!==blobSHA(await readFile(join(root,proof.sourcePath)))
        ||proof.canonicalEmotionId!==canonical||proof.locale!=='en'
        ||proof.exactLabel!==taxonomy.labels.en||!taxonomy.scripture.includes(proof.reference)
        ||proof.scriptureTextIncluded!==false)throw Error('TYPE wording or Scripture source mismatch');
      const side=new Map((record.variants||[]).map(v=>[v.kind,v]));
      if(side.size!==(record.variants||[]).length||[...side.keys()].some(x=>!['CLEAN','TYPE','THUMB'].includes(x)))throw Error('duplicate or unsupported variant');
      const existing=new Map((master.variants||[]).map(v=>[v.kind,v]));
      const clean=side.get('CLEAN')||existing.get('CLEAN')||{kind:'CLEAN',imagePath:master.imagePath,format:master.format,width:master.width,height:master.height,fileBytes:master.fileBytes,sha256:master.sha256,altText:master.accessibility?.altText};
      const type=side.get('TYPE'),thumb=side.get('THUMB')||existing.get('THUMB');
      if(!type||!thumb)throw Error('three-file bundle incomplete');
      if(clean.imagePath!==master.imagePath||clean.sha256!==master.sha256)throw Error('candidate changed original CLEAN');
      if(type.locale!=='en'||type.embeddedWording?.label!==proof.exactLabel
        ||type.embeddedWording?.scriptureReference!==proof.reference
        ||type.embeddedWording?.scriptureTextIncluded!==false)throw Error('embedded wording or Bible reference mismatch');
      if(thumb.embeddedWording||thumb.locale)throw Error('THUMB must be text-free and locale-null');
      const files=[];
      for(const variant of [clean,type,thumb])files.push(await verify(root,masterId,variant));
      if(new Set(files.map(x=>x.path)).size!==3||new Set(files.map(x=>x.sha256)).size!==3)throw Error('candidate files reused across variants');
      if(record.imagePath&&(record.imagePath!==type.imagePath||record.format!=='webp'
        ||record.sha256!==type.sha256))throw Error('stale derivative primary pointer');
      technicallyVerified.push({assetId,sourceMasterAssetId:masterId,contentType:'emotion',status:record.status,
        files,publicationApproved:false});
    }catch(error){rejected.push({assetId,reason:error.message});}
  }
  return {technicallyVerified,rejected,publicationApproved:false};
}
