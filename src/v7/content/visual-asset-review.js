// Lane B review boundary. This validates revision-bound evidence; the Lane A binary
// audit must independently inspect bytes and produce the referenced integrity proof.
const sha256 = value => /^[a-f0-9]{64}$/i.test(String(value || ''));
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const refs = value => Array.isArray(value) && value.length > 0 && value.every(nonempty);
const validDate = value => nonempty(value) && Number.isFinite(Date.parse(value));
const exact = value => String(value ?? '').normalize('NFC').trim();
const locales = new Set(['en', 'tl', 'ceb', 'ilo']);
const knownKinds = new Set(['with_text', 'thumbnail']);
const assetsFor = item => item?.visualAssets ?? item?.visual_assets ?? item?.body?.visualAssets ?? item?.body?.visual_assets;

function stableSerialize(value) {
  if (value === undefined) return 'null';
  if (Array.isArray(value)) return '[' + value.map(stableSerialize).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stableSerialize(value[key])).join(',') + '}';
  }
  return JSON.stringify(value);
}

export function visualAssetEvidenceSnapshot(item) {
  const assets = assetsFor(item);
  return assets == null ? null : stableSerialize(assets);
}

function validRights(rights) {
  return rights?.status === 'verified'
    && Array.isArray(rights.allowedUses) && rights.allowedUses.includes('display')
    && refs(rights.evidenceRefs ?? rights.evidence_refs);
}

function expectedTypography(item, variant) {
  const locale = exact(variant.locale).toLowerCase();
  const kind = variant.textKind || 'title';
  if (kind === 'title') {
    if (locale === exact(item.sourceLocale || 'en').toLowerCase()) return exact(item.title);
    return exact((item.translations || []).find(row => exact(row.locale).toLowerCase() === locale)?.title);
  }
  if (kind !== 'scripture') return '';
  const passage = item.reviewEvidence?.approvedScriptureExcerpts?.[locale];
  if (!passage || passage.revision !== item.revision || passage.rightsVerified !== true
    || !refs(passage.evidenceRefs) || !nonempty(passage.reference)
    || !nonempty(passage.translation) || variant.reference !== passage.reference
    || variant.translation !== passage.translation) return '';
  return exact(passage.text);
}

function validMeasurements(row) {
  return nonempty(row.imagePath) && /^\/v7\/images\/[a-z0-9/_-]+\.(webp|png|jpe?g)$/i.test(row.imagePath)
    && sha256(row.sha256)
    && Number.isSafeInteger(row.fileBytes) && row.fileBytes > 0
    && Number.isSafeInteger(row.width) && row.width > 0
    && Number.isSafeInteger(row.height) && row.height > 0;
}

