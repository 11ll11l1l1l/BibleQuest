import { buildPhysicalPushEvidence } from './push-device-field-evidence.js';
import { createStore } from '../app/store.js';
import { createSessionService } from '../app/session.js';
import { createPushSubscriptionService } from '../app/push-subscription.js';
import { createPushSubscriptionPersistence } from '../app/push-subscription-persistence.js';
import { createApi } from '../core/api.js';
import { authStorage, privateStorage } from '../core/storage.js';

const VAPID_PUBLIC_KEY = 'BKxJ2WXSqmiA9ZEmx8bItafM4fp_R4NkTC4F45BGZjjDqnfK-C3Goqb25CVgWsSSwMZsvOczx8LNv2vstkdqRmI';
const OWNER_KEY = 'bq:v5:push-owner';
const COMPILED_BUILD_SHA = String(__BQ_BUILD_SHA__ || '');
const EXACT_SHA = /^[0-9a-f]{40}$/i;
const ALLOWED_HOST_SUFFIXES = Object.freeze(['mybiblequest.pages.dev', 'biblequest-7th.pages.dev']);

const $ = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
const fields = Object.freeze({
  harness: $('[data-field-harness]'),
  auth: $('[data-field-auth]'),
  supported: $('[data-field-supported]'),
  permission: $('[data-field-permission]'),
  worker: $('[data-field-worker]'),
  browserSubscription: $('[data-field-browser-sub]'),
  owner: $('[data-field-owner]'),
  persistence: $('[data-field-persistence]'),
  compiledSha: $('[data-field-compiled-sha]'),
  artifactSha: $('[data-field-artifact-sha]'),
  identity: $('[data-field-identity]'),
  message: $('[data-field-message]'),
  tester: $('[data-field-tester]'),
  device: $('[data-field-device]'),
  environment: $('[data-field-environment]'),
  reference: $('[data-field-reference]'),
});

let persistenceVerified = false;
let artifactBuildSha = '';
let evidenceStorageKey = '';

function isAllowedFieldOrigin() {
  if (location.protocol !== 'https:') return false;
  const host = location.hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some(suffix => host === suffix || host.endsWith('.' + suffix));
}

