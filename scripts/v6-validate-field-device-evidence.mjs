import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateFieldDeviceEvidence } from '../src/v6/field-device-evidence.js';

export const FIELD_DEVICE_PROFILES = Object.freeze([
  'installed-pwa','manual-accessibility','background-media','full-nonpush',
]);

export function evaluateFieldDeviceProfile(record, profile = 'full-nonpush') {
  const p=String(profile||'').trim().toLowerCase();
  if(!FIELD_DEVICE_PROFILES.includes(p)) throw new Error('Unknown field/device evidence profile: '+p+'.');
  const e=record?.checklistEligibility||{};
  const pwa=e.physicalInstalledPwaOffline===true;
  const a11y=e.criticalManualAccessibility===true;
  const media=e.backgroundLockscreenMedia===true;
  const satisfied=p==='installed-pwa'?pwa:p==='manual-accessibility'?a11y:p==='background-media'?media:pwa&&a11y&&media;
  return Object.freeze({
    profile:p,satisfied,physicalInstalledPwaOffline:pwa,criticalManualAccessibility:a11y,
    backgroundLockscreenMedia:media,
    aggregateFieldDeviceStillRequiresPhysicalPushEvidence:e.aggregateFieldDeviceStillRequiresPhysicalPushEvidence===true,
  });
}

async function main(argv){
  if(argv.length<2||argv.length>3) throw new Error('Usage: node scripts/v6-validate-field-device-evidence.mjs <evidence.json> <expected-candidate-sha> [installed-pwa|manual-accessibility|background-media|full-nonpush]');
  const raw=JSON.parse(await readFile(resolve(argv[0]),'utf8'));
  const validated=validateFieldDeviceEvidence(raw,argv[1]);
  const result=evaluateFieldDeviceProfile(validated,argv[2]||'full-nonpush');
  process.stdout.write(JSON.stringify({
    schemaVersion:1,evidenceClass:validated.evidenceClass,evidenceType:validated.evidenceType,
    candidateSha:validated.candidateSha,observedAt:validated.observedAt,...result,
  },null,2)+'\n');
  if(!result.satisfied) process.exitCode=3;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main(process.argv.slice(2)).catch(error=>{console.error(error?.stack||error);process.exitCode=1;});
}
