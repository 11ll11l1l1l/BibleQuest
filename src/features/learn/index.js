export function learnPage({ onReader, onStudy, onDeepQuestions }) {
  return {
    title: 'Learn',
    html: `<section class="bq-panel"><p class="bq-eyebrow">LEARN</p><h1>Learn</h1><p>Read the Bible directly, follow a guided study, or examine a deep question through Scripture and private reflection.</p><div class="bq-learning-grid"><button type="button" class="bq-learning-card" data-open-reader><b>Bible Reader</b><span>English BSB + Tagalog ULB · search · verse tools</span></button><button type="button" class="bq-learning-card" data-open-study><b>Guided Study</b><span>Passage · context · observation · reflection · application</span></button><button type="button" class="bq-learning-card" data-open-deep-questions><b>Deep Questions</b><span>Question · Scripture · open reflection · private note</span></button></div></section>`,
    mount(root) {
      const reader = root.querySelector('[data-open-reader]'), study = root.querySelector('[data-open-study]'), deep = root.querySelector('[data-open-deep-questions]');
      const goReader = () => onReader?.(), goStudy = () => onStudy?.(), goDeep = () => onDeepQuestions?.();
      reader?.addEventListener('click', goReader); study?.addEventListener('click', goStudy); deep?.addEventListener('click', goDeep);
      return () => { reader?.removeEventListener('click', goReader); study?.removeEventListener('click', goStudy); deep?.removeEventListener('click', goDeep); };
    }
  };
}
