import test from 'node:test';
import assert from 'node:assert/strict';
import { REQUIRED_MOTION_WIDTHS, REQUIRED_MOTION_PREFERENCES, REQUIRED_SCREENSHOTS,
  validateV7MotionEvidence } from '../../scripts/v7-certify-motion-evidence.mjs';

const sha='a'.repeat(40);
function fixture() {
  const observations=[];
  const checks=[];
  for(const width of REQUIRED_MOTION_WIDTHS)for(const reducedMotion of REQUIRED_MOTION_PREFERENCES){
    const locale=width===390?'tl':width===430?'ceb':'en';
    checks.push(`${width}/${reducedMotion}/${locale}:active-focus-no-overflow-reduced-motion`);
    observations.push({width,reducedMotion,locale,
      layout:{viewport:width,widest:width,navTarget:48,layoutShiftScore:.01,longTasks:0,maxLongTaskMs:0}});
  }
  return {schemaVersion:1,result:'PASS',candidateSha:sha,testedWidths:[...REQUIRED_MOTION_WIDTHS],
    testedMotion:[...REQUIRED_MOTION_PREFERENCES],testedLocales:['en','tl','ceb'],
    capturedStates:['rest','interacting','settled','reduced-motion'],
    checks,observations,screenshots:[...REQUIRED_SCREENSHOTS]};
}
test('motion gate seals exact-SHA browser actions, 3 supported locales and six proof screenshots',()=>{
  const result=validateV7MotionEvidence(fixture(),sha);
  assert.equal(result.result,'PASS');
  assert.equal(result.verifiedCombinations,8);
  assert.equal(result.screenshotCount,6);
  assert.equal(result.measuredMaxCls,.01);
});
test('a missing viewport, reduced-motion state, unsupported shell locale or screenshot fails closed',()=>{
  const mutations=[
    e=>{e.testedWidths.pop();},
    e=>{e.testedMotion.pop();},
    e=>{e.testedLocales.pop();},
    e=>{e.capturedStates.pop();},
    e=>{e.screenshots.pop();},
    e=>{e.screenshots.push('../../bad.png');},
    e=>{e.observations.pop();},
    e=>{e.checks.pop();},
    e=>{e.candidateSha='b'.repeat(40);},
  ];
  for(const mutate of mutations){
    const e=fixture();mutate(e);
    assert.throws(()=>validateV7MotionEvidence(e,sha),/missing|namespace|exact candidate|motion evidence|one measured motion viewport/i);
  }
});
test('non-input layout shifts and unsafe nav targets fail release instead of claiming visual parity',()=>{
  const e=fixture();
  e.observations[0].layout.layoutShiftScore=.4;
  assert.throws(()=>validateV7MotionEvidence(e,sha),/instability/);
  const f=fixture();
  f.observations[1].layout.navTarget=25;
  assert.throws(()=>validateV7MotionEvidence(f,sha),/clipped/);
});
test('missing performance measurement is never certified as a passing recording',()=>{
  const e=fixture();
  delete e.observations[0].layout.maxLongTaskMs;
  assert.throws(()=>validateV7MotionEvidence(e,sha),/measurement/);
});
