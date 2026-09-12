import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const evidencePath = path.join(root, 'V4_PHASE6_FIELD_EVIDENCE.json');
const requireComplete = process.argv.includes('--require-complete');
const expectedGates = ['A', 'B', 'C', 'D', 'E', 'F'];
const allowedStatus = new Set(['pending', 'pass', 'fail']);

function fail(message) {
  throw new Error(`V4 Phase 6 field-evidence gate: ${message}`);
}

function isSha(value) {
  return /^[0-9a-f]{40}$/i.test(String(value || ''));
}

function isJstTimestamp(value) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?\+09:00$/.test(String(value || ''));
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function walk(value, trail = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, [...trail, String(index)]));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const lower = key.toLowerCase();
    if (/(password|token|secret|recovery_code|private_email|auth_header)/.test(lower)) {
      fail(`forbidden sensitive evidence key at ${[...trail, key].join('.')}`);
    }
    walk(child, [...trail, key]);
  }
}

if (!fs.existsSync(evidencePath)) fail('missing V4_PHASE6_FIELD_EVIDENCE.json');
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));

if (evidence.schema !== 'biblequest-v4-phase6-field-evidence/v1') fail('unexpected schema');
if (!isJstTimestamp(evidence.updated_jst)) fail('updated_jst must be an explicit JST timestamp');
if (!isSha(evidence.certified_application_sha)) fail('certified_application_sha must be a full commit SHA');
if (!evidence.gates || typeof evidence.gates !== 'object' || Array.isArray(evidence.gates)) fail('gates must be an object');

const actualGates = Object.keys(evidence.gates).sort();
if (actualGates.join(',') !== expectedGates.join(',')) fail(`expected exactly gates ${expectedGates.join(', ')}`);
walk(evidence);

for (const gateId of expectedGates) {
  const gate = evidence.gates[gateId];
  if (!gate || typeof gate !== 'object' || Array.isArray(gate)) fail(`Gate ${gateId} must be an object`);
  if (!allowedStatus.has(gate.status)) fail(`Gate ${gateId} has invalid status ${String(gate.status)}`);
  if (!nonEmpty(gate.title)) fail(`Gate ${gateId} requires a title`);

  if (gate.status === 'pass') {
    if (!isJstTimestamp(gate.observed_at_jst)) fail(`Gate ${gateId} PASS requires observed_at_jst`);
    if (!isSha(gate.application_sha)) fail(`Gate ${gateId} PASS requires application_sha`);
    if (gate.application_sha !== evidence.certified_application_sha) fail(`Gate ${gateId} application_sha must match certified_application_sha`);
    if (!/^https:\/\//i.test(String(gate.host || ''))) fail(`Gate ${gateId} PASS requires an HTTPS host`);
    if (!nonEmpty(gate.expected_behavior)) fail(`Gate ${gateId} PASS requires expected_behavior`);
    if (!nonEmpty(gate.observed_behavior)) fail(`Gate ${gateId} PASS requires observed_behavior`);
    if (!Array.isArray(gate.evidence_refs) || gate.evidence_refs.length === 0 || gate.evidence_refs.some(ref => !nonEmpty(ref))) {
      fail(`Gate ${gateId} PASS requires at least one sanitized evidence reference`);
    }
  }

  if (gate.status === 'fail' && !nonEmpty(gate.failure_summary)) fail(`Gate ${gateId} FAIL requires failure_summary`);

  if (['D', 'E', 'F'].includes(gateId) && gate.status === 'pass') {
    if (!gate.device || typeof gate.device !== 'object') fail(`Gate ${gateId} PASS requires physical device metadata`);
    if (!nonEmpty(gate.device.model) || !nonEmpty(gate.device.android_version)) fail(`Gate ${gateId} requires device model and Android version`);
    if (gate.physical_device !== true) fail(`Gate ${gateId} must explicitly record physical_device=true`);
  }

  if (['D', 'E'].includes(gateId) && gate.status === 'pass') {
    if (!gate.browser || typeof gate.browser !== 'object' || !nonEmpty(gate.browser.name) || !nonEmpty(gate.browser.version)) {
      fail(`Gate ${gateId} requires browser name and version`);
    }
    if (String(gate.zoom) !== '100%') fail(`Gate ${gateId} must record zoom=100%`);
  }

  if (gateId === 'F' && gate.status === 'pass') {
    if (gate.installed_pwa !== true) fail('Gate F PASS requires installed_pwa=true');
    if (!nonEmpty(gate.install_source_browser)) fail('Gate F PASS requires install_source_browser');
  }
}

if (requireComplete) {
  const incomplete = expectedGates.filter(id => evidence.gates[id].status !== 'pass');
  if (incomplete.length) fail(`production promotion blocked; field gates not PASS: ${incomplete.join(', ')}`);
}

console.log(`BibleQuest V4 Phase 6 field evidence validated (${requireComplete ? 'production-complete' : 'schema/readiness'} mode).`);
