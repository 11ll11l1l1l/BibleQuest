/**
 * A binary hash match is not a visual/safety approval. Keep known-bad
 * candidates out of BOTH manual verification and the triage readiness count.
 * The release manifest is controlled by the separate production auditor.
 */
const REPAIR_STATUS = /(?:repair_required|quarantin|rejected|unsafe|blocked)/i;

export function candidateQuarantineReason(record) {
  if (REPAIR_STATUS.test(String(record?.status || '')))
    return 'record status explicitly requires repair or quarantine';
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
