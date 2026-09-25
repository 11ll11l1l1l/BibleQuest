import assert from 'node:assert/strict';
import test from 'node:test';

import { createOfflineScriptureAvailability } from '../../src/app/offline-scripture-status.js';
import { offlineScriptureEligibility } from '../../src/v6/reader/offline-availability.ts';

test('offline eligibility follows the explicit translation license/delivery matrix', () => {
  for (const id of ['bsb', 'tl', 'cebocb']) {
    const status = offlineScriptureEligibility(id);
    assert.equal(status.eligible, true, id);
    assert.equal(status.delivery, 'downloadable', id);
    assert.equal(status.redistribution, 'allowed', id);
    assert.equal(status.reason, 'package-eligible', id);
  }

  assert.deepEqual(offlineScriptureEligibility('jko'), {
    translationId: 'jko',
    eligible: false,
    delivery: 'live',
    redistribution: 'review-required',
    reason: 'live-only',
  });
  assert.deepEqual(offlineScriptureEligibility('nlt'), {
    translationId: 'nlt',
    eligible: false,
    delivery: 'external',
    redistribution: 'forbidden',
    reason: 'external-only',
  });
  assert.deepEqual(offlineScriptureEligibility('unknown'), {
    translationId: 'unknown',
    eligible: false,
    delivery: 'unknown',
    redistribution: 'unknown',
    reason: 'unknown-translation',
  });
});

function bibleService(translations: Record<string, { id: string; mode: string; bundled: boolean }>) {
  return {
    getTranslation(id: string) {
      const translation = translations[id];
      if (!translation) throw new Error(`unknown translation ${id}`);
      return translation;
    },
    getBook(code: string) {
      return { code: String(code).toUpperCase(), name: code, chapters: 50 };
    },
  };
}

test('live availability probes only policy-approved bundled translations', async () => {
  const calls: string[] = [];
  const service = createOfflineScriptureAvailability({
    bibleService: bibleService({
      bsb: { id: 'bsb', mode: 'bundled', bundled: true },
      jko: { id: 'jko', mode: 'live-kougo', bundled: false },
      nlt: { id: 'nlt', mode: 'licensed-link', bundled: false },
      unknown: { id: 'unknown', mode: 'bundled', bundled: true },
      mismatch: { id: 'bsb', mode: 'live-kougo', bundled: false },
    }),
    probeService: {
      async loadBook(translationId: string, bookCode: string) {
        calls.push(`${translationId}:${bookCode}`);
        return { ok: true };
      },
    },
  });

  assert.equal((await service.getStatus('bsb', 'JHN')).available, true);
  assert.deepEqual(calls, ['bsb:JHN']);

  const jko = await service.getStatus('jko', 'JHN');
  assert.equal(jko.available, false);
  assert.equal(jko.supported, false);
  assert.match(jko.reason, /network connection/i);

  const nlt = await service.getStatus('nlt', 'JHN');
  assert.equal(nlt.available, false);
  assert.equal(nlt.supported, false);
  assert.match(nlt.reason, /licensed external reader/i);

  const unknown = await service.getStatus('unknown', 'JHN');
  assert.equal(unknown.available, false);
  assert.equal(unknown.supported, false);
  assert.match(unknown.reason, /not approved/i);

  const mismatch = await service.getStatus('mismatch', 'JHN');
  assert.equal(mismatch.available, false);
  assert.equal(mismatch.supported, false);
  assert.match(mismatch.reason, /metadata does not match/i);

  assert.deepEqual(calls, ['bsb:JHN']);
});

test('approved bundled translations preserve V5 opened-cache miss and corruption states', async () => {
  let mode: 'missing' | 'malformed' = 'missing';
  const service = createOfflineScriptureAvailability({
    bibleService: bibleService({
      bsb: { id: 'bsb', mode: 'bundled', bundled: true },
    }),
    probeService: {
      async loadBook() {
        if (mode === 'malformed') throw new Error('Cached Bible pack was malformed and was removed.');
        throw new Error('unavailable');
      },
    },
  });

  const missing = await service.getStatus('bsb', 'ACT');
  assert.equal(missing.available, false);
  assert.equal(missing.supported, true);
  assert.match(missing.reason, /open this book while online/i);

  mode = 'malformed';
  const malformed = await service.getStatus('bsb', 'ACT');
  assert.equal(malformed.available, false);
  assert.equal(malformed.supported, true);
  assert.match(malformed.reason, /invalid and was removed/i);
});
