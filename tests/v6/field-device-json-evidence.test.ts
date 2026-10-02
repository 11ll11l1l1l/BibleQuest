import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FIELD_DEVICE_GATE_STEPS,
  MANUAL_A11Y_GATES,
  validateFieldDeviceEvidence,
  evaluateFieldDeviceProfile,
} from '../../scripts/v6-validate-field-device-evidence.mjs';

const sha='a'.repeat(40);

function gate(id,status='PASS'){
  return {
    id,
    label:id,
    status,
    notes: status==='PASS' ? 'Observed on the physical QA device.' : '',
    steps: FIELD_DEVICE_GATE_STEPS[id].map(step=>({id:step,checked:status==='PASS'})),
  };
}
function record(overrides={}){
  const gates=Object.keys(FIELD_DEVICE_GATE_STEPS).map(id=>gate(id));
  return {
    schemaVersion:1,
    evidenceClass:'PHYSICAL-DEVICE',
    candidateSha:sha,
    evidenceDateJst:'2026-10-02',
    observedAt:'2026-10-02T14:00:00.000Z',
    tester:'QA operator',
    deviceOsBrowser:'Android device / Chrome',
    environment:'immutable Cloudflare preview',
    durableEvidenceReference:'issue-452-field-run',
    origin:'https://abc.mybiblequest.pages.dev',
    installedDisplayMode:'standalone',
    networkOnlineAtExport:false,
    gates,
    checklistEligibility:{
      physicalInstalledPwaOffline:true,
      criticalManualAccessibility:true,
      backgroundLockscreenMedia:true,
    },
    ...overrides,
  };
}

test('validates all non-push physical rows against one exact candidate SHA',()=>{
  const e=validateFieldDeviceEvidence(record(),sha);
  assert.equal(e.candidateSha,sha);
  assert.equal(e.checklistEligibility.physicalInstalledPwaOffline,true);
  assert.equal(e.checklistEligibility.criticalManualAccessibility,true);
  assert.equal(e.checklistEligibility.backgroundLockscreenMedia,true);
  assert.equal(e.checklistEligibility.aggregateFieldDeviceStillRequiresPhysicalPushEvidence,true);
  for(const p of ['installed-pwa','manual-accessibility','background-media','full-nonpush']){
    assert.equal(evaluateFieldDeviceProfile(e,p).satisfied,true);
  }
});

test('installed-PWA profile requires an actual installed display mode',()=>{
  const r=record({installedDisplayMode:'browser-tab'});
  assert.throws(()=>validateFieldDeviceEvidence(r,sha),/Declared installed-PWA eligibility/);
  r.checklistEligibility={...r.checklistEligibility,physicalInstalledPwaOffline:false};
  const e=validateFieldDeviceEvidence(r,sha);
  assert.equal(evaluateFieldDeviceProfile(e,'installed-pwa').satisfied,false);
});

test('manual accessibility requires every physical accessibility gate',()=>{
  const r=record();
  r.gates=r.gates.map(g=>g.id==='screen-reader'?gate('screen-reader','PENDING'):g);
  r.checklistEligibility={...r.checklistEligibility,criticalManualAccessibility:false};
  const e=validateFieldDeviceEvidence(r,sha);
  assert.equal(evaluateFieldDeviceProfile(e,'manual-accessibility').satisfied,false);
  assert.ok(MANUAL_A11Y_GATES.includes('screen-reader'));
});

test('background-media is independent from PWA and manual accessibility',()=>{
  const r=record();
  r.gates=r.gates.map(g=>g.id==='background-media'?gate('background-media','PENDING'):g);
  r.checklistEligibility={...r.checklistEligibility,backgroundLockscreenMedia:false};
  const e=validateFieldDeviceEvidence(r,sha);
  assert.equal(evaluateFieldDeviceProfile(e,'installed-pwa').satisfied,true);
  assert.equal(evaluateFieldDeviceProfile(e,'manual-accessibility').satisfied,true);
  assert.equal(evaluateFieldDeviceProfile(e,'background-media').satisfied,false);
  assert.equal(evaluateFieldDeviceProfile(e,'full-nonpush').satisfied,false);
});

test('PASS fails closed on unchecked physical sub-steps or missing observations',()=>{
  const r=record();
  r.gates[0].steps[0].checked=false;
  assert.throws(()=>validateFieldDeviceEvidence(r,sha),/PASS requires every physical sub-check/);

  const r2=record();
  r2.gates[1].notes='short';
  assert.throws(()=>validateFieldDeviceEvidence(r2,sha),/PASS requires a concrete physical observation/);
});

test('validator rejects wrong SHA, unapproved origin, and inconsistent declared eligibility',()=>{
  assert.throws(()=>validateFieldDeviceEvidence(record(),'b'.repeat(40)),/expected release-candidate SHA/);
  assert.throws(()=>validateFieldDeviceEvidence(record({origin:'https://attacker.example'}),sha),/not an approved deployed BibleQuest/);
  const r=record();
  r.checklistEligibility={...r.checklistEligibility,backgroundLockscreenMedia:false};
  assert.throws(()=>validateFieldDeviceEvidence(r,sha),/Declared background-media eligibility/);
});

test('validator rejects obvious account identifiers and credential material',()=>{
  assert.throws(()=>validateFieldDeviceEvidence(record({tester:'qa@example.com'}),sha),/account, credential, endpoint, key, or token material/);
  const r=record();
  r.gates[2].notes='Observed for 11111111-1111-4111-8111-111111111111.';
  assert.throws(()=>validateFieldDeviceEvidence(r,sha),/account, credential, endpoint, key, or token material/);
});

test('unknown profiles fail closed and full-nonpush never claims physical push evidence',()=>{
  const e=validateFieldDeviceEvidence(record(),sha);
  assert.throws(()=>evaluateFieldDeviceProfile(e,'all'),/Unknown field\/device evidence profile/);
  const full=evaluateFieldDeviceProfile(e,'full-nonpush');
  assert.equal(full.aggregateFieldDeviceStillRequiresPhysicalPushEvidence,true);
});
