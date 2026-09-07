export function learnPage({ onReader, onStudy }) {
  return {
    title: 'Learn',
    html: `<section class="bq-panel"><p class="bq-eyebrow">LEARN</p><h1>Study Scripture with purpose</h1><p>Read the Bible directly or open a guided study that moves from passage and context to understanding, reflection, and concrete response.</p><div class="bq-learning-grid"><button type="button" class="bq-learning-card" data-open-reader><b>Bible Reader</b><span>English BSB + Tagalog ULB · search · verse tools</span></button><button type="button" class="bq-learning-card" data-open-study><b>Guided Study</b><span>Passage · context · observation · reflection · application</span></button></div></section>`,
    mount(root) {
      const reader = root.querySelector('[data-open-reader]'), study = root.querySelector('[data-open-study]');
      const goReader = () => onReader?.(), goStudy = () => onStudy?.();
      reader?.addEventListener('click', goReader); study?.addEventListener('click', goStudy);
      return () => { reader?.removeEventListener('click', goReader); study?.removeEventListener('click', goStudy); };
    }
  };
}
