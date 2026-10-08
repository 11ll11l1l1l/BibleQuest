import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeV7VisualRegistry, findV7Visual, loadV7VisualRegistry } from '../../src/ui/visual-assets.js';
const sha='a'.repeat(64);
function fixture(){return {schemaVersion:1,assets:[{
 assetId:'bqv7-emotion-anxiety-worry-01',contentType:'emotion',contentId:'anxiety_worry',
 src:'/v7/images/emotion/bqv7-emotion-anxiety-worry-01.webp',sha256:sha,
 alt:'A contemplative person by a window',focalPoint:{x:.5,y:.4},
 variants:[{kind:'with_text',locale:'en',embeddedText:'Anxious / worried',
 src:'/v7/images/emotion/bqv7-emotion-anxiety-worry-01-with-text-en.webp',sha256:sha}]
 }],byContent:{'emotion:anxiety_worry':['bqv7-emotion-anxiety-worry-01']}};}
test('shared visual resolver only selects verified text matching exact label and language',()=>{
 const registry=normalizeV7VisualRegistry(fixture());
 assert.match(findV7Visual(registry,['emotion:anxiety_worry'],'en','Anxious / worried').src,/with-text-en/);
 assert.doesNotMatch(findV7Visual(registry,['emotion:anxiety_worry'],'tl','Balisa').src,/with-text/);
 assert.doesNotMatch(findV7Visual(registry,['emotion:anxiety_worry'],'en','Different title').src,/with-text/);
 assert.equal(findV7Visual(registry,['emotion:missing']),null);
});
test('unapproved origins, invalid hashes and forged content references fail closed',()=>{
 for(const bad of [{src:'https://untrusted.invalid/abc.webp'},{src:'/v7/images/../../bad.webp'},{sha256:'bad'},{alt:''}]){
  const data=fixture();Object.assign(data.assets[0],bad);
  assert.throws(()=>normalizeV7VisualRegistry(data),/Invalid/);
 }
 const data=fixture();data.byContent['emotion:other']=['fake'];
 assert.throws(()=>normalizeV7VisualRegistry(data),/unknown asset/);
});
test('source/test mode falls back to live text without network',async()=>{
 assert.equal(await loadV7VisualRegistry(),null);
});
