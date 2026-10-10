import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIBRARY_EMOTIONS } from '../../src/features/library/emotion-taxonomy.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const expected = [
  ['anxiety-worry', 'THUMB', 'ca5ccf4f4f256911783d8c9921f7bd889896dda1895e051a582cb28e1271c5a5', 26430, 384, 480],
  ['hurt-betrayal', 'TYPE', '530b122c24b088199e4bbfb81f32cc465091da25486a1a65ba4aa3edeff73987', 165908, 1024, 1280],
  ['hurt-betrayal', 'THUMB', 'd55a743c0d295a1b46b1072f422325ba2f4e3becee220c0a4599dd034b29b5d4', 67402, 512, 640],
  ['rejection', 'TYPE', 'a164c0f11f9bf8ad6963a7ef73347aa248a43f9fa12ec760d9769c99704300fe', 111752, 1024, 1280],
  ['rejection', 'THUMB', 'c3cdeb2a854065c811258227dfb2806498e11bb5682a56ee909fd4b8c60b7669', 34590, 384, 480],
  ['spiritual-dryness-distance', 'TYPE', '2447467ec045954618fdb71c87d721371c9cdd28e53831c7e025ce969bd48107', 116420, 1024, 1280],
  ['spiritual-dryness-distance', 'THUMB', 'c607f6d7a593605b3cf2b6fde0365c5a60d33b90fd1a6f2d6e34889ef73821c9', 34316, 400, 500],
  ['temptation', 'TYPE', 'f7d703c009a37915af8de5474afc6306002e157bae3661079400af6c1eb996f1', 192340, 1024, 1280],
];
const originals = Object.freeze({
  'anxiety-worry':'675f2d1aefc74edec328f21a47109b37be77d53fcc0d6c53f3e23d0292db5d61',
  'hurt-betrayal':'a62aa4bc1634457a97feb705bedb072f13f0d4fc59990c1a73642dc9ff30957c',
  rejection:'851925b93ad108f90aa1f0943259debcd9aef4db9181e488029a782882d2b448',
  'spiritual-dryness-distance':'4da226c6017a64bb108d52a66ddea338d9d4feb4adc4c03393abc67a257332d3',
  temptation:'51bc3448770b8b69677db1e58c1a40f941506742777a583fbf85c3b462c5b675',
});

function verifyWebP(bytes, sha, count) {
  assert.equal(bytes.length, count);
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.equal(digest(bytes),sha,'actual WebP bytes must match the sidecar and exporter');
}

test('eight Lane Y derivatives are real hash-pinned WebPs, old SVG is absent and CLEAN source is unchanged', async () => {
  const records = new Map();
  for (const [id, kind, hash, byteCount, width, height] of expected) {
    if (!records.has(id)) {
      const masterId = 'bqv7-emotion-'+id+'-01';
      const record = JSON.parse(await readFile(join(ROOT,'data/v7/visual-assets/records',masterId+'-derivatives.json'),'utf8'));
      const master = JSON.parse(await readFile(join(ROOT,'data/v7/visual-assets/records',masterId+'.json'),'utf8'));
      assert.equal(master.status,'production_ready','the original approved CLEAN must be preserved');
      assert.equal(master.sha256,originals[id]);
      assert.equal(digest(await readFile(join(ROOT,'public',master.imagePath.slice(1)))), originals[id]);
      assert.notEqual(record.qa?.productionReady,true);
      assert.notEqual(record.qc?.productionReady,true);
      assert.match(record.status, /candidate.*qa_pending/);
      assert.equal(record.laneYRasterExportEvidence?.runId,38045007143);
      records.set(id,record);
    }
    const record=records.get(id);
    const variant=record.variants.find(x=>x.kind===kind);
    assert.ok(variant,'missing '+id+'/'+kind);
    const expectedPath='/v7/images/emotion/bqv7-emotion-'+id+'-01-'+(kind==='TYPE'?'with-text-en':'thumbnail')+'.webp';
    assert.equal(variant.imagePath,expectedPath);
    assert.equal(variant.format,'webp');
    assert.equal(variant.sha256,hash);
    assert.equal(variant.fileBytes,byteCount);
    assert.deepEqual([variant.width,variant.height],[width,height]);
    verifyWebP(await readFile(join(ROOT,'public',expectedPath.slice(1))),hash,byteCount);
    assert.equal(variant.legacySvgSource?.format,'svg');
    assert.match(variant.legacySvgSource?.sha256||'',/^[0-9a-f]{64}$/);
    await assert.rejects(access(join(ROOT,'public',variant.legacySvgSource.path.slice(1))),{code:'ENOENT'});
    assert.equal((variant.qa||variant.qc)?.independentVisualApproval,false);
    if (kind==='TYPE') {
      const proof=record.wordingEvidence;
      const canonical=LIBRARY_EMOTIONS.find(x=>x.id===proof?.canonicalEmotionId);
      assert.ok(canonical,'canonical taxonomy entry missing for '+id);
      assert.equal(proof.exactLabel,canonical.labels.en);
      assert.ok(canonical.scripture.includes(proof.reference),'taxonomy Scripture reference drift');
      assert.equal(proof.scriptureTextIncluded,false,'verse prose must not be baked into TYPE');
    }
  }
});

test('Lane Y hash verification fails on altered or spoofed payloads',()=>{
  const data=Buffer.from('RIFF\\x00\\x00\\x00\\x00WEBP');
  assert.throws(()=>verifyWebP(data,'0'.repeat(64),data.length),/actual WebP bytes/);
  assert.throws(()=>verifyWebP(data,'0'.repeat(64),data.length+1));
});
