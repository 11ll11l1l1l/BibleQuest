const BASIC_PROGRESS_EVENT = 'transform:spiritual:v1:complete';
const FULL_PROGRESS_EVENT = 'transform:full:v1:complete';

export function createTransformService({ engine, progress, personalityProfile = null }) {
  if (!engine || !progress) throw new Error('Transform service requires Transform engine and progress owners.');

  function reconcileBasic(state = engine.getState()) {
    if (!state.spiritual.result) return null;
    return progress.record({
      id: BASIC_PROGRESS_EVENT,
      type: 'transform.spiritual.complete',
      xp: 20,
      meaningful: true,
      metrics: { reflections: 1 }
    });
  }

  function reconcileFull(state = engine.getState()) {
    if (!state.personality.result || !state.bias.result) return null;
    return progress.record({
      id: FULL_PROGRESS_EVENT,
      type: 'transform.full.complete',
      xp: 35,
      meaningful: true,
      metrics: { reflections: 1, assessments: 1 }
    });
  }

  function openBasic() {
    const state = engine.getState();
    const progressResult = reconcileBasic(state);
    return Object.freeze({ state, progressResult });
  }

  function openFull() {
    const state = engine.getState();
    const progressResult = reconcileFull(state);
    return Object.freeze({ state, progressResult, recommendations: engine.recommendations() });
  }

  function setSpiritualAnswer(id, value) {
    return engine.setSpiritualAnswer(id, value);
  }

  function completeBasicAssessment() {
    const state = engine.calculateSpiritual();
    const progressResult = reconcileBasic(state);
    return Object.freeze({ state, progressResult });
  }

  function setPersonalityAnswer(id, value) {
    return engine.setPersonalityAnswer(id, value);
  }

  function completePersonalityAssessment() {
    const state = engine.calculatePersonality();
    let profileSaved = false;
    let profileError = '';
    if (personalityProfile?.capture && state.personality.result) {
      try { personalityProfile.capture(state.personality.result); profileSaved = true; }
      catch (error) { profileError = error?.message || 'Private personality profile could not be saved.'; }
    }
    const progressResult = reconcileFull(state);
    return Object.freeze({ state, progressResult, recommendations: engine.recommendations(), profileSaved, profileError });
  }

  function setBiasAnswer(id, value) {
    return engine.setBiasAnswer(id, value);
  }

  function completeBiasAssessment() {
    const state = engine.calculateBias();
    const progressResult = reconcileFull(state);
    return Object.freeze({ state, progressResult, recommendations: engine.recommendations() });
  }

  function saveReflection(input) {
    const output = engine.saveReflection(input);
    return Object.freeze({ ...output, recommendations: engine.recommendations() });
  }

  function resetSpiritual() {
    return engine.resetSpiritual();
  }

  function resetPersonality() {
    const state = engine.resetPersonality();
    personalityProfile?.clear?.();
    return state;
  }

  function resetBias() {
    return engine.resetBias();
  }

  function resetReflection() {
    return engine.resetReflection();
  }

  return Object.freeze({
    openBasic,
    openFull,
    getState: engine.getState,
    setSpiritualAnswer,
    completeBasicAssessment,
    setPersonalityAnswer,
    completePersonalityAssessment,
    setBiasAnswer,
    completeBiasAssessment,
    saveReflection,
    recommendations: engine.recommendations,
    resetSpiritual,
    resetPersonality,
    resetBias,
    resetReflection,
    definitions: engine.definitions,
    basicProgressEvent: BASIC_PROGRESS_EVENT,
    fullProgressEvent: FULL_PROGRESS_EVENT
  });
}