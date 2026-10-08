import test from 'node:test';
import assert from 'node:assert/strict';
import { checkScriptureReview } from '../../scripts/v7-scripture-integrity-audit.mjs';

const base = () => ({
 schemaVersion:1, contentPath:'data/v7/visual-assets/records/sample.json', assetId:'sample',
 locale:'en', translation:'BSB', reference:'Psalm 68:6',
 displayKind:'reference_only', displayedWords:null, imageSha256:'a'.repeat(64),
 textSource:'BSB Psalm 68', licenseEvidence:null, exactTextVerified:false,
 referenceVerified:true, contextVerified:true, applicationVerified:true,
 renderedTextVerifiedAt320px:true, reviewer:'independent reviewer',
 reviewedAt:'2026-10-09T00:00:00Z', status:'approved',
 contextNotes:'Psalm 68:5–6 addresses care for vulnerable people'
});
test('reference-only review accepts applicable evidence', () => {
 assert.deepEqual(checkScriptureReview(base()), []);
});
test('quotation requires exact text and licensing evidence', () => {
 const row={...base(),displayKind:'scripture_quote',displayedWords:'A quotation'};
 assert.match(checkScriptureReview(row).join(' '), /licensing or exact-text/);
});
test('baked image text needs inspected 320px evidence', () => {
 const row={...base(),renderedTextVerifiedAt320px:false};
 assert.match(checkScriptureReview(row).join(' '), /rendered image text/);
});
test('missing theological context blocks approval', () => {
 const row={...base(),contextVerified:false};
 assert.match(checkScriptureReview(row).join(' '), /contextVerified/);
});
test('pending reviews cannot count as approved', () => {
 const row={...base(),status:'pending',referenceVerified:false};
 assert.deepEqual(checkScriptureReview(row), []);
});
