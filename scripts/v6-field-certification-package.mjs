import { readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  requireEvidenceTimestamp,
  requireExactCandidateSha,
  sanitizeEvidenceText,
} from '../src/v6/physical-device-evidence.js';
import { validateFieldDeviceEvidence } from '../src/v6/field-device-evidence.js';
import { validatePhysicalPushEvidence } from '../src/v6/push-device-field-evidence.js';
import { evaluateFieldDeviceProfile } from './v6-validate-field-device-evidence.mjs';
import { evaluatePhysicalPushEvidenceProfile } from './v6-validate-push-field-evidence.mjs';

export const FIELD_CERTIFICATION_PACKAGE_SCHEMA_VERSION = 1;
export const FIELD_CERTIFICATION_PROFILES = Object.freeze(['field', 'final']);
export const POST_PRODUCTION_OBSERVATION_IDS = Object.freeze([
  'automated-rc-gates-pass',
  'field-evidence-same-sha',
  'promotion-authorized-exact-sha',
  'production-build-sha',
  'route-smoke',
  'pwa-smoke',
  'offline-smoke',
  'real-push-smoke',
  'bsb-audio-control-smoke',
  'post-production-evidence-preserved',
]);

const AUTOMATION_ONLY_PATTERN = /\b(?:headless|playwright|ci[- ]?only|automation[- ]?only|automated[- ]?only)\b/i;

function requiredSanitizedText(value, label) {
  const text = sanitizeEvidenceText(value, label);
  if (!text || text.toUpperCase() === 'PENDING') throw new Error(label + ' is required.');
  return text;
}

function normalizeEvidenceFile(value, label) {
  const path = sanitizeEvidenceText(value, label);
  if (!path || path.toUpperCase() === 'PENDING') throw new Error(label + ' is required.');
  if (isAbsolute(path) || path.split(/[\\/]+/).includes('..')) {
    throw new Error(label + ' must be a safe relative path inside the field package.');
  }
  return path;
}

function requireCandidateBoundReference(value, label, expectedSha) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(label + ' must be a candidate-bound reference object.');
  }
  const sha = requireExactCandidateSha(value.candidateSha, label);
  if (sha !== expectedSha) throw new Error(label + ' belongs to a different release-candidate SHA.');
  return requiredSanitizedText(value.reference, label);
}

function requirePhysicalReference(value, label, automatedReferences) {
  const reference = requiredSanitizedText(value, label);
  if (AUTOMATION_ONLY_PATTERN.test(reference)) {
    throw new Error(label + ' cannot be represented only by automated/headless evidence.');
  }
  if (automatedReferences.includes(reference)) {
    throw new Error(label + ' must be distinct from automated/browser evidence references.');
  }
  return reference;
}

function normalizePostProduction(postProduction, profile) {
  if (!postProduction || typeof postProduction !== 'object' || Array.isArray(postProduction)) {
    throw new Error('Post-production checklist must be an object.');
  }
  const observations = Array.isArray(postProduction.observations) ? postProduction.observations : [];
  if (observations.length !== POST_PRODUCTION_OBSERVATION_IDS.length) {
    throw new Error('Post-production checklist must contain the exact observation inventory.');
  }
  const byId = new Map();
  for (const observation of observations) {
    const id = String(observation?.id || '').trim();
    if (!POST_PRODUCTION_OBSERVATION_IDS.includes(id) || byId.has(id)) {
      throw new Error('Post-production checklist contains an unknown or duplicate observation.');
    }
    const status = String(observation?.status || '').trim().toUpperCase();
    if (!['PENDING', 'PASS', 'FAIL'].includes(status)) {
      throw new Error('Post-production observation has an invalid status: ' + id + '.');
    }
    const notes = sanitizeEvidenceText(observation?.notes, 'Post-production ' + id + ' notes');
    if (status === 'PASS' && notes.length < 12) {
      throw new Error('Post-production PASS requires a concrete observation: ' + id + '.');
    }
    byId.set(id, Object.freeze({ id, status, notes }));
  }
  const normalized = POST_PRODUCTION_OBSERVATION_IDS.map(id => byId.get(id));
  if (profile === 'final' && normalized.some(observation => observation.status !== 'PASS')) {
    throw new Error('Final field package validation requires every post-production observation to PASS.');
  }
  return Object.freeze(normalized);
}

