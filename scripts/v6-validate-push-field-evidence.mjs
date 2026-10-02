import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validatePhysicalPushEvidence } from '../src/v6/push-device-field-evidence.js';

export const PUSH_FIELD_EVIDENCE_PROFILES = Object.freeze([
  'physical-push',
  'assignment-due',
  'full',
]);

export function evaluatePhysicalPushEvidenceProfile(record, profile = 'full') {
  const normalized = String(profile || '').trim().toLowerCase();
  if (!PUSH_FIELD_EVIDENCE_PROFILES.includes(normalized)) {
    throw new Error('Unknown physical push evidence profile: ' + normalized + '.');
  }
  const eligibility = record?.checklistEligibility || {};
  const physicalPush = eligibility.physicalDevicePushEvidenceComplete === true;
  const assignmentDue = eligibility.assignmentAssignedDuePhysicalEvidenceComplete === true;
  const satisfied = normalized === 'physical-push'
    ? physicalPush
    : normalized === 'assignment-due'
      ? assignmentDue
      : physicalPush && assignmentDue;
  return Object.freeze({
    profile: normalized,
    satisfied,
    physicalDevicePushEvidenceComplete: physicalPush,
    assignmentAssignedDuePhysicalEvidenceComplete: assignmentDue,
    aggregatePushStillRequiresBuiltBrowserEvidence:
      eligibility.aggregatePushStillRequiresBuiltBrowserEvidence === true,
  });
}

async function main(argv) {
  if (argv.length < 2 || argv.length > 3) {
    throw new Error(
      'Usage: node scripts/v6-validate-push-field-evidence.mjs <evidence.json> <expected-candidate-sha> [physical-push|assignment-due|full]',
    );
  }
  const raw = JSON.parse(await readFile(resolve(argv[0]), 'utf8'));
  const validated = validatePhysicalPushEvidence(raw, argv[1]);
  const evaluation = evaluatePhysicalPushEvidenceProfile(validated, argv[2] || 'full');
  const summary = {
    schemaVersion: 1,
    evidenceClass: validated.evidenceClass,
    candidateSha: validated.candidateSha,
    observedAt: validated.observedAt,
    profile: evaluation.profile,
    satisfied: evaluation.satisfied,
    physicalDevicePushEvidenceComplete: evaluation.physicalDevicePushEvidenceComplete,
    assignmentAssignedDuePhysicalEvidenceComplete: evaluation.assignmentAssignedDuePhysicalEvidenceComplete,
    aggregatePushStillRequiresBuiltBrowserEvidence:
      evaluation.aggregatePushStillRequiresBuiltBrowserEvidence,
  };
  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
  if (!evaluation.satisfied) process.exitCode = 3;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => {
    console.error(error?.stack || error);
    process.exitCode = 1;
  });
}
