/**
 * Discover complete, unapproved three-file image candidates and prove their
 * local binary integrity before the built-app Chromium check. This module
 * never promotes a candidate or edits the release registry.
 */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyV7ManualCandidate } from './v7-manual-candidate-integrity.mjs';
import { candidateQuarantineReason } from './v7-visual-candidate-policy.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const recordName = /^bqv7-(?:emotion|need)-[a-z0-9-]+-[0-9]{2,}\.json$/;

export async function triageV7ArtworkCandidates(root = ROOT, verify = verifyV7ManualCandidate) {
  const dir = join(root, 'data/v7/visual-assets/records');
  const approved = [];
  const rejected = [];
  const pending = [];
  for (const name of (await readdir(dir)).filter(x => recordName.test(x)).sort()) {
    const assetId = name.slice(0, -'.json'.length);
    let record;
    try {
      record = JSON.parse(await readFile(join(dir, name), 'utf8'));
    } catch (error) {
      rejected.push({ assetId, reason: 'unreadable candidate sidecar: ' + error.message });
      continue;
    }
    // Audited published masters are handled by the separate release auditor.
    if (record.status === 'production_ready') continue;
    // Partial records remain in the backfill queue. Never misreport them as
    // three-file candidates or as failures of the release itself.
    if (record.schemaVersion !== 2 || !Array.isArray(record.variants)
      || record.variants.length !== 3
      || !['emotion', 'need'].includes(record.contentType)) continue;
    try {
      // Do not trust a hash-only PASS when the record already documents a
      // known unsafe or visually defective candidate.
      const quarantine = candidateQuarantineReason(record);
      if (quarantine) throw new Error('candidate quarantined: ' + quarantine);
      // The verifier reads three distinct real file bytes, SHA-256, dimensions,
      // source taxonomy/wording, permitted provenance, and safe image paths.
      const measured = await verify(root, assetId);
      if (measured.technicalIntegrity !== 'PASS' || measured.assetId !== assetId
        || measured.files?.length !== 3
        || new Set(measured.files.map(file => file.kind)).size !== 3)
        throw new Error('three independently verified files required');
      approved.push({ assetId, contentType: record.contentType, status: record.status,
        files: measured.files, publicationApproved: false });
    } catch (error) {
      rejected.push({ assetId, reason: error.message });
    }
    pending.push(assetId);
  }
  return { technicallyVerified: approved, rejected, threeFileCandidates: pending,
    publicationApproved: false };
}
