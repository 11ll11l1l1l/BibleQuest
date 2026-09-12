import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const requireComplete = args.includes('--require-complete');
const fileIndex = args.indexOf('--file');
let evidencePath = path.join(root, 'V4_PHASE6_FIELD_EVIDENCE.json');

if (fileIndex !== -1) {
  const requestedPath = args[fileIndex + 1];
  if (!requestedPath || requestedPath.startsWith('--')) {
    throw new Error('V4 Phase 6 field-evidence gate: --file requires a JSON path');
  }
  evidencePath = path.resolve(process.cwd(), requestedPath);
}

const consumed = new Set(['--require-complete']);
if (fileIndex !== -1) {
  consumed.add('--file');
  consumed.add(args[fileIndex + 1]);
}
for (const arg of args) {
  if (!consumed.has(arg)) throw new Error(`V4 Phase 6 field-evidence gate: unknown argument ${arg}`);
}

const expectedGates = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const allowedStatus = new Set(['pending', 'pass', 'fail']);
const emergencyActions = ['authorization', 'force_sign_out', 'suspend_reactivate', 'set_temp_password', 'change_email'];
const linkedActivityScenarios = [
  'journey_group_create_join_persistence',
  'journey_group_assignment_and_unrelated_denial',
  'cloud_team_management_assignment_and_denial',
  'linked_couple_accept_assignment_and_unrelated_isolation',
  'couples_challenge_shared_day_individual_points',
  'live_room_realtime_reconnect_and_isolation',
  'reload_relogin_persistence',
  'read_only_postrun_confirmation'
];

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

function isSafeStructuralKey(trail, key) {
  return trail.join('.') === 'gates.A.actions' && key === 'set_temp_password';
}

function walk(value, trail = []) {
  if (typeof value === 'string') {
    if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(value)) fail(`email-like value forbidden at ${trail.join('.') || 'root'}`);
    if (/\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/.test(value)) fail(`JWT-like value forbidden at ${trail.join('.') || 'root'}`);
    if (/\bBearer\s+[A-Za-z0-9._~-]+/i.test(value)) fail(`authorization value forbidden at ${trail.join('.') || 'root'}`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, [...trail, String(index)]));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const lower = key.toLowerCase();
    if (/(password|token|secret|recovery_code|private_email|auth_header)/.test(lower) && !isSafeStructuralKey(trail, key)) {
      fail(`forbidden sensitive evidence key at ${[...trail, key].join('.')}`);
    }
    walk(child, [...trail, key]);
  }
}

function requireBoolean(gate, key, gateId) {
  if (gate[key] !== true) fail(`Gate ${gateId} PASS requires ${key}=true`);
}

if (!fs.existsSync(evidencePath)) fail(`missing evidence file: ${evidencePath}`);
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

  if (gateId === 'A' && gate.status === 'pass') {
    requireBoolean(gate, 'real_authenticated_sessions', gateId);
    requireBoolean(gate, 'safe_target_designated', gateId);
    if (!Number.isInteger(gate.independent_target_sessions) || gate.independent_target_sessions < 2) fail('Gate A requires at least two independent target sessions');
    if (!gate.actions || typeof gate.actions !== 'object' || Array.isArray(gate.actions)) fail('Gate A requires an actions object');
    for (const action of emergencyActions) if (gate.actions[action] !== 'pass') fail(`Gate A requires actions.${action}=pass`);
    requireBoolean(gate, 'audit_secret_hygiene_verified', gateId);
    requireBoolean(gate, 'session_revocation_observed', gateId);
  }

  if (gateId === 'B' && gate.status === 'pass') {
    requireBoolean(gate, 'real_authenticated_sessions', gateId);
    requireBoolean(gate, 'same_storage_switch_roundtrip', gateId);
    requireBoolean(gate, 'stale_private_state_cleared', gateId);
    requireBoolean(gate, 'stale_privileged_controls_cleared', gateId);
    requireBoolean(gate, 'backend_authorization_verified', gateId);
  }

  if (gateId === 'C' && gate.status === 'pass') {
    requireBoolean(gate, 'real_authenticated_sessions', gateId);
    if (!Number.isInteger(gate.distinct_populated_congregations) || gate.distinct_populated_congregations < 2) fail('Gate C requires at least two legitimate populated congregations');
    requireBoolean(gate, 'cross_congregation_read_isolation_verified', gateId);
    requireBoolean(gate, 'cross_congregation_write_isolation_verified', gateId);
    requireBoolean(gate, 'deep_link_and_code_bypass_denied', gateId);
  }

  if (['D', 'E', 'F'].includes(gateId) && gate.status === 'pass') {
    if (!gate.device || typeof gate.device !== 'object') fail(`Gate ${gateId} PASS requires physical device metadata`);
    if (!nonEmpty(gate.device.model) || !nonEmpty(gate.device.android_version)) fail(`Gate ${gateId} requires device model and Android version`);
    if (gate.physical_device !== true) fail(`Gate ${gateId} must explicitly record physical_device=true`);
  }

  if (['D', 'E'].includes(gateId) && gate.status === 'pass') {
    if (!gate.browser || typeof gate.browser !== 'object' || !nonEmpty(gate.browser.name) || !nonEmpty(gate.browser.version)) fail(`Gate ${gateId} requires browser name and version`);
    if (gateId === 'D' && !/chrome/i.test(gate.browser.name)) fail('Gate D requires Chrome');
    if (gateId === 'E' && !/brave/i.test(gate.browser.name)) fail('Gate E requires Brave');
    if (String(gate.zoom) !== '100%') fail(`Gate ${gateId} must record zoom=100%`);
    requireBoolean(gate, 'no_document_horizontal_scroll', gateId);
    requireBoolean(gate, 'critical_routes_touch_usable', gateId);
    requireBoolean(gate, 'rotation_recovery_verified', gateId);
  }

  if (gateId === 'F' && gate.status === 'pass') {
    if (gate.installed_pwa !== true) fail('Gate F PASS requires installed_pwa=true');
    if (!nonEmpty(gate.install_source_browser)) fail('Gate F PASS requires install_source_browser');
    requireBoolean(gate, 'standalone_launch_verified', gateId);
    requireBoolean(gate, 'offline_contract_verified', gateId);
    requireBoolean(gate, 'reconnect_without_reinstall_verified', gateId);
    requireBoolean(gate, 'relaunch_state_verified', gateId);
  }

  if (gateId === 'G' && gate.status === 'pass') {
    requireBoolean(gate, 'real_authenticated_sessions', gateId);
    requireBoolean(gate, 'normal_product_paths_only', gateId);
    if (!Number.isInteger(gate.distinct_authenticated_accounts) || gate.distinct_authenticated_accounts < 3) fail('Gate G requires at least three distinct authenticated accounts/sessions');
    if (!gate.scenarios || typeof gate.scenarios !== 'object' || Array.isArray(gate.scenarios)) fail('Gate G requires a scenarios object');
    for (const scenario of linkedActivityScenarios) if (gate.scenarios[scenario] !== 'pass') fail(`Gate G requires scenarios.${scenario}=pass`);
  }
}

if (requireComplete) {
  const incomplete = expectedGates.filter(id => evidence.gates[id].status !== 'pass');
  if (incomplete.length) fail(`production promotion blocked; field gates not PASS: ${incomplete.join(', ')}`);
}

console.log(`BibleQuest V4 Phase 6 field evidence validated (${requireComplete ? 'production-complete' : 'schema/readiness'} mode): ${path.relative(root, evidencePath) || path.basename(evidencePath)}.`);
