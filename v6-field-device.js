import { buildFieldDeviceEvidence } from './src/v6/field-device-evidence.js';
import {
  requireApprovedBibleQuestOrigin,
  requireExactCandidateSha,
} from './src/v6/physical-device-evidence.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const fields = Object.freeze({
  harness: $('[data-field-harness]'),
  sha: $('[data-field-sha]'),
  installed: $('[data-field-installed]'),
  network: $('[data-field-network]'),
  worker: $('[data-field-worker]'),
  message: $('[data-field-message]'),
  tester: $('[data-field-tester]'),
  device: $('[data-field-device]'),
  environment: $('[data-field-environment]'),
  reference: $('[data-field-reference]'),
});

let candidateSha = '';
let storageKey = '';

function setStatus(node, value, ok = null) {
  node.textContent = value;
  node.dataset.kind = ok === true ? 'ok' : ok === false ? 'error' : '';
}

function setMessage(value, kind = '') {
  fields.message.textContent = String(value || '');
  fields.message.dataset.kind = kind;
}

function isApprovedOrigin() {
  try {
    requireApprovedBibleQuestOrigin(location.origin);
    return true;
  } catch {
    return false;
  }
}

function installedMode() {
  if (matchMedia('(display-mode: standalone)').matches) return 'standalone';
  if (navigator.standalone === true) return 'ios-standalone';
  return 'browser-tab';
}

function jstDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

async function loadCandidateSha() {
  const response = await fetch('./bq-build.json', { cache: 'no-store', credentials: 'same-origin' });
  if (!response.ok) throw new Error('bq-build.json unavailable: HTTP ' + response.status);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error('bq-build.json did not return JSON; deployed artifact identity is not trustworthy.');
  }
  const build = await response.json();
  return requireExactCandidateSha(build?.sha, 'Deployed candidate');
}

async function workerState() {
  if (!('serviceWorker' in navigator)) return 'unsupported';
  const registration = await navigator.serviceWorker.getRegistration('./');
  if (!registration) return 'not registered';
  if (registration.active) return 'active';
  if (registration.waiting) return 'waiting';
  if (registration.installing) return 'installing';
  return 'registered';
}

function gateSnapshot(section) {
  return Object.freeze({
    id: String(section.dataset.gate || ''),
    status: String(section.querySelector('[data-gate-status]')?.value || 'PENDING'),
    notes: String(section.querySelector('[data-gate-notes]')?.value || '').trim(),
    steps: Object.freeze([...section.querySelectorAll('[data-step]')].map(input => Object.freeze({
      id: String(input.dataset.step || ''),
      checked: input.checked === true,
    }))),
  });
}

function evidenceMetadata() {
  return Object.freeze({
    tester: fields.tester?.value || '',
    deviceOsBrowser: fields.device?.value || '',
    environment: fields.environment?.value || '',
    durableEvidenceReference: fields.reference?.value || '',
  });
}

function persistedState() {
  return {
    tester: fields.tester.value,
    device: fields.device.value,
    environment: fields.environment.value,
    reference: fields.reference.value,
    gates: Object.fromEntries($$('[data-gate]').map(section => {
      const snapshot = gateSnapshot(section);
      return [snapshot.id, snapshot];
    })),
  };
}

function save() {
  if (!storageKey) return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(persistedState()));
  } catch {
    setMessage('Could not persist local field progress on this device.', 'error');
  }
}

function restore() {
  if (!storageKey) return;
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
  } catch {
    localStorage.removeItem(storageKey);
  }
  if (!saved || typeof saved !== 'object') return;
  fields.tester.value = String(saved.tester || '');
  fields.device.value = String(saved.device || '');
  fields.environment.value = String(saved.environment || '');
  fields.reference.value = String(saved.reference || '');
  for (const section of $$('[data-gate]')) {
    const gate = saved.gates?.[section.dataset.gate];
    if (!gate) continue;
    const status = section.querySelector('[data-gate-status]');
    const notes = section.querySelector('[data-gate-notes]');
    if (['PENDING', 'PASS', 'FAIL'].includes(gate.status)) status.value = gate.status;
    notes.value = String(gate.notes || '');
    const byId = new Map((gate.steps || []).map(step => [String(step.id), step.checked === true]));
    for (const input of section.querySelectorAll('[data-step]')) {
      input.checked = byId.get(String(input.dataset.step)) === true;
    }
  }
}

function exportRecord() {
  return buildFieldDeviceEvidence({
    candidateSha,
    metadata: evidenceMetadata(),
    gates: $$('[data-gate]').map(gateSnapshot),
    evidenceDateJst: jstDate(),
    observedAt: new Date().toISOString(),
    origin: location.origin,
    installedDisplayMode: installedMode(),
    networkOnlineAtExport: navigator.onLine,
  });
}

async function refreshDeviceState() {
  setStatus(fields.network, navigator.onLine ? 'online' : 'offline', navigator.onLine ? null : true);
  const mode = installedMode();
  setStatus(fields.installed, mode, mode === 'browser-tab' ? false : true);
  const worker = await workerState();
  setStatus(fields.worker, worker, worker === 'active' ? true : worker === 'unsupported' || worker === 'not registered' ? false : null);
}

async function boot() {
  if (!isApprovedOrigin()) {
    setStatus(fields.harness, 'blocked: approved HTTPS BibleQuest host required', false);
    throw new Error('Physical field evidence must run from an approved deployed BibleQuest HTTPS host.');
  }
  if (!globalThis.isSecureContext) {
    setStatus(fields.harness, 'blocked: secure context required', false);
    throw new Error('Secure context required.');
  }
  candidateSha = await loadCandidateSha();
  storageKey = 'bq:v6:physical-field:' + candidateSha;
  setStatus(fields.sha, candidateSha, true);
  restore();
  await refreshDeviceState();
  setStatus(fields.harness, 'ready', true);
  setMessage('Exact deployed candidate loaded. Record only observations made on this physical device.', 'ok');
}

$('[data-field-refresh]').addEventListener('click', () => {
  void refreshDeviceState()
    .then(() => setMessage('Device state refreshed.', 'ok'))
    .catch(error => setMessage(error?.message || error, 'error'));
});

for (const control of $$('input,select,textarea')) {
  control.addEventListener('change', save);
  control.addEventListener('input', save);
}

$('[data-field-copy]').addEventListener('click', async () => {
  try {
    const record = exportRecord();
    await navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setMessage('Sanitized exact-candidate physical record copied.', 'ok');
  } catch (error) {
    setMessage(error?.message || error, 'error');
  }
});

$('[data-field-download]').addEventListener('click', () => {
  try {
    const record = exportRecord();
    const blob = new Blob([JSON.stringify(record, null, 2) + '\n'], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'biblequest-v6-physical-field-' + candidateSha.slice(0, 12) + '.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 0);
    setMessage('Sanitized exact-candidate physical record downloaded.', 'ok');
  } catch (error) {
    setMessage(error?.message || error, 'error');
  }
});

$('[data-field-reset]').addEventListener('click', () => {
  if (storageKey) localStorage.removeItem(storageKey);
  location.reload();
});

window.addEventListener('online', () => void refreshDeviceState());
window.addEventListener('offline', () => void refreshDeviceState());
matchMedia('(display-mode: standalone)').addEventListener?.('change', () => void refreshDeviceState());

void boot().catch(error => setMessage(error?.message || error, 'error'));
