/**
 * A binary hash match is not a visual/safety approval. Keep known-bad
 * candidates out of BOTH manual verification and the triage readiness count.
 * The release manifest is controlled by the separate production auditor.
 */
const REPAIR_STATUS = /(?:repair_required|quarantin|rejected|unsafe|blocked)/i;

// Source-pixel editorial rejects. This list is deliberately SHA-bound: a new
// independently reviewed replacement variant gets a different digest, while
// relabeling an unchanged rejected binary cannot grant publication. Reference
// exact image-review comments on the source pull requests listed below.
export const KNOWN_REJECTED_V7_VARIANTS = Object.freeze({
  'bqv7-emotion-hope-02': Object.freeze([
    { kind: 'TYPE', sha256: 'a393a964ed770652e6a9cec82b268bd651c4bab6b131ab1afb5939cb41e2be74',
      reason: 'PR #1437: title starts inside 10% top image safety margin' }
  ]),
  'bqv7-emotion-anger-01': Object.freeze([
    { kind: 'TYPE', sha256: '9eb2382869256dbdb845b2f93fb921892e6153ed6edf64316a747eb330bd9323',
      reason: 'PR #1438: title starts inside 10% top image safety margin' }
  ]),
  'bqv7-emotion-doubt-01': Object.freeze([
    { kind: 'TYPE', sha256: '1fd0f996fe2c655718f15da581069141de2ad345a63529b7caeaa571964e55ca',
      reason: 'PR #1439: Scripture reference extends into 10% bottom image safety margin' }
  ]),
  'bqv7-emotion-insecurity-unworthiness-01': Object.freeze([
    { kind: 'TYPE', sha256: '3b8332b6c81b659b54082f49a3796a5b9204c96794f42a042aa174c245be3055',
      reason: 'PR #1423: title starts inside 10% top image safety margin' }
  ]),
  'bqv7-need-hope-01': Object.freeze([
    { kind: 'TYPE', sha256: '96c276dcbf3e94fcd68347fc7757011205c9fdbc81b49f4653a2063bdf79c222',
      reason: 'PR #1448: title starts inside 10% top image safety margin' },
    { kind: 'CLEAN', sha256: '9916381aaa9cb244847bbb3fcee69e1f15cee04bea76bb4f026ad7772e74061f',
      reason: 'PR #1448: near-duplicate of the planting-a-seedling Hopeful scene in PR #1437' }
  ])
});

// Narrow exact-pixel rejection shared by candidate triage and release audit.
// The latter already has its own detailed variant QA error messages.
export function knownRejectedVisualReason(record) {
  for (const variant of record?.variants || []) {
    const rejected = KNOWN_REJECTED_V7_VARIANTS[record?.assetId]?.find(item =>
      item.kind === variant.kind && item.sha256 === variant.sha256);
    if (rejected) return 'known-bad visual variant: ' + rejected.reason;
  }
  return null;
}

export function candidateQuarantineReason(record) {
  if (REPAIR_STATUS.test(String(record?.status || '')))
    return 'record status explicitly requires repair or quarantine';
  const rejected = knownRejectedVisualReason(record);
  if (rejected) return rejected;
  if (record?.qc?.svgDataUriPolicyCompliant === false
    || record?.qc?.staticSvgSafetyReviewed === false)
    return 'record has a failed static SVG safety review';

  for (const variant of record?.variants || []) {
    const qa = variant.qa || variant.qc || {};
    if (qa.allowedSvgReferencesOnly === false
      || qa.embeddedDataImageSourceViolation === true)
      return variant.kind + ' violates the SVG source policy';
    if (variant.kind === 'TYPE') {
      if (qa.topSafeAreaAcceptable === false || qa.topMarginRepairRequired === true)
        return 'TYPE failed the text safe-area review';
      if (qa.visualInspected === false || qa.typeReadableAt320px === false
        || qa.spellingCheckedAgainstTaxonomy === false)
        return 'TYPE has an explicitly failed visual/wording QA check';
    }
    if ((variant.kind === 'CLEAN' || variant.kind === 'THUMB')
      && qa.noBakedText === false)
      return variant.kind + ' contains unapproved baked text';
  }
  return null;
}
