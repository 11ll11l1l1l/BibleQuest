export function learnPage({ onReader }) {
  return {
    title: 'Learn',
    html: `<section class="bq-panel"><p class="bq-eyebrow">LEARN</p><h1>Learn</h1><p>Open Scripture through the clean v3 Bible data service. More study modes will return as their own verified milestones.</p><div class="bq-learning-grid"><button type="button" class="bq-learning-card" data-open-reader><b>Bible Reader</b><span>English BSB + Tagalog ULB · search · verse tools</span></button></div></section>`,
    mount(root) {
      const button = root.querySelector('[data-open-reader]');
      button?.addEventListener('click', onReader);
      return () => button?.removeEventListener('click', onReader);
    }
  };
}
