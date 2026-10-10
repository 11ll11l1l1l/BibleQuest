import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {triageV7DerivativeCandidates} from '../../scripts/v7-derivative-candidate-triage.mjs';

const project=fileURLToPath(new URL('../../',import.meta.url));
const assetId='bqv7-emotion-fear-01';
const fileNames=[assetId+'.json',assetId+'-derivatives.json'];
async function makeFixture(t){
  const root=await mkdtemp(join(tmpdir(),'bq-v7-derivative-review-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  const dir=join(root,'data/v7/visual-assets/records');
  await mkdir(dir,{recursive:true});
  const records={};
  for(const name of fileNames){
    records[name]=JSON.parse(await readFile(join(project,'data/v7/visual-assets/records',name)));
  }
  const side=records[assetId+'-derivatives.json'];
  // Only the old SVG had a failed static source policy. The current
  // separately decoded WebP is NOT automatically rights/pixel approved.
  side.qc.staticSvgSafetyReviewed=null;
  side.qc.svgDataUriPolicyCompliant=null;
  await mkdir(join(root,'src/features/library'),{recursive:true});
  await writeFile(join(root,'src/features/library/emotion-taxonomy.js'),
    await readFile(join(project,'src/features/library/emotion-taxonomy.js')));
  for(const row of side.variants){
    const src=join(project,'public',row.imagePath.slice(1));
    const dest=join(root,'public',row.imagePath.slice(1));
    await mkdir(dirname(dest),{recursive:true});
    await writeFile(dest,await readFile(src));
  }
  async function save(){
    for(const [name,record] of Object.entries(records))
      await writeFile(join(dir,name),JSON.stringify(record));
  }
  await save();
  return {root,records,side,save};
}

test('actual Fear derivative WebPs can be technically QA routed without publishing TYPE',async t=>{
  const fixture=await makeFixture(t);
  const result=await triageV7DerivativeCandidates(fixture.root);
  assert.equal(result.rejected.length,0,JSON.stringify(result.rejected));
  assert.equal(result.technicallyVerified.length,1);
  const candidate=result.technicallyVerified[0];
  assert.equal(candidate.assetId,assetId+'-derivatives');
  assert.equal(candidate.sourceMasterAssetId,assetId);
  assert.equal(candidate.publicationApproved,false);
  assert.deepEqual(candidate.files.map(v=>v.kind),['CLEAN','TYPE','THUMB']);
  assert(candidate.files.every(v=>v.path.endsWith('.webp')));
  assert(candidate.files.every(v=>/^[0-9a-f]{64}$/.test(v.sha256)));
});

test('candidate with a flipped TYPE byte fails closed rather than gaining browser PASS',async t=>{
  const f=await makeFixture(t);
  const type=f.side.variants.find(v=>v.kind==='TYPE');
  const p=join(f.root,'public',type.imagePath.slice(1));
  const bytes=await readFile(p);
  bytes[bytes.length-3]^=0x3f;
  await writeFile(p,bytes);
  const r=await triageV7DerivativeCandidates(f.root);
  assert.equal(r.technicallyVerified.length,0);
  assert.match(r.rejected[0].reason,/SHA mismatch/);
});

test('candidate with retired SVG pointer or explicit failed QA cannot be auto-certified',async t=>{
  const f=await makeFixture(t);
  f.side.imagePath='/v7/images/emotion/'+assetId+'-with-text-en.svg';
  f.side.format='svg';
  await f.save();
  let r=await triageV7DerivativeCandidates(f.root);
  assert.equal(r.technicallyVerified.length,0);
  assert.match(r.rejected[0].reason,/stale derivative primary pointer/);
  delete f.side.imagePath;
  f.side.qc.staticSvgSafetyReviewed=false;
  await f.save();
  r=await triageV7DerivativeCandidates(f.root);
  assert.equal(r.technicallyVerified.length,0);
  assert.match(r.rejected[0].reason,/quarantined/);
});

test('the actual unmodified base Fear sidecar remains quarantined while static SVG flag is stale',async()=>{
  const r=await triageV7DerivativeCandidates();
  const entry=r.rejected.find(x=>x.assetId===assetId+'-derivatives');
  assert(entry,'legacy stored false SVG QA flag should not silently auto-pass');
  assert.match(entry.reason,/quarantined/);
});
