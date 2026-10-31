// Opt-in foreground transition tone. No audio file, autoplay or queued cue replay.
export function createPracticeCue({ createContext = () => { const Context = globalThis.AudioContext || globalThis.webkitAudioContext; if (!Context) throw new Error('Transition sound is unavailable in this browser.'); return new Context(); } } = {}) {
  let context = null, enabled = false, generation = 0, oscillator = null;
  function stop() { try { oscillator?.stop(); } catch {} oscillator = null; }
  function disable() { generation++; enabled = false; stop(); }
  async function enable() {
    const token = ++generation;
    context ||= createContext();
    await context.resume();
    if (token !== generation) return false;
    enabled = true;
    return true;
  }
  function play() {
    if (!enabled || context?.state !== 'running') return false;
    stop();
    const tone = context.createOscillator(), gain = context.createGain(), now = context.currentTime;
    tone.type = 'sine'; tone.frequency.setValueAtTime(440, now);
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.035, now + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    tone.connect(gain); gain.connect(context.destination); tone.start(now); tone.stop(now + 0.5); oscillator = tone;
    tone.onended = () => { tone.disconnect(); gain.disconnect(); if (oscillator === tone) oscillator = null; };
    return true;
  }
  function dispose() { disable(); const previous = context; context = null; void previous?.close()?.catch?.(() => {}); }
  return Object.freeze({ enable, disable, stop, play, dispose, isEnabled: () => enabled });
}
