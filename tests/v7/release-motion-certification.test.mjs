import test from 'node:test';
import assert from 'node:assert/strict';
import { REQUIRED_MOTION_WIDTHS, REQUIRED_MOTION_PREFERENCES, REQUIRED_LIBRARY_DECK_KINDS, REQUIRED_SCREENSHOTS,
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
  const deckObservations = REQUIRED_MOTION_PREFERENCES.flatMap(reducedMotion =>
    REQUIRED_LIBRARY_DECK_KINDS.map(kind => ({
      width:390,locale:'en',reducedMotion,kind,firstId:'first-'+kind,secondId:'second-'+kind,
      activeAfterNext:'second-'+kind,activeAfterHome:'first-'+kind,
      transitionMs:reducedMotion==='reduce'?0:280,
      selectedUnchanged:true,keyboardFocusRestored:true,scrollable:true,noOverflow:true,
    })));
  for (const row of deckObservations)
    checks.push('390/' + row.reducedMotion + '/en:built-library-' + row.kind + '-deck-motion-and-focus');
  return {schemaVersion:1,result:'PASS',candidateSha:sha,testedWidths:[...REQUIRED_MOTION_WIDTHS],
    testedMotion:[...REQUIRED_MOTION_PREFERENCES],testedLocales:['en','tl','ceb'],
    capturedStates:['rest','interacting','settled','reduced-motion'],
    checks,observations,deckObservations,screenshots:[...REQUIRED_SCREENSHOTS]};
}
test('motion gate seals exact-SHA browser actions, 3 supported locales and six proof screenshots',()=>{
  const result=validateV7MotionEvidence(fixture(),sha);
  assert.equal(result.result,'PASS');
  assert.equal(result.verifiedCombinations,8);
  assert.equal(result.verifiedLibraryDeckCombinations,4);
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

test('built Library Feeling and Need motion is required in both settings',()=>{
  const missing=fixture();
  missing.deckObservations.pop();
  assert.throws(()=>validateV7MotionEvidence(missing,sha),/missing exact built Library deck motion/);
  const duplicate=fixture();
  duplicate.deckObservations.push({...duplicate.deckObservations[0]});
  assert.throws(()=>validateV7MotionEvidence(duplicate,sha),/missing exact built Library deck motion|unexpected or duplicated/);
  const falseSettle=fixture();
  falseSettle.deckObservations[0].activeAfterNext='first-emotion';
  assert.throws(()=>validateV7MotionEvidence(falseSettle,sha),/Next did not settle/);
  const skipFocus=fixture();
  skipFocus.deckObservations[0].keyboardFocusRestored=false;
  assert.throws(()=>validateV7MotionEvidence(skipFocus,sha),/keyboardFocusRestored/);
  const animatedReduce=fixture();
  animatedReduce.deckObservations.find(row=>row.reducedMotion==='reduce').transitionMs=280;
  assert.throws(()=>validateV7MotionEvidence(animatedReduce,sha),/reduced-motion animation/);
  const staticNormal=fixture();
  staticNormal.deckObservations[0].transitionMs=0;
  assert.throws(()=>validateV7MotionEvidence(staticNormal,sha),/normal deck transition/);
});
