import assert from 'node:assert/strict';
import test from 'node:test';
import {
  evaluateV7VisualAssetGates, visualAssetEvidenceSnapshot
} from '../../src/v7/content/visual-asset-review.js';
import {
  canAutoPublishV7LibraryDecision, createV7LibraryAssetDecisionReport,
  evaluateV7LibraryApproval, requiredV7LibraryApprovalCriteria
} from '../../src/v7/content/automated-approval-policy.js';

const time = '2026-10-08T09:00:00Z';
const sha = letter => letter.repeat(64);
const rights = () => ({ status: 'verified', allowedUses: ['display'], evidenceRefs: ['rights:verified'] });
function baseItem() {
  return {
    id: 'devotional-001', type: 'devotional', revision: 'r1', title: 'Courage for Today',
    sourceLocale: 'en', source: { kind: 'owned' }, rights: rights(),
    translations: [{ locale: 'tl', title: 'Tapang para sa Ngayon' }]
  };
}
function visual() {
  return {
    id: 'cover-01', imagePath: '/v7/images/devotional/cover-01.webp',
    width: 1024, height: 1280, fileBytes: 1000, sha256: sha('a'),
    source: { uri: 'generated:biblequest:cover-01' },
    provenance: { evidenceRefs: ['generation:cover-01'] },
    rights: rights(), altText: 'Sunlight through a window', fallback: 'theme-gradient',
    variants: [
      {
        kind: 'with_text', locale: 'en', textKind: 'title', text: 'Courage for Today',
        sourceRevision: 'r1', liveTextFallback: true,
        imagePath: '/v7/images/devotional/cover-01-with-text-en.webp',
        width: 1024, height: 1280, fileBytes: 1024, sha256: sha('b'),
        derivedFromSha256: sha('a'), provenance: { evidenceRefs: ['derivative:cover-text'] },
        rights: rights(), altText: 'Sunlight with the title Courage for Today', fallback: 'theme-gradient',
        integrity: { sha256Verified: true, dimensionsVerified: true, verifiedSha256: sha('b'), evidenceRefs: ['binary-audit:cover-text'] },
        typographyQa: {
          result: 'pass', observedText: 'Courage for Today', locale: 'en', sourceRevision: 'r1',
          imageSha256: sha('b'), checkedAt: time, evaluator: 'independent-visual-qa',
          evidenceRefs: ['vision:confirmed-text'], fontLicense: { status: 'verified', evidenceRefs: ['font:license'] }
        }
      },
      {
        kind: 'thumbnail', imagePath: '/v7/images/devotional/cover-01-thumbnail.webp',
        width: 320, height: 400, fileBytes: 320, sha256: sha('c'),
        derivedFromSha256: sha('a'), provenance: { evidenceRefs: ['derivative:cover-thumb'] },
        rights: rights(), altText: 'Small crop of sunlight', fallback: 'theme-gradient',
        integrity: { sha256Verified: true, dimensionsVerified: true, verifiedSha256: sha('c'), evidenceRefs: ['binary-audit:cover-thumb'] }
      }
    ]
  };
}
function clone(value) { return structuredClone(value); }
function decisionFor(item) {
  return evaluateV7LibraryApproval({
    item, decidedAt: time,
    evaluations: requiredV7LibraryApprovalCriteria(item.type).map(row => ({
      id: row.id, result: 'pass', evaluator: 'content-qa', evaluatedAt: time,
      evidenceRefs: ['content:criterion:' + row.id]
    })),
    secondPass: {
      result: 'pass', revision: item.revision, evaluator: 'independent-content-qa',
      evaluatedAt: time, evidenceRefs: ['content:adversarial']
    }
  });
}

