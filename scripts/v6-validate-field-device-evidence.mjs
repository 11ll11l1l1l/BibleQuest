import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SHA = /^[0-9a-f]{40}$/i;
const APPROVED_HOSTS = Object.freeze(['mybiblequest.pages.dev', 'biblequest-7th.pages.dev']);
export const FIELD_DEVICE_GATE_STEPS = Object.freeze({
  'installed-pwa': Object.freeze(['installed','warm','offline-launch','offline-home','offline-reader','restart']),
  'keyboard-focus': Object.freeze(['sequence','activation','return']),
  'screen-reader': Object.freeze(['labels','headings','updates']),
  'text-scaling': Object.freeze(['scale','reflow']),
  'touch-overflow': Object.freeze(['targets','orientation','safe-area']),
  'motion-contrast': Object.freeze(['motion','contrast']),
  'background-media': Object.freeze(['background-playback','metadata','play-pause','seek','chapter-nav','resume']),
});
export const MANUAL_A11Y_GATES = Object.freeze([
  'keyboard-focus','screen-reader','text-scaling','touch-overflow','motion-contrast',
]);
export const FIELD_DEVICE_PROFILES = Object.freeze([
  'installed-pwa','manual-accessibility','background-media','full-nonpush',
]);

const SENSITIVE = Object.freeze([
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i,
  /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/,
  /\bsb_secret_[A-Za-z0-9_-]+\b/i,
  /\bservice_role\b/i,
  /\bp256dh\b/i,
  /\b(?:password|endpoint|auth(?:entication)?\s*token)\s*[:=]/i,
]);

function txt(v){ return String(v ?? '').trim(); }
function exactSha(v){
  const s=txt(v).toLowerCase();
  if(!SHA.test(s)) throw new Error('Field/device evidence requires an exact 40-character candidate SHA.');
  return s;
}
function safe(v,label){
  const s=txt(v);
  if(SENSITIVE.some(re=>re.test(s))) throw new Error(label+' contains account, credential, endpoint, key, or token material.');
  return s;
}
function approvedOrigin(v){
  let u;
  try { u=new URL(txt(v)); } catch { throw new Error('Field/device evidence origin must be a valid HTTPS URL.'); }
  if(u.protocol!=='https:' || !APPROVED_HOSTS.some(s=>u.hostname===s || u.hostname.endsWith('.'+s))){
    throw new Error('Field/device evidence origin is not an approved deployed BibleQuest HTTPS host.');
  }
  return u.origin;
}
function gateMap(record){
  if(!Array.isArray(record?.gates)) throw new Error('Field/device evidence gates must be an array.');
  const out=new Map();
  for(const gate of record.gates){
    const id=txt(gate?.id);
    const expected=FIELD_DEVICE_GATE_STEPS[id];
    if(!expected || out.has(id)) throw new Error('Field/device evidence has an unknown or duplicate gate: '+(id||'missing')+'.');
    const status=txt(gate?.status).toUpperCase();
    if(!['PENDING','PASS','FAIL'].includes(status)) throw new Error(id+' has an invalid status.');
    const notes=safe(gate?.notes,id+' observation');
    const steps=Array.isArray(gate?.steps)?gate.steps:[];
    const seen=new Map();
    for(const step of steps){
      const sid=txt(step?.id);
      if(!expected.includes(sid)||seen.has(sid)) throw new Error(id+' has an invalid or duplicate physical sub-step.');
      seen.set(sid,step?.checked===true);
    }
    const normalized=expected.map(sid=>Object.freeze({id:sid,checked:seen.get(sid)===true}));
    if(status==='PASS'){
      if(normalized.some(x=>!x.checked)) throw new Error(id+' PASS requires every physical sub-check.');
      if(notes.length<12) throw new Error(id+' PASS requires a concrete physical observation.');
    }
    out.set(id,Object.freeze({id,status,notes,steps:Object.freeze(normalized)}));
  }
  for(const id of Object.keys(FIELD_DEVICE_GATE_STEPS)){
    if(!out.has(id)) throw new Error('Field/device evidence is missing gate '+id+'.');
  }
  return out;
}

