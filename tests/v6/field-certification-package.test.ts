import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createFieldCertificationPackage,
  validateFieldCertificationPackageData,
} from '../../scripts/v6-field-certification-package.mjs';
import {
  FIELD_DEVICE_GATE_STEPS,
  buildFieldDeviceEvidence,
} from '../../src/v6/field-device-evidence.js';
import {
  PUSH_FIELD_GATE_STEPS,
  buildPhysicalPushEvidence,
} from '../../src/v6/push-device-field-evidence.js';

const sha='a'.repeat(40);

const gate=(definitions,id,status='PASS')=>({
  id,
  status,
  notes:status==='PASS'?'Observed and recorded on the physical QA device.':'',
  steps:definitions[id].map(step=>({id:step,checked:status==='PASS'})),
});

function fieldRecord(overrides={}){
  return buildFieldDeviceEvidence({
    candidateSha:sha,
    metadata:{
      tester:'QA operator',
      deviceOsBrowser:'Pixel 9 / Android 16 / Chrome 141 installed PWA',
      environment:'immutable Cloudflare preview',
      durableEvidenceReference:'field-record-physical-device-20261003',
    },
    gates:Object.keys(FIELD_DEVICE_GATE_STEPS).map(id=>gate(FIELD_DEVICE_GATE_STEPS,id)),
    evidenceDateJst:'2026-10-03',
    observedAt:'2026-10-02T22:00:00.000Z',
    origin:'https://abc.mybiblequest.pages.dev',
    installedDisplayMode:'standalone',
    networkOnlineAtExport:true,
    ...overrides,
  });
}

function pushRecord(overrides={}){
  return buildPhysicalPushEvidence({
    candidateSha:sha,
    metadata:{
      tester:'QA operator',
      deviceOsBrowser:'Pixel 9 / Android 16 / Chrome 141 installed PWA',
      environment:'immutable Cloudflare preview',
      durableEvidenceReference:'push-record-physical-device-20261003',
    },
    gates:[
      gate(PUSH_FIELD_GATE_STEPS,'p1'),
      gate(PUSH_FIELD_GATE_STEPS,'p2'),
      gate(PUSH_FIELD_GATE_STEPS,'p3','PENDING'),
    ],
    sanitizedSnapshot:{
      candidate_sha:sha,
      authenticated:true,
      push_supported:true,
      notification_permission:'granted',
      service_worker_active:true,
      browser_subscription_present:true,
      owner_marker_matches_current_account:true,
      lifecycle_persistence_verified_this_session:true,
    },
    observedAt:'2026-10-02T22:15:00.000Z',
    ...overrides,
  });
}

function packageRecord(){
  const record=JSON.parse(JSON.stringify(createFieldCertificationPackage(sha,{now:()=>new Date('2026-10-02T21:45:00.000Z')})));
  record.references={
    exactRcAutomatedGate:'rc-gate-run-12345',
    builtBrowserPush:'phase1-run-23456',
    assignmentDueBackend:'issue-1029-due-delivery-evidence',
    assignmentAssignedDurableNotification:'assigned-notification-evidence-34567',
    assignmentAssignedDispatchLedger:'assigned-dispatch-ledger-evidence-45678',
    assignmentCleanup:'field-cleanup-record-56789',
    screenshotVideo:['sanitized-field-video-reference-1'],
  };
  return record;
}

test('field package composes existing physical exports without requiring duplicate P3 due testing',()=>{
  const result=validateFieldCertificationPackageData({
    packageRecord:packageRecord(),
    fieldDeviceRecord:fieldRecord(),
    pushDeviceRecord:pushRecord(),
    expectedCandidateSha:sha,
    profile:'field',
  });
  assert.equal(result.candidateSha,sha);
  assert.equal(result.observedBuildSha,sha);
  assert.equal(result.evidence.physicalInstalledPwaOffline,true);
  assert.equal(result.evidence.criticalManualAccessibility,true);
  assert.equal(result.evidence.backgroundLockscreenMedia,true);
  assert.equal(result.evidence.physicalDevicePush,true);
  assert.equal(result.evidence.assignmentAssignedDueCompositeReadyForReview,true);
  assert.equal(result.postProductionComplete,false);
});

test('field package fails closed on a different candidate SHA or incomplete physical evidence',()=>{
  assert.throws(()=>validateFieldCertificationPackageData({
    packageRecord:packageRecord(),
    fieldDeviceRecord:fieldRecord(),
    pushDeviceRecord:pushRecord(),
    expectedCandidateSha:'b'.repeat(40),
    profile:'field',
  }),/expected release-candidate SHA/);

  const incompletePush=pushRecord({
    gates:[
      gate(PUSH_FIELD_GATE_STEPS,'p1'),
      gate(PUSH_FIELD_GATE_STEPS,'p2','PENDING'),
      gate(PUSH_FIELD_GATE_STEPS,'p3','PENDING'),
    ],
  });
  assert.throws(()=>validateFieldCertificationPackageData({
    packageRecord:packageRecord(),
    fieldDeviceRecord:fieldRecord(),
    pushDeviceRecord:incompletePush,
    expectedCandidateSha:sha,
    profile:'field',
  }),/P1\/P2 physical push evidence/);
});

test('field package rejects missing supporting references and automation-only physical references',()=>{
  const missing=packageRecord();
  missing.references.assignmentAssignedDispatchLedger='PENDING';
  assert.throws(()=>validateFieldCertificationPackageData({
    packageRecord:missing,
    fieldDeviceRecord:fieldRecord(),
    pushDeviceRecord:pushRecord(),
    expectedCandidateSha:sha,
    profile:'field',
  }),/dispatch\/ledger reference is required/);

  assert.throws(()=>validateFieldCertificationPackageData({
    packageRecord:packageRecord(),
    fieldDeviceRecord:fieldRecord({
      metadata:{
        tester:'QA operator',
        deviceOsBrowser:'Pixel 9 / Android 16 / Chrome 141 installed PWA',
        environment:'immutable Cloudflare preview',
        durableEvidenceReference:'Playwright headless workflow only',
      },
    }),
    pushDeviceRecord:pushRecord(),
    expectedCandidateSha:sha,
    profile:'field',
  }),/cannot be represented only by automated\/headless evidence/);
});

test('final profile requires the bounded post-production human checklist',()=>{
  const pending=packageRecord();
  assert.throws(()=>validateFieldCertificationPackageData({
    packageRecord:pending,
    fieldDeviceRecord:fieldRecord(),
    pushDeviceRecord:pushRecord(),
    expectedCandidateSha:sha,
    profile:'final',
  }),/every post-production observation to PASS/);

  const complete=packageRecord();
  complete.postProduction.productionPromotionReference='production-promotion-record-67890';
  complete.postProduction.evidenceReference='post-production-field-record-78901';
  complete.postProduction.observations=complete.postProduction.observations.map(observation=>({
    ...observation,
    status:'PASS',
    notes:'Observed against the exact certified production candidate.',
  }));
  const result=validateFieldCertificationPackageData({
    packageRecord:complete,
    fieldDeviceRecord:fieldRecord(),
    pushDeviceRecord:pushRecord(),
    expectedCandidateSha:sha,
    profile:'final',
  });
  assert.equal(result.postProductionComplete,true);
  assert.equal(result.postProduction.length,10);
});