function safeMessage(value) {
  return String(value || 'Operation failed.')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted-email]')
    .replace(/https:\/\/[^\s"'<>]+/gi, '[redacted-url]')
    .replace(/\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/g, '[redacted-token]')
    .slice(0, 280);
}

function setMessage(message, kind = '') {
  fields.message.textContent = message;
  fields.message.dataset.kind = kind;
}

function setStatus(node, value, ok = null) {
  node.textContent = value;
  node.dataset.kind = ok === true ? 'ok' : ok === false ? 'error' : '';
}

async function verifyExactCandidate() {
  setStatus(fields.compiledSha, COMPILED_BUILD_SHA || 'missing', EXACT_SHA.test(COMPILED_BUILD_SHA));
  const response = await fetch('/bq-build.json', { cache: 'no-store', credentials: 'same-origin' });
  if (!response.ok) throw new Error('Exact-candidate artifact identity is unavailable.');
  const build = await response.json();
  artifactBuildSha = String(build?.sha || '');
  setStatus(fields.artifactSha, artifactBuildSha || 'missing', EXACT_SHA.test(artifactBuildSha));
  const matches = EXACT_SHA.test(COMPILED_BUILD_SHA)
    && EXACT_SHA.test(artifactBuildSha)
    && COMPILED_BUILD_SHA === artifactBuildSha;
  setStatus(fields.identity, matches ? 'exact SHA match' : 'blocked: SHA mismatch', matches);
  if (!matches) throw new Error('Field testing requires matching exact 40-character compiled and artifact SHAs.');
  return artifactBuildSha;
}

if (!isAllowedFieldOrigin()) {
  setStatus(fields.harness, 'blocked: approved HTTPS BibleQuest host required', false);
  throw new Error('V6 push field harness runs only on an approved HTTPS BibleQuest host.');
}

await verifyExactCandidate();
evidenceStorageKey = 'bq:v6:push-field-evidence:' + artifactBuildSha;
restoreEvidenceProgress();

const api = createApi();
const store = createStore({
  session: Object.freeze({
    status: 'booting',
    authenticated: false,
    remoteAvailable: true,
    user: null,
    expiresAt: null,
    error: '',
  }),
});
const session = createSessionService({ auth: api.auth, store });
const persistence = createPushSubscriptionPersistence({
  session,
  api: api.pushSubscriptions,
});

let serviceWorkerRegistration = null;
if ('serviceWorker' in navigator) {
  serviceWorkerRegistration = await navigator.serviceWorker.register('/offline-shell-sw.js', { scope: '/' });
  await navigator.serviceWorker.ready;
}

const push = createPushSubscriptionService({
  session,
  persistence,
  serviceWorker: navigator.serviceWorker,
  notification: globalThis.Notification,
  applicationServerKey: VAPID_PUBLIC_KEY,
  ownerStorage: authStorage,
});

async function currentBrowserSubscription() {
  if (!serviceWorkerRegistration?.pushManager) return null;
  return serviceWorkerRegistration.pushManager.getSubscription().catch(() => null);
}

function pushGateSnapshot(section) {
  return Object.freeze({
    id: String(section.dataset.pushGate || ''),
    status: String(section.querySelector('[data-push-gate-status]')?.value || 'PENDING'),
    notes: String(section.querySelector('[data-push-gate-notes]')?.value || '').trim(),
    steps: Object.freeze($('[data-push-step]', section).map(input => Object.freeze({
      id: String(input.dataset.pushStep || ''),
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

function evidenceProgress() {
  return Object.freeze({
    metadata: evidenceMetadata(),
    gates: Object.freeze(all('[data-push-gate]').map(pushGateSnapshot)),
  });
}

function saveEvidenceProgress() {
  if (!evidenceStorageKey) return;
  try {
    privateStorage.write(evidenceStorageKey, evidenceProgress());
  } catch {
    setMessage('Could not persist physical push evidence progress on this device.', 'error');
  }
}

function restoreEvidenceProgress() {
  if (!evidenceStorageKey) return;
  let saved = null;
  try {
    saved = privateStorage.read(evidenceStorageKey, null);
  } catch {
    privateStorage.remove(evidenceStorageKey);
  }
  if (!saved || typeof saved !== 'object') return;
  fields.tester.value = String(saved.metadata?.tester || '');
  fields.device.value = String(saved.metadata?.deviceOsBrowser || '');
  fields.environment.value = String(saved.metadata?.environment || '');
  fields.reference.value = String(saved.metadata?.durableEvidenceReference || '');
  const gates = new Map((Array.isArray(saved.gates) ? saved.gates : []).map(gate => [String(gate?.id || ''), gate]));
  for (const section of all('[data-push-gate]')) {
    const gate = gates.get(String(section.dataset.pushGate || ''));
    if (!gate) continue;
    const status = section.querySelector('[data-push-gate-status]');
    const notes = section.querySelector('[data-push-gate-notes]');
    if (['PENDING', 'PASS', 'FAIL'].includes(String(gate.status || ''))) status.value = gate.status;
    notes.value = String(gate.notes || '');
    const steps = new Map((Array.isArray(gate.steps) ? gate.steps : []).map(step => [String(step?.id || ''), step?.checked === true]));
    for (const input of section.querySelectorAll('[data-push-step]')) {
      input.checked = steps.get(String(input.dataset.pushStep || '')) === true;
    }
  }
}

async function physicalEvidenceRecord() {
  await verifyExactCandidate();
  return buildPhysicalPushEvidence({
    candidateSha: artifactBuildSha,
    metadata: evidenceMetadata(),
    gates: all('[data-push-gate]').map(pushGateSnapshot),
    sanitizedSnapshot: await sanitizedSnapshot(),
    origin: location.origin,
  });
}

async function sanitizedSnapshot() {
  const state = session.getState();
  const browserSubscription = await currentBrowserSubscription();
  const pushState = await push.getState();
  const ownerMatches = Boolean(
    state.authenticated
    && state.user?.id
    && authStorage.getItem(OWNER_KEY) === String(state.user.id),
  );
  return Object.freeze({
    observed_at: new Date().toISOString(),
    candidate_sha: artifactBuildSha,
    authenticated: state.authenticated === true,
    push_supported: pushState.supported === true,
    notification_permission: pushState.permission || 'unsupported',
    service_worker_active: Boolean(
      serviceWorkerRegistration?.active
      || serviceWorkerRegistration?.waiting
      || serviceWorkerRegistration?.installing
    ),
    browser_subscription_present: Boolean(browserSubscription),
    owner_marker_matches_current_account: ownerMatches,
    lifecycle_persistence_verified_this_session: persistenceVerified,
  });
}

async function refresh() {
  try {
    const state = session.getState();
    const snapshot = await sanitizedSnapshot();
    setStatus(fields.harness, 'ready', true);
    setStatus(fields.auth, snapshot.authenticated ? 'yes' : 'no', snapshot.authenticated);
    setStatus(fields.supported, snapshot.push_supported ? 'yes' : 'no', snapshot.push_supported);
    setStatus(
      fields.permission,
      snapshot.notification_permission,
      snapshot.notification_permission === 'granted'
        ? true
        : snapshot.notification_permission === 'denied'
          ? false
          : null,
    );
    setStatus(fields.worker, snapshot.service_worker_active ? 'active' : 'not active', snapshot.service_worker_active);
    setStatus(
      fields.browserSubscription,
      snapshot.browser_subscription_present ? 'present' : 'absent',
      snapshot.browser_subscription_present ? true : null,
    );
    setStatus(
      fields.owner,
      snapshot.owner_marker_matches_current_account ? 'matches signed-in account' : 'not matched',
      snapshot.owner_marker_matches_current_account ? true : null,
    );
    setStatus(
      fields.persistence,
      snapshot.lifecycle_persistence_verified_this_session ? 'verified by enable path' : 'not exercised',
      snapshot.lifecycle_persistence_verified_this_session ? true : null,
    );
    $('[data-field-enable]').disabled = !state.authenticated || !snapshot.push_supported;
    $('[data-field-disable]').disabled = !state.authenticated || !snapshot.push_supported;
    $('[data-field-signout]').disabled = !state.authenticated;
    return snapshot;
  } catch (error) {
    setMessage(safeMessage(error?.message || error), 'error');
    throw error;
  }
}

$('[data-field-signin]').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const email = String(data.get('email') || '').trim();
  const password = String(data.get('password') || '');
  setMessage('Signing in...');
  try {
    await session.signIn(email, password);
    form.elements.password.value = '';
    persistenceVerified = false;
    setMessage('Signed in. Credentials are not included in field evidence.', 'ok');
    await refresh();
  } catch (error) {
    form.elements.password.value = '';
    setMessage(safeMessage(error?.message || error), 'error');
  }
});

$('[data-field-signout]').addEventListener('click', async () => {
  setMessage('Signing out and cleaning the current browser push subscription...');
  try {
    await session.signOut();
    persistenceVerified = false;
    setMessage('Signed out. Current-browser push cleanup completed through the V6 lifecycle.', 'ok');
    await refresh();
  } catch (error) {
    setMessage(safeMessage(error?.message || error), 'error');
  }
});

$('[data-field-enable]').addEventListener('click', async () => {
  setMessage('Requesting notification permission and enabling assignment push...');
  try {
    await push.enable(['assignment']);
    persistenceVerified = true;
    const snapshot = await refresh();
    if (
      !snapshot.browser_subscription_present
      || !snapshot.owner_marker_matches_current_account
      || !snapshot.lifecycle_persistence_verified_this_session
    ) {
      throw new Error('Push enable did not reach the required field-test state.');
    }
    setMessage('Assignment push is enabled for this browser. The tester may now fully close the app for P1.', 'ok');
  } catch (error) {
    persistenceVerified = false;
    setMessage(safeMessage(error?.message || error), 'error');
  }
});

$('[data-field-disable]').addEventListener('click', async () => {
  setMessage('Disabling push and removing the current browser subscription...');
  try {
    await push.disable();
    persistenceVerified = false;
    const snapshot = await refresh();
    if (snapshot.browser_subscription_present || snapshot.owner_marker_matches_current_account) {
      throw new Error('Push disable did not clean the current browser subscription.');
    }
    setMessage('Push is disabled for this browser. P2 may now run with the app fully closed.', 'ok');
  } catch (error) {
    setMessage(safeMessage(error?.message || error), 'error');
  }
});

$('[data-field-refresh]').addEventListener('click', () => {
  setMessage('Refreshing sanitized state...');
  void verifyExactCandidate()
    .then(refresh)
    .then(() => setMessage('Sanitized state refreshed.', 'ok'))
    .catch(error => setMessage(safeMessage(error?.message || error), 'error'));
});

$('[data-field-copy]').addEventListener('click', async () => {
  try {
    await verifyExactCandidate();
    const snapshot = await sanitizedSnapshot();
    await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
    setMessage('Sanitized status copied. It contains no email, user ID, endpoint, key material, or token.', 'ok');
  } catch (error) {
    setMessage(safeMessage(error?.message || error), 'error');
  }
});

$('[data-field-copy-evidence]').addEventListener('click', async () => {
  try {
    const evidence = await physicalEvidenceRecord();
    await navigator.clipboard.writeText(JSON.stringify(evidence, null, 2));
    setMessage('Exact-SHA physical push evidence copied. It contains no account ID, email, endpoint, key material, credential, or token.', 'ok');
  } catch (error) {
    setMessage(safeMessage(error?.message || error), 'error');
  }
});

for (const control of all('[data-field-tester],[data-field-device],[data-field-environment],[data-field-reference],[data-push-gate] input,[data-push-gate] select,[data-push-gate] textarea')) {
  control.addEventListener('change', saveEvidenceProgress);
  control.addEventListener('input', saveEvidenceProgress);
}

window.addEventListener('pageshow', () => {
  void verifyExactCandidate().then(refresh).catch(() => {});
});

await session.boot();
await refresh();
setMessage('Harness ready. Use a designated safe QA account only.', 'ok');
