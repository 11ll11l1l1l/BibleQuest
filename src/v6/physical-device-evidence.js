const SHA_PATTERN = /^[0-9a-f]{40}$/i;
const JST_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const APPROVED_FIELD_HOST_SUFFIXES = Object.freeze([
  'mybiblequest.pages.dev',
  'biblequest-7th.pages.dev',
]);

const SENSITIVE_TEXT_PATTERNS = Object.freeze([
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i,
  /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/,
  /\bsb[_]secret_[A-Za-z0-9_-]+\b/i,
  /\bservice_role\b/i,
  /\bp256dh\b/i,
  /\bBearer\s+[A-Za-z0-9._~+\/-]{12,}\b/i,
  /\b(?:password|endpoint|auth(?:entication)?\s*token|access[_ -]?token|refresh[_ -]?token|api[_ -]?key|apikey|secret|authorization)\s*[:=]/i,
  /https:\/\/(?:fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[^/\s]+\.notify\.windows\.com)\/\S+/i,
]);

export function evidenceText(value) {
  return String(value ?? '').trim();
}

export function requireExactCandidateSha(value, label = 'Physical-device evidence') {
  const sha = evidenceText(value).toLowerCase();
  if (!SHA_PATTERN.test(sha)) throw new Error(label + ' requires an exact 40-character candidate SHA.');
  return sha;
}

export function sanitizeEvidenceText(value, label) {
  const normalized = evidenceText(value);
  if (SENSITIVE_TEXT_PATTERNS.some(pattern => pattern.test(normalized))) {
    throw new Error(label + ' contains account, credential, endpoint, key, or token material.');
  }
  return normalized;
}

export function requireEvidenceMetadata(metadata, label = 'Physical-device evidence') {
  const tester = sanitizeEvidenceText(metadata?.tester, 'Tester metadata');
  const deviceOsBrowser = sanitizeEvidenceText(metadata?.deviceOsBrowser, 'Device metadata');
  const environment = sanitizeEvidenceText(metadata?.environment, 'Environment metadata');
  const durableEvidenceReference = sanitizeEvidenceText(metadata?.durableEvidenceReference, 'Evidence reference');
  if (!tester) throw new Error(label + ' requires a tester or QA identifier.');
  if (!deviceOsBrowser) throw new Error(label + ' requires device / OS / browser metadata.');
  if (!environment) throw new Error(label + ' requires an environment label.');
  if (!durableEvidenceReference) throw new Error(label + ' requires a durable evidence reference.');
  return Object.freeze({ tester, deviceOsBrowser, environment, durableEvidenceReference });
}

export function requireEvidenceTimestamp(value, label = 'Observed timestamp') {
  const timestamp = sanitizeEvidenceText(value, label);
  if (!timestamp || !Number.isFinite(Date.parse(timestamp))) throw new Error(label + ' must be a valid timestamp.');
  return timestamp;
}

export function requireJstEvidenceDate(value) {
  const date = sanitizeEvidenceText(value, 'Evidence date');
  if (!JST_DATE_PATTERN.test(date)) throw new Error('Evidence date must use YYYY-MM-DD.');
  return date;
}

export function requireApprovedBibleQuestOrigin(value) {
  let url;
  try { url = new URL(evidenceText(value)); } catch {
    throw new Error('Field/device evidence origin must be a valid HTTPS URL.');
  }
  const host = url.hostname.toLowerCase();
  const approved = APPROVED_FIELD_HOST_SUFFIXES.some(suffix => host === suffix || host.endsWith('.' + suffix));
  if (url.protocol !== 'https:' || !approved) {
    throw new Error('Field/device evidence origin is not an approved deployed BibleQuest HTTPS host.');
  }
  return url.origin;
}

export function normalizePhysicalGate(gate, id, expectedSteps, label = id) {
  const gateId = evidenceText(gate?.id).toLowerCase();
  if (gateId !== id) throw new Error(label + ' has an invalid physical gate id.');
  const status = evidenceText(gate?.status).toUpperCase();
  if (!['PENDING', 'PASS', 'FAIL'].includes(status)) throw new Error(label + ' has an invalid evidence status.');
  const notes = sanitizeEvidenceText(gate?.notes, label + ' observation');
  if (!Array.isArray(gate?.steps) || gate.steps.length !== expectedSteps.length) {
    throw new Error(label + ' must contain the exact physical sub-step inventory.');
  }
  const seen = new Map();
  for (const step of gate.steps) {
    const stepId = evidenceText(step?.id);
    if (!expectedSteps.includes(stepId) || seen.has(stepId)) {
      throw new Error(label + ' has an invalid or duplicate physical sub-step.');
    }
    seen.set(stepId, step?.checked === true);
  }
  const normalizedSteps = expectedSteps.map(stepId => {
    if (!seen.has(stepId)) throw new Error(label + ' is missing physical sub-step ' + stepId + '.');
    return Object.freeze({ id: stepId, checked: seen.get(stepId) === true });
  });
  if (status === 'PASS') {
    if (normalizedSteps.some(step => !step.checked)) throw new Error(label + ' PASS requires every physical sub-step.');
    if (notes.length < 12) throw new Error(label + ' PASS requires a concrete physical observation.');
  }
  return Object.freeze({ id, status, notes, steps: Object.freeze(normalizedSteps) });
}

export function normalizePhysicalGateSet(gates, definitions, labelPrefix = 'Physical-device evidence') {
  if (!Array.isArray(gates)) throw new Error(labelPrefix + ' gates must be an array.');
  const ids = Object.keys(definitions);
  if (gates.length !== ids.length) throw new Error(labelPrefix + ' requires exactly ' + ids.length + ' gate records.');
  const byId = new Map();
  for (const gate of gates) {
    const id = evidenceText(gate?.id).toLowerCase();
    if (!definitions[id] || byId.has(id)) {
      throw new Error(labelPrefix + ' has an unknown or duplicate gate: ' + (id || 'missing') + '.');
    }
    byId.set(id, gate);
  }
  return Object.freeze(ids.map(id => normalizePhysicalGate(
    byId.get(id), id, definitions[id], labelPrefix + ' ' + id.toUpperCase(),
  )));
}

export function assertDeclaredEligibility(declared, key, expected, label) {
  if (Boolean(declared?.[key]) !== expected) {
    throw new Error('Declared ' + label + ' eligibility does not match physical evidence.');
  }
}
