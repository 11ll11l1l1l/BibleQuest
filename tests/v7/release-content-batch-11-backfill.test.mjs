import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseV7ContentBundle } from '../../src/v7/content/contract.js';
import { assessV7DevotionalCatalogTranslationCoverage } from '../../src/v7/content/devotional-translation-policy.js';

const bundle=parseV7ContentBundle(JSON.parse(readFileSync(new URL('../../content/v7/devotionals/biblequest-original-emotions-11-backfill.json',import.meta.url),'utf8')));
const items=bundle.items;
const summary=JSON.parse(readFileSync(new URL('../../data/v7/curation/release-content-batch-11-backfill-summary.json',import.meta.url),'utf8'));

test('Lane A batch 11 backfills the six historical batch-05 gaps',()=>{
  assert.equal(items.length,6);
  assert.equal(new Set(items.map(x=>x.id)).size,6);
  assert.deepEqual(items.map(x=>x.id.split('.')[2]).sort(),['excitement','guilt','love_connection','shame','spiritual_dryness_distance','temptation']);
  assert.ok(items.every(x=>x.id.endsWith('.11')));
  assert.ok(items.every(x=>x.source.kind==='first_party'));
  assert.ok(items.every(x=>x.rights.status==='verified'));
  assert.ok(items.every(x=>x.publicationState==='pending_review'));
  const report=assessV7DevotionalCatalogTranslationCoverage(items);
  assert.equal(report.ready,true);
  assert.equal(report.devotionalCount,6);
});

test('Lane A batch 11 checksum, BSB and translation QA manifests are exact',()=>{
  assert.equal(summary.status,'ready_for_automated_policy_review');
  assert.equal(summary.counts.devotionals,6);
  assert.equal(summary.counts.reviewedTranslations,18);
  const map=new Map(items.map(x=>[x.id,x]));
  for(const row of summary.items){
    const item=map.get(row.contentId);assert.ok(item,row.contentId);
    const digest=createHash('sha256').update(`${item.sourceContent.title}\n${item.sourceContent.body}`,'utf8').digest('hex');
    assert.equal(item.source.checksum,`sha256:${digest}`,item.id);
    assert.equal(row.sourceChecksum,item.source.checksum,item.id);
    assert.ok(row.bsbReferences.length>0,item.id);
    assert.deepEqual(item.translations.map(t=>t.locale).sort(),['ceb','fil','ilo']);
    assert.ok(item.translations.every(t=>t.reviewStatus==='reviewed'));
    assert.ok(Object.values(row.qaPass).every(Boolean),item.id);
  }
});
