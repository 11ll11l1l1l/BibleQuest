import {
  assertDeclaredEligibility,
  normalizePhysicalGateSet,
  requireApprovedBibleQuestOrigin,
  requireEvidenceMetadata,
  requireEvidenceTimestamp,
  requireExactCandidateSha,
  requireJstEvidenceDate,
} from './physical-device-evidence.js';

export const FIELD_DEVICE_GATE_STEPS = Object.freeze({
  'installed-pwa':Object.freeze(['installed','warm','offline-launch','offline-home','offline-reader','restart']),
  'keyboard-focus':Object.freeze(['sequence','activation','return']),
  'screen-reader':Object.freeze(['labels','headings','updates']),
  'text-scaling':Object.freeze(['scale','reflow']),
  'touch-overflow':Object.freeze(['targets','orientation','safe-area']),
  'motion-contrast':Object.freeze(['motion','contrast']),
  'background-media':Object.freeze(['background-playback','metadata','play-pause','seek','chapter-nav','resume']),
});
export const MANUAL_ACCESSIBILITY_GATE_IDS = Object.freeze(['keyboard-focus','screen-reader','text-scaling','touch-overflow','motion-contrast']);
const DISPLAY_MODES=Object.freeze(['standalone','ios-standalone','browser-tab']);

export function buildFieldDeviceEvidence({candidateSha,metadata,gates,evidenceDateJst,observedAt=new Date().toISOString(),origin,installedDisplayMode,networkOnlineAtExport=false}={}) {
  const sha=requireExactCandidateSha(candidateSha,'Field/device evidence');
  const normalizedMetadata=requireEvidenceMetadata(metadata,'Field/device evidence');
  const normalizedGates=normalizePhysicalGateSet(gates,FIELD_DEVICE_GATE_STEPS,'Field/device evidence');
  const approvedOrigin=requireApprovedBibleQuestOrigin(origin);
  const mode=String(installedDisplayMode||'').trim();
  if(!DISPLAY_MODES.includes(mode)) throw new Error('Field/device evidence has an invalid installed display mode.');
  const gateStatus=Object.fromEntries(normalizedGates.map(gate=>[gate.id,gate.status]));
  if(gateStatus['installed-pwa']==='PASS'&&mode==='browser-tab') {
    throw new Error('Installed-PWA PASS requires standalone or iOS standalone display mode.');
  }
  const physicalInstalledPwaOffline=gateStatus['installed-pwa']==='PASS';
  const criticalManualAccessibility=MANUAL_ACCESSIBILITY_GATE_IDS.every(id=>gateStatus[id]==='PASS');
  const backgroundLockscreenMedia=gateStatus['background-media']==='PASS';
  return Object.freeze({
    schemaVersion:1,evidenceClass:'PHYSICAL-DEVICE',evidenceType:'PWA-A11Y-MEDIA',candidateSha:sha,
    evidenceDateJst:requireJstEvidenceDate(evidenceDateJst),observedAt:requireEvidenceTimestamp(observedAt),
    ...normalizedMetadata,origin:approvedOrigin,installedDisplayMode:mode,networkOnlineAtExport:networkOnlineAtExport===true,
    gates:normalizedGates,
    checklistEligibility:Object.freeze({
      physicalInstalledPwaOffline,criticalManualAccessibility,backgroundLockscreenMedia,
      aggregateFieldDeviceStillRequiresPhysicalPushEvidence:true,
    }),
  });
}

export function validateFieldDeviceEvidence(record,expectedCandidateSha) {
  if(!record||typeof record!=='object'||Array.isArray(record)) throw new Error('Field/device evidence must be a JSON object.');
  if(record.schemaVersion!==1) throw new Error('Field/device evidence schemaVersion must be 1.');
  if(record.evidenceClass!=='PHYSICAL-DEVICE') throw new Error('Field/device evidence class must be PHYSICAL-DEVICE.');
  if(record.evidenceType!=null&&record.evidenceType!=='PWA-A11Y-MEDIA') throw new Error('Field/device evidence type must be PWA-A11Y-MEDIA.');
  const rebuilt=buildFieldDeviceEvidence({
    candidateSha:record.candidateSha,
    metadata:{tester:record.tester,deviceOsBrowser:record.deviceOsBrowser,environment:record.environment,durableEvidenceReference:record.durableEvidenceReference},
    gates:record.gates,evidenceDateJst:record.evidenceDateJst,observedAt:record.observedAt,origin:record.origin,
    installedDisplayMode:record.installedDisplayMode,networkOnlineAtExport:record.networkOnlineAtExport,
  });
  if(expectedCandidateSha&&rebuilt.candidateSha!==requireExactCandidateSha(expectedCandidateSha,'Expected release candidate')) {
    throw new Error('Field/device evidence does not match the expected release-candidate SHA.');
  }
  const declared=record.checklistEligibility||{};
  assertDeclaredEligibility(declared,'physicalInstalledPwaOffline',rebuilt.checklistEligibility.physicalInstalledPwaOffline,'installed-PWA');
  assertDeclaredEligibility(declared,'criticalManualAccessibility',rebuilt.checklistEligibility.criticalManualAccessibility,'manual-accessibility');
  assertDeclaredEligibility(declared,'backgroundLockscreenMedia',rebuilt.checklistEligibility.backgroundLockscreenMedia,'background-media');
  assertDeclaredEligibility(declared,'aggregateFieldDeviceStillRequiresPhysicalPushEvidence',true,'aggregate field/device external dependency');
  return rebuilt;
}
