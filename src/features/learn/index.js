export function learnPage({ onReader, onStudy, onDeepQuestions, onStoryJourney, onWisdomSituations }) {
  return {
    title: 'Learn',
    html: `<section class="bq-panel"><p class="bq-eyebrow">LEARN</p><h1>Learn</h1><p>Read Scripture directly, follow a guided study, examine a deep question, walk through a Bible story, or practice difficult Scripture-informed judgment.</p><div class="bq-learning-grid"><button type="button" class="bq-learning-card" data-open-reader><b>Bible Reader</b><span>English BSB + Tagalog ULB · search · verse tools</span></button><button type="button" class="bq-learning-card" data-open-study><b>Guided Study</b><span>Passage · context · observation · reflection · application</span></button><button type="button" class="bq-learning-card" data-open-deep-questions><b>Deep Questions</b><span>Question · Scripture · open reflection · private note</span></button><button type="button" class="bq-learning-card" data-open-story-journey><b>Story Journey</b><span>Five Bible scenes · Scripture checkpoint · replay</span></button><button type="button" class="bq-learning-card" data-open-wisdom-situations><b>Wisdom Situations</b><span>Complex scenario · strongest judgment · rationale · Scripture</span></button></div></section>`,
    mount(root) {
      const reader = root.querySelector('[data-open-reader]'), study = root.querySelector('[data-open-study]'), deep = root.querySelector('[data-open-deep-questions]'), story = root.querySelector('[data-open-story-journey]'), wisdom = root.querySelector('[data-open-wisdom-situations]');
      const goReader = () => onReader?.(), goStudy = () => onStudy?.(), goDeep = () => onDeepQuestions?.(), goStory = () => onStoryJourney?.(), goWisdom = () => onWisdomSituations?.();
      reader?.addEventListener('click', goReader); study?.addEventListener('click', goStudy); deep?.addEventListener('click', goDeep); story?.addEventListener('click', goStory); wisdom?.addEventListener('click', goWisdom);
      return () => { reader?.removeEventListener('click', goReader); study?.removeEventListener('click', goStudy); deep?.removeEventListener('click', goDeep); story?.removeEventListener('click', goStory); wisdom?.removeEventListener('click', goWisdom); };
    }
  };
}
