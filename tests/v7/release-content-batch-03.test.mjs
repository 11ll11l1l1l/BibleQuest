import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseV7ContentBundle } from '../../src/v7/content/contract.js';
import { assessV7DevotionalCatalogTranslationCoverage } from '../../src/v7/content/devotional-translation-policy.js';

const files = [
  '../../content/v7/devotionals/biblequest-original-emotions-03a.json',
  '../../content/v7/devotionals/biblequest-original-emotions-03b.json',
  '../../content/v7/devotionals/biblequest-original-emotions-03c.json'
];
const EXPECTED = [
  'anxiety_worry','fear','sadness','grief_loss','loneliness','anger','hurt_betrayal','rejection','guilt','shame',
  'insecurity_unworthiness','doubt','confusion_uncertainty','discouragement','hopelessness','overwhelm','stress',
  'tiredness_weariness','spiritual_dryness_distance','temptation','impatience_waiting','jealousy_envy','frustration',
  'numbness_emptiness','joy','gratitude','peace_contentment','hope','excitement','love_connection'
];
const items=files.flatMap(path=>parseV7ContentBundle(JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'))).items);
const summary=JSON.parse(readFileSync(new URL('../../data/v7/curation/release-content-batch-03-summary.json',import.meta.url),'utf8'));

test('Lane A batch 03 adds a distinct third devotional for all 30 launch emotions',()=>{
  assert.equal(items.length,30);
  assert.ok(items.every(item=>item.id.endsWith('.03')));
  assert.equal(new Set(items.map(item=>item.id)).size,30);
  const emotions=items.map(item=>item.taxonomyLinks.find(link=>link.kind==='emotion').id.slice('emotion.'.length));
  assert.deepEqual([...emotions].sort(),[...EXPECTED].sort());
  assert.ok(items.every(item=>item.source.kind==='first_party'));
  assert.ok(items.every(item=>item.rights.status==='verified'));
  assert.ok(items.every(item=>item.publicationState==='pending_review'));
});

test('batch 03 has complete reviewed current-revision TL CEB and ILO coverage',()=>{
  const report=assessV7DevotionalCatalogTranslationCoverage(items);
  assert.equal(report.ready,true);
  assert.equal(report.devotionalCount,30);
  for(const item of items){
    assert.deepEqual(item.translations.map(t=>t.locale).sort(),['ceb','fil','ilo']);
    assert.ok(item.translations.every(t=>t.reviewStatus==='reviewed'));
    assert.ok(item.translations.every(t=>t.translatedFromRevision===item.revision));
  }
});

test('batch 03 QA manifest is checksum-bound and complete',()=>{
  assert.equal(summary.status,'ready_for_automated_policy_review');
  assert.equal(summary.counts.devotionals,30);
  assert.equal(summary.counts.reviewedTranslations,90);
  assert.equal(summary.items.length,30);
  const byId=new Map(items.map(item=>[item.id,item]));
  for(const row of summary.items){
    const item=byId.get(row.contentId);
    assert.ok(item,row.contentId);
    const digest=createHash('sha256').update(`${item.sourceContent.title}\n${item.sourceContent.body}`,'utf8').digest('hex');
    assert.equal(item.source.checksum,`sha256:${digest}`,item.id);
    assert.equal(row.sourceChecksum,item.source.checksum,item.id);
    assert.equal(row.sourceRevision,item.revision,item.id);
    assert.ok(row.bsbReferences.length>0,item.id);
    assert.deepEqual(Object.keys(row.qaPass).sort(),['ceb','ilo','tl']);
    assert.ok(Object.values(row.qaPass).every(Boolean),item.id);
  }
});