export function evaluateV7VisualAssetGates(item) {
  const rejectionReasons = [], repairReasons = [], assetEvidence = [];
  const assets = assetsFor(item);
  if (assets == null) return { rejectionReasons, repairReasons, assetEvidence };
  if (!Array.isArray(assets)) return { rejectionReasons: ['visual_asset_manifest_invalid'], repairReasons, assetEvidence };
  const ids = new Set(), paths = new Set();
  for (const [index, asset] of assets.entries()) {
    const prefix = `visual_asset_${index}`;
    if (!asset || typeof asset !== 'object' || Array.isArray(asset)) {
      rejectionReasons.push(`${prefix}_invalid`);
      continue;
    }
    const id = exact(asset.assetId || asset.id);
    if (id && ids.has(id)) rejectionReasons.push(`${prefix}_duplicate_id`);
    if (id) ids.add(id);
    const source = asset.source && typeof asset.source === 'object' ? asset.source : {};
    const provenance = asset.provenance && typeof asset.provenance === 'object' ? asset.provenance : {};
    const sourceId = exact(asset.sourceUri || asset.source_uri || asset.sourceRef || source.uri || source.ref || source.id);
    if (!sourceId || !refs(provenance.evidenceRefs ?? provenance.evidence_refs ?? asset.provenanceRefs ?? asset.provenance_refs))
      rejectionReasons.push(`${prefix}_provenance_unverified`);
    if (!validRights(asset.rights)) rejectionReasons.push(`${prefix}_rights_unverified`);
    if (!nonempty(asset.alt || asset.altText || asset.alt_text) && asset.accessibility?.decorative !== true)
      repairReasons.push(`${prefix}_alt_missing`);
    if (!nonempty(asset.fallback || asset.fallbackUrl || asset.fallback_url))
      repairReasons.push(`${prefix}_fallback_missing`);
    if (asset.variants === undefined) {
      assetEvidence.push({ assetId: id || prefix, variants: [] });
      continue; // CLEAN-only legacy approvals remain unchanged.
    }
    if (!Array.isArray(asset.variants)) {
      rejectionReasons.push(`${prefix}_variants_invalid`);
      continue;
    }
    if (!validMeasurements(asset)) repairReasons.push(`${prefix}_clean_integrity_incomplete`);
    else if (paths.has(asset.imagePath)) rejectionReasons.push(`${prefix}_duplicate_path`);
    else paths.add(asset.imagePath);
    const variants = [], keys = new Set();
    for (const [variantIndex, variant] of asset.variants.entries()) {
      const keyPrefix = `${prefix}_variant_${variantIndex}`;
      if (!variant || typeof variant !== 'object' || Array.isArray(variant) || !knownKinds.has(variant.kind)) {
        rejectionReasons.push(`${keyPrefix}_invalid`);continue;
      }
      const locale = exact(variant.locale).toLowerCase();
      const variantKey = variant.kind + ':' + (variant.kind === 'with_text' ? locale : '');
      if (keys.has(variantKey)) rejectionReasons.push(`${keyPrefix}_duplicate_kind_locale`);
      keys.add(variantKey);
      if (!validMeasurements(variant)) repairReasons.push(`${keyPrefix}_integrity_incomplete`);
      else if (paths.has(variant.imagePath) || variant.imagePath === asset.imagePath) rejectionReasons.push(`${keyPrefix}_duplicate_path`);
      else paths.add(variant.imagePath);
      const suffix = variant.kind === 'thumbnail' ? '-thumbnail.' : '-with-text-' + locale + '.';
      if (nonempty(asset.imagePath) && nonempty(variant.imagePath) &&
        !variant.imagePath.startsWith(asset.imagePath.slice(0,asset.imagePath.lastIndexOf('.')) + suffix))
        rejectionReasons.push(`${keyPrefix}_path_mismatch`);
      if (!sha256(asset.sha256) || variant.derivedFromSha256 !== asset.sha256)
        repairReasons.push(`${keyPrefix}_clean_binding_incomplete`);
      if (!refs(variant.provenance?.evidenceRefs)) repairReasons.push(`${keyPrefix}_provenance_incomplete`);
      if (!validRights(variant.rights)) rejectionReasons.push(`${keyPrefix}_rights_unverified`);
      if (!nonempty(variant.altText) && variant.accessibility?.decorative !== true)
        repairReasons.push(`${keyPrefix}_alt_missing`);
      if (!nonempty(variant.fallback)) repairReasons.push(`${keyPrefix}_fallback_missing`);
      const integrity = variant.integrity || {};
      if (integrity.sha256Verified !== true || integrity.dimensionsVerified !== true ||
        integrity.verifiedSha256 !== variant.sha256 || !refs(integrity.evidenceRefs))
        repairReasons.push(`${keyPrefix}_binary_verification_incomplete`);
      if (variant.kind === 'thumbnail') {
        if (variant.locale || variant.text || variant.textKind) rejectionReasons.push(`${keyPrefix}_thumbnail_contains_text_metadata`);
        if (variant.width > asset.width || variant.height > asset.height)
          rejectionReasons.push(`${keyPrefix}_thumbnail_dimensions_invalid`);
      } else {
        const expected = locales.has(locale) ? expectedTypography(item, variant) : '';
        if (!expected || exact(variant.text) !== expected || !locales.has(locale))
          rejectionReasons.push(`${keyPrefix}_typography_content_mismatch`);
        if (variant.sourceRevision !== item.revision)
          rejectionReasons.push(`${keyPrefix}_revision_mismatch`);
        if (variant.liveTextFallback !== true)
          repairReasons.push(`${keyPrefix}_live_text_fallback_missing`);
        const qa = variant.typographyQa || {};
        if (qa.result === 'fail' || (nonempty(qa.observedText) && exact(qa.observedText) !== expected))
          rejectionReasons.push(`${keyPrefix}_rendered_text_mismatch`);
        else if (qa.result !== 'pass' || exact(qa.observedText) !== expected ||
          qa.locale !== locale || qa.sourceRevision !== item.revision ||
          qa.imageSha256 !== variant.sha256 || !validDate(qa.checkedAt) ||
          !nonempty(qa.evaluator) || !refs(qa.evidenceRefs))
          repairReasons.push(`${keyPrefix}_typography_qa_incomplete`);
        if (qa.fontLicense?.status !== 'verified' || !refs(qa.fontLicense?.evidenceRefs))
          rejectionReasons.push(`${keyPrefix}_font_rights_unverified`);
      }
      variants.push({ kind: variant.kind, ...(variant.kind === 'with_text' ? { locale } : {}),
        sha256: exact(variant.sha256), integrityReady: validMeasurements(variant) && integrity.sha256Verified === true });
    }
    assetEvidence.push({ assetId: id || prefix, masterSha256: exact(asset.sha256), variants });
  }
  return { rejectionReasons: [...new Set(rejectionReasons)], repairReasons: [...new Set(repairReasons)], assetEvidence };
}
