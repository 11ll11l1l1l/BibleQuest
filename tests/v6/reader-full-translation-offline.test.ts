import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CANONICAL_BIBLE_BOOK_CODES,
  auditCanonicalScriptureInventory,
  fullTranslationOfflineEligibility,
} from '../../src/v6/reader/full-translation-offline.ts';
import { translationPackagingPolicy } from '../../src/v6/reader/license-policy.ts';

const sha = 'a'.repeat(64);
const inventory = CANONICAL_BIBLE_BOOK_CODES.map((code) => ({ code, path: `data/packs/bible/${code}.json` }));

function manifest(translationId = 'bsb') {
  const policy = translationPackagingPolicy(translationId);
  assert.ok(policy);
  return {
    schemaVersion: 1 as const,
    translationId,
    label: translationId,
    contentVersion: 'inventory-contract-v1',
    delivery: policy.delivery,
    license: policy.license,
    books: CANONICAL_BIBLE_BOOK_CODES.map((bookCode) => ({
      bookCode,
      url: `data/packs/bible/${bookCode}.json`,
      sha256: sha,
    })),
  };
}

test('canonical inventory contract contains exactly the 66 Bible books', () => {
  assert.equal(CANONICAL_BIBLE_BOOK_CODES.length, 66);
  const audit = auditCanonicalScriptureInventory(inventory);
  assert.equal(audit.complete, true);
  assert.equal(audit.expectedBooks, 66);
  assert.equal(audit.discoveredBooks, 66);
  assert.deepEqual(audit.missing, []);
  assert.deepEqual(audit.extra, []);
  assert.deepEqual(audit.duplicates, []);
});

test('inventory completeness fails closed for missing, duplicate, or noncanonical books', () => {
  const missing = auditCanonicalScriptureInventory(inventory.slice(1));
  assert.equal(missing.complete, false);
  assert.deepEqual(missing.missing, ['GEN']);

  const duplicate = auditCanonicalScriptureInventory([...inventory, inventory[0]]);
  assert.equal(duplicate.complete, false);
  assert.deepEqual(duplicate.duplicates, ['GEN']);

  const extra = auditCanonicalScriptureInventory([...inventory, { code: 'SOURCE', path: 'SOURCE.json' }]);
  assert.equal(extra.complete, false);
  assert.deepEqual(extra.extra, ['SOURCE']);
});

test('full-translation offline eligibility requires complete inventory, valid 66-book manifest, and allowed policy', () => {
  assert.equal(fullTranslationOfflineEligibility(manifest(), inventory).eligible, true);

  const incompleteManifest = { ...manifest(), books: manifest().books.slice(1) };
  assert.equal(fullTranslationOfflineEligibility(incompleteManifest, inventory).reason, 'manifest-incomplete');

  assert.equal(fullTranslationOfflineEligibility(manifest(), inventory.slice(1)).reason, 'inventory-incomplete');
});

test('live/external translations cannot become full-offline eligible through inventory alone', () => {
  const jko = manifest('jko');
  assert.equal(fullTranslationOfflineEligibility(jko, inventory).eligible, false);
  assert.equal(fullTranslationOfflineEligibility(jko, inventory).reason, 'manifest-invalid');

  const nlt = manifest('nlt');
  assert.equal(fullTranslationOfflineEligibility(nlt, inventory).eligible, false);
  assert.equal(fullTranslationOfflineEligibility(nlt, inventory).reason, 'manifest-invalid');
});
