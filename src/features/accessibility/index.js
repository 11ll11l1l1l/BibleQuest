export function accessibilityPage({ accessibility, onBack } = {}) {
  if (!accessibility?.subscribe) throw new Error('Accessibility page requires the accessibility service.');
  return {
    title: 'Accessibility',
    html: `<section class="bq-panel bq-accessibility-page" data-accessibility-page>
      <p class="bq-eyebrow">ACCESSIBILITY</p>
      <h1>Accessibility</h1>
      <p>Adjust readability and motion for this device. These preferences use BibleQuest's existing local storage boundary and do not change account or cloud data.</p>
      <button type="button" class="bq-secondary-button" data-accessibility-back>← More</button>
    </section>
    <section class="bq-panel bq-accessibility-controls" aria-labelledby="bq-accessibility-options">
      <h2 id="bq-accessibility-options">Display and motion</h2>
      <label for="bq-accessibility-text">Text size</label>
      <select id="bq-accessibility-text" data-accessibility-setting="text">
        <option value="normal">Normal</option>
        <option value="large">Large</option>
        <option value="xlarge">Extra large</option>
      </select>
      <label for="bq-accessibility-motion">Motion</label>
      <select id="bq-accessibility-motion" data-accessibility-setting="motion">
        <option value="system">Follow device</option>
        <option value="reduce">Reduce motion</option>
        <option value="full">Full motion</option>
      </select>
      <label for="bq-accessibility-contrast">Contrast</label>
      <select id="bq-accessibility-contrast" data-accessibility-setting="contrast">
        <option value="normal">Normal</option>
        <option value="strong">Stronger contrast</option>
      </select>
      <button type="button" class="bq-secondary-button" data-accessibility-reset>Reset accessibility settings</button>
      <p class="bq-accessibility-status" role="status" aria-live="polite" data-accessibility-status></p>
    </section>`,
    mount(root) {
      const text = root.querySelector('[data-accessibility-setting="text"]');
      const motion = root.querySelector('[data-accessibility-setting="motion"]');
      const contrast = root.querySelector('[data-accessibility-setting="contrast"]');
      const back = root.querySelector('[data-accessibility-back]');
      const reset = root.querySelector('[data-accessibility-reset]');
      const status = root.querySelector('[data-accessibility-status]');
      const render = state => {
        if (text) text.value = state.text;
        if (motion) motion.value = state.motion;
        if (contrast) contrast.value = state.contrast;
        if (status) status.textContent = state.motion === 'system'
          ? `Motion follows this device; effective motion is ${state.effectiveMotion === 'reduce' ? 'reduced' : 'full'}.`
          : `Accessibility settings saved on this device. Effective motion is ${state.effectiveMotion === 'reduce' ? 'reduced' : 'full'}.`;
      };
      const setText = () => accessibility.setText(text.value);
      const setMotion = () => accessibility.setMotion(motion.value);
      const setContrast = () => accessibility.setContrast(contrast.value);
      const goBack = () => onBack?.();
      const resetAll = () => accessibility.reset();
      text?.addEventListener('change', setText);
      motion?.addEventListener('change', setMotion);
      contrast?.addEventListener('change', setContrast);
      back?.addEventListener('click', goBack);
      reset?.addEventListener('click', resetAll);
      const unsubscribe = accessibility.subscribe(render);
      return () => {
        text?.removeEventListener('change', setText);
        motion?.removeEventListener('change', setMotion);
        contrast?.removeEventListener('change', setContrast);
        back?.removeEventListener('click', goBack);
        reset?.removeEventListener('click', resetAll);
        unsubscribe();
      };
    }
  };
}
