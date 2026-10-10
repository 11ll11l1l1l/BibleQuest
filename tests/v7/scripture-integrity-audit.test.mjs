import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { auditScriptureReviews, checkScriptureReview } from '../../scripts/v7-scripture-integrity-audit.mjs';

const base = () => ({
 schemaVersion:1, contentPath:'data/v7/visual-assets/records/sample.json', assetId:'sample',
 locale:'en', translation:'BSB', reference:'Psalm 68:6',
 displayKind:'reference_only', displayedWords:null, imageSha256:'a'.repeat(64), canonicalSourceBlobSha:'b'.repeat(40),
 textSource:'BSB Psalm 68', licenseEvidence:null, exactTextVerified:false,
 referenceVerified:true, contextVerified:true, applicationVerified:true,
 renderedTextVerifiedAt320px:true, reviewer:'independent reviewer',
 reviewedAt:'2026-10-09T00:00:00Z', status:'approved',
 contextNotes:'Psalm 68:5–6 addresses care for vulnerable people'
});
test('reference-only review accepts applicable evidence', () => {
 assert.deepEqual(checkScriptureReview(base()), []);
});
test('quotation requires exact text and licensing evidence', () => {
 const row={...base(),displayKind:'scripture_quote',displayedWords:'A quotation'};
 assert.match(checkScriptureReview(row).join(' '), /licensing or exact-text/);
});
test('baked image text needs inspected 320px evidence', () => {
 const row={...base(),renderedTextVerifiedAt320px:false};
 assert.match(checkScriptureReview(row).join(' '), /rendered image text/);
});
test('missing theological context blocks approval', () => {
 const row={...base(),contextVerified:false};
 assert.match(checkScriptureReview(row).join(' '), /contextVerified/);
});
test('pending reviews cannot count as approved', () => {
 const row={...base(),status:'pending',referenceVerified:false};
 assert.deepEqual(checkScriptureReview(row), []);
});


test('approved reviews require exact source revision evidence', () => {
 const row={...base(),canonicalSourceBlobSha:null};
 assert.match(checkScriptureReview(row).join(' '), /canonicalSourceBlobSha/);
});

test('missing review and asset inventories fail closed', async t => {
 const root=await mkdtemp(join(tmpdir(),'bq-v7-scripture-missing-'));
 t.after(()=>rm(root,{recursive:true,force:true}));
 const result=await auditScriptureReviews(root);
 assert.equal(result.status,'BLOCKED');
 assert.match(result.errors.join(' '),/required Scripture review directory is missing/);
 assert.match(result.errors.join(' '),/required visual record directory is missing/);
});

test('approval binds the source record and actual image bytes to their reviewed hashes', async t => {
 const root=await mkdtemp(join(tmpdir(),'bq-v7-scripture-sha-'));
 t.after(()=>rm(root,{recursive:true,force:true}));
 const recordDir=join(root,'data/v7/visual-assets/records');
 const reviewDir=join(root,'data/v7/scripture-reviews');
 const imageDir=join(root,'public/v7/images/emotion');
 await Promise.all([mkdir(recordDir,{recursive:true}),mkdir(reviewDir,{recursive:true}),mkdir(imageDir,{recursive:true})]);
 const assetId='sample';
 const recordPath='data/v7/visual-assets/records/'+assetId+'.json';
 const imagePath='/v7/images/emotion/sample.svg';
 const image=Buffer.from('<svg/>');
 const imageSha256=createHash('sha256').update(image).digest('hex');
 const record={assetId,imagePath,sha256:imageSha256,variants:[],rights:{
   sourceType:'original_programmatic_vector',artRights:'Original artwork',
   thirdPartyAsset:false,attributionRequired:false
 }};
 const source=Buffer.from(JSON.stringify(record));
 const sourceSha=createHash('sha1').update(Buffer.from('blob '+source.length)).update(Buffer.from([0])).update(source).digest('hex');
 const review={...base(),contentPath:recordPath,assetId,imageSha256,canonicalSourceBlobSha:sourceSha};
 await Promise.all([
   writeFile(join(root,recordPath),source),
   writeFile(join(root,'public',imagePath.slice(1)),image),
   writeFile(join(reviewDir,'sample.json'),JSON.stringify(review))
 ]);
 const result=await auditScriptureReviews(root);
 assert.equal(result.status,'PASS',JSON.stringify(result.errors));
 assert.deepEqual(result.counts,{records:1,approved:1,pending:0,unreviewed:0});
});
