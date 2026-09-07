import { getContentProvenance } from '../../core/content-provenance.js';
import { sourceGuide } from '../../ui/source-labels.js';

export function learnPage({ onReader, onStudy, onDeepQuestions, onStoryJourney, onWisdomSituations, onAdaptiveLearning, onOpenReview, translations = [], recallSource = null }) {
  const guide = sourceGuide({
    translations,
    recall: recallSource,
    custom: [getContentProvenance('bq-study'), getContentProvenance('bq-retelling'), getContentProvenance('bq-wisdom'), getContentProvenance('bq-recall'), getContentProvenance('bq-game')]
  });
  return {
    title: 'Learn',
    html: `<section class="bq-panel"><p class="bq-eyebrow">LEARN</p><h1>Learn</h1><p>Read Scripture directly, follow a guided study, examine a deep question, walk through a Bible story, practice difficult Scripture-informed judgment, or review weak areas with spaced retrieval.</p><div class="bq-learning-grid"><button type="button" class="bq-learning-card" data-open-reader><b>Bible Reader</b><span>English BSB + Tagalog ULB · search · verse tools</span></button><button type="button" class="bq-learning-card" data-open-study><b>Guided Study</b><span>Passage · context · observation · reflection · application</span></button><button type="button" class="bq-learning-card" data-open-deep-questions><b>Deep Questions</b><span>Question · Scripture · open reflection · private note</span></button><button type="button" class="bq-learning-card" data-open-story-journey><b>Story Journey</b><span>Five Bible scenes · Scripture checkpoint · replay</span></button><button type="button" class="bq-learning-card" data-open-wisdom-situations><b>Wisdom Situations</b><span>Complex scenario · strongest judgment · rationale · Scripture</span></button><button type="button" class="bq-learning-card" data-open-adaptive-learning><b>Adaptive Learning</b><span>Due multiple-choice questions · weak areas · spaced Smart Review</span></button><button type="button" class="bq-learning-card" data-open-open-review><b>Open Smart Review</b><span>Answer from memory · reveal source answer · Got it / Review again</span></button></div></section>${guide}`,
    mount(root) {
      const reader = root.querySelector('[data-open-reader]'), study = root.querySelector('[data-open-study]'), deep = root.querySelector('[data-open-deep-questions]'), story = root.querySelector('[data-open-story-journey]'), wisdom = root.querySelector('[data-open-wisdom-situations]'), adaptive = root.querySelector('[data-open-adaptive-learning]'), openReview = root.querySelector('[data-open-open-review]');
      const goReader = () => onReader?.(), goStudy = () => onStudy?.(), goDeep = () => onDeepQuestions?.(), goStory = () => onStoryJourney?.(), goWisdom = () => onWisdomSituations?.(), goAdaptive = () => onAdaptiveLearning?.(), goOpenReview = () => onOpenReview?.();
      reader?.addEventListener('click', goReader); study?.addEventListener('click', goStudy); deep?.addEventListener('click', goDeep); story?.addEventListener('click', goStory); wisdom?.addEventListener('click', goWisdom); adaptive?.addEventListener('click', goAdaptive); openReview?.addEventListener('click', goOpenReview);
      return () => { reader?.removeEventListener('click', goReader); study?.removeEventListener('click', goStudy); deep?.removeEventListener('click', goDeep); story?.removeEventListener('click', goStory); wisdom?.removeEventListener('click', goWisdom); adaptive?.removeEventListener('click', goAdaptive); openReview?.removeEventListener('click', goOpenReview); };
    }
  };
}
