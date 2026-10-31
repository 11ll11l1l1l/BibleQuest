import test from 'node:test';
import assert from 'node:assert/strict';
import { createPracticeVoice } from '../../src/features/spiritual-practices/voice.js';

function fixture() {
  const utterances = [], canceled = [], errors = [];
  let last = null;
  const synth = {
    getVoices: () => [{lang: 'fil-PH', name: 'Filipino'}],
    speak: utterance => { last = utterance; utterances.push(utterance); },
    cancel: () => { if (last) { canceled.push(last); last.onerror?.({ error: 'canceled' }); } last = null; },
  };
  const voice = createPracticeVoice({getSynth: () => synth, createUtterance: text => ({text})});
  return {voice, synth, utterances, canceled, errors};
}
test('device narration is opt-in, reads reviewed stage only and chooses supported voice', () => {
  const f = fixture();
  assert.equal(f.voice.read({title:'Prepare',guide:'Be still.'}),false);
  assert.equal(f.utterances.length,0);
  assert.equal(f.voice.enable(),true);
  assert.equal(f.voice.read({title:'Prepare',guide:'Be still.'},'tl',()=>f.errors.push('error')),true);
  assert.equal(f.utterances.length,1);
  assert.equal(f.utterances[0].text,'Prepare. Be still.');
  assert.equal(f.utterances[0].lang,'fil-PH');
  assert.equal(f.utterances[0].voice.name,'Filipino');
  assert.equal(f.utterances[0].volume,1);
  assert.equal(f.utterances[0].rate,0.9);
  f.voice.read({title:'Stillness',guide:'Return to the passage.'},'en');
  assert.equal(f.utterances.at(-1).lang,'en-US');
  assert.equal(f.errors.length,0,'canceled utterances are not reported as failures');
  assert.equal(f.canceled.length,1);
  f.voice.disable();
  assert.equal(f.voice.read({title:'Blocked',guide:'Never speak without consent.'}),false);
  assert.equal(f.utterances.length,2);
});
test('stale events do not report failures after stop, disable, or disposal', () => {
  const f=fixture();f.voice.enable();
  f.voice.read({title:'T',guide:'G'},'ceb',()=>f.errors.push('first'));
  const old=f.utterances.at(-1);
  assert.equal(old.lang,'ceb-PH');
  f.voice.read({title:'Next',guide:'G'},'ceb',()=>f.errors.push('second'));
  old.onerror({error:'network'});
  assert.deepEqual(f.errors,[]);
  f.utterances.at(-1).onerror({error:'network'});
  assert.deepEqual(f.errors,['second']);
  f.voice.dispose();
  assert.equal(f.voice.isEnabled(),false);
  assert.equal(f.voice.read({title:'No',guide:'No'}),false);
});
test('unsupported speech and browser exceptions fail explicitly without synthetic audio', () => {
  const absent=createPracticeVoice({getSynth:()=>null,createUtterance:text=>({text})});
  assert.equal(absent.enable(),false);
  assert.equal(absent.read({title:'T',guide:'G'}),false);
  const broken=createPracticeVoice({getSynth:()=>({speak(){throw new Error('device unavailable')},cancel(){}}),createUtterance:text=>({text})});
  assert.equal(broken.enable(),true);
  assert.equal(broken.read({title:'T',guide:'G'}),false);
  broken.dispose();
});
