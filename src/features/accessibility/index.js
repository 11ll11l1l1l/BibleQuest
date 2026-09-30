import { uiButtonHtml, uiCardHtml, uiSelectFieldHtml, uiStatusHtml } from '../../v6/ui/primitives.ts';

// Inherited compatibility selectors rendered by the shared primitives:
// data-accessibility-page, data-accessibility-setting, data-accessibility-reset.
export function accessibilityPage({ accessibility, onBack } = {}) {
  if (!accessibility?.subscribe) throw new Error('Accessibility page requires the accessibility service.');
  return {
    title: 'Accessibility',
    html: `${uiCardHtml({
      heading: 'Accessibility',
      headingLevel: 1,
      eyebrow: 'ACCESSIBILITY',
      description: "Adjust readability and motion for this device. These preferences use BibleQuest's existing local storage boundary and do not change account or cloud data.",
      className: 'bq-accessibility-page',
      data: { 'accessibility-page': true },
      actions: [{ label: '← More', variant: 'secondary', data: { 'accessibility-back': true } }]
    })}
    <section class="bq-panel bq-accessibility-controls" aria-labelledby="bq-accessibility-options">
      <h2 id="bq-accessibility-options">Display and motion</h2>
      ${uiSelectFieldHtml({
        id: 'bq-accessibility-text',
        label: 'Text size',
        data: { 'accessibility-setting': 'text' },
        options: [
          { value: 'normal', label: 'Normal' },
          { value: 'large', label: 'Large' },
          { value: 'xlarge', label: 'Extra large' }
        ]
      })}
      ${uiSelectFieldHtml({
        id: 'bq-accessibility-motion',
        label: 'Motion',
        data: { 'accessibility-setting': 'motion' },
        options: [
          { value: 'system', label: 'Follow device' },
          { value: 'reduce', label: 'Reduce motion' },
          { value: 'full', label: 'Full motion' }
        ]
      })}
      ${uiSelectFieldHtml({
        id: 'bq-accessibility-contrast',
        label: 'Contrast',
        data: { 'accessibility-setting': 'contrast' },
        options: [
          { value: 'normal', label: 'Normal' },
          { value: 'strong', label: 'Stronger contrast' }
        ]
      })}
      ${uiButtonHtml({ label: 'Reset accessibility settings', variant: 'secondary', data: { 'accessibility-reset': true } })}
      ${uiStatusHtml({ className: 'bq-accessibility-status', data: { 'accessibility-status': true } })}
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