export function createFieldCertificationPackage(candidateSha, { now = () => new Date() } = {}) {
  const sha = requireExactCandidateSha(candidateSha, 'Field certification package');
  return Object.freeze({
    schemaVersion: FIELD_CERTIFICATION_PACKAGE_SCHEMA_VERSION,
    evidenceClass: 'HUMAN-FIELD-PACKAGE',
    candidateSha: sha,
    initializedAt: now().toISOString(),
    artifacts: Object.freeze({
      fieldDeviceEvidence: 'field-device.json',
      pushDeviceEvidence: 'field-push.json',
    }),
    references: Object.freeze({
      exactRcAutomatedGate: Object.freeze({ candidateSha: sha, reference: 'PENDING' }),
      builtBrowserPush: Object.freeze({ candidateSha: sha, reference: 'PENDING' }),
      assignmentDueBackend: 'PENDING',
      assignmentAssignedDurableNotification: Object.freeze({ candidateSha: sha, reference: 'PENDING' }),
      assignmentAssignedDispatchLedger: Object.freeze({ candidateSha: sha, reference: 'PENDING' }),
      assignmentCleanup: Object.freeze({ candidateSha: sha, reference: 'PENDING' }),
      screenshotVideo: Object.freeze([]),
    }),
    postProduction: Object.freeze({
      productionBuildShaObserved: 'PENDING',
      productionPromotionReference: 'PENDING',
      evidenceReference: 'PENDING',
      observations: Object.freeze(POST_PRODUCTION_OBSERVATION_IDS.map(id => Object.freeze({
        id,
        status: 'PENDING',
        notes: '',
      }))),
    }),
  });
}

