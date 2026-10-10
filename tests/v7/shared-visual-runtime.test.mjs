import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeV7VisualRegistry, findV7Visual, loadV7VisualRegistry, createV7VisualRegistryLoader } from '../../src/ui/visual-assets.js';
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

test('visual loader coalesces concurrent reads and caches successful verified data', async () => {
 let calls = 0;
 const load = createV7VisualRegistryLoader({
  production: true,
  fetcher: async (url, options) => {
   calls++;
   assert.equal(url, 'data/v7/visual-assets.json');
   assert.equal(options.cache, 'force-cache');
   return { ok: true, json: async () => fixture() };
  }
 });
 const a = load(), b = load();
 assert.equal(a, b, 'parallel cards must share a single request');
 const [first, second] = await Promise.all([a, b]);
 assert.equal(first, second);
 assert.equal(first.assets.size, 1);
 assert.equal(await load(), first);
 assert.equal(calls, 1);
});

test('visual loader retries a transient offline/HTTP failure on the next invocation', async () => {
 let calls = 0;
 const load = createV7VisualRegistryLoader({
  production: true,
  fetcher: async () => {
   calls++;
   if (calls === 1) throw new Error('offline');
   if (calls === 2) return { ok: false, status: 503 };
   return { ok: true, json: async () => fixture() };
  }
 });
 assert.equal(await load(), null, 'offline uses live text');
 assert.equal(await load(), null, 'HTTP failure uses live text');
 assert.equal((await load()).assets.size, 1, 'next online request recovers image');
 assert.equal(calls, 3);
 await load();
 assert.equal(calls, 3, 'success stays cached');
});

test('visual loader cannot cache invalid registry or bypass manifest integrity on recovery', async () => {
 let calls = 0;
 const load = createV7VisualRegistryLoader({
  production: true,
  fetcher: async () => {
   calls++;
   if (calls === 1) return { ok: true, json: async () => {
    const invalid = fixture(); invalid.assets[0].src = 'https://unsafe.invalid/a.webp';
    return invalid;
   } };
   return { ok: true, json: async () => fixture() };
  }
 });
 assert.equal(await load(), null, 'unsafe manifest must not publish');
 assert.equal((await load()).assets.size, 1);
 assert.equal(calls, 2);
});

test('source mode and missing fetch fail closed without throwing', async () => {
 let calls = 0;
 const disabled = createV7VisualRegistryLoader({
  production: false, fetcher: () => { calls++; return Promise.reject(Error('unexpected')); }
 });
 assert.equal(await disabled(), null);
 assert.equal(calls, 0);
 assert.equal(await createV7VisualRegistryLoader({ production: true })(), null);
});