test('complete CLEAN/TYPE/THUMB evidence approves and produces an exact-revision release report', () => {
  const item = { ...baseItem(), visualAssets: [visual()] };
  const gates = evaluateV7VisualAssetGates(item);
  assert.deepEqual(gates.rejectionReasons, []);
  assert.deepEqual(gates.repairReasons, []);
  const decision = decisionFor(item);
  assert.equal(decision.outcome, 'auto_approved');
  assert.equal(canAutoPublishV7LibraryDecision(decision, item), true);
  const report = createV7LibraryAssetDecisionReport([decision]);
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.counts.auto_approved, 1);
  assert.equal(report.entries[0].revision, 'r1');
  assert.deepEqual(report.entries[0].visualAssetEvidence[0].variants.map(x => x.kind), ['with_text', 'thumbnail']);
  assert.equal(JSON.stringify(report), JSON.stringify(createV7LibraryAssetDecisionReport([decision])));
});

test('wrong-locale, wrong attribution and transcript mismatch reject TYPE artwork', () => {
  for (const change of [
    variant => { variant.locale = 'tl'; },
    variant => { variant.text = 'The Lord is my shield'; },
    variant => { variant.typographyQa.observedText = 'C0urage for Today'; },
    variant => { variant.sourceRevision = 'r0'; },
    variant => { variant.typographyQa.fontLicense.status = 'unknown'; }
  ]) {
    const item = { ...baseItem(), visualAssets: [visual()] };
    change(item.visualAssets[0].variants[0]);
    const decision = decisionFor(item);
    assert.equal(decision.outcome, 'rejected');
    assert.equal(canAutoPublishV7LibraryDecision(decision, item), false);
  }
});

test('canonical release content title and FIL Tagalog translation approve matching TL artwork only', () => {
  const item = { ...baseItem(), visualAssets: [visual()] };
  delete item.title;
  item.sourceContent = { title: 'Courage for Today' };
  item.translations = [{ locale: 'fil', content: { title: 'Tapang para sa Ngayon' }, translatedFromRevision: 'r1' }];
  const variant = item.visualAssets[0].variants[0];
  variant.locale = 'tl';
  variant.text = 'Tapang para sa Ngayon';
  variant.typographyQa.locale = 'fil';
  variant.typographyQa.observedText = 'Tapang para sa Ngayon';
  variant.imagePath = '/v7/images/devotional/cover-01-with-text-tl.webp';
  assert.equal(decisionFor(item).outcome, 'auto_approved');
  item.translations[0].translatedFromRevision = 'r0';
  assert.equal(decisionFor(item).outcome, 'rejected');
});

test('variant paths cannot append unreviewed suffixed payloads', () => {
  const item = { ...baseItem(), visualAssets: [visual()] };
  item.visualAssets[0].variants[0].imagePath =
    '/v7/images/devotional/cover-01-with-text-en.extra.webp';
  const decision = decisionFor(item);
  assert.equal(decision.outcome, 'rejected');
  assert.ok(decision.rejectionReasons.includes('visual_asset_0_variant_0_path_mismatch'));
});

test('an unapproved Bible excerpt is not eligible for embedded lettering', () => {
  const item = { ...baseItem(), visualAssets: [visual()] };
  const typography = item.visualAssets[0].variants[0];
  typography.textKind = 'scripture';
  assert.ok(evaluateV7VisualAssetGates(item).rejectionReasons.includes('visual_asset_0_variant_0_typography_content_mismatch'));
});

test('missing integrity, typography evidence and alternative text create machine repair reasons', () => {
  for (const edit of [
    variant => { delete variant.integrity; },
    variant => { variant.altText = ''; },
    variant => { variant.liveTextFallback = false; },
    variant => { variant.derivedFromSha256 = ''; }
  ]) {
    const item = { ...baseItem(), visualAssets: [visual()] };
    edit(item.visualAssets[0].variants[0]);
    const decision = decisionFor(item);
    assert.equal(decision.outcome, 'needs_repair');
    assert.ok(decision.repairReasons.some(x => x.startsWith('visual_asset_0_variant_0_')));
  }
});

test('missing independent typography QA cannot be treated as verified font rights', () => {
  const item = { ...baseItem(), visualAssets: [visual()] };
  delete item.visualAssets[0].variants[0].typographyQa;
  const decision = decisionFor(item);
  assert.equal(decision.outcome, 'rejected');
  assert.ok(decision.rejectionReasons.includes('visual_asset_0_variant_0_font_rights_unverified'));
});