export function validateFieldCertificationPackageData({
  packageRecord,
  fieldDeviceRecord,
  pushDeviceRecord,
  expectedCandidateSha,
  profile = 'field',
} = {}) {
  if (!packageRecord || typeof packageRecord !== 'object' || Array.isArray(packageRecord)) {
    throw new Error('Field certification package must be a JSON object.');
  }
  if (packageRecord.schemaVersion !== FIELD_CERTIFICATION_PACKAGE_SCHEMA_VERSION) {
    throw new Error('Field certification package schemaVersion must be 1.');
  }
  if (packageRecord.evidenceClass !== 'HUMAN-FIELD-PACKAGE') {
    throw new Error('Field certification package evidenceClass must be HUMAN-FIELD-PACKAGE.');
  }
  const normalizedProfile = String(profile || '').trim().toLowerCase();
  if (!FIELD_CERTIFICATION_PROFILES.includes(normalizedProfile)) {
    throw new Error('Unknown field certification profile: ' + normalizedProfile + '.');
  }
  const expectedSha = requireExactCandidateSha(expectedCandidateSha, 'Expected release candidate');
  const packageSha = requireExactCandidateSha(packageRecord.candidateSha, 'Field certification package');
  if (packageSha !== expectedSha) throw new Error('Field certification package does not match the expected release-candidate SHA.');
  requireEvidenceTimestamp(packageRecord.initializedAt, 'Field package initialized timestamp');

  const field = validateFieldDeviceEvidence(fieldDeviceRecord, expectedSha);
  const push = validatePhysicalPushEvidence(pushDeviceRecord, expectedSha);
  const fieldEvaluation = evaluateFieldDeviceProfile(field, 'full-nonpush');
  const pushEvaluation = evaluatePhysicalPushEvidenceProfile(push, 'physical-push');
  if (!fieldEvaluation.satisfied) {
    throw new Error('Field package requires PASS for installed-PWA, manual accessibility, and background media physical evidence.');
  }
  if (!pushEvaluation.satisfied) {
    throw new Error('Field package requires PASS for P1/P2 physical push evidence.');
  }

  if (push.origin !== field.origin) {
    throw new Error('Field-device and push physical evidence must come from the same deployed origin.');
  }

  const references = packageRecord.references || {};
  const exactRcAutomatedGate = requireCandidateBoundReference(
    references.exactRcAutomatedGate,
    'Exact RC automated-gate reference',
    expectedSha,
  );
  const builtBrowserPush = requireCandidateBoundReference(
    references.builtBrowserPush,
    'Built-browser push reference',
    expectedSha,
  );
  const assignmentDueBackend = requiredSanitizedText(references.assignmentDueBackend, 'Assignment due backend evidence reference');
  const assignmentAssignedDurableNotification = requireCandidateBoundReference(
    references.assignmentAssignedDurableNotification,
    'Assignment assigned durable-notification reference',
    expectedSha,
  );
  const assignmentAssignedDispatchLedger = requireCandidateBoundReference(
    references.assignmentAssignedDispatchLedger,
    'Assignment assigned dispatch/ledger reference',
    expectedSha,
  );
  const assignmentCleanup = requireCandidateBoundReference(
    references.assignmentCleanup,
    'Disposable assignment cleanup reference',
    expectedSha,
  );
  const automatedReferences = [exactRcAutomatedGate, builtBrowserPush];
  const fieldPhysicalReference = requirePhysicalReference(
    field.durableEvidenceReference,
    'Field-device physical evidence reference',
    automatedReferences,
  );
  const pushPhysicalReference = requirePhysicalReference(
    push.durableEvidenceReference,
    'Push physical evidence reference',
    automatedReferences,
  );

  const screenshots = Array.isArray(references.screenshotVideo) ? references.screenshotVideo : [];
  if (screenshots.length > 20) throw new Error('Field package supports at most 20 screenshot/video references.');
  const screenshotVideo = screenshots.map((reference, index) =>
    requiredSanitizedText(reference, 'Screenshot/video reference ' + (index + 1)));

  const postProduction = normalizePostProduction(packageRecord.postProduction, normalizedProfile);
  let productionBuildShaObserved = null;
  let productionPromotionReference = null;
  let postProductionEvidenceReference = null;
  if (normalizedProfile === 'final') {
    productionBuildShaObserved = requireExactCandidateSha(
      packageRecord.postProduction?.productionBuildShaObserved,
      'Observed production build SHA',
    );
    if (productionBuildShaObserved !== expectedSha) {
      throw new Error('Observed production build SHA does not match the certified release candidate.');
    }
    productionPromotionReference = requiredSanitizedText(
      packageRecord.postProduction?.productionPromotionReference,
      'Production promotion reference',
    );
    postProductionEvidenceReference = requiredSanitizedText(
      packageRecord.postProduction?.evidenceReference,
      'Post-production evidence reference',
    );
  }

  return Object.freeze({
    schemaVersion: 1,
    evidenceClass: 'HUMAN-FIELD-PACKAGE',
    profile: normalizedProfile,
    candidateSha: expectedSha,
    targetOrigin: field.origin,
    observedBuildSha: field.candidateSha,
    tester: field.tester,
    deviceOsBrowser: field.deviceOsBrowser,
    environment: field.environment,
    installedDisplayMode: field.installedDisplayMode,
    fieldObservedAt: field.observedAt,
    pushObservedAt: push.observedAt,
    evidence: Object.freeze({
      physicalInstalledPwaOffline: true,
      criticalManualAccessibility: true,
      backgroundLockscreenMedia: true,
      physicalDevicePush: true,
      assignmentAssignedDueCompositeReadyForReview: true,
      browserPlusPhysicalPushCompositeReadyForReview: true,
      exactRcAutomatedGate,
      builtBrowserPush,
      assignmentDueBackend,
      assignmentAssignedDurableNotification,
      assignmentAssignedDispatchLedger,
      assignmentCleanup,
      fieldPhysicalReference,
      pushPhysicalReference,
      screenshotVideo: Object.freeze(screenshotVideo),
    }),
    postProductionComplete: normalizedProfile === 'final',
    productionBuildShaObserved,
    productionPromotionReference,
    postProductionEvidenceReference,
    postProduction,
  });
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function validatePackageFile(packagePath, expectedCandidateSha, profile) {
  const resolvedPackage = resolve(packagePath);
  const packageRecord = await readJson(resolvedPackage);
  const artifacts = packageRecord?.artifacts || {};
  const fieldRelative = normalizeEvidenceFile(artifacts.fieldDeviceEvidence, 'Field-device evidence file');
  const pushRelative = normalizeEvidenceFile(artifacts.pushDeviceEvidence, 'Push evidence file');
  const base = dirname(resolvedPackage);
  const fieldDeviceRecord = await readJson(resolve(base, fieldRelative));
  const pushDeviceRecord = await readJson(resolve(base, pushRelative));
  return validateFieldCertificationPackageData({
    packageRecord,
    fieldDeviceRecord,
    pushDeviceRecord,
    expectedCandidateSha,
    profile,
  });
}

async function main(argv) {
  const [command, ...rest] = argv;
  if (command === 'init') {
    if (rest.length !== 2) {
      throw new Error('Usage: node scripts/v6-field-certification-package.mjs init <exact-rc-sha> <package.json>');
    }
    const record = createFieldCertificationPackage(rest[0]);
    await writeFile(resolve(rest[1]), JSON.stringify(record, null, 2) + '\n', 'utf8');
    process.stdout.write(JSON.stringify(record, null, 2) + '\n');
    return;
  }
  if (command === 'validate') {
    if (rest.length < 2 || rest.length > 3) {
      throw new Error('Usage: node scripts/v6-field-certification-package.mjs validate <package.json> <exact-rc-sha> [field|final]');
    }
    const result = await validatePackageFile(rest[0], rest[1], rest[2] || 'field');
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return;
  }
  throw new Error('Usage: node scripts/v6-field-certification-package.mjs <init|validate> ...');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => {
    console.error(error?.stack || error);
    process.exitCode = 1;
  });
}
