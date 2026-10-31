// Foreground, opt-in device speech. Only the published practice stage title and
// guide reach the device TTS engine. Never send Scripture, journal, answers,
// account details or notes to speech or to an external narration provider.
const LANGUAGE = Object.freeze({ en: 'en-US', tl: 'fil-PH', ceb: 'ceb-PH' });

const defaultUtterance = text => new globalThis.SpeechSynthesisUtterance(text);
export function createPracticeVoice({
  getSynth = () => globalThis.speechSynthesis,
  createUtterance = defaultUtterance,
} = {}) {
  let enabled = false, generation = 0, active = null;
  const available = () => {
    const synth = getSynth();
    return Boolean(synth && typeof synth.speak === 'function'
      && typeof synth.cancel === 'function'
      && (typeof globalThis.SpeechSynthesisUtterance === 'function'
        || createUtterance !== defaultUtterance));
  };
  function stop() {
    generation += 1;
    active = null;
    try { getSynth()?.cancel?.(); } catch { /* Some browsers lose TTS on hide. */ }
  }
  function disable() { enabled = false; stop(); }
  function enable() {
    if (!available()) return false;
    enabled = true;
    return true;
  }
  function read(stage, locale = 'en', onError = () => {}) {
    if (!enabled || !available() || !stage
        || typeof stage.title !== 'string' || typeof stage.guide !== 'string') return false;
    // Cancel stale narration before speaking. Do not queue stages after a
    // delayed/reloaded session; only the current foreground stage matters.
    stop();
    const token = generation;
    const synth = getSynth();
    const spoken = `${stage.title.slice(0, 150)}. ${stage.guide.slice(0, 3000)}`;
    try {
      const utterance = createUtterance(spoken);
      utterance.lang = LANGUAGE[locale] || LANGUAGE.en;
      utterance.volume = 1;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      const voices = typeof synth.getVoices === 'function' ? synth.getVoices() : [];
      const prefix = utterance.lang.split('-')[0].toLowerCase();
      const match = Array.isArray(voices) ? voices.find(voice =>
        typeof voice.lang === 'string' && voice.lang.toLowerCase().split('-')[0] === prefix) : null;
      if (match) utterance.voice = match;
      utterance.onerror = event => {
        if (token !== generation || active !== utterance) return;
        active = null;
        if (!['canceled', 'interrupted'].includes(event?.error)) onError();
      };
      utterance.onend = () => { if (token === generation) active = null; };
      active = utterance;
      synth.speak(utterance);
      return true;
    } catch {
      if (token === generation) active = null;
      return false;
    }
  }
  function dispose() { disable(); }
  return Object.freeze({ available, enable, disable, stop, read, dispose, isEnabled: () => enabled });
}