export function validateFieldDeviceEvidence(record, expectedCandidateSha){
  if(!record || typeof record!=='object' || Array.isArray(record)) throw new Error('Field/device evidence must be a JSON object.');
  if(record.schemaVersion!==1) throw new Error('Field/device evidence schemaVersion must be 1.');
  if(record.evidenceClass!=='PHYSICAL-DEVICE') throw new Error('Field/device evidence class must be PHYSICAL-DEVICE.');
  const candidateSha=exactSha(record.candidateSha);
  if(expectedCandidateSha && candidateSha!==exactSha(expectedCandidateSha)) throw new Error('Field/device evidence does not match the expected release-candidate SHA.');
  const tester=safe(record.tester,'Tester');
  const deviceOsBrowser=safe(record.deviceOsBrowser,'Device metadata');
  const environment=safe(record.environment,'Environment metadata');
  const durableEvidenceReference=safe(record.durableEvidenceReference,'Evidence reference');
  if(!tester||!deviceOsBrowser||!environment||!durableEvidenceReference) throw new Error('Field/device evidence metadata is incomplete.');
  const origin=approvedOrigin(record.origin);
  const mode=txt(record.installedDisplayMode);
  if(!['standalone','ios-standalone','browser-tab'].includes(mode)) throw new Error('Field/device evidence has an invalid installed display mode.');
  const gates=gateMap(record);
  const installedPwa=gates.get('installed-pwa').status==='PASS' && mode!=='browser-tab';
  const manualAccessibility=MANUAL_A11Y_GATES.every(id=>gates.get(id).status==='PASS');
  const backgroundMedia=gates.get('background-media').status==='PASS';
  const declared=record.checklistEligibility || {};
  if(Boolean(declared.physicalInstalledPwaOffline)!==installedPwa) throw new Error('Declared installed-PWA eligibility does not match physical evidence.');
  if(Boolean(declared.criticalManualAccessibility)!==manualAccessibility) throw new Error('Declared manual-accessibility eligibility does not match physical evidence.');
  if(Boolean(declared.backgroundLockscreenMedia)!==backgroundMedia) throw new Error('Declared background-media eligibility does not match physical evidence.');
  return Object.freeze({
    schemaVersion:1,evidenceClass:'PHYSICAL-DEVICE',candidateSha,
    evidenceDateJst:safe(record.evidenceDateJst,'Evidence date'),
    observedAt:safe(record.observedAt,'Observed timestamp'),
    tester,deviceOsBrowser,environment,durableEvidenceReference,origin,
    installedDisplayMode:mode,
    networkOnlineAtExport:record.networkOnlineAtExport===true,
    gates:Object.freeze([...gates.values()]),
    checklistEligibility:Object.freeze({
      physicalInstalledPwaOffline:installedPwa,
      criticalManualAccessibility:manualAccessibility,
      backgroundLockscreenMedia:backgroundMedia,
      aggregateFieldDeviceStillRequiresPhysicalPushEvidence:true,
    }),
  });
}

export function evaluateFieldDeviceProfile(record, profile='full-nonpush'){
  const p=txt(profile).toLowerCase();
  if(!FIELD_DEVICE_PROFILES.includes(p)) throw new Error('Unknown field/device evidence profile: '+p+'.');
  const e=record.checklistEligibility || {};
  const pwa=e.physicalInstalledPwaOffline===true;
  const a11y=e.criticalManualAccessibility===true;
  const media=e.backgroundLockscreenMedia===true;
  const satisfied=p==='installed-pwa'?pwa:p==='manual-accessibility'?a11y:p==='background-media'?media:pwa&&a11y&&media;
  return Object.freeze({profile:p,satisfied,physicalInstalledPwaOffline:pwa,criticalManualAccessibility:a11y,backgroundLockscreenMedia:media,aggregateFieldDeviceStillRequiresPhysicalPushEvidence:true});
}

async function main(argv){
  if(argv.length<2||argv.length>3) throw new Error('Usage: node scripts/v6-validate-field-device-evidence.mjs <evidence.json> <expected-candidate-sha> [installed-pwa|manual-accessibility|background-media|full-nonpush]');
  const raw=JSON.parse(await readFile(resolve(argv[0]),'utf8'));
  const validated=validateFieldDeviceEvidence(raw,argv[1]);
  const result=evaluateFieldDeviceProfile(validated,argv[2]||'full-nonpush');
  process.stdout.write(JSON.stringify({schemaVersion:1,candidateSha:validated.candidateSha,...result},null,2)+'\n');
  if(!result.satisfied) process.exitCode=3;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main(process.argv.slice(2)).catch(error=>{console.error(error?.stack||error);process.exitCode=1;});
}