test('every declared derivative requires its own verified rights and permitted display', () => {
  const item = { ...baseItem(), visualAssets: [visual()] };
  item.visualAssets[0].variants[1].rights = { status: 'unknown', allowedUses: [] };
  const decision = decisionFor(item);
  assert.equal(decision.outcome, 'rejected');
  assert.ok(decision.rejectionReasons.includes('visual_asset_0_variant_1_rights_unverified'));
});

test('stale approved asset bytes, changed metadata, or a newly added variant cannot reuse approval', () => {
  const item = { ...baseItem(), visualAssets: [visual()] };
  const approved = decisionFor(item);
  const changed = clone(item);
  changed.visualAssets[0].variants[1].sha256 = sha('d');
  assert.equal(canAutoPublishV7LibraryDecision(approved, changed), false);
  const subtle = clone(item);
  subtle.visualAssets[0].variants[0].typographyQa.evidenceRefs = ['other-evidence'];
  assert.equal(evaluateV7VisualAssetGates(subtle).rejectionReasons.length, 0);
  assert.equal(canAutoPublishV7LibraryDecision(approved, subtle), false);
  assert.notEqual(visualAssetEvidenceSnapshot(item), visualAssetEvidenceSnapshot(subtle));
});

test('asset-free legacy content stays eligible under existing policy', () => {
  const item = baseItem();
  const decision = decisionFor(item);
  assert.equal(decision.outcome, 'auto_approved');
  assert.equal(canAutoPublishV7LibraryDecision(decision, item), true);
  assert.equal(visualAssetEvidenceSnapshot(item), null);
});

test('Lane D report cannot accept unknown policy or duplicate revision entries', () => {
  const decision = decisionFor(baseItem());
  assert.throws(() => createV7LibraryAssetDecisionReport([decision,decision]), /duplicate item revision/);
  assert.throws(() => createV7LibraryAssetDecisionReport([{ ...decision,policyVersion:'99' }]), /versioned Lane B policy/);
});


test('embedded data, blob and executable URLs fail closed despite claimed hash and rights', () => {
  const edits = [
    asset => { asset.src = 'data:image/png;base64,AA=='; },
    asset => { asset.fallbackUrl = 'data:image/svg+xml,%3Csvg%3E'; },
    asset => { asset.source.uri = 'data:image/png;base64,AA=='; },
    asset => { asset.variants[0].url = 'blob:https://example.test/bad'; },
    asset => { asset.variants[1].src = 'javascript:alert(1)'; },
    asset => { asset.variants[1].fallback = 'file:///private/cover.png'; }
  ];
  for (const [index, edit] of edits.entries()) {
    const item = { ...baseItem(), visualAssets: [visual()] };
    edit(item.visualAssets[0]);
    const gates = evaluateV7VisualAssetGates(item);
    const target = index < 3
      ? 'visual_asset_0_embedded_resource_forbidden'
      : `visual_asset_0_variant_${index === 3 ? 0 : 1}_embedded_resource_forbidden`;
    assert.ok(gates.rejectionReasons.includes(target), target);
    const decision = decisionFor(item);
    assert.equal(decision.outcome, 'rejected');
    assert.equal(canAutoPublishV7LibraryDecision(decision, item), false);
    assert.ok(createV7LibraryAssetDecisionReport([decision]).entries[0].rejectionReasons.includes(target));
  }
});

test('embedded-image rejection also applies to CLEAN-only legacy metadata', () => {
  const item = { ...baseItem(), visualAssets: [visual()] };
  delete item.visualAssets[0].variants;
  assert.equal(decisionFor(item).outcome, 'auto_approved');
  item.visualAssets[0].src = 'data:image/png;base64,AA==';
  assert.equal(decisionFor(item).outcome, 'rejected');
  assert.ok(evaluateV7VisualAssetGates(item).rejectionReasons.includes('visual_asset_0_embedded_resource_forbidden'));
});
